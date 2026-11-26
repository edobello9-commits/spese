// Service worker: l'app si apre subito dalla copia salvata, anche con poco segnale,
// e intanto scarica la versione nuova per la prossima apertura.
// Cambiare CACHE a ogni rilascio: così il nuovo service worker subentra e l'app
// mostra il banner «Nuova versione disponibile».
const CACHE = 'spese-v4';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // La pagina, con o senza ?nuova=1, è sempre la stessa index.html.
  const key = req.mode === 'navigate' ? './index.html' : req;
  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      const hit = await c.match(key, { ignoreSearch: req.mode === 'navigate' });
      const net = fetch(req).then((res) => {
        if (res && res.ok) c.put(key, res.clone());
        return res;
      });
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net.catch(() => c.match('./index.html'));
    })
  );
});
