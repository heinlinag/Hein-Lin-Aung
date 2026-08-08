import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...Array.from(new Uint8Array(buffer))));
}

/**
 * Hook to register push notifications.
 * Fetches the VAPID public key from the server (push.getVapidKey) to avoid key mismatch.
 * Subscribes the browser and sends the subscription to the server.
 */
export function usePushNotifications(workerID: string | null) {
  const subscribeMut = trpc.push.subscribe.useMutation();
  const vapidQuery = trpc.push.getVapidKey.useQuery(undefined, { enabled: !!workerID });
  const subscribedRef = useRef(false);
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!workerID || subscribedRef.current || attemptedRef.current) return;
    if (!vapidQuery.data?.publicKey) return; // wait for VAPID key from server
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    attemptedRef.current = true;
    const vapidPublicKey = vapidQuery.data.publicKey;

    const register = async () => {
      try {
        // Register service worker
        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;

        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("[Push] Permission denied");
          return;
        }

        // Check for existing subscription
        let subscription = await registration.pushManager.getSubscription();

        // If existing subscription uses a different key, unsubscribe first
        if (subscription) {
          try {
            // Verify the subscription is still valid by checking its endpoint
            const p256dhBuf = subscription.getKey("p256dh");
            const authBuf = subscription.getKey("auth");
            if (p256dhBuf && authBuf) {
              await subscribeMut.mutateAsync({
                workerID,
                subscription: {
                  endpoint: subscription.endpoint,
                  keys: {
                    p256dh: arrayBufferToBase64(p256dhBuf),
                    auth: arrayBufferToBase64(authBuf),
                  },
                },
              });
              subscribedRef.current = true;
              console.log("[Push] Re-registered existing subscription");
              return;
            }
          } catch {
            // If re-registration fails, unsubscribe and create fresh
            await subscription.unsubscribe();
            subscription = null;
          }
        }

        // Create new subscription with the correct VAPID key from server
        const newSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        const p256dhBuf = newSubscription.getKey("p256dh");
        const authBuf = newSubscription.getKey("auth");
        if (!p256dhBuf || !authBuf) {
          console.error("[Push] Missing keys from subscription");
          return;
        }

        await subscribeMut.mutateAsync({
          workerID,
          subscription: {
            endpoint: newSubscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(p256dhBuf),
              auth: arrayBufferToBase64(authBuf),
            },
          },
        });
        subscribedRef.current = true;
        console.log("[Push] New subscription registered successfully");
      } catch (err) {
        console.warn("[Push] Setup failed:", err);
      }
    };

    register();
  }, [workerID, vapidQuery.data?.publicKey]); // eslint-disable-line react-hooks/exhaustive-deps
}
