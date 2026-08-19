const CACHE_NAME = 'feztime-v1';

const URLS_TO_CACHE = [
  '/',
  '/favicon.ico',
  '/manifest.json'
  // podés sumar CSS/fonts si querés
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE).catch((err) => {
        console.error('Error cacheando recursos iniciales', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  // Tenant pages must stay tenant-scoped; never serve a root fallback for them.
  const pathname = new URL(request.url).pathname;
  if (request.mode === 'navigate' && pathname !== '/' && !pathname.startsWith('/_next/')) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        // opcional: cache dinámico de GET
        return networkResponse;
      });
    })
  );
});
