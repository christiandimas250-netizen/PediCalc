const CACHE_NAME = 'pedicalc-offline-v5';

// Solo guardamos archivos locales en la instalación inicial para evitar bloqueos CORS
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Fuerza la instalación inmediata
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Ignorar peticiones que no sean GET (como extensiones de Chrome)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          (networkResponse) => {
            // Permitimos respuestas opacas (status 0) de CDNs para guardarlas sin error
            if (!networkResponse || (networkResponse.status !== 200 && networkResponse.status !== 0)) {
              return networkResponse;
            }

            var responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(() => {
          console.log('Modo offline: No se pudo obtener el recurso', event.request.url);
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Fuerza a la PWA a usar el nuevo SW de inmediato
  );
});
