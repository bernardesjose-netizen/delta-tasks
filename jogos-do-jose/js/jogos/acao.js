// Jogos de ação, calmos e só com toques: Frutas em Linha (combinar 3), Ténis de Mesa e Cobra.
// Pensados para telemóveis fracos: desenho simples, requestAnimationFrame com passo pelo tempo real,
// e uma função de limpeza que para todos os temporizadores quando a pessoa sai a meio.
// Num ecrã deitado e baixo (tablet), os botões passam para os lados do campo, para tudo caber sem deslizar.
import { el, limpar, som, aviso, dados, verRecorde, baralhar } from '../util.js';

/* ---------- Partes comuns ---------- */
const ehLeve = () => document.documentElement.classList.contains('leve') ||
  Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

function nivelValido(n) {
  const v = Math.round(Number(n) || 1);
  return Math.min(4, Math.max(1, v));
}

// Ecrã deitado (largo e baixo): os controlos vão para os lados.
const ecraDeitado = () => (window.innerWidth || 0) >= 600 && (window.innerWidth || 0) >= (window.innerHeight || 0) * 1.3;

// Guarda temporizadores, o requestAnimationFrame e os «ouvintes» globais, para os parar todos de uma vez.
function criarControlo() {
  const temporizadores = new Set();
  const ouvintes = [];
  let raf = 0;
  const c = {
    vivo: true,
    depois(ms, f) {
      const id = setTimeout(() => { temporizadores.delete(id); if (c.vivo) f(); }, ms);
      temporizadores.add(id);
      return id;
    },
    cancelar(id) { if (id) { clearTimeout(id); temporizadores.delete(id); } },
    quadro(f) {
      if (!c.vivo) return;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(t => { raf = 0; if (c.vivo) f(t); });
    },
    pararQuadro() { if (raf) cancelAnimationFrame(raf); raf = 0; },
    ouvir(alvo, tipo, f, opcoes) { alvo.addEventListener(tipo, f, opcoes); ouvintes.push([alvo, tipo, f, opcoes]); },
    acabar() {
      c.vivo = false;
      temporizadores.forEach(id => clearTimeout(id));
      temporizadores.clear();
      c.pararQuadro();
      ouvintes.forEach(o => o[0].removeEventListener(o[1], o[2], o[3]));
      ouvintes.length = 0;
    },
  };
  return c;
}

// Botão de premir e largar (as setas do ténis): toque, rato e Safari antigo sem «pointer events».
function segurar(botao, aoPremir, aoLargar) {
  let premido = false;
  const ini = e => { if (e.cancelable) e.preventDefault(); if (premido) return; premido = true; aoPremir(); };
  const fim = () => { if (!premido) return; premido = false; aoLargar(); };
  if (window.PointerEvent) {
    botao.addEventListener('pointerdown', e => {
      if (e.button > 0) return;
      try { botao.setPointerCapture(e.pointerId); } catch (x) { /* sem captura */ }
      ini(e);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => botao.addEventListener(t, fim));
  } else {
    botao.addEventListener('touchstart', ini, { passive: false });
    botao.addEventListener('touchend', fim);
    botao.addEventListener('touchcancel', fim);
    botao.addEventListener('mousedown', ini);
    botao.addEventListener('mouseup', fim);
    botao.addEventListener('mouseleave', fim);
  }
  botao.addEventListener('contextmenu', e => e.preventDefault());
}

// Botão que reage logo ao toque (as setas da cobra), sem esperar que o dedo se levante.
function premir(botao, f) {
  if (window.PointerEvent) {
    botao.addEventListener('pointerdown', e => { if (e.button > 0) return; if (e.cancelable) e.preventDefault(); f(); });
  } else {
    let ultimoToque = 0;
    botao.addEventListener('touchstart', e => { if (e.cancelable) e.preventDefault(); ultimoToque = Date.now(); f(); }, { passive: false });
    botao.addEventListener('mousedown', () => { if (Date.now() - ultimoToque > 800) f(); });
  }
  // teclado (Enter ou espaço com o botão em foco)
  botao.addEventListener('click', e => { if (e.detail === 0) f(); });
  botao.addEventListener('contextmenu', e => e.preventDefault());
}

// Dedo a arrastar numa superfície (a mesa do ténis, a grelha da cobra).
function arrasto(elemento, ctl, { inicio, mover, fim }) {
  if (window.PointerEvent) {
    let id = null;
    elemento.addEventListener('pointerdown', e => {
      id = e.pointerId;
      try { elemento.setPointerCapture(id); } catch (x) { /* sem captura */ }
      if (e.cancelable) e.preventDefault();
      inicio(e.clientX, e.clientY);
    });
    elemento.addEventListener('pointermove', e => {
      if (e.pointerId !== id) return;
      if (e.cancelable) e.preventDefault();
      mover(e.clientX, e.clientY);
    });
    const acabar = e => { if (e.pointerId !== id) return; id = null; if (fim) fim(); };
    elemento.addEventListener('pointerup', acabar);
    elemento.addEventListener('pointercancel', acabar);
  } else {
    elemento.addEventListener('touchstart', e => { const t = e.changedTouches[0]; if (e.cancelable) e.preventDefault(); inicio(t.clientX, t.clientY); }, { passive: false });
    elemento.addEventListener('touchmove', e => { const t = e.changedTouches[0]; if (e.cancelable) e.preventDefault(); mover(t.clientX, t.clientY); }, { passive: false });
    elemento.addEventListener('touchend', () => { if (fim) fim(); });
    let rato = false;
    elemento.addEventListener('mousedown', e => { rato = true; inicio(e.clientX, e.clientY); });
    elemento.addEventListener('mousemove', e => { if (rato) mover(e.clientX, e.clientY); });
    ctl.ouvir(document, 'mouseup', () => { if (rato) { rato = false; if (fim) fim(); } });
  }
}

// Camada por cima do campo: instruções, contagem 3-2-1, pausa e mensagens curtas.
function criarSobre() {
  const caixa = el('div', { class: 'acao-sobre', hidden: true });
  let atual = null;
  const mostrar = (classe, ...filhos) => {
    limpar(caixa);
    caixa.className = `acao-sobre ${classe}`;
    caixa.append(...filhos);
    caixa.hidden = false;
  };
  return {
    el: caixa,
    esconder() { atual = null; caixa.hidden = true; limpar(caixa); },
    numero(n) { if (atual === `n${n}`) return; atual = `n${n}`; mostrar('acao-numero', el('span', {}, String(n))); },
    texto(t) { atual = `t${t}`; mostrar('acao-texto', el('span', {}, t)); },
    painel(...filhos) { atual = 'painel'; mostrar('acao-painel', el('div', { class: 'acao-cartao' }, ...filhos)); },
  };
}

function prepararCanvas(canvas, largura, altura, leve) {
  const dpr = Math.max(1, Math.min(leve ? 1 : 2, window.devicePixelRatio || 1));
  canvas.style.width = `${largura}px`;
  canvas.style.height = `${altura}px`;
  canvas.width = Math.round(largura * dpr);
  canvas.height = Math.round(altura * dpr);
  return dpr;
}

// Altura livre no ecrã, desde o topo de um elemento até ao fundo (descontando o que vem depois dele).
function alturaLivre(elemento, depois) {
  const topo = elemento.getBoundingClientRect().top + (window.pageYOffset || 0);
  return (window.innerHeight || 600) - topo - depois;
}

// Põe os filhos certos na ronda, conforme o ecrã está ao alto ou deitado.
function arrumar(ronda, deitado, filhos) {
  ronda.classList.toggle('acao-deitado', deitado);
  limpar(ronda);
  ronda.append(...filhos.filter(Boolean));
}

function retangulo(g, x, y, l, a, r) {
  const rr = Math.min(r, l / 2, a / 2);
  g.beginPath();
  g.moveTo(x + rr, y);
  g.arcTo(x + l, y, x + l, y + a, rr);
  g.arcTo(x + l, y + a, x, y + a, rr);
  g.arcTo(x, y + a, x, y, rr);
  g.arcTo(x, y, x + l, y, rr);
  g.closePath();
}

/* =====================================================================
   1. Frutas em Linha — trocar frutas vizinhas para fazer 3 ou mais iguais
   ===================================================================== */
const FRUTAS = ['🍎', '🍋', '🍇', '🍐', '🍊', '🍉', '🍓', '🍒'];
const NOME_FRUTA = ['maçã', 'limão', 'uvas', 'pera', 'laranja', 'melancia', 'morango', 'cerejas'];
const CFG_FRUTAS = [null,
  { n: 6, tipos: 4, jogadas: 20, objetivo: 1500, valor: 10 },
  { n: 7, tipos: 5, jogadas: 20, objetivo: 3000, valor: 20 },
  { n: 8, tipos: 6, jogadas: 18, objetivo: 3600, valor: 30 },
  { n: 8, tipos: 7, jogadas: 15, objetivo: 4200, valor: 50 },
];

// Índices das frutas que estão em linhas (ou colunas) de 3 ou mais iguais.
function gruposIguais(t, n) {
  const s = new Set();
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      let f = c;
      while (f + 1 < n && t[r * n + f + 1] === t[r * n + c]) f++;
      if (f - c >= 2) for (let x = c; x <= f; x++) s.add(r * n + x);
      c = f + 1;
    }
  }
  for (let c = 0; c < n; c++) {
    let r = 0;
    while (r < n) {
      let f = r;
      while (f + 1 < n && t[(f + 1) * n + c] === t[r * n + c]) f++;
      if (f - r >= 2) for (let y = r; y <= f; y++) s.add(y * n + c);
      r = f + 1;
    }
  }
  return Array.from(s);
}

