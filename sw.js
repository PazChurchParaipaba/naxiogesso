const CACHE_NAME = 'naxio-gesso-v8.7.0-grid7x7';
const urlsToCache = [
  './index.html',
  './manifest.json',
  './logo.png?v=8.6.0',
  './css/style.css',
  './css/autopecas_pro.css',
  './js/naxio_gesso.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache).catch(err => console.log('Asset cache error', err)))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deletando cache antigo:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Ignora esquemas não suportados como extensões do navegador ou chamadas websocket/realtime
  if (!event.request.url.startsWith('http')) return;
  // Ignora chamadas ao servidor de impressão local na porta 3000
  if (event.request.url.includes(':3000')) return;

  // Network first for index.html to guarantee live animation code
  if (event.request.mode === 'navigate' || event.request.url.includes('index.html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        return fetch(event.request).catch(err => {
          // Captura erros normais de offline / rede sem poluir console
          return new Response(null, { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});
