import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

const VAPID_PUBLIC_KEY = "BAQN0wvOeqzGaDPxLZm76ZG6Iw2L1IfRZ8h5GzcxYJFFm4AT3RybTyiM0r8825pWeKZJ7MOSz9yZwBZ-_AI1q-g";

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

export function usePushNotifications(workerID: string | null) {
  const subscribeMut = trpc.push.subscribe.useMutation();
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!workerID || subscribedRef.current) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          const p256dhBuf = existing.getKey("p256dh");
          const authBuf = existing.getKey("auth");
          if (!p256dhBuf || !authBuf) return;
          await subscribeMut.mutateAsync({
            workerID,
            subscription: {
              endpoint: existing.endpoint,
              keys: {
                p256dh: arrayBufferToBase64(p256dhBuf),
                auth: arrayBufferToBase64(authBuf),
              },
            },
          });
          subscribedRef.current = true;
          return;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        const p256dhBuf = subscription.getKey("p256dh");
        const authBuf = subscription.getKey("auth");
        if (!p256dhBuf || !authBuf) return;

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
      } catch (err) {
        console.warn("Push notification setup failed:", err);
      }
    };

    register();
  }, [workerID]); // eslint-disable-line react-hooks/exhaustive-deps
}
