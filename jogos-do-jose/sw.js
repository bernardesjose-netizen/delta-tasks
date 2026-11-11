// Guarda os jogos (e as fotografias) no aparelho para funcionarem mesmo sem internet.
importScripts('ficheiros.js'); // define self.FICHEIROS e self.VERSAO (gerado por ferramentas/gerar-lista.mjs)
const VERSAO = self.VERSAO;
const FICHEIROS = self.FICHEIROS;

async function guardarTudo() {
  const cache = await caches.open(VERSAO);
  // Guarda em grupos e tolera falhas pontuais (uma fotografia em falta não estraga o resto).
  for (let i = 0; i < FICHEIROS.length; i += 20) {
    await Promise.allSettled(FICHEIROS.slice(i, i + 20).map(async f => {
      if (await cache.match(f)) return;
      const r = await fetch(f, { cache: 'no-cache' });
      if (r.ok) await cache.put(f, r);
    }));
  }
}

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(['./', './index.html'])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(nomes.filter(n => n !== VERSAO).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
      .then(() => guardarTudo()),
  );
});

self.addEventListener('message', e => {
  if (!e.data || e.data.tipo !== 'estado' || !e.ports[0]) return;
  e.waitUntil((async () => {
    const cache = await caches.open(VERSAO);
    const chaves = await cache.keys();
    const guardados = new Set(chaves.map(r => new URL(r.url).pathname));
    const base = new URL('./', self.location).pathname;
    const n = FICHEIROS.filter(f => guardados.has(new URL(f, self.location).pathname) || (f === './' && guardados.has(base))).length;
    e.ports[0].postMessage({ total: FICHEIROS.length, guardados: n });
    if (n < FICHEIROS.length) guardarTudo();
  })());
});

// Responde logo com a cópia guardada e atualiza-a em segundo plano.
self.addEventListener('fetch', e => {
  const pedido = e.request;
  if (pedido.method !== 'GET' || new URL(pedido.url).origin !== self.location.origin) return;
  if (new URL(pedido.url).pathname.startsWith('/.netlify/')) return;
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
