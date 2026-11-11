// Guarda os jogos no aparelho para funcionarem mesmo sem internet.
const VERSAO = 'jogos-do-jose-v4';
const FICHEIROS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.ico',
  './css/estilo.css',
  './js/app.js',
  './js/util.js',
  './js/motor.js',
  './js/jogos/cerebro.js',
  './js/jogos/palavras.js',
  './js/jogos/cartas.js',
  './js/jogos/paciencia.js',
  './js/dados/perguntas.js',
  './js/dados/conteudos.js',
  './icones/favicon.svg',
  './icones/apple-touch-icon.png',
  './icones/icone-192.png',
  './icones/icone-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(FICHEIROS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(nomes.filter(n => n !== VERSAO).map(n => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

// Responde logo com a cópia guardada e atualiza-a em segundo plano.
self.addEventListener('fetch', e => {
  const pedido = e.request;
  if (pedido.method !== 'GET' || new URL(pedido.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.open(VERSAO).then(async cache => {
      const guardado = await cache.match(pedido, { ignoreSearch: true });
      const daRede = fetch(pedido)
        .then(r => { if (r && r.ok) cache.put(pedido, r.clone()); return r; })
        .catch(() => guardado || (pedido.mode === 'navigate' ? cache.match('./index.html') : Response.error()));
      return guardado || daRede;
    }),
  );
});
