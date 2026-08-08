import { useEffect, useRef, useState, useCallback } from "react";
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

export type PushPermissionState = "default" | "granted" | "denied" | "unsupported";

/**
 * Hook to register push notifications.
 * Returns permissionState and a requestPermission function for the UI banner.
 */
export function usePushNotifications(workerID: string | null): {
  permissionState: PushPermissionState;
  requestPermission: () => Promise<void>;
} {
  const subscribeMut = trpc.push.subscribe.useMutation();
  const vapidQuery = trpc.push.getVapidKey.useQuery(undefined, { enabled: !!workerID });
  const subscribedRef = useRef(false);
  const attemptedRef = useRef(false);

  // Initialise from browser state
  const getInitialPermission = (): PushPermissionState => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission as PushPermissionState;
  };
  const [permissionState, setPermissionState] = useState<PushPermissionState>(getInitialPermission);

  const doSubscribe = useCallback(async (vapidPublicKey: string) => {
    if (!workerID) return;
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      setPermissionState(permission as PushPermissionState);
      if (permission !== "granted") return;

      let subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        try {
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
            return;
          }
        } catch {
          await subscription.unsubscribe();
          subscription = null;
        }
      }

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const p256dhBuf = newSubscription.getKey("p256dh");
      const authBuf = newSubscription.getKey("auth");
      if (!p256dhBuf || !authBuf) return;

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
    } catch (err) {
      console.warn("[Push] Setup failed:", err);
    }
  }, [workerID]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-subscribe when VAPID key is ready and permission is default
  useEffect(() => {
    if (!workerID || subscribedRef.current || attemptedRef.current) return;
    if (!vapidQuery.data?.publicKey) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermissionState("unsupported");
      return;
    }
    // Only auto-prompt if permission is "default" (not yet asked)
    if (Notification.permission !== "default") {
      setPermissionState(Notification.permission as PushPermissionState);
      if (Notification.permission === "granted") {
        attemptedRef.current = true;
        doSubscribe(vapidQuery.data.publicKey);
      }
      return;
    }
    attemptedRef.current = true;
    doSubscribe(vapidQuery.data.publicKey);
  }, [workerID, vapidQuery.data?.publicKey, doSubscribe]);

  // Manual re-request (called from UI banner)
  const requestPermission = useCallback(async () => {
    if (!vapidQuery.data?.publicKey) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    subscribedRef.current = false;
    attemptedRef.current = false;
    await doSubscribe(vapidQuery.data.publicKey);
  }, [vapidQuery.data?.publicKey, doSubscribe]);

  return { permissionState, requestPermission };
}

