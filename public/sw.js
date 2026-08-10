self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(self.registration.showNotification(data.title || 'Namaz hatırlatması', { body: data.body || 'Namaz vakti bildirimi', icon: data.icon || '/favicon.ico', data: { url: data.url || '/profile#namaz' } }));
});
self.addEventListener('notificationclick', event => { event.notification.close(); event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => { const target = list[0]; return target ? target.focus() : clients.openWindow(event.notification.data.url); })); });
