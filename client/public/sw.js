// Enhanced Service Worker for Push Notifications v2.0
const APP_NAME = "PP4 Manual Slitter";
const ICON_URL = "/manus-storage/gspp-logo_988a5ce5.png";

// Push notification handler
self.addEventListener("push", function (event) {
  if (!event.data) return;
  
  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: APP_NAME, body: event.data.text() };
  }

  const title = data.title || APP_NAME;
  const options = {
    body: data.body || "",
    icon: data.icon || ICON_URL,
    badge: ICON_URL,
    tag: data.tag || "gspp-notification-" + Date.now(),
    requireInteraction: data.requireInteraction || false,
    vibrate: [100, 50, 100, 50, 200],
    timestamp: Date.now(),
    data: {
      url: data.url || "/",
      type: data.type || "general",
    },
    actions: data.actions || getDefaultActions(data.type),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Get default actions based on notification type
function getDefaultActions(type) {
  switch (type) {
    case "approval":
      return [
        { action: "view", title: "View Request" },
        { action: "dismiss", title: "Dismiss" },
      ];
    case "order":
      return [
        { action: "view", title: "View Order" },
        { action: "dismiss", title: "Dismiss" },
      ];
    case "scanner":
      return [
        { action: "view", title: "View Details" },
        { action: "dismiss", title: "Dismiss" },
      ];
    default:
      return [];
  }
}

// Notification click handler
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  if (action === "dismiss") return;

  const targetUrl = data.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      // Try to focus an existing window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.postMessage({
            type: "NOTIFICATION_CLICK",
            url: targetUrl,
            notificationType: data.type,
          });
          return;
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Notification close handler
self.addEventListener("notificationclose", function (event) {
  // Track dismissed notifications
  const data = event.notification.data || {};
  console.log("[SW] Notification dismissed:", data.type);
});

// Service worker activation
self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

// Install event
self.addEventListener("install", function (event) {
  self.skipWaiting();
});
