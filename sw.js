/**
 * PrincessCycle - Service Worker
 * Offline-First Caching & PWA Support.
 *
 * IMPORTANT: Bump CACHE_VERSION on every release that changes any asset
 * below, or installed clients will keep serving stale code forever.
 * The asset list MUST include every module in the ES module graph of
 * index.html + js/app.js — a missing file breaks the app offline entirely.
 */

const CACHE_VERSION = 'v1.1.1';
const CACHE_NAME = `princess-cycle-${CACHE_VERSION}`;

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/fairy-icon.jpg',
  './assets/favicon.svg',
  // Styles
  './css/reset.css',
  './css/variables.css',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './css/responsive.css',
  './css/cute.css',
  // Core
  './js/app.js',
  './js/config.js',
  './js/state.js',
  './js/storage.js',
  './js/router.js',
  './js/dom.js',
  './js/validation.js',
  './js/ui.js',
  // Domain
  './js/cycle.js',
  './js/sleep.js',
  './js/affirmations.js',
  './js/demo-data.js',
  // Controllers
  './js/checkin.js',
  './js/settings.js',
  './js/onboarding.js',
  './js/calendar.js',
  './js/insights.js',
  './js/history.js',
  './js/sharing.js',
  './js/privacy-lock.js',
  // Ambient features
  './js/audio.js',
  './js/ambient-audio.js',
  './js/relaxation.js',
  './js/sparkles.js',
  './js/notifications.js'
];

// Install Event - Pre-cache core assets (never fail install over one bad asset)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(ASSETS_TO_CACHE.map((url) => cache.add(url)))
    ).then(() => self.skipWaiting())
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
  if (!event.request.url.startsWith(self.location.origin)) return;

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
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
