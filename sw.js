const CACHE = 'chromakey-v2';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
const assetURLs = new Set(ASSETS.map(asset => new URL(asset, self.registration.scope).href));
const pageURLs = ASSETS.slice(0, 2).map(asset => new URL(asset, self.registration.scope).href);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(ASSETS.map(asset =>
      new Request(new URL(asset, self.registration.scope), { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('chromakey-') && k !== CACHE)
      .map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  url.search = '';
  url.hash = '';
  if (!assetURLs.has(url.href)) return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(e.request, { cache: 'no-store' });
      if (response.ok) {
        try {
          const keys = pageURLs.includes(url.href) ? pageURLs : [url.href];
          await Promise.all(keys.map(key => cache.put(key, response.clone())));
        } catch (err) {
          console.error('Impossible de mettre à jour le cache :', err);
        }
      }
      return response;
    } catch (err) {
      const cached = await cache.match(url.href);
      if (cached) return cached;
      throw err;
    }
  })());
});
