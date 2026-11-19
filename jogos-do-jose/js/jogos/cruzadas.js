// Palavras Cruzadas: grelha livre (as palavras cruzam-se em letras comuns, sem encostar umas às outras),
// gerada na hora a partir do banco de palavras. Cada partida é diferente.
import {
  el, limpar, som, aviso, elogio, dados, guardar, verRecorde, baralhar, amostra, semAcentos, duracao, falar, calar,
} from '../util.js';

// min/alvo: quantas palavras · letras: tamanho das palavras · casa: tamanho das casas (px) ·
// cols/linhas: limites da grelha · mistura: parte das palavras que vem do nível anterior (mais fáceis).
const NIVEIS = {
  1: { alvo: 5, min: 4, letrasMin: 3, letras: 6, casaMin: 38, casaMax: 60, colsMax: 8, linhasMin: 5, linhasMax: 8, mistura: 0, primeira: true, ajuda: true },
  2: { alvo: 6, min: 6, letrasMin: 3, letras: 7, casaMin: 32, casaMax: 54, colsMax: 9, linhasMin: 7, linhasMax: 9, mistura: 0.3, primeira: false, ajuda: true },
  3: { alvo: 8, min: 8, letrasMin: 4, letras: 9, casaMin: 28, casaMax: 48, colsMax: 11, linhasMin: 9, linhasMax: 11, mistura: 0.3, primeira: false, ajuda: true },
  4: { alvo: 12, min: 10, letrasMin: 4, letras: 11, casaMin: 26, casaMax: 44, colsMax: 13, linhasMin: 11, linhasMax: 13, mistura: 0.45, primeira: false, ajuda: false },
};
// Sem K, W e Y: nenhuma palavra do banco os tem (como nas palavras cruzadas dos jornais).
const LETRAS = 'ABCDEFGHIJLMNOPQRSTUVXZ'.split('');
const ESPACO = 2; // px entre casas
const TEMPO_GERAR = 90; // ms, no máximo, a experimentar grelhas (num telemóvel fraco acaba sempre antes dos 300 ms)

// MAÇÃ → MACA, CORAÇÃO → CORACAO: como nas palavras cruzadas dos jornais.
const limpa = p => semAcentos(String(p)).toUpperCase().replace(/[^A-Z]/g, '');

/* ================= Banco de palavras ================= */
let BANCO = null;
function juntarBanco(PALAVRAS_CRUZADAS, DICAS_ANAGRAMAS, ANAGRAMAS) {
  if (BANCO) return BANCO;
  const vistas = {};
  const todas = [];
  const juntar = (n, texto, pista) => {
    const w = limpa(texto);
    if (w.length < 3 || vistas[w] || !pista) return;
    for (let i = 0; i < w.length; i++) if (LETRAS.indexOf(w[i]) < 0) return;
    vistas[w] = true;
    todas.push({ n, w, texto, pista });
  };
  PALAVRAS_CRUZADAS.forEach(x => juntar(x.n, x.p, x.d));
  (ANAGRAMAS || []).forEach(a => juntar(a.n, a.palavra, DICAS_ANAGRAMAS[limpa(a.palavra)] || a.dica));
  BANCO = todas;
  return todas;
}

/* ================= Gerador ================= */
const T = 32; // lado da área de trabalho (a grelha final nunca passa de 13)

