// MediBridge Service Worker: Offline Caching & Background Web Push Notifications

const CACHE_NAME = 'medibridge-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/sounds/alarm.mp3',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Pre-caching asset failed:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Background Web Push Notification handler
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'MediBridge Reminder', body: event.data.text() };
    }
  }

  const title = data.title || 'Medicine Due Reminder';
  const options = {
    body: data.body || 'You have medication scheduled right now. Tap to view.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200, 100, 300],
    tag: data.tag || 'med-reminder',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/?reminderModal=true',
      medicines: data.medicines || [],
    },
    actions: [
      { action: 'taken', title: 'Mark as Taken' },
      { action: 'snooze', title: 'Snooze (10m)' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler: opens app directly to the silent reminder modal
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/?reminderModal=true';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
