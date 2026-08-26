// Service Worker for Outing Route Assistant Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle scheduled notifications from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, tag, scheduledTime, data } = event.data;
    const now = Date.now();
    const delay = Math.max(0, scheduledTime - now);

    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: '/favicon.ico',
        tag: tag || 'outing-departure-alert',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        data: data || {},
        requireInteraction: true,
      });
    }, delay);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
