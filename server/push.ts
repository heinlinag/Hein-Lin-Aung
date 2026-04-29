import webpush from "web-push";
import { getDb } from "./db";
import { pushSubscriptions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const VAPID_PUBLIC_KEY = "BAQN0wvOeqzGaDPxLZm76ZG6Iw2L1IfRZ8h5GzcxYJFFm4AT3RybTyiM0r8825pWeKZJ7MOSz9yZwBZ-_AI1q-g";
const VAPID_PRIVATE_KEY = "M35xO2CoEezdTTJZz_hw9NiUWwctl2_kQf-CHwzItcs";

webpush.setVapidDetails(
  "mailto:admin@gspp.local",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

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
  payload: { title: string; body: string; icon?: string; tag?: string }
) {
  const results = await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  );
  return results;
}
