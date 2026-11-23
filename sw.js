const NOMBRE_CACHE = 'georeporte-v2';

const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './geo-helper.js',
  './app.js',
  './manifest.json'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(NOMBRE_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nombres) => Promise.all(
        nombres
          .filter((nombre) => nombre !== NOMBRE_CACHE)
          .map((nombre) => caches.delete(nombre))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  if (evento.request.method !== 'GET') return;
  if (new URL(evento.request.url).origin !== self.location.origin) return;

  evento.respondWith(
    caches.match(evento.request, { ignoreSearch: true })
      .then((respuestaCache) => {
        if (respuestaCache) return respuestaCache;

        return fetch(evento.request).then((respuestaRed) => {
          if (respuestaRed && respuestaRed.ok) {
            const copia = respuestaRed.clone();
            caches.open(NOMBRE_CACHE).then((cache) => cache.put(evento.request, copia));
          }
          return respuestaRed;
        });
      })
      .catch(() => caches.match('./index.html'))
  );
});
