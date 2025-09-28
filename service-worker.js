// Verbessertes Service Worker mit Offline-Fallback und Cache-Versioning
const CACHE_NAME = 'pwa-task-v2';
const OFFLINE_URL = '/offline.html';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(networkResp => {
        // optional: cache new GET responses from same-origin
        if (networkResp && networkResp.status === 200 && networkResp.type === 'basic') {
          const respClone = networkResp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
        }
        return networkResp;
      }).catch(() => {
        // Wenn alles fehlschlägt, liefere Offline-Seite bei HTML-Navigationsanfragen
        if (event.request.mode === 'navigate' || (event.request.headers.get('accept')||'').includes('text/html')) {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});