// Tenta pôr as palavras de `cands`, por ordem, cada uma a cruzar alguma das que já lá estão.
// Uma palavra que não cabe é posta de lado e passa-se à seguinte.
function tentarGrelha(cands, cols, linhas, alvo) {
  const L = new Array(T * T).fill('');
  const H = new Array(T * T).fill(-1);
  const V = new Array(T * T).fill(-1);
  const onde = {};
  const postas = [];
  let minR = T;
  let maxR = -1;
  let minC = T;
  let maxC = -1;
  let cruzamentos = 0;

  function por(c, r0, c0, dir) {
    const w = c.w;
    const dr = dir === 'V' ? 1 : 0;
    const dc = 1 - dr;
    const id = postas.length;
    for (let k = 0; k < w.length; k++) {
      const i = (r0 + dr * k) * T + (c0 + dc * k);
      if (!L[i]) { L[i] = w[k]; (onde[w[k]] || (onde[w[k]] = [])).push(i); }
      if (dir === 'H') H[i] = id; else V[i] = id;
    }
    minR = Math.min(minR, r0); maxR = Math.max(maxR, r0 + dr * (w.length - 1));
    minC = Math.min(minC, c0); maxC = Math.max(maxC, c0 + dc * (w.length - 1));
    postas.push({ c, r: r0, col: c0, dir });
  }

  // Devolve o número de cruzamentos (0 = não toca em nada) ou -1 se a palavra não pode ficar ali.
  function avaliar(w, r0, c0, dir) {
    const dr = dir === 'V' ? 1 : 0;
    const dc = 1 - dr;
    const n = w.length;
    const r1 = r0 + dr * (n - 1);
    const c1 = c0 + dc * (n - 1);
    if (Math.max(maxR, r1) - Math.min(minR, r0) + 1 > linhas) return -1;
    if (Math.max(maxC, c1) - Math.min(minC, c0) + 1 > cols) return -1;
    if (r0 < 1 || c0 < 1 || r1 > T - 2 || c1 > T - 2) return -1;
    // antes da primeira letra e depois da última tem de haver uma casa vazia
    if (L[(r0 - dr) * T + (c0 - dc)] || L[(r1 + dr) * T + (c1 + dc)]) return -1;
    let cruz = 0;
    for (let k = 0; k < n; k++) {
      const i = (r0 + dr * k) * T + (c0 + dc * k);
      const x = L[i];
      if (x) {
        if (x !== w[k]) return -1;
        if (dir === 'H' ? H[i] >= 0 : V[i] >= 0) return -1; // já há uma palavra nesta direção
        cruz++;
      } else if (dir === 'H') {
        if (L[i - T] || L[i + T]) return -1; // letra nova encostada a outra: formava uma palavra falsa
      } else if (L[i - 1] || L[i + 1]) return -1;
    }
    return cruz;
  }

  const primeira = cands[0];
  const n0 = primeira.w.length;
  const dir0 = n0 > linhas ? 'H' : n0 > cols ? 'V' : (Math.random() < 0.65 ? 'H' : 'V');
  const meio = T >> 1;
  por(primeira, dir0 === 'H' ? meio : meio - (n0 >> 1), dir0 === 'H' ? meio - (n0 >> 1) : meio, dir0);

  for (let q = 1; q < cands.length && postas.length < alvo; q++) {
    const c = cands[q];
    const w = c.w;
    const areaAntes = (maxR - minR + 1) * (maxC - minC + 1);
    let melhor = null;
    let melhorPontos = -1e9;
    const experimentar = (r0, c0, dir) => {
      const cruz = avaliar(w, r0, c0, dir);
      if (cruz < 1) return;
      const dr = dir === 'V' ? 1 : 0;
      const alt = Math.max(maxR, r0 + dr * (w.length - 1)) - Math.min(minR, r0) + 1;
      const larg = Math.max(maxC, c0 + (1 - dr) * (w.length - 1)) - Math.min(minC, c0) + 1;
      // mais cruzamentos é melhor; crescer muito, ou fugir da forma da caixa, é pior
      const forma = Math.abs(larg / cols - alt / linhas);
      const pontos = cruz * 10 - (alt * larg - areaAntes) * 0.35 - forma * 12 + Math.random() * 6;
      if (pontos > melhorPontos) { melhorPontos = pontos; melhor = { r0, c0, dir, cruz }; }
    };
    for (let k = 0; k < w.length; k++) {
      const lista = onde[w[k]];
      if (!lista) continue;
      for (let j = 0; j < lista.length; j++) {
        const i = lista[j];
        const r = (i / T) | 0;
        const cc = i % T;
        if (H[i] < 0) experimentar(r, cc - k, 'H');
        if (V[i] < 0) experimentar(r - k, cc, 'V');
      }
    }
    if (melhor) { por(c, melhor.r0, melhor.c0, melhor.dir); cruzamentos += melhor.cruz; }
  }
  const largura = maxC - minC + 1;
  const altura = maxR - minR + 1;
  return {
    palavras: postas.map(p => ({ w: p.c.w, texto: p.c.texto, pista: p.c.pista, dir: p.dir, r: p.r - minR, c: p.col - minC })),
    cruzamentos, colunas: largura, linhas: altura,
  };
}

// Confirma que cada sequência de 2 ou mais letras, na horizontal e na vertical, é uma palavra posta
// (nada de «palavras» falsas), que as palavras cabem e que estão todas ligadas.
export function grelhaValida(g) {
  const R = g.linhas;
  const C = g.colunas;
  const L = new Array(R * C).fill('');
  for (const p of g.palavras) {
    for (let k = 0; k < p.w.length; k++) {
      const r = p.r + (p.dir === 'V' ? k : 0);
      const c = p.c + (p.dir === 'H' ? k : 0);
      if (r < 0 || c < 0 || r >= R || c >= C) return false;
      const i = r * C + c;
      if (L[i] && L[i] !== p.w[k]) return false;
      L[i] = p.w[k];
    }
  }
  const chaves = {};
  g.palavras.forEach(p => { chaves[`${p.dir}${p.r},${p.c},${p.w.length}`] = true; });
  let corridas = 0;
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C;) {
      if (!L[r * C + c]) { c++; continue; }
      let f = c;
      while (f < C && L[r * C + f]) f++;
      if (f - c >= 2) { if (!chaves[`H${r},${c},${f - c}`]) return false; corridas++; }
      c = f;
    }
  }
  for (let c = 0; c < C; c++) {
    for (let r = 0; r < R;) {
      if (!L[r * C + c]) { r++; continue; }
      let f = r;
      while (f < R && L[f * C + c]) f++;
      if (f - r >= 2) { if (!chaves[`V${r},${c},${f - r}`]) return false; corridas++; }
      r = f;
    }
  }
  if (corridas !== g.palavras.length) return false;
  // todas ligadas
  const visto = new Array(R * C).fill(false);
  const pilha = [];
  const inicio = L.findIndex(x => x);
  if (inicio < 0) return false;
  pilha.push(inicio);
  visto[inicio] = true;
  let ligadas = 0;
  while (pilha.length) {
    const i = pilha.pop();
    ligadas++;
    const r = (i / C) | 0;
    const c = i % C;
    [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([a, b]) => {
      if (a < 0 || b < 0 || a >= R || b >= C) return;
      const j = a * C + b;
      if (L[j] && !visto[j]) { visto[j] = true; pilha.push(j); }
    });
  }
  return ligadas === L.filter(x => x).length;
}