// Todas as trocas de vizinhas que fazem pelo menos 3 iguais: [i, j, quantas frutas saem].
function trocasPossiveis(t, n) {
  const lista = [];
  for (let i = 0; i < n * n; i++) {
    const vizinhas = [];
    if (i % n < n - 1) vizinhas.push(i + 1);
    if (i + n < n * n) vizinhas.push(i + n);
    for (const j of vizinhas) {
      if (t[i] === t[j]) continue;
      const a = t[i]; t[i] = t[j]; t[j] = a;
      const g = gruposIguais(t, n);
      if (g.indexOf(i) >= 0 || g.indexOf(j) >= 0) lista.push([i, j, g.length]);
      t[j] = t[i]; t[i] = a;
    }
  }
  return lista;
}

function tiposIniciais(n, k) {
  for (let tentativa = 0; tentativa < 200; tentativa++) {
    const t = new Array(n * n);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        let v;
        do { v = Math.floor(Math.random() * k); }
        while ((c >= 2 && t[r * n + c - 1] === v && t[r * n + c - 2] === v) || (r >= 2 && t[(r - 1) * n + c] === v && t[(r - 2) * n + c] === v));
        t[r * n + c] = v;
      }
    }
    if (trocasPossiveis(t, n).length) return t;
  }
  return null;
}

