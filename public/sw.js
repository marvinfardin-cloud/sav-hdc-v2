self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Les Hauts de Californie";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/apple-touch-icon.png",
      badge: "/apple-touch-icon.png",
      data: { url: data.url || "/client/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/client/dashboard";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((wins) => {
        for (const win of wins) {
          if (win.url.includes(url) && "focus" in win) return win.focus();
        }
        return clients.openWindow(url);
      })
  );
});
