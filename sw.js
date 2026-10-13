// SERVICE WORKER: precache del app shell + network-first con actualización de caché.
// En línea siempre se sirve la versión más reciente; sin conexión se usa la última copia guardada.
// scripts/build_dist.js reemplaza __APP_VERSION__ para que cada release use una caché nueva.
const CACHE_NAME = 'fittrack-__APP_VERSION__';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './src/app.js',
  './src/styles/app.css',
  './src/components/svg_muscles.js',
  './src/utils.js',
  './src/data/meal_plans.json',
  './src/data/training_plans.json',
  './src/data/equivalents.json',
  './src/data/progress_history.demo.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // cache: 'no-cache' revalida con el servidor (ETag) para no servir archivos viejos de la caché HTTP
  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