// Experimenta várias grelhas durante pouco tempo e fica com a melhor (mais palavras, mais cruzamentos,
// mais compacta). `novas`: palavras do nível · `faceis`: do nível anterior.
function gerar(novas, faceis, cfg, cols, linhas, alvo, minimo, tempoMax) {
  const t0 = Date.now();
  const maxLetras = Math.max(cols, linhas);
  const cabe = x => x.w.length <= maxLetras && x.w.length >= cfg.letrasMin && x.w.length <= cfg.letras;
  const A = novas.filter(cabe);
  const B = faceis.filter(cabe);
  let melhor = null;
  let melhorPontos = -1e9;
  let tentativas = 0;
  const quantasB = Math.round(44 * cfg.mistura);
  while (tentativas < 60) {
    tentativas++;
    // a primeira palavra é comprida (dá o «esqueleto»); depois, umas do nível e outras mais fáceis
    let cands = amostra(A, 44 - quantasB).concat(amostra(B, quantasB));
    cands = baralhar(cands);
    let iLonga = 0;
    for (let i = 1; i < Math.min(8, cands.length); i++) if (cands[i].w.length > cands[iLonga].w.length) iLonga = i;
    cands.unshift(cands.splice(iLonga, 1)[0]);
    const g = tentarGrelha(cands, cols, linhas, alvo);
    const n = g.palavras.length;
    const pontos = Math.min(n, alvo) * 1000 + g.cruzamentos * 15 - g.colunas * g.linhas;
    if (pontos > melhorPontos && grelhaValida(g)) { melhor = g; melhorPontos = pontos; }
    const ms = Date.now() - t0;
    if (melhor && melhor.palavras.length >= alvo && (tentativas >= 10 || ms > tempoMax / 2)) break;
    if (ms > tempoMax && melhor && melhor.palavras.length >= minimo) break;
    if (ms > tempoMax * 2.2) break;
  }
  return { grelha: melhor, tentativas, ms: Date.now() - t0 };
}

// Exportada para os testes: gera uma grelha para um nível, numa largura (px) e altura livre (px).
export function gerarCruzadas(nivel, banco, largura, alturaLivre, opcoes = {}) {
  const cfg = NIVEIS[nivel] || NIVEIS[1];
  const { cols, linhas } = limitesGrelha(cfg, largura, alturaLivre);
  const novas = opcoes.novas || banco.filter(x => x.n === nivel);
  const faceis = opcoes.faceis || (nivel > 1 ? banco.filter(x => x.n === nivel - 1) : []);
  const alvo = opcoes.alvo || cfg.alvo;
  const minimo = Math.min(alvo, opcoes.minimo || cfg.min);
  let r = gerar(novas, faceis, cfg, cols, linhas, alvo, minimo, opcoes.tempoMax || TEMPO_GERAR);
  // Caso raro: não se conseguiu o mínimo de palavras. Deixa-se a grelha crescer um pouco na altura.
  if (!r.grelha || r.grelha.palavras.length < minimo) {
    const r2 = gerar(novas, faceis, cfg, cols, linhas + 3, alvo, minimo, 40);
    if (r2.grelha && (!r.grelha || r2.grelha.palavras.length > r.grelha.palavras.length)) r = { grelha: r2.grelha, tentativas: r.tentativas + r2.tentativas, ms: r.ms + r2.ms };
  }
  return { ...r, cols, linhas };
}

function limitesGrelha(cfg, largura, alturaLivre) {
  const colsCabem = Math.floor((largura + ESPACO) / (cfg.casaMin + ESPACO));
  const cols = Math.max(5, Math.min(cfg.colsMax, colsCabem));
  const linhasCabem = Math.floor((alturaLivre + ESPACO) / (cfg.casaMin + ESPACO));
  const linhas = Math.max(cfg.linhasMin, Math.min(cfg.linhasMax, linhasCabem));
  return { cols, linhas };
}

// Numeração clássica: lê-se a grelha linha a linha; cada casa onde começa uma palavra leva um número.
function numerar(g) {
  const inicio = {};
  g.palavras.forEach(p => { inicio[p.r * g.colunas + p.c] = true; });
  const numero = {};
  let n = 0;
  for (let i = 0; i < g.linhas * g.colunas; i++) if (inicio[i]) numero[i] = ++n;
  g.palavras.forEach(p => { p.num = numero[p.r * g.colunas + p.c]; });
  g.palavras.sort((a, b) => (a.dir === b.dir ? a.num - b.num : a.dir === 'H' ? -1 : 1));
}

