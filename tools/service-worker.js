const CACHE = 'eduprompt-v1';
const ASSETS = [
  '/tools/eduprompt.html',
  '/tools/manifest.json',
];

// Install: cache the app shell (icons are optional — they may not exist yet)
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(ASSETS.map(url => cache.add(url)))
    )
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for same-origin, bypass for external (GA, etc.)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        caches.open(CACHE).then(cache => cache.put(e.request, res.clone()));
        return res;
      }).catch(() => caches.match('/tools/eduprompt.html'));
    })
  );
});
