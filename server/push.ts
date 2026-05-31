import webpush from "web-push";
import { getDb } from "./db";
import { pushSubscriptions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Use env-injected VAPID keys (set via webdev_request_secrets)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:admin@stockdash.click",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export { VAPID_PUBLIC_KEY };

export async function saveSubscription(workerID: string, subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const db = await getDb();
  if (!db) return;
  // Remove old subscriptions for this worker with same endpoint
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.workerID, workerID));
  await db.insert(pushSubscriptions).values({
    workerID,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  });
}

export async function removeSubscription(workerID: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.workerID, workerID));
}

export async function getSubscriptionsForWorkers(workerIDs: string[]) {
  const db = await getDb();
  if (!db || workerIDs.length === 0) return [];
  const rows = await db.select().from(pushSubscriptions);
  return rows.filter(r => workerIDs.includes(r.workerID));
}

export async function getAllSubscriptions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pushSubscriptions);
}

export async function sendPushNotification(
  subscriptions: { endpoint: string; p256dh: string; auth: string }[],
  payload: { 
    title: string; 
    body: string; 
    icon?: string; 
    tag?: string;
    type?: "general" | "approval" | "order" | "scanner" | "system";
    url?: string;
    requireInteraction?: boolean;
    actions?: Array<{ action: string; title: string }>;
  }
) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("[Push] VAPID keys not configured, skipping push notification");
    return [];
  }

  const enrichedPayload = {
    ...payload,
    icon: payload.icon || "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    type: payload.type || "general",
    url: payload.url || "/",
    requireInteraction: payload.requireInteraction ?? false,
  };
  
  const results = await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(enrichedPayload)
      ).catch(err => {
        // 410 Gone = subscription expired, ignore silently
        if (err?.statusCode !== 410) console.error("[Push] send error:", err?.message);
      })
    )
  );
  return results;
}

/**
 * Send push notification to ALL subscribed workers
 */
export async function sendPushToAll(payload: Parameters<typeof sendPushNotification>[1]) {
  const subs = await getAllSubscriptions();
  return sendPushNotification(subs, payload);
}

/**
 * Send push notification to specific workers by their IDs
 */
export async function sendPushToWorkers(workerIDs: string[], payload: Parameters<typeof sendPushNotification>[1]) {
  const subs = await getSubscriptionsForWorkers(workerIDs);
  return sendPushNotification(subs, payload);
}