/* ================= Jogo ================= */
export async function cruzadas(alvo, { nivel, curto, aoTerminar }) {
  const N = NIVEIS[nivel] ? nivel : 1;
  const cfg = NIVEIS[N];
  let vivo = true;
  const tempos = [];
  let aoTeclar = null;
  let ajustar = null;
  const depois = (ms, f) => { tempos.push(setTimeout(() => { if (vivo) f(); }, ms)); };
  const limpeza = () => {
    vivo = false;
    tempos.forEach(clearTimeout);
    if (aoTeclar) document.removeEventListener('keydown', aoTeclar);
    if (ajustar) window.removeEventListener('resize', ajustar);
    calar();
  };

  limpar(alvo);
  const zona = el('div', { class: 'cruz-grelha-zona' }, el('div', { class: 'a-carregar' }, 'A preparar as palavras cruzadas…'));
  const caixa = el('div', { class: 'ronda cruz' }, zona);
  alvo.append(caixa);
  const [banco1, banco2] = await Promise.all([import('../dados/cruzadas.js'), import('../dados/conteudos.js')]);
  // deixa o ecrã mostrar «A preparar…» antes de gerar
  await new Promise(r => setTimeout(r, 30));
  if (!vivo || !document.body.contains(caixa)) return limpeza;

  const banco = juntarBanco(banco1.PALAVRAS_CRUZADAS, banco1.DICAS_ANAGRAMAS, banco2.ANAGRAMAS);

  // Palavras que saíram nas últimas partidas deste nível ficam de fora.
  if (!dados.vistos) dados.vistos = {};
  const chave = `cruz${N}`;
  let recentes = dados.vistos[chave] || [];
  const doNivel = banco.filter(x => x.n === N);
  const faceisTodas = N > 1 ? banco.filter(x => x.n === N - 1) : [];
  const fora = () => { const s = {}; recentes.forEach(w => { s[w] = true; }); return s; };
  let s = fora();
  let novas = doNivel.filter(x => !s[x.w]);
  if (novas.length < Math.max(40, cfg.alvo * 5)) {
    // já saíram quase todas: recomeça, sem repetir as das duas últimas partidas
    recentes = recentes.slice(-2 * cfg.alvo);
    s = fora();
    novas = doNivel.filter(x => !s[x.w]);
  }
  const faceis = faceisTodas.filter(x => !s[x.w]);

  const topo = document.getElementById('topo');
  const largura = zona.clientWidth || (window.innerWidth - 16);
  const painelAlt = window.innerWidth >= 600 ? 190 : 285;
  const alturaLivre = window.innerHeight - (topo ? topo.offsetHeight : 68) - painelAlt - 70;
  const alvoN = curto ? Math.max(4, cfg.alvo - 2) : cfg.alvo;
  const ger = gerarCruzadas(N, banco, largura, alturaLivre, { novas, faceis, alvo: alvoN, minimo: Math.min(alvoN, cfg.min) });
  const g = ger.grelha;
  numerar(g);
  dados.vistos[chave] = recentes.concat(g.palavras.map(p => p.w)).slice(-400);
  guardar();

  /* ---------- estado ---------- */
  const R = g.linhas;
  const C = g.colunas;
  const palavras = g.palavras;
  const sol = new Array(R * C).fill('');
  const val = new Array(R * C).fill('');
  const fixa = new Array(R * C).fill(false); // letra dada (nível 1) ou mostrada pela ajuda
  const ajudada = new Array(R * C).fill(false);
  const errada = new Array(R * C).fill(false);
  const certa = new Array(R * C).fill(false);
  const hor = new Array(R * C).fill(-1);
  const ver = new Array(R * C).fill(-1);
  const numDe = {};
  palavras.forEach((p, i) => {
    p.cels = [];
    for (let k = 0; k < p.w.length; k++) {
      const idx = (p.r + (p.dir === 'V' ? k : 0)) * C + (p.c + (p.dir === 'H' ? k : 0));
      p.cels.push(idx);
      sol[idx] = p.w[k];
      if (p.dir === 'H') hor[idx] = i; else ver[idx] = i;
    }
    numDe[p.cels[0]] = p.num;
    p.certa = false;
  });
  if (cfg.primeira) palavras.forEach(p => { const k = p.cels[0]; val[k] = sol[k]; fixa[k] = true; });

  let atual = 0;
  let cursor = -1;
  let ajudas = 0;
  let verificacoes = 0;
  let terminado = false;
  let confirmar = false;
  let tSeguinte = null;
  let ultimaCerta = null; // palavra acabada de acertar (para o elogio na barra da pista)
  let fraseCerta = '';
  const t0 = Date.now();

  /* ---------- ecrã ---------- */
  const celulas = [];
  const grelha = el('div', { class: 'cruz-grelha', role: 'group', 'aria-label': `Grelha de palavras cruzadas, com ${palavras.length} palavras` });
  for (let i = 0; i < R * C; i++) {
    if (!sol[i]) { celulas.push(null); grelha.append(el('div', { class: 'cruz-vazio', 'aria-hidden': 'true' })); continue; }
    const letra = el('span', { class: 'cruz-letra' }, '');
    const b = el('button', { class: 'cruz-cel', type: 'button', onclick: () => tocarCasa(i) },
      numDe[i] ? el('span', { class: 'cruz-num', 'aria-hidden': 'true' }, String(numDe[i])) : null, letra);
    b.letra = letra;
    celulas.push(b);
    grelha.append(b);
  }
  limpar(zona).append(grelha);

  const pistaRotulo = el('span', { class: 'cruz-pista-num' });
  const pistaTexto = el('span', { class: 'cruz-pista-texto' });
  const pistaNota = el('span', { class: 'cruz-pista-nota' });
  const barraPista = el('div', { class: 'cruz-pista' },
    el('div', { class: 'cruz-pista-corpo', 'aria-live': 'polite' }, pistaRotulo, pistaTexto, pistaNota),
    el('button', { class: 'cruz-seguinte', type: 'button', 'aria-label': 'Pista seguinte', onclick: () => irPara(1) }, '▶'));
  const teclado = el('div', { class: 'cruz-teclado', role: 'group', 'aria-label': 'Letras' },
    LETRAS.map(l => el('button', { class: 'cruz-tecla', type: 'button', 'data-letra': l, onclick: () => escrever(l) }, l)),
    el('button', { class: 'cruz-tecla cruz-apagar', type: 'button', 'aria-label': 'Apagar', onclick: apagar },
      el('span', { 'aria-hidden': 'true' }, '⌫'), el('small', {}, 'Apagar')));
  const painel = el('div', { class: 'cruz-painel' }, barraPista, teclado);

  const btnLetra = cfg.ajuda ? el('button', { class: 'btn claro cruz-btn cruz-btn-letra', type: 'button', onclick: mostrarLetra }, '💡 Mostrar uma letra') : null;
  const btnVerificar = el('button', { class: 'btn claro cruz-btn cruz-btn-verificar', type: 'button', onclick: verificar }, '🔍 Verificar');
  const btnDesistir = el('button', { class: 'btn claro cruz-btn cruz-desistir', type: 'button', onclick: desistir }, 'Desistir / ver a solução');
  const acoes = el('div', { class: `cruz-acoes${cfg.ajuda ? '' : ' cruz-sem-ajuda'}` }, btnLetra, btnVerificar, btnDesistir);
  const zonaRetorno = el('div', { class: 'cruz-retorno' });

  const item = p => {
    p.li = el('button', { class: 'cruz-item', type: 'button', onclick: () => { escolherPalavra(palavras.indexOf(p)); verPalavra(); } },
      el('b', {}, String(p.num)), ` ${p.pista} `, el('span', { class: 'cruz-item-letras' }, `(${p.w.length})`));
    return el('li', {}, p.li);
  };
  const listas = el('div', { class: 'cruz-listas' },
    el('div', { class: 'cruz-lista' }, el('h3', {}, '→ Horizontais'), el('ol', {}, palavras.filter(p => p.dir === 'H').map(item))),
    el('div', { class: 'cruz-lista' }, el('h3', {}, '↓ Verticais'), el('ol', {}, palavras.filter(p => p.dir === 'V').map(item))));

  const contador = el('span', {});
  const barraProgresso = el('i', { style: { width: '0%' } });
  limpar(caixa).append(
    el('div', { class: 'progresso cruz-progresso' }, contador, el('div', { class: 'barra' }, barraProgresso)),
    zona,
    painel,
    zonaRetorno,
    acoes,
    listas,
    el('p', { class: 'dica cruz-dica' },
      cfg.primeira ? 'A primeira letra de cada palavra já está escrita, a azul. ' : '',
      'Toque numa casa ou numa pista e escreva com as letras de baixo. Toque outra vez na mesma casa para trocar entre horizontal e vertical. Escreve-se sem acentos: MAÇÃ fica MACA.'));
  caixa.setAttribute('data-geracao-ms', String(ger.ms));
  caixa.setAttribute('data-tentativas', String(ger.tentativas));

  // Casas quadradas, o maior possível sem sair do ecrã nem deslizar para os lados.
  ajustar = () => {
    const larg = zona.clientWidth || (window.innerWidth - 16);
    const porLargura = Math.floor((larg - (C - 1) * ESPACO) / C);
    const livre = window.innerHeight - (topo ? topo.offsetHeight : 68) - painel.offsetHeight - 50;
    const porAltura = Math.floor((livre - (R - 1) * ESPACO) / R);
    const lado = Math.max(16, Math.min(porLargura, Math.max(cfg.casaMin, Math.min(cfg.casaMax, porAltura))));
    grelha.style.gridTemplateColumns = `repeat(${C}, ${lado}px)`;
    grelha.style.gridAutoRows = `${lado}px`;
    grelha.style.fontSize = `${Math.round(lado * 0.56)}px`;
    grelha.style.setProperty('--cruz-num', `${Math.max(9, Math.min(15, Math.round(lado * 0.28)))}px`);
    caixa.setAttribute('data-casa', String(lado));
  };
  ajustar();
  window.addEventListener('resize', ajustar);

  /* ---------- lógica ---------- */
  const bloqueada = k => fixa[k] || certa[k];
  function primeiraLivre(p) {
    for (let j = 0; j < p.cels.length; j++) if (!bloqueada(p.cels[j]) && !val[p.cels[j]]) return p.cels[j];
    for (let j = 0; j < p.cels.length; j++) if (!bloqueada(p.cels[j])) return p.cels[j];
    return p.cels[0];
  }
  function seguinteLivre(p, k, passo) {
    for (let j = p.cels.indexOf(k) + passo; j >= 0 && j < p.cels.length; j += passo) if (!bloqueada(p.cels[j])) return p.cels[j];
    return -1;
  }
  function porResolver(desde, passo) {
    for (let d = 1; d <= palavras.length; d++) {
      const i = ((desde + passo * d) % palavras.length + palavras.length) % palavras.length;
      if (!palavras[i].certa) return i;
    }
    return -1;
  }

  function escolherPalavra(i) {
    if (terminado || i < 0) return;
    clearTimeout(tSeguinte);
    const mudou = i !== atual;
    atual = i;
    cursor = primeiraLivre(palavras[i]);
    som.clique();
    pintar();
    if (mudou || cursor >= 0) lerPista();
  }
  function irPara(passo) {
    if (terminado) return;
    const i = porResolver(atual, passo);
    escolherPalavra(i >= 0 ? i : (atual + passo + palavras.length) % palavras.length);
    verPalavra();
  }
  function lerPista() {
    if (!dados.def.voz) return;
    const p = palavras[atual];
    falar(`${p.num} ${p.dir === 'H' ? 'horizontal' : 'vertical'}, ${p.w.length} letras. ${p.pista}`);
  }

  function tocarCasa(k) {
    if (terminado) return;
    clearTimeout(tSeguinte);
    const h = hor[k];
    const v = ver[k];
    const antes = atual;
    const outra = palavras[atual].dir === 'H' ? v : h;
    if (k === cursor && h >= 0 && v >= 0) atual = atual === h ? v : h; // mesma casa: troca a direção
    else if (palavras[atual].cels.indexOf(k) < 0 || (palavras[atual].certa && outra >= 0 && !palavras[outra].certa)) {
      // outra palavra: de preferência na mesma direção, mas uma que ainda falte antes de uma já certa
      const opcoes = (palavras[atual].dir === 'H' ? [h, v] : [v, h]).filter(i => i >= 0);
      const faltam = opcoes.filter(i => !palavras[i].certa);
      atual = faltam.length ? faltam[0] : opcoes[0];
    }
    cursor = k;
    som.clique();
    pintar();
    if (atual !== antes) lerPista();
  }

  function escrever(l) {
    if (terminado) return;
    clearTimeout(tSeguinte);
    let p = palavras[atual];
    let k = p.cels.indexOf(cursor) >= 0 ? cursor : primeiraLivre(p);
    if (bloqueada(k)) {
      k = seguinteLivre(p, k, 1);
      if (k < 0 && !bloqueada(primeiraLivre(p))) k = primeiraLivre(p);
    }
    if (k < 0) {
      // esta palavra já não tem casas livres: a letra vai para a palavra seguinte que falta
      const i = porResolver(atual, 1);
      if (i < 0) return;
      escolherPalavra(i);
      verPalavra();
      p = palavras[atual];
      k = cursor;
      if (bloqueada(k)) return;
    }
    val[k] = l;
    errada[k] = false;
    cursor = k;
    const novas = conferir(k);
    if (novas.length) palavraCerta(novas);
    else {
      som.clique();
      const s = seguinteLivre(p, k, 1);
      if (s >= 0) cursor = s;
    }
    pintar();
    verCasa(cursor);
  }

  function apagar() {
    if (terminado) return;
    clearTimeout(tSeguinte);
    const p = palavras[atual];
    let k = p.cels.indexOf(cursor) >= 0 ? cursor : primeiraLivre(p);
    if (bloqueada(k) || !val[k]) {
      const a = seguinteLivre(p, k, -1);
      if (a < 0) { pintar(); return; }
      k = a;
    }
    val[k] = '';
    errada[k] = false;
    cursor = k;
    som.clique();
    pintar();
    verCasa(cursor);
  }

  // Vê se as palavras que passam na casa k ficaram completas e certas. Devolve as que ficaram agora.
  function conferir(k) {
    const novas = [];
    [hor[k], ver[k]].forEach(i => {
      if (i < 0 || palavras[i].certa) return;
      const p = palavras[i];
      if (p.cels.every(c => val[c] === sol[c])) {
        p.certa = true;
        p.cels.forEach(c => { certa[c] = true; errada[c] = false; });
        novas.push(p);
      }
    });
    return novas;
  }

  function palavraCerta(novas) {
    const feitas = palavras.filter(p => p.certa).length;
    if (feitas === palavras.length) { fim(); return; }
    som.certo();
    if (dados.def.voz) falar(novas[0].texto.toLowerCase());
    if (palavras[atual].certa) {
      ultimaCerta = palavras[atual];
      fraseCerta = elogio();
      // passa à palavra seguinte que falta, com tempo para ver a palavra ficar verde
      clearTimeout(tSeguinte);
      tSeguinte = setTimeout(() => { if (vivo && !terminado) { escolherPalavra(porResolver(atual, 1)); verPalavra(); } }, 1100);
      tempos.push(tSeguinte);
    }
  }

  function pintar() {
    const p = palavras[atual];
    const naPalavra = {};
    p.cels.forEach(k => { naPalavra[k] = true; });
    for (let k = 0; k < R * C; k++) {
      const b = celulas[k];
      if (!b) continue;
      let cls = 'cruz-cel';
      if (certa[k]) cls += ' cruz-certa';
      if (naPalavra[k]) cls += ' cruz-sel';
      if (k === cursor && !terminado) cls += ' cruz-cursor';
      if (fixa[k]) cls += ajudada[k] ? ' cruz-ajudada' : ' cruz-dada';
      if (errada[k] && val[k]) cls += ' cruz-errada';
      if (b.solucao) cls += ' cruz-solucao';
      if (b.className !== cls) b.className = cls;
      if (b.letra.textContent !== val[k]) b.letra.textContent = val[k];
      const r = (k / C) | 0;
      b.setAttribute('aria-label', `Linha ${r + 1}, coluna ${(k % C) + 1}: ${val[k] || 'vazia'}`);
    }
    const rotulo = `${p.num} ${p.dir === 'H' ? 'Horizontal →' : 'Vertical ↓'} · ${p.w.length} letras`;
    if (pistaRotulo.textContent !== rotulo) pistaRotulo.textContent = rotulo;
    if (pistaTexto.textContent !== p.pista) pistaTexto.textContent = p.pista;
    const completa = p.cels.every(k => val[k]);
    barraPista.classList.toggle('cruz-pista-certa', p.certa);
    let nota = '';
    if (p.certa) nota = p === ultimaCerta ? `✔ ${fraseCerta}` : '✔ Esta já está certa!';
    else if (completa) nota = 'Ainda não está certa. Reveja as letras ou toque em «Verificar».';
    if (pistaNota.textContent !== nota) pistaNota.textContent = nota;
    palavras.forEach(q => {
      q.li.classList.toggle('cruz-item-atual', q === p);
      q.li.classList.toggle('cruz-item-certa', q.certa);
    });
    const feitas = palavras.filter(q => q.certa).length;
    contador.textContent = `Palavras certas: ${feitas} de ${palavras.length}`;
    barraProgresso.style.width = `${(feitas / palavras.length) * 100}%`;
  }

  // Mantém a casa visível entre o topo e o teclado (nos ecrãs baixos, o teclado fica preso em baixo).
  function verCasa(k) {
    const b = celulas[k];
    if (!b || !b.getBoundingClientRect) return;
    const r = b.getBoundingClientRect();
    const cima = (topo ? topo.getBoundingClientRect().bottom : 0) + 6;
    const baixo = Math.min(window.innerHeight, painel.getBoundingClientRect().top) - 6;
    if (r.bottom > baixo) window.scrollBy(0, Math.min(r.bottom - baixo, r.top - cima));
    else if (r.top < cima) window.scrollBy(0, r.top - cima);
  }
  function verPalavra() {
    const p = palavras[atual];
    verCasa(p.cels[0]);
    verCasa(cursor);
  }

  function verificar() {
    if (terminado) return;
    let preenchidas = 0;
    let erradas = 0;
    for (let k = 0; k < R * C; k++) {
      if (!sol[k] || bloqueada(k) || !val[k]) continue;
      preenchidas++;
      if (val[k] !== sol[k]) { errada[k] = true; erradas++; }
    }
    if (!preenchidas) { aviso('Ainda não há letras novas para verificar. Escreva primeiro algumas palavras.'); return; }
    verificacoes++;
    pintar();
    if (erradas) {
      som.quase();
      aviso(erradas === 1 ? 'Há 1 letra trocada, marcada a cor-de-rosa. Corrija-a com calma.' : `Há ${erradas} letras trocadas, marcadas a cor-de-rosa. Corrija-as com calma.`);
    } else {
      som.rapido();
      aviso('Tudo o que escreveu está certo. Continue!');
    }
  }

  function mostrarLetra() {
    if (terminado || !cfg.ajuda) return;
    clearTimeout(tSeguinte);
    const falta = k => !bloqueada(k) && val[k] !== sol[k];
    let k = cursor >= 0 && palavras[atual].cels.indexOf(cursor) >= 0 && falta(cursor) ? cursor : -1;
    if (k < 0) k = palavras[atual].cels.filter(falta)[0];
    if (k == null || k < 0) {
      const i = porResolver(atual, 1);
      if (i < 0) return;
      atual = i;
      k = palavras[i].cels.filter(falta)[0];
      if (k == null) return;
    }
    val[k] = sol[k];
    fixa[k] = true;
    ajudada[k] = true;
    errada[k] = false;
    ajudas++;
    cursor = k;
    const novas = conferir(k);
    if (novas.length) palavraCerta(novas);
    else {
      som.rapido();
      const s = seguinteLivre(palavras[atual], k, 1);
      if (s >= 0) cursor = s;
    }
    if (terminado) return;
    pintar();
    verCasa(k);
    if (ajudas === 1) aviso('As letras mostradas pela ajuda ficam a roxo.', 2000);
  }

  function desistir() {
    if (terminado) return;
    if (!confirmar) {
      confirmar = true;
      btnDesistir.textContent = 'Tem a certeza? Toque outra vez';
      depois(5000, () => { confirmar = false; btnDesistir.textContent = 'Desistir / ver a solução'; });
      return;
    }
    terminado = true;
    clearTimeout(tSeguinte);
    for (let k = 0; k < R * C; k++) {
      if (!sol[k] || val[k] === sol[k]) continue;
      val[k] = sol[k];
      celulas[k].solucao = true;
    }
    cursor = -1;
    pintar();
    painel.classList.add('esconder');
    acoes.classList.add('esconder');
    const ms = Date.now() - t0;
    const b = el('button', {
      class: 'btn verde grande largo', type: 'button',
      onclick: () => {
        if (!vivo) return;
        vivo = false;
        limpeza();
        aoTerminar({
          estrelas: 1,
          titulo: 'Fica para a próxima! 🌱',
          numeros: [
            { valor: `${palavras.filter(p => p.certa).length} de ${palavras.length}`, rotulo: 'palavras certas' },
            { valor: duracao(ms), rotulo: 'tempo' },
          ],
        });
      },
    }, 'Ver resultado ▶');
    limpar(zonaRetorno).append(
      el('div', { class: 'retorno info' }, el('div', { class: 'icone' }, '💡'),
        el('div', {}, el('b', {}, 'Aqui está a solução.'),
          el('div', { class: 'info-extra' }, 'As letras a roxo eram as que faltavam. Para a próxima é que é!'))),
      el('div', { class: 'fila-botoes' }, b));
    try { b.focus({ preventScroll: true }); } catch (e) { /* navegador antigo */ }
    window.scrollTo(0, 0);
  }

  function fim() {
    terminado = true;
    clearTimeout(tSeguinte);
    cursor = -1;
    pintar();
    grelha.classList.add('cruz-feita');
    painel.classList.add('esconder');
    acoes.classList.add('esconder');
    som.vitoria();
    const ms = Date.now() - t0;
    const custo = ajudas + verificacoes;
    const estrelas = custo === 0 ? 3 : custo <= 3 ? 2 : 1;
    // O recorde de tempo só conta quando a grelha foi feita com poucas ajudas.
    const rec = estrelas >= 2 ? verRecorde(`cruzadas-${N}`, Math.max(1, Math.round(ms / 1000)), true) : { bateu: false, primeiro: true };
    limpar(zonaRetorno).append(el('div', { class: 'retorno bom' }, el('div', { class: 'icone' }, '🎉'),
      el('div', {}, el('b', {}, `${elogio()} Grelha completa!`), el('div', { class: 'info-extra' }, `Descobriu as ${palavras.length} palavras.`))));
    window.scrollTo(0, 0);
    const numeros = [
      { valor: String(palavras.length), rotulo: 'palavras' },
      { valor: duracao(ms), rotulo: 'tempo' },
    ];
    if (cfg.ajuda) numeros.push({ valor: String(ajudas), rotulo: ajudas === 1 ? 'letra mostrada' : 'letras mostradas' });
    numeros.push({ valor: String(verificacoes), rotulo: verificacoes === 1 ? 'verificação' : 'verificações' });
    depois(1700, () => {
      vivo = false;
      limpeza();
      aoTerminar({
        estrelas,
        titulo: estrelas === 3 ? 'Tudo certo, sem ajudas! 🎉' : estrelas === 2 ? 'Palavras cruzadas completas! 👏' : 'Grelha completa! 🌱',
        recorde: rec.bateu && !rec.primeiro,
        numeros,
      });
    });
  }

  // No computador também se pode usar o teclado: letras, Apagar, setas e Enter (pista seguinte).
  aoTeclar = e => {
    if (terminado || e.ctrlKey || e.metaKey || e.altKey || !e.key) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); apagar(); return; }
    if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); irPara(e.shiftKey ? -1 : 1); return; }
    const seta = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
    if (seta) {
      e.preventDefault();
      if (cursor < 0) return;
      let r = ((cursor / C) | 0) + seta[0];
      let c = (cursor % C) + seta[1];
      while (r >= 0 && c >= 0 && r < R && c < C && !sol[r * C + c]) { r += seta[0]; c += seta[1]; }
      if (r < 0 || c < 0 || r >= R || c >= C) return;
      const k = r * C + c;
      const quer = seta[1] ? hor[k] : ver[k];
      const antes = atual;
      atual = quer >= 0 ? quer : (hor[k] >= 0 ? hor[k] : ver[k]);
      cursor = k;
      pintar();
      verCasa(k);
      if (atual !== antes) lerPista();
      return;
    }
    if (e.key.length === 1) {
      const l = semAcentos(e.key).toUpperCase();
      if (l < 'A' || l > 'Z') return;
      e.preventDefault();
      if (LETRAS.indexOf(l) >= 0) escrever(l);
      else aviso(`Nestas palavras cruzadas não há a letra ${l}.`, 1500);
    }
  };
  document.addEventListener('keydown', aoTeclar);

  atual = 0;
  cursor = primeiraLivre(palavras[0]);
  pintar();
  aviso(cfg.primeira
    ? 'Leia a pista e escreva a palavra. A primeira letra já lá está. Cada palavra certa fica verde!'
    : 'Toque numa casa ou numa pista e escreva a palavra. Cada palavra certa fica verde!', 3500);
  lerPista();

  return limpeza;
}
