const CACHE_NAME = 'pedicalc-offline-v2';

// Recursos esenciales a guardar en caché
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  // Es crítico hacer caché de los CDNs para que funcione 100% offline
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js'
];

// Instalación: Guarda todo en caché la primera vez
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierta');
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptar peticiones (Fetch): Busca primero en caché, si no está, va a internet
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si el recurso está en la caché, devuélvelo
        if (response) {
          return response;
        }
        // Si no está, búscalo en la red
        return fetch(event.request).then(
          (networkResponse) => {
            // Verificar si recibimos una respuesta válida
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
              return networkResponse;
            }

            // Clonar la respuesta de red para guardarla en la caché y devolverla
            var responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
      })
  );
});

// Activación: Limpia cachés viejas si cambias la versión
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
