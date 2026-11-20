// Guarda os jogos (e as fotografias) no aparelho para funcionarem mesmo sem internet.
// Pensado para telemóveis fracos: nunca bloqueia a página, descarrega aos poucos e, nas
// atualizações, reaproveita as fotografias que já estão guardadas (da mesma geração).
importScripts('ficheiros.js'); // define self.FICHEIROS e self.VERSAO (gerado por ferramentas/gerar-lista.mjs)
const VERSAO = self.VERSAO;
const FICHEIROS = self.FICHEIROS;
const imutavel = f => f.startsWith('./fotos/') || f.startsWith('./icones/');
// Ex.: 'jogos-do-jose-f2'. Só se reaproveitam fotografias de versões da mesma geração.
const geracao = nome => nome.slice(0, nome.lastIndexOf('-'));

let aGuardar = null;
function guardarTudo() {
  if (aGuardar) return aGuardar;
  aGuardar = (async () => {
    const cache = await caches.open(VERSAO);
    const antigas = (await caches.keys()).filter(n => n !== VERSAO && geracao(n) === geracao(VERSAO));
    const procurarAntigo = async f => {
      for (const n of antigas) { const r = await (await caches.open(n)).match(f); if (r) return r; }
      return null;
    };
    for (let i = 0; i < FICHEIROS.length; i += 4) {
      await Promise.all(FICHEIROS.slice(i, i + 4).map(async f => {
        if (await cache.match(f)) return;
        // Fotografias e ícones não mudam dentro da mesma geração: copiam-se sem rede.
        const antigo = imutavel(f) ? await procurarAntigo(f) : null;
        if (antigo) { await cache.put(f, antigo); return; }
        const r = await fetch(f, { cache: 'no-cache' });
        if (r.ok) await cache.put(f, r);
      }).map(pr => pr.catch(() => {}))); // um ficheiro em falta não estraga os outros
    }
    // Só no fim se apagam as versões antigas (já não fazem falta).
    const nomes = await caches.keys();
    await Promise.all(nomes.filter(n => n !== VERSAO).map(n => caches.delete(n)));
  })().finally(() => { aGuardar = null; });
  return aGuardar;
}

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(['./', './index.html'])).then(() => self.skipWaiting()));
});

// A ativação é rápida de propósito: enquanto dura, o navegador retém os pedidos da página.
self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('message', e => {
  if (!e.data) return;
  if (e.data.tipo === 'guardar') { e.waitUntil(guardarTudo()); return; }
  if (e.data.tipo !== 'estado' || !e.ports[0]) return;
  e.waitUntil((async () => {
    const cache = await caches.open(VERSAO);
    const chaves = await cache.keys();
    const guardados = new Set(chaves.map(r => new URL(r.url).pathname));
    const base = new URL('./', self.location).pathname;
    const n = FICHEIROS.filter(f => guardados.has(new URL(f, self.location).pathname) || (f === './' && guardados.has(base))).length;
    e.ports[0].postMessage({ total: FICHEIROS.length, guardados: n });
    if (n < FICHEIROS.length) await guardarTudo();
  })());
});

// O que já está guardado nesta versão sai logo do aparelho; o resto vem da rede (e fica guardado).
// Sem rede, serve-se a última cópia que houver.
self.addEventListener('fetch', e => {
  const pedido = e.request;
  const url = new URL(pedido.url);
  if (pedido.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/.netlify/')) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSAO);
    const guardado = await cache.match(pedido, { ignoreSearch: true });
    if (guardado) return guardado;
    try {
      const r = await fetch(pedido);
      if (r && r.ok) { cache.put(pedido, r.clone()); return r; }
      // Logo a seguir a uma atualização, a página que já estava aberta ainda pode pedir uma
      // fotografia que entretanto foi trocada: se o servidor já não a tiver, serve-se a cópia antiga.
      const antiga = await caches.match(pedido, { ignoreSearch: true });
      return antiga || r;
    } catch (erro) {
      const antigo = await caches.match(pedido, { ignoreSearch: true });
      if (antigo) return antigo;
      if (pedido.mode === 'navigate') return (await caches.match('./index.html')) || Response.error();
      return Response.error();
    }
  })());
});
