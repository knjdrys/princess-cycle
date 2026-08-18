/**
 * PrincessCycle - Service Worker
 * Offline-First Caching & PWA Support
 */

const CACHE_NAME = 'princess-cycle-v1.0.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/favicon.svg',
  './css/reset.css',
  './css/variables.css',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './css/responsive.css',
  './js/app.js',
  './js/state.js',
  './js/storage.js',
  './js/cycle.js',
  './js/validation.js',
  './js/ui.js',
  './js/calendar.js',
  './js/insights.js',
  './js/history.js',
  './js/sharing.js',
  './js/notifications.js',
  './js/demo-data.js'
];

// Install Event - Pre-cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Stale-While-Revalidate Strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Network failure, return cached version or fallback
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
