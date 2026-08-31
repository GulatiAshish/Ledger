/* Ledger service worker.
   Bump CACHE when you change any file below, otherwise the phone keeps the old copy. */
const CACHE = 'ledger-v9';

/* Everything the app needs to run. There are no other network calls anywhere —
   fonts are self-hosted, charts are inline SVG, storage is IndexedDB. */
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './archivo-var.woff2',
  './plexmono-400.woff2',
  './plexmono-600.woff2'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  // addAll is atomic: if any file 404s the whole install fails, so a broken
  // deploy is loud instead of silently half-cached. Only files the running app
  // actually needs go in here — the launcher reads shortcut icons itself, so
  // listing them would just mean a forgotten upload takes offline down with it.
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;   // nothing cross-origin exists

  /* Navigation: cache-first, revalidate in the background.
     Network-first would be wrong here. Fully offline it only costs a failed
     fetch, but on weak signal — a shop floor, a basement, patchy 4G — fetch
     can hang for tens of seconds before it rejects, so the app would open
     slower on a bad connection than with no connection at all. This way it
     opens instantly every time and picks up a new deploy on the next launch. */
  if (req.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then(cached => {
        const fresh = fetch(req).then(r => {
          if (r && r.ok) {
            const copy = r.clone();
            caches.open(CACHE).then(c => c.put('./index.html', copy));
          }
          return r;
        }).catch(() => cached);
        return cached || fresh;      // network only on the very first ever load
      })
    );
    return;
  }

  /* Assets: cache-first. Fall back to the cache on network failure rather than
     returning undefined, which respondWith turns into a hard network error. */
  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(r => {
        if (r && r.ok) {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return r;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