export function frutas(alvo, { nivel, aoTerminar, rapidoTeste }) {
  const N = nivelValido(nivel);
  const cfg = CFG_FRUTAS[N];
  const n = cfg.n;
  const leve = ehLeve();
  const f = rapidoTeste ? 0.25 : leve ? 0.55 : 1;
  const T = { mov: Math.round(300 * f), sai: Math.round(270 * f), pausa: Math.round(110 * f) };
  const ctl = criarControlo();
  const grelha = new Array(n * n);
  let pontos = 0;
  let jogadas = cfg.jogadas;
  let usadas = 0;
  let estado = 'pronto';
  let escolhida = null;
  let pista = null;
  let tPista = 0;
  let terminou = false;

  limpar(alvo);
  alvo.classList.add('ecra-cheio');
  const elJogadas = el('b', {}, String(jogadas));
  const elPontos = el('b', {}, '0');
  const barra = el('i', { style: { width: '0%' } });
  const msg = el('p', { class: 'frutas-msg', 'aria-live': 'polite' }, 'Escolha a primeira fruta.');
  const tab = el('div', { class: 'frutas-tabuleiro', 'data-estado': 'pronto', 'aria-label': 'Tabuleiro de frutas' });
  tab.style.setProperty('--frutas-mov', `${T.mov}ms`);
  tab.style.setProperty('--frutas-sai', `${T.sai}ms`);
  const caixa = el('div', { class: 'frutas-caixa' }, tab);
  const btnAjuda = el('button', { class: 'btn claro frutas-ajuda', type: 'button', onclick: () => ajuda() }, '💡 Ajuda');
  const acoes = el('div', { class: 'frutas-acoes' }, btnAjuda, msg);
  const dica = el('p', { class: 'frutas-dica' }, 'Toque numa fruta e depois numa vizinha para as trocar. Junte 3 ou mais iguais em linha!');
  const info = el('div', { class: 'frutas-info' },
    el('span', {}, 'Jogadas: ', elJogadas),
    el('span', {}, 'Pontos: ', elPontos, ` / ${cfg.objetivo}`));
  const elBarra = el('div', { class: 'barra frutas-barra', 'aria-hidden': 'true' }, barra);
  const lado = el('div', { class: 'frutas-lado' });
  const ronda = el('div', { class: 'ronda frutas' });
  alvo.append(ronda);
  let deitado = null;
  function organizar() {
    const d = ecraDeitado();
    if (d === deitado) return;
    deitado = d;
    if (d) {
      limpar(lado);
      lado.append(dica, info, elBarra, acoes);
      arrumar(ronda, true, [caixa, lado]);
    } else arrumar(ronda, false, [dica, info, elBarra, caixa, acoes]);
  }

  const tipos = () => grelha.map(p => p.t);
  const dizer = t => { msg.textContent = t; };
  function mudarEstado(s) { estado = s; tab.setAttribute('data-estado', s); }
  function atualizarInfo() {
    elJogadas.textContent = String(jogadas);
    elPontos.textContent = String(pontos);
    barra.style.width = `${Math.min(100, (pontos / cfg.objetivo) * 100)}%`;
  }
  function criarPeca(t, r, c) {
    const e = el('div', { class: 'frutas-peca', role: 'button' }, el('i', { 'aria-hidden': 'true' }, FRUTAS[t]));
    e.style.width = `${100 / n}%`;
    e.style.height = `${100 / n}%`;
    e.setAttribute('aria-label', NOME_FRUTA[t]);
    return { t, e, r, c };
  }
  function colocar(p) {
    p.e.style.transform = `translate(${p.c * 100}%, ${p.r * 100}%)`;
    p.e.setAttribute('data-r', p.r);
    p.e.setAttribute('data-c', p.c);
  }
  function dimensionar() {
    organizar();
    // primeiro pequeno: um tabuleiro largo demais, mesmo por um instante, faz o telemóvel afastar o zoom e baralha as medidas
    caixa.style.maxWidth = '200px';
    caixa.style.width = '200px';
    let ladoTab;
    if (deitado) {
      const largura = Math.max(200, ronda.clientWidth - 300);
      ladoTab = Math.max(200, Math.min(largura, alturaLivre(caixa, 10), 560));
    } else {
      const largura = Math.min(ronda.clientWidth || 300, 470);
      const livre = alturaLivre(caixa, acoes.offsetHeight + 18);
      ladoTab = Math.max(Math.min(largura, livre), Math.min(largura, 250));
    }
    ladoTab = Math.round(ladoTab);
    caixa.style.maxWidth = `${ladoTab}px`;
    caixa.style.width = deitado ? `${ladoTab}px` : '';
    tab.style.fontSize = `${Math.round((ladoTab / n) * 0.6)}px`;
  }

  // Tabuleiro inicial, sem grupos já feitos e com pelo menos uma troca possível.
  const inicial = tiposIniciais(n, cfg.tipos);
  for (let i = 0; i < n * n; i++) {
    const p = criarPeca(inicial[i], Math.floor(i / n), i % n);
    grelha[i] = p;
    colocar(p);
    tab.append(p.e);
  }
  dimensionar();

  tab.addEventListener('click', e => {
    if (estado !== 'pronto') return;
    let no = e.target;
    while (no && no !== tab && !(no.classList && no.classList.contains('frutas-peca'))) no = no.parentNode;
    if (!no || no === tab) return;
    let p = null;
    for (let i = 0; i < grelha.length; i++) if (grelha[i].e === no) { p = grelha[i]; break; }
    if (p) tocar(p);
  });

  function tirarPista() {
    ctl.cancelar(tPista);
    if (pista) pista.forEach(p => p.e.classList.remove('frutas-pista'));
    pista = null;
  }
  function tocar(p) {
    tirarPista();
    if (!escolhida) { escolhida = p; p.e.classList.add('frutas-escolhida'); som.clique(); dizer('Agora toque numa vizinha.'); return; }
    if (escolhida === p) { p.e.classList.remove('frutas-escolhida'); escolhida = null; dizer('Escolha a primeira fruta.'); return; }
    const a = escolhida;
    a.e.classList.remove('frutas-escolhida');
    escolhida = null;
    if (Math.abs(a.r - p.r) + Math.abs(a.c - p.c) === 1) trocar(a, p);
    else { escolhida = p; p.e.classList.add('frutas-escolhida'); som.clique(); dizer('Agora toque numa vizinha.'); }
  }
  function permutar(a, b) {
    const r = a.r;
    const c = a.c;
    a.r = b.r; a.c = b.c; b.r = r; b.c = c;
    grelha[a.r * n + a.c] = a;
    grelha[b.r * n + b.c] = b;
    colocar(a);
    colocar(b);
  }
  function trocar(a, b) {
    mudarEstado('ocupado');
    permutar(a, b);
    som.peca();
    ctl.depois(T.mov + 40, () => {
      if (!gruposIguais(tipos(), n).length) {
        permutar(a, b);
        som.quase();
        dizer('Assim não faz 3 iguais. Tente outra.');
        ctl.depois(T.mov + 40, () => mudarEstado('pronto'));
        return;
      }
      jogadas--;
      usadas++;
      atualizarInfo();
      cascata(1);
    });
  }
  function cascata(cadeia) {
    const iguais = gruposIguais(tipos(), n);
    if (!iguais.length) { fimDaJogada(); return; }
    const ganho = iguais.length * cfg.valor * (cadeia > 1 ? 2 : 1);
    pontos += ganho;
    atualizarInfo();
    if (cadeia > 1) { som.rapido(); dizer(`Em cadeia! O dobro: +${ganho}`); } else {
      som.certo();
      dizer(iguais.length >= 5 ? `Muito bem! +${ganho}` : `+${ganho} pontos`);
    }
    iguais.forEach(i => grelha[i].e.classList.add('frutas-sai'));
    ctl.depois(T.sai, () => {
      iguais.forEach(i => { tab.removeChild(grelha[i].e); grelha[i] = null; });
      cair();
      ctl.depois(T.mov + T.pausa, () => cascata(cadeia + 1));
    });
  }
  // As frutas de cima descem para os buracos e entram frutas novas por cima.
  function cair() {
    const novas = [];
    for (let c = 0; c < n; c++) {
      let livre = n - 1;
      for (let r = n - 1; r >= 0; r--) {
        const p = grelha[r * n + c];
        if (!p) continue;
        if (livre !== r) { grelha[livre * n + c] = p; grelha[r * n + c] = null; p.r = livre; colocar(p); }
        livre--;
      }
      const vazias = livre + 1;
      for (let r = livre; r >= 0; r--) {
        const p = criarPeca(Math.floor(Math.random() * cfg.tipos), r - vazias, c);
        p.e.classList.add('frutas-nova');
        colocar(p);
        tab.append(p.e);
        p.r = r;
        grelha[r * n + c] = p;
        novas.push(p);
      }
    }
    if (novas.length) {
      void tab.offsetWidth; // fixa a posição de partida antes de as deixar cair
      novas.forEach(p => { p.e.classList.remove('frutas-nova'); colocar(p); });
    }
  }
  function fimDaJogada() {
    if (pontos >= cfg.objetivo || jogadas <= 0) { terminar(); return; }
    if (!trocasPossiveis(tipos(), n).length) { baralharTabuleiro(); return; }
    mudarEstado('pronto');
    if (jogadas <= 3) dizer(jogadas === 1 ? 'Última jogada!' : `Faltam ${jogadas} jogadas.`);
  }
  function baralharTabuleiro() {
    mudarEstado('ocupado');
    tirarPista();
    dizer('Sem trocas possíveis: frutas baralhadas.');
    tab.classList.add('frutas-baralha');
    ctl.depois(T.sai + 80, () => {
      let novo = null;
      for (let k = 0; k < 80 && !novo; k++) {
        const t = baralhar(tipos());
        if (!gruposIguais(t, n).length && trocasPossiveis(t, n).length) novo = t;
      }
      if (!novo) novo = tiposIniciais(n, cfg.tipos);
      grelha.forEach((p, i) => {
        p.t = novo[i];
        p.e.firstChild.textContent = FRUTAS[p.t];
        p.e.setAttribute('aria-label', NOME_FRUTA[p.t]);
      });
      tab.classList.remove('frutas-baralha');
      ctl.depois(T.sai + 80, () => mudarEstado('pronto'));
    });
  }
  function ajuda() {
    if (estado !== 'pronto') return;
    const lista = trocasPossiveis(tipos(), n);
    if (!lista.length) { baralharTabuleiro(); return; }
    let maior = 0;
    lista.forEach(x => { if (x[2] > maior) maior = x[2]; });
    const melhores = lista.filter(x => x[2] === maior);
    const escolha = melhores[Math.floor(Math.random() * melhores.length)];
    tirarPista();
    if (escolhida) { escolhida.e.classList.remove('frutas-escolhida'); escolhida = null; }
    pista = [grelha[escolha[0]], grelha[escolha[1]]];
    pista.forEach(p => p.e.classList.add('frutas-pista'));
    som.clique();
    dizer('Troque as duas frutas a azul.');
    tPista = ctl.depois(9000, tirarPista);
  }
  function terminar() {
    if (terminou) return;
    terminou = true;
    mudarEstado('fim');
    tirarPista();
    btnAjuda.disabled = true;
    const pct = pontos / cfg.objetivo;
    const chegou = pct >= 1;
    const estrelas = chegou ? 3 : pct >= 0.7 ? 2 : 1;
    dizer(chegou ? 'Chegou ao objetivo! 🎉' : 'Acabaram as jogadas.');
    const rec = chegou ? verRecorde(`frutas-${N}`, usadas, true) : null;
    ctl.depois(rapidoTeste ? 250 : 1400, () => aoTerminar({
      estrelas,
      titulo: chegou ? 'Chegou ao objetivo! 🎉' : estrelas === 2 ? 'Quase lá! 👏' : 'Acabaram as jogadas',
      numeros: [
        { valor: String(pontos), rotulo: `pontos (objetivo: ${cfg.objetivo})` },
        { valor: String(usadas), rotulo: usadas === 1 ? 'jogada' : 'jogadas' },
        rec && rec.anterior != null ? { valor: String(Math.min(rec.anterior, usadas)), rotulo: 'recorde (menos jogadas)' } : null,
      ].filter(Boolean),
      recorde: Boolean(rec && rec.bateu && !rec.primeiro),
    }));
  }

  let tRedim = 0;
  ctl.ouvir(window, 'resize', () => { ctl.cancelar(tRedim); tRedim = ctl.depois(150, dimensionar); });
  if (rapidoTeste) {
    // só para os testes automáticos (a app nunca passa esta opção)
    window.__frutas = {
      estado: () => estado,
      baralhar: () => { if (estado === 'pronto') baralharTabuleiro(); },
      semGrupos: () => gruposIguais(tipos(), n).length === 0,
      temTrocas: () => trocasPossiveis(tipos(), n).length > 0,
    };
  }

  return () => {
    ctl.acabar();
    alvo.classList.remove('ecra-cheio');
  };
}

