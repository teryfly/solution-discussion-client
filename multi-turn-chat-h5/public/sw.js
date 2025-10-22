const CACHE_NAME = 'ai-dev-platform-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];
// Install new SW and pre-cache basic shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(urlsToCache);
      // Activate this SW immediately on install
      await self.skipWaiting();
    })()
  );
});
// Activate new SW and clean old caches, take control of clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});
// Helper: determine if a request is same-origin
function isSameOrigin(url) {
  try {
    const requestURL = new URL(url, self.location.origin);
    return requestURL.origin === self.location.origin;
  } catch {
    return false;
  }
}
// Fetch handler:
// - Only handle same-origin GET with cache-first
// - Bypass all cross-origin requests (e.g., API calls to localhost:8000) and non-GET methods
self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Only cache GET requests from same origin
  const sameOrigin = isSameOrigin(request.url);
  const isGET = request.method === 'GET';
  if (!sameOrigin || !isGET) {
    // Let the network handle it directly (important for POST/PUT/DELETE and cross-origin API calls)
    return;
  }
  event.respondWith(
    (async () => {
      // Try cache first
      const cached = await caches.match(request);
      if (cached) return cached;
      // Otherwise fetch from network and optionally put a copy into cache
      try {
        const response = await fetch(request);
        // Clone and store only successful basic responses
        if (response && response.status === 200 && response.type === 'basic') {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
        }
        return response;
      } catch (err) {
        // Optionally return a fallback response or rethrow
        throw err;
      }
    })()
  );
});