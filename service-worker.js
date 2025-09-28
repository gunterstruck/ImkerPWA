// Name des Caches. Erhöhen Sie diese Versionsnummer, um den Cache zu aktualisieren.
const CACHE_NAME = 'pwa-task-v1';

// Dateien, die beim ersten Besuch sofort im Cache gespeichert werden sollen
const urlsToCache = [
    '.', // Die Startseite (index.html)
    'index.html',
    'manifest.json',
    // Hier können Sie bei Bedarf weitere lokale Assets hinzufügen
];

// -------------------------------------------------------------------------
// INSTALL-EVENT: Cache öffnen und statische Assets hinzufügen
// -------------------------------------------------------------------------
self.addEventListener('install', (event) => {
    // Erzwingt, dass der neue Service Worker sofort die Kontrolle übernimmt
    self.skipWaiting(); 
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Statische Assets gecacht');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Service Worker: Fehler beim Caching statischer Assets', error);
            })
    );
});

// -------------------------------------------------------------------------
// ACTIVATE-EVENT: Alte Caches aufräumen
// -------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Aktiviert und bereit für die Kontrolle über Clients');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Lösche alten Cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// -------------------------------------------------------------------------
// FETCH-EVENT: Abfangen von Netzwerkanfragen für Offline-Funktionalität
// -------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
    // Nur GET-Anfragen behandeln
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache-Hit: Antwort aus dem Cache zurückgeben
                if (response) {
                    return response;
                }
                
                // Cache-Miss: Gehe zum Netzwerk
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Überprüfen, ob eine gültige Antwort erhalten wurde
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // Wichtig: Klonen Sie die Antwort.
                        // Ein Response-Stream kann nur einmal gelesen werden.
                        const responseToCache = networkResponse.clone();

                        // Neue Anfrage zum Cache hinzufügen, falls erfolgreich
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch((error) => {
                        // Fängt Netzwerkfehler ab (z.B. wenn offline)
                        console.error('Service Worker: Fetch fehlgeschlagen; Offline-Fallback nicht gefunden.', error);
                        // Optional: Hier könnten Sie eine Offline-Seite zurückgeben
                        // return caches.match('offline.html');
                    });
            })
    );
});