/* =====================================================================
   2. Ténis de Mesa — a raquete de baixo é da pessoa, a de cima do computador
   ===================================================================== */
export function tenis(alvo, { nivel, aoTerminar, rapidoTeste }) {
  const N = nivelValido(nivel);
  const W = 300;
  const H = 400;
  const R = 7;
  const ESP = 10;
  const Y_EU = H - 30; // face de cima da raquete da pessoa
  const Y_CPU = 30; // face de baixo da raquete do computador
  const VENCE = 5;
  const cfg = {
    vel: [125, 160, 200, 240][N - 1], // velocidade da bola (unidades da mesa por segundo; a mesa tem 400 de comprido)
    eu: [124, 94, 78, 66][N - 1], // largura da raquete da pessoa
    cpu: 64,
    velCpu: [80, 115, 155, 195][N - 1],
    erro: [66, 54, 47, 42][N - 1], // quanto o computador pode falhar a pontaria
    ver: [0.45, 0.55, 0.7, 0.85][N - 1], // a partir de onde o computador começa a seguir a bola
    botoes: [230, 250, 270, 290][N - 1],
  };
  const FATOR = rapidoTeste ? 2.5 : 1;
  const leve = ehLeve();
  const ctl = criarControlo();
  const pontos = { eu: 0, cpu: 0 };
  const eu = { x: W / 2, w: cfg.eu };
  const cpu = { x: W / 2, w: cfg.cpu };
  let bola = { x: W / 2, y: H / 2, vx: 0, vy: 0, vel: cfg.vel };
  let estado = 'inicio';
  let antesDaPausa = null;
  let tempoEstado = 0;
  let servirNoFim = true;
  let servicos = 0;
  let cpuAlvo = null;
  let toques = 0;
  let ultimo = 0;
  let dirBotoes = 0;
  let dirTeclas = 0;
  let aArrastar = false;
  let escala = 1;
  let dpr = 1;
  let terminou = false;
  const corMesa = (getComputedStyle(document.documentElement).getPropertyValue('--mesa') || '').trim() || '#1e7a4c';

  limpar(alvo);
  alvo.classList.add('ecra-cheio');
  const elEu = el('b', {}, '0');
  const elCpu = el('b', {}, '0');
  const btnPausa = el('button', { class: 'btn claro pausa acao-pausa', type: 'button', onclick: () => pausar() }, '⏸ Pausa');
  const canvas = el('canvas', { class: 'tenis-mesa', 'aria-label': 'Mesa de ténis' });
  const g = canvas.getContext('2d');
  const sobre = criarSobre();
  const campo = el('div', { class: 'acao-campo tenis-campo' }, canvas, sobre.el);
  const caixa = el('div', { class: 'acao-caixa' }, campo);
  const btnEsq = el('button', { class: 'btn claro grande tenis-seta', type: 'button', 'aria-label': 'Mexer para a esquerda' }, '◀');
  const btnDir = el('button', { class: 'btn claro grande tenis-seta', type: 'button', 'aria-label': 'Mexer para a direita' }, '▶');
  const chipCpu = el('span', { class: 'acao-chip tenis-cpu', 'aria-live': 'polite' }, 'Computador: ', elCpu);
  const chipEu = el('span', { class: 'acao-chip tenis-eu', 'aria-live': 'polite' }, 'Você', el('br'), elEu);
  const topo = el('div', { class: 'acao-topo' });
  const controlos = el('div', { class: 'tenis-controlos' });
  const ladoEsq = el('div', { class: 'acao-lado' });
  const ladoDir = el('div', { class: 'acao-lado' });
  const ronda = el('div', { class: 'ronda acao tenis' });
  alvo.append(ronda);
  let deitado = null;
  function organizar() {
    const d = ecraDeitado();
    if (d === deitado) return;
    deitado = d;
    if (d) {
      // tablet deitado: ◀ à esquerda da mesa, ▶ à direita
      limpar(ladoEsq); limpar(ladoDir);
      ladoEsq.append(chipCpu, btnPausa, el('div', { class: 'acao-espaco' }), btnEsq);
      ladoDir.append(el('div', { class: 'acao-espaco' }), chipEu, btnDir);
      arrumar(ronda, true, [ladoEsq, caixa, ladoDir]);
    } else {
      limpar(topo); limpar(controlos);
      topo.append(chipCpu, btnPausa);
      controlos.append(btnEsq, chipEu, btnDir);
      arrumar(ronda, false, [topo, caixa, controlos]);
    }
  }

  function dimensionar() {
    organizar();
    let alt;
    let largura;
    if (deitado) {
      largura = Math.max(200, ronda.clientWidth - 2 * 150);
      alt = Math.min((largura * 4) / 3, alturaLivre(caixa, 10));
    } else {
      largura = Math.min(ronda.clientWidth || 300, 480);
      alt = Math.min((largura * 4) / 3, alturaLivre(caixa, controlos.offsetHeight + 22));
    }
    alt = Math.max(alt, 240);
    const l = Math.floor((alt * 3) / 4);
    const a = Math.floor((l * 4) / 3);
    dpr = prepararCanvas(canvas, l, a, leve);
    campo.style.width = `${l}px`;
    campo.style.height = `${a}px`;
    escala = l / W;
    desenhar();
  }

  function raquete(x, y, w, cor) {
    retangulo(g, x - w / 2, y, w, ESP, 5);
    g.fillStyle = cor;
    g.fill();
    g.lineWidth = 2;
    g.strokeStyle = '#ffffff';
    g.stroke();
  }
  function desenhar() {
    g.setTransform(escala * dpr, 0, 0, escala * dpr, 0, 0);
    g.fillStyle = corMesa;
    g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255,255,255,.7)';
    g.lineWidth = 3;
    g.strokeRect(1.5, 1.5, W - 3, H - 3);
    g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.stroke();
    // a rede, a meio da mesa
    g.strokeStyle = 'rgba(255,255,255,.85)';
    g.lineWidth = 4;
    if (g.setLineDash) g.setLineDash([8, 6]);
    g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
    if (g.setLineDash) g.setLineDash([]);
    raquete(cpu.x, Y_CPU - ESP, cpu.w, '#1d2633');
    raquete(eu.x, Y_EU, eu.w, '#f57c00');
    if (estado === 'jogo' || estado === 'contagem' || estado === 'pausa') {
      g.fillStyle = 'rgba(0,0,0,.25)';
      g.beginPath(); g.arc(bola.x + 2, bola.y + 3, R, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffffff';
      g.beginPath(); g.arc(bola.x, bola.y, R, 0, Math.PI * 2); g.fill();
    }
  }

  function atualizarPlacar() { elEu.textContent = String(pontos.eu); elCpu.textContent = String(pontos.cpu); }
  const limitar = (x, w) => Math.max(w / 2, Math.min(W - w / 2, x));

  function servir() {
    const paraBaixo = servicos % 2 === 0;
    servicos++;
    const ang = (Math.random() * 2 - 1) * 0.42;
    const vel = cfg.vel * 0.85;
    bola = { x: W / 2, y: H / 2, vel, vx: vel * Math.sin(ang), vy: (paraBaixo ? 1 : -1) * vel * Math.cos(ang) };
    cpuAlvo = null;
  }
  function preverX(yAlvo) {
    const t = (yAlvo - bola.y) / bola.vy;
    const min = R;
    const L = W - 2 * R;
    let x = (bola.x + bola.vx * t - min) % (2 * L);
    if (x < 0) x += 2 * L;
    if (x > L) x = 2 * L - x;
    return x + min;
  }
  function rebater(raq, sentido) {
    const desvio = Math.max(-1, Math.min(1, (bola.x - raq.x) / (raq.w / 2 + R)));
    const ang = desvio * 0.95; // até uns 54 graus nas pontas da raquete
    bola.vel = Math.min(cfg.vel * 1.3, bola.vel * 1.04);
    bola.vx = bola.vel * Math.sin(ang);
    bola.vy = sentido * bola.vel * Math.cos(ang);
    bola.y = sentido < 0 ? Y_EU - R : Y_CPU + R;
    cpuAlvo = null;
    som.clique();
  }
  function fisica(h) {
    const yAntes = bola.y;
    bola.x += bola.vx * h;
    bola.y += bola.vy * h;
    if (bola.x < R) { bola.x = 2 * R - bola.x; bola.vx = Math.abs(bola.vx); }
    if (bola.x > W - R) { bola.x = 2 * (W - R) - bola.x; bola.vx = -Math.abs(bola.vx); }
    if (bola.vy > 0 && yAntes + R <= Y_EU && bola.y + R >= Y_EU && Math.abs(bola.x - eu.x) <= eu.w / 2 + R * 0.8) {
      rebater(eu, -1);
      toques++;
    } else if (bola.vy < 0 && yAntes - R >= Y_CPU && bola.y - R <= Y_CPU && Math.abs(bola.x - cpu.x) <= cpu.w / 2 + R * 0.8) {
      rebater(cpu, 1);
    }
    if (bola.y - R > H) ponto('cpu');
    else if (bola.y + R < 0) ponto('eu');
  }
  function moverCpu(h) {
    let destino = W / 2;
    if (estado === 'jogo' && bola.vy < 0) {
      if (cpuAlvo == null && bola.y < H * cfg.ver) cpuAlvo = preverX(Y_CPU + R) + (Math.random() * 2 - 1) * cfg.erro;
      destino = cpuAlvo == null ? cpu.x : cpuAlvo;
    }
    const d = destino - cpu.x;
    const passo = cfg.velCpu * h * (estado === 'jogo' && bola.vy < 0 ? 1 : 0.5);
    cpu.x = limitar(Math.abs(d) <= passo ? destino : cpu.x + (d > 0 ? passo : -passo), cpu.w);
  }
  function ponto(quem) {
    pontos[quem]++;
    atualizarPlacar();
    estado = 'ponto';
    tempoEstado = 1.4;
    if (quem === 'eu') { som.certo(); sobre.texto(pontos.eu >= VENCE ? 'Ganhou o jogo! 🎉' : 'Ponto para si! 👏'); } else {
      som.quase();
      sobre.texto(pontos.cpu >= VENCE ? 'O computador ganhou.' : 'Ponto do computador.');
    }
  }
  function iniciarContagem(servirDepois) {
    estado = 'contagem';
    servirNoFim = servirDepois;
    tempoEstado = 2.7; // 3, 2, 1 — cerca de 0,9 s cada
    if (servirDepois) bola = { x: W / 2, y: H / 2, vx: 0, vy: 0, vel: cfg.vel };
    sobre.numero(3);
    arrancar();
  }

  function atualizar(h) {
    const dir = aArrastar ? 0 : (dirBotoes || dirTeclas);
    if (dir) eu.x = limitar(eu.x + dir * cfg.botoes * h, eu.w);
    if (estado === 'contagem') {
      tempoEstado -= h;
      moverCpu(h);
      if (tempoEstado <= 0) {
        sobre.esconder();
        if (servirNoFim) servir();
        estado = 'jogo';
      } else sobre.numero(Math.ceil(tempoEstado / 0.9));
    } else if (estado === 'ponto') {
      tempoEstado -= h;
      moverCpu(h);
      if (tempoEstado <= 0) {
        if (pontos.eu >= VENCE || pontos.cpu >= VENCE) terminar();
        else iniciarContagem(true);
      }
    } else if (estado === 'jogo') {
      // passos pequenos, para a bola nunca atravessar uma raquete
      const passos = Math.max(1, Math.ceil(h / (1 / 120)));
      const p = h / passos;
      for (let k = 0; k < passos && estado === 'jogo'; k++) { moverCpu(p); fisica(p); }
    }
  }
  const aCorrer = () => estado === 'contagem' || estado === 'jogo' || estado === 'ponto';
  function ciclo(t) {
    let dt = ultimo ? (t - ultimo) / 1000 : 0;
    ultimo = t;
    if (dt > 0.05) dt = 0.05; // um telemóvel lento não faz a bola «saltar»
    if (dt < 0) dt = 0;
    atualizar(dt * FATOR);
    desenhar();
    if (aCorrer()) ctl.quadro(ciclo);
  }
  function arrancar() { ultimo = 0; ctl.quadro(ciclo); }

  function pausar() {
    if (!aCorrer()) return;
    antesDaPausa = estado;
    estado = 'pausa';
    ctl.pararQuadro();
    dirBotoes = 0;
    dirTeclas = 0;
    desenhar();
    btnPausa.disabled = true;
    sobre.painel(
      el('h2', {}, '⏸ Em pausa'),
      el('p', {}, 'O jogo está parado. Descanse o tempo que quiser.'),
      el('button', { class: 'btn verde acao-continuar', type: 'button', onclick: continuar }, '▶ Continuar'));
  }
  function continuar() {
    if (estado !== 'pausa') return;
    btnPausa.disabled = false;
    if (antesDaPausa === 'ponto') { estado = 'ponto'; tempoEstado = 0.3; sobre.esconder(); arrancar(); } else iniciarContagem(antesDaPausa === 'contagem' ? servirNoFim : false);
  }
  function comecar() {
    if (estado !== 'inicio') return;
    btnPausa.disabled = false;
    iniciarContagem(true);
  }
  function terminar() {
    if (terminou) return;
    terminou = true;
    estado = 'fim';
    ctl.pararQuadro();
    btnPausa.disabled = true;
    btnEsq.disabled = true;
    btnDir.disabled = true;
    desenhar();
    const ganhou = pontos.eu >= VENCE;
    const estrelas = ganhou ? (pontos.cpu <= 2 ? 3 : 2) : 1;
    sobre.texto(ganhou ? `Ganhou ${pontos.eu}–${pontos.cpu}! 🎉` : `O computador ganhou ${pontos.cpu}–${pontos.eu}.`);
    ctl.depois(rapidoTeste ? 300 : 1600, () => aoTerminar({
      estrelas,
      titulo: ganhou ? 'Ganhou! 🎉' : 'Desta vez ganhou o computador',
      numeros: [
        { valor: `${pontos.eu} – ${pontos.cpu}`, rotulo: 'resultado (você – computador)' },
        { valor: String(toques), rotulo: toques === 1 ? 'bola devolvida' : 'bolas devolvidas' },
      ],
      recorde: false,
    }));
  }

  // Controlos: arrastar o dedo na mesa, botões ◀ ▶ (manter premido) e as setas do teclado.
  const xDaMesa = clientX => { const r = canvas.getBoundingClientRect(); return ((clientX - r.left) / (r.width || 1)) * W; };
  const seguirDedo = cx => {
    if (estado === 'fim' || estado === 'pausa' || estado === 'inicio') return;
    eu.x = limitar(xDaMesa(cx), eu.w);
    if (!aCorrer()) desenhar();
  };
  arrasto(canvas, ctl, {
    inicio: x => { aArrastar = true; seguirDedo(x); },
    mover: x => seguirDedo(x),
    fim: () => { aArrastar = false; },
  });
  segurar(btnEsq, () => { dirBotoes = -1; }, () => { if (dirBotoes === -1) dirBotoes = 0; });
  segurar(btnDir, () => { dirBotoes = 1; }, () => { if (dirBotoes === 1) dirBotoes = 0; });
  ctl.ouvir(document, 'keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'Left') { dirTeclas = -1; e.preventDefault(); }
    if (e.key === 'ArrowRight' || e.key === 'Right') { dirTeclas = 1; e.preventDefault(); }
  });
  ctl.ouvir(document, 'keyup', e => {
    if ((e.key === 'ArrowLeft' || e.key === 'Left') && dirTeclas === -1) dirTeclas = 0;
    if ((e.key === 'ArrowRight' || e.key === 'Right') && dirTeclas === 1) dirTeclas = 0;
  });
  ctl.ouvir(document, 'visibilitychange', () => { if (document.hidden) pausar(); });
  let tRedim = 0;
  ctl.ouvir(window, 'resize', () => { ctl.cancelar(tRedim); tRedim = ctl.depois(150, dimensionar); });

  dimensionar();
  btnPausa.disabled = true;
  sobre.painel(
    el('h2', {}, '🏓 Ténis de Mesa'),
    el('p', {}, 'A sua raquete é a laranja, em baixo. Arraste o dedo na mesa ou use os botões ◀ ▶.'),
    el('p', {}, el('b', {}, `Ganha quem fizer ${VENCE} pontos primeiro.`)),
    el('button', { class: 'btn verde acao-comecar', type: 'button', onclick: comecar }, '▶ Começar'));

  if (rapidoTeste) {
    // só para os testes automáticos (a app nunca passa esta opção)
    window.__tenis = () => ({ estado, bola: { x: bola.x, y: bola.y, vx: bola.vx, vy: bola.vy }, eu: eu.x, euW: eu.w, cpu: cpu.x, pontos: { eu: pontos.eu, cpu: pontos.cpu }, W, H, Y_EU });
  }

  return () => {
    ctl.acabar();
    alvo.classList.remove('ecra-cheio');
  };
}

