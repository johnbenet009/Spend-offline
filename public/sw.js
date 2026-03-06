const CACHE_NAME = 'spend-v2';
const BASE = self.registration.scope; // e.g. https://user.github.io/Spend-offline/
const INDEX_URL = new URL('index.html', BASE).toString();

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([INDEX_URL]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((n) => (n !== CACHE_NAME ? caches.delete(n) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // App Shell-style navigation fallback for SPA
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          return fresh;
        } catch {
          const cached = await caches.match(INDEX_URL);
          return cached || Response.error();
        }
      })()
    );
    return;
  }
});
