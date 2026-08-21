// SERVICE WORKER v9 (NETWORK FIRST PARA EVITAR CACHE VIEJO)
const CACHE_NAME = 'fitapp-v9-live';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Siempre intentar red primero, fallback a cache si no hay conexión
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