/* =====================================================================
   3. Cobra — comer maçãs e crescer, sem bater em si própria
   ===================================================================== */
const DIR = { cima: { x: 0, y: -1 }, baixo: { x: 0, y: 1 }, esq: { x: -1, y: 0 }, dir: { x: 1, y: 0 } };

export function cobra(alvo, { nivel, aoTerminar, rapidoTeste }) {
  const N = nivelValido(nivel);
  const cfg = {
    n: [10, 12, 12, 14][N - 1],
    passo: [480, 360, 280, 220][N - 1], // milissegundos por casa
    objetivo: [10, 14, 18, 22][N - 1],
    paredes: N > 1,
  };
  const n = cfg.n;
  const INICIAL = 3;
  const FATOR = rapidoTeste ? 1.5 : 1;
  const leve = ehLeve();
  const ctl = criarControlo();
  const meio = Math.floor(n / 2);
  const corpo = [{ x: meio, y: meio }, { x: meio - 1, y: meio }, { x: meio - 2, y: meio }];
  let dir = DIR.dir;
  const fila = [];
  let maca = null;
  let macas = 0;
  let passos = 0;
  let estado = 'inicio';
  let acc = 0;
  let ultimo = 0;
  let lado = 300;
  let dpr = 1;
  let fundo = null;
  let imgMaca = null;
  let batida = null;
  let avisouTras = false;
  let terminou = false;
  const recAntes = dados.recordes ? dados.recordes[`cobra-${N}`] : null;

  limpar(alvo);
  alvo.classList.add('ecra-cheio');
  const elComp = el('b', {}, String(corpo.length));
  const btnPausa = el('button', { class: 'btn claro pausa acao-pausa', type: 'button', onclick: () => pausar() }, '⏸ Pausa');
  const canvas = el('canvas', { class: 'cobra-grelha', 'aria-label': 'Grelha da cobra' });
  const g = canvas.getContext('2d');
  const sobre = criarSobre();
  const campo = el('div', { class: `acao-campo cobra-campo${cfg.paredes ? ' cobra-paredes' : ''}` }, canvas, sobre.el);
  const caixa = el('div', { class: 'acao-caixa' }, campo);
  const seta = (classe, rotulo, simbolo, d) => {
    const b = el('button', { class: `btn claro cobra-seta ${classe}`, type: 'button', 'aria-label': rotulo }, simbolo);
    premir(b, () => virar(d));
    return b;
  };
  const setas = el('div', { class: 'cobra-setas' },
    seta('cobra-esq', 'Para a esquerda', '◀', DIR.esq),
    seta('cobra-cima', 'Para cima', '▲', DIR.cima),
    seta('cobra-baixo', 'Para baixo', '▼', DIR.baixo),
    seta('cobra-dir', 'Para a direita', '▶', DIR.dir));
  const chip = el('span', { class: 'acao-chip cobra-info' }, 'Tamanho: ', elComp, ` de ${cfg.objetivo}`);
  const topo = el('div', { class: 'acao-topo' });
  const ladoEsq = el('div', { class: 'acao-lado' });
  const ladoDir = el('div', { class: 'acao-lado cobra-lado-setas' });
  const ronda = el('div', { class: 'ronda acao cobra' });
  alvo.append(ronda);
  let deitado = null;
  function organizar() {
    const d = ecraDeitado();
    if (d === deitado) return;
    deitado = d;
    if (d) {
      limpar(ladoEsq); limpar(ladoDir);
      ladoEsq.append(chip, btnPausa);
      ladoDir.append(setas);
      arrumar(ronda, true, [ladoEsq, caixa, ladoDir]);
    } else {
      limpar(topo);
      topo.append(chip, btnPausa);
      arrumar(ronda, false, [topo, caixa, setas]);
    }
  }

  function novaMaca() {
    const livres = [];
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        let ocupada = false;
        for (let i = 0; i < corpo.length; i++) if (corpo[i].x === x && corpo[i].y === y) { ocupada = true; break; }
        if (!ocupada) livres.push({ x, y });
      }
    }
    // longe da cabeça, para dar tempo de pensar
    const cab = corpo[0];
    const boas = livres.filter(c => Math.abs(c.x - cab.x) + Math.abs(c.y - cab.y) >= 3);
    const lista = boas.length ? boas : livres;
    maca = lista.length ? lista[Math.floor(Math.random() * lista.length)] : null;
  }
  novaMaca();

  function prepararDesenhos() {
    const s = lado / n;
    fundo = document.createElement('canvas');
    fundo.width = canvas.width;
    fundo.height = canvas.height;
    const f = fundo.getContext('2d');
    f.setTransform(dpr, 0, 0, dpr, 0, 0);
    f.fillStyle = '#f4fbf6';
    f.fillRect(0, 0, lado, lado);
    f.fillStyle = '#e1f0e5';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if ((x + y) % 2) f.fillRect(x * s, y * s, s, s);
    imgMaca = document.createElement('canvas');
    const px = Math.max(8, Math.round(s * dpr));
    imgMaca.width = px;
    imgMaca.height = px;
    const m = imgMaca.getContext('2d');
    m.textAlign = 'center';
    m.textBaseline = 'middle';
    m.font = `${Math.round(px * 0.8)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    m.fillText('🍎', px / 2, px / 2 + px * 0.05);
  }
  function dimensionar() {
    organizar();
    let l;
    if (deitado) {
      const largura = Math.max(200, ronda.clientWidth - 2 * 190) - 8; // 8 = bordas do campo
      l = Math.min(largura, alturaLivre(caixa, 10) - 8);
    } else {
      const largura = Math.min(ronda.clientWidth || 300, 480) - 8;
      const livre = alturaLivre(caixa, setas.offsetHeight + 26) - 8;
      l = Math.max(Math.min(largura, livre), Math.min(largura, 220));
    }
    l = Math.max(n * 12, Math.floor(l / n) * n); // casas com píxeis inteiros: desenho nítido
    lado = l;
    dpr = prepararCanvas(canvas, l, l, leve);
    prepararDesenhos();
    desenhar();
  }
  function desenhar() {
    const s = lado / n;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(fundo, 0, 0);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (maca) g.drawImage(imgMaca, maca.x * s, maca.y * s, s, s);
    for (let i = corpo.length - 1; i >= 0; i--) {
      const c = corpo[i];
      const cab = i === 0;
      g.fillStyle = cab ? (batida ? '#c62828' : '#0f5a33') : (i % 2 ? '#1f8f50' : '#28a35d');
      retangulo(g, c.x * s + 1, c.y * s + 1, s - 2, s - 2, s * (cab ? 0.38 : 0.3));
      g.fill();
    }
    // olhos, virados para onde a cobra vai
    const c = corpo[0];
    const cx = c.x * s + s / 2;
    const cy = c.y * s + s / 2;
    const px = -dir.y;
    const py = dir.x;
    [-1, 1].forEach(k => {
      const ox = cx + dir.x * s * 0.14 + px * s * 0.2 * k;
      const oy = cy + dir.y * s * 0.14 + py * s * 0.2 * k;
      g.fillStyle = '#ffffff';
      g.beginPath(); g.arc(ox, oy, s * 0.15, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#10261a';
      g.beginPath(); g.arc(ox + dir.x * s * 0.05, oy + dir.y * s * 0.05, s * 0.075, 0, Math.PI * 2); g.fill();
    });
  }

  function virar(d) {
    if (estado !== 'jogo') return;
    const ult = fila.length ? fila[fila.length - 1] : dir;
    if (d === ult) return;
    if (d.x === -ult.x && d.y === -ult.y) {
      if (!avisouTras) { avisouTras = true; aviso('A cobra não pode andar para trás. Vire primeiro para um dos lados.'); }
      return;
    }
    if (fila.length < 2) fila.push(d);
  }
  function avancar() {
    if (fila.length) dir = fila.shift();
    passos++;
    const cab = corpo[0];
    let x = cab.x + dir.x;
    let y = cab.y + dir.y;
    if (!cfg.paredes) { x = (x + n) % n; y = (y + n) % n; } else if (x < 0 || y < 0 || x >= n || y >= n) { bater('parede'); return; }
    const come = Boolean(maca) && x === maca.x && y === maca.y;
    const ate = come ? corpo.length : corpo.length - 1; // a ponta da cauda sai do sítio
    for (let i = 0; i < ate; i++) if (corpo[i].x === x && corpo[i].y === y) { bater('corpo'); return; }
    corpo.unshift({ x, y });
    if (come) {
      macas++;
      elComp.textContent = String(corpo.length);
      if (corpo.length >= cfg.objetivo) { som.certo(); chegar(); return; }
      som.rapido();
      novaMaca();
    } else corpo.pop();
  }
  function ciclo(t) {
    let dt = ultimo ? t - ultimo : 0;
    ultimo = t;
    if (dt > 100) dt = 100; // limite: num telemóvel lento a cobra abranda em vez de saltar casas
    if (dt < 0) dt = 0;
    acc += dt * FATOR;
    if (acc >= cfg.passo) {
      acc -= cfg.passo;
      if (acc > cfg.passo) acc = 0;
      avancar();
      desenhar();
    }
    if (estado === 'jogo') ctl.quadro(ciclo);
  }
  function arrancar(espera) { acc = -espera; ultimo = 0; ctl.quadro(ciclo); }

  function bater(onde) {
    estado = 'fim';
    batida = onde;
    ctl.pararQuadro();
    btnPausa.disabled = true;
    som.quase();
    desenhar();
    sobre.texto(onde === 'parede' ? 'Bateu na parede!' : 'A cobra tocou na própria cauda!');
    ctl.depois(rapidoTeste ? 300 : 1800, () => terminar(false));
  }
  function chegar() {
    estado = 'fim';
    ctl.pararQuadro();
    btnPausa.disabled = true;
    maca = null;
    desenhar();
    sobre.texto(`Chegou ao tamanho ${cfg.objetivo}! 🎉`);
    ctl.depois(rapidoTeste ? 300 : 1600, () => terminar(true));
  }
  function terminar(chegou) {
    if (terminou) return;
    terminou = true;
    const comp = corpo.length;
    const rec = verRecorde(`cobra-${N}`, comp, false);
    const fracao = (comp - INICIAL) / (cfg.objetivo - INICIAL);
    const estrelas = chegou ? 3 : fracao >= 0.5 ? 2 : 1;
    aoTerminar({
      estrelas,
      titulo: chegou ? 'Chegou ao objetivo! 🎉' : estrelas === 2 ? 'Muito bem! 👏' : 'Boa tentativa!',
      numeros: [
        { valor: String(comp), rotulo: `de tamanho (objetivo: ${cfg.objetivo})` },
        { valor: String(macas), rotulo: macas === 1 ? 'maçã comida' : 'maçãs comidas' },
        rec.anterior != null ? { valor: String(Math.max(rec.anterior, comp)), rotulo: 'o seu recorde' } : null,
      ].filter(Boolean),
      recorde: rec.bateu && !rec.primeiro,
    });
  }
  function pausar() {
    if (estado !== 'jogo') return;
    estado = 'pausa';
    ctl.pararQuadro();
    btnPausa.disabled = true;
    sobre.painel(
      el('h2', {}, '⏸ Em pausa'),
      el('p', {}, 'A cobra está à espera. Descanse o tempo que quiser.'),
      el('button', { class: 'btn verde acao-continuar', type: 'button', onclick: continuar }, '▶ Continuar'));
  }
  function continuar() {
    if (estado !== 'pausa') return;
    estado = 'jogo';
    btnPausa.disabled = false;
    sobre.esconder();
    arrancar(500);
  }
  function comecar() {
    if (estado !== 'inicio') return;
    estado = 'jogo';
    btnPausa.disabled = false;
    sobre.esconder();
    arrancar(600);
  }

  // Deslizar o dedo na grelha também vira a cobra.
  let x0 = 0;
  let y0 = 0;
  arrasto(canvas, ctl, {
    inicio: (x, y) => { x0 = x; y0 = y; },
    mover: (x, y) => {
      const dx = x - x0;
      const dy = y - y0;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) virar(dx > 0 ? DIR.dir : DIR.esq); else virar(dy > 0 ? DIR.baixo : DIR.cima);
      x0 = x;
      y0 = y;
    },
  });
  ctl.ouvir(document, 'keydown', e => {
    const d = { ArrowUp: DIR.cima, Up: DIR.cima, ArrowDown: DIR.baixo, Down: DIR.baixo, ArrowLeft: DIR.esq, Left: DIR.esq, ArrowRight: DIR.dir, Right: DIR.dir }[e.key];
    if (d && estado === 'jogo') { e.preventDefault(); virar(d); }
  });
  ctl.ouvir(document, 'visibilitychange', () => { if (document.hidden) pausar(); });
  let tRedim = 0;
  ctl.ouvir(window, 'resize', () => { ctl.cancelar(tRedim); tRedim = ctl.depois(150, dimensionar); });

  dimensionar();
  btnPausa.disabled = true;
  sobre.painel(
    el('h2', {}, '🐍 Cobra'),
    el('p', {}, 'Coma as maçãs 🍎 para crescer. Use as setas ou deslize o dedo na grelha.'),
    el('p', {}, cfg.paredes ? 'Não bata nas paredes nem na cauda. ' : 'Pode atravessar as paredes, mas não toque na cauda. ',
      el('b', {}, `Chegue ao tamanho ${cfg.objetivo}!`), recAntes != null ? ` (Recorde: ${recAntes}.)` : ''),
    el('button', { class: 'btn verde acao-comecar', type: 'button', onclick: comecar }, '▶ Começar'));

  if (rapidoTeste) {
    // só para os testes automáticos (a app nunca passa esta opção)
    window.__cobra = () => ({ estado, corpo: corpo.map(c => ({ x: c.x, y: c.y })), dir: { x: dir.x, y: dir.y }, fila: fila.length, maca: maca ? { x: maca.x, y: maca.y } : null, n, paredes: cfg.paredes, passos });
  }

  return () => {
    ctl.acabar();
    alvo.classList.remove('ecra-cheio');
  };
}
