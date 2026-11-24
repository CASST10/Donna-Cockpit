// Donna Jura Service Worker v4.33
// Versionsnummer ändern = Update-Banner erscheint auf allen Geräten
const CACHE = 'donna-jura-v4.33';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './motivation.wav'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if(url.origin !== self.location.origin){
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  // Seite selbst: Network-first, damit neue Uploads sofort ankommen
  // (auch wenn die Versionsnummer mal vergessen wird). Offline → Cache.
  if(e.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html')){
    // cache:'no-cache' → am Browser-Zwischenspeicher vorbei immer beim Server nachfragen
    e.respondWith(
      fetch(e.request.url, {cache:'no-cache', credentials:'same-origin'}).then(resp => {
        if(resp.ok){ const clone = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, clone)); }
        return resp;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(resp => {
        if(resp.ok){ const clone = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, clone)); }
        return resp;
      });
    })
  );
});
