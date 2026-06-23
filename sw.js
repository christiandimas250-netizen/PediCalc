// Aumentamos la versión para forzar la actualización en los dispositivos
const CACHE_NAME = 'pedicalc-offline-v4';

const urlsToCache = [
  '.',
  './index.html',
  './manifest.json',
  // Los CDN de unpkg SÍ soportan CORS, así que los dejamos en la instalación inicial.
  // Tailwind fue removido de aquí para evitar que crashee la instalación.
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierta');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          (networkResponse) => {
            // SOLUCIÓN CORS: Permitimos respuestas 'opaque' (status 0) para que 
            // el CDN de Tailwind pueda ser guardado en caché dinámicamente sin fallar.
            if(!networkResponse || (networkResponse.status !== 200 && networkResponse.status !== 0) || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors' && networkResponse.type !== 'opaque')) {
              return networkResponse;
            }

            var responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch((error) => {
          console.error('Fallo la red y no se encontró recurso en caché:', event.request.url);
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
