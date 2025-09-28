const CACHE_NAME = 'pwa-single-v1';
const OFFLINE_URL = 'offline.html';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'offline.html',
  'manifest.json',
  'service-worker.js',
  'icon-192.png',
  'icon-512.png',
  'maskable-icon.png'
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
        if (networkResp && networkResp.status === 200 && networkResp.type === 'basic') {
          const clone = networkResp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResp;
      }).catch(() => {
        if (event.request.mode === 'navigate' || (event.request.headers.get('accept')||'').includes('text/html')) {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});
