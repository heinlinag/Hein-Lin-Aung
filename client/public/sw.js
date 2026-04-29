// Service Worker for Push Notifications
self.addEventListener("push", function (event) {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Notification", body: event.data.text() };
  }
  const options = {
    body: data.body || "",
    icon: data.icon || "/manus-storage/gspp-logo_988a5ce5.png",
    badge: "/manus-storage/gspp-logo_988a5ce5.png",
    tag: data.tag || "gspp-notification",
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };
  event.waitUntil(self.registration.showNotification(data.title || "GSPP", options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("/");
    })
  );
});
