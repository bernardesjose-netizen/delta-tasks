// Jogos de lógica: Jogo da Forca (com uma flor que perde pétalas, em vez do desenho clássico) e Sudoku.
import {
  el, limpar, som, aviso, elogio, consolo, dados, verRecorde, baralhar, escolher, escolherNaoVistos, semAcentos,
  estrelasPorPercentagem, duracao, falar, calar,
} from '../util.js';

const NS_SVG = 'http://www.w3.org/2000/svg';
function svg(tag, attrs, ...filhos) {
  const n = document.createElementNS(NS_SVG, tag);
  for (const k of Object.keys(attrs || {})) n.setAttribute(k, attrs[k]);
  filhos.forEach(f => n.appendChild(f));
  return n;
}

/* ================= Jogo da Forca (a flor) ================= */
// Só palavras com letras do português (fica de fora, por exemplo, «GYÖKERES»), e nada de temas com palavras
// estrangeiras ou marcas de fora (inglês, comidas do mundo, companhias aéreas, carros, craques estrangeiros).
const LETRAS_PT = /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]+$/;
const TEMAS_FORA = /ingl[eê]s|franc[eê]s|espanhol|alem[aã]o|italiano|b[aá]sico|estados unidos|comidas do mundo|companhias|marcas de carros|lendas do futebol/i;
const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const FORCA_NIVEIS = {
  1: { min: 4, max: 5, erros: 8, primeira: true, pista: true },
  2: { min: 6, max: 7, erros: 7, primeira: false, pista: true },
  3: { min: 8, max: 9, erros: 6, primeira: false, pista: true },
  4: { min: 10, max: 99, erros: 5, primeira: false, pista: false },
};
// Cor das pétalas (preenchimento, contorno): muda de palavra para palavra.
const CORES_PETALAS = [['#f06292', '#c2185b'], ['#ffb74d', '#e65100'], ['#ba68c8', '#7b1fa2'], ['#64b5f6', '#1565c0'], ['#ff8a80', '#d32f2f']];
// «Á», «À», «Â» e «Ã» contam como «A»; «Ç» conta como «C».
const letraBase = l => semAcentos(l).toUpperCase();

// Junta as palavras da sopa de letras (com o tema) e as da palavra baralhada (com a dica).
function palavrasForca(SOPA_TEMAS, ANAGRAMAS) {
  const mapa = new Map();
  ANAGRAMAS.forEach(a => {
    if (LETRAS_PT.test(a.palavra)) mapa.set(a.palavra, { palavra: a.palavra, dica: a.dica });
  });
  SOPA_TEMAS.forEach(t => (TEMAS_FORA.test(t.tema) ? [] : t.palavras).forEach(p => {
    if (!LETRAS_PT.test(p)) return;
    const x = mapa.get(p) || { palavra: p };
    if (!x.tema) { x.tema = t.tema; x.emoji = t.emoji; }
    mapa.set(p, x);
  }));
  return Array.from(mapa.values());
}

// Flor com tantas pétalas quantos os erros permitidos. Cada erro faz cair uma, que fica no chão.
const CHAO = [[-24, 0, 15], [22, 1, -20], [-10, 2, -8], [32, -1, 25], [-33, 1, 30], [9, 2, 12], [-19, -1, -30], [27, 2, 5]];
function desenharFlor(nPetalas, cor) {
  const s = svg('svg', { viewBox: '0 0 120 130', class: 'forca-flor', 'aria-hidden': 'true', focusable: 'false' });
  s.appendChild(svg('ellipse', { cx: 60, cy: 125, rx: 38, ry: 5, fill: '#cfe8d6' }));
  const chao = CHAO.slice(0, nPetalas).map(([dx, dy, ang]) => {
    const p = svg('ellipse', {
      class: 'forca-chao', cx: 60 + dx, cy: 123 + dy, rx: 6.5, ry: 3.2, fill: cor[0], stroke: cor[1], 'stroke-width': 1, transform: `rotate(${ang} ${60 + dx} ${123 + dy})`,
    });
    s.appendChild(p);
    return p;
  });
  s.appendChild(svg('path', { d: 'M60 70 C 57 92, 63 108, 60 122', stroke: '#2e7d32', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }));
  s.appendChild(svg('path', { d: 'M60 106 C 46 92, 32 96, 25 104 C 36 114, 50 113, 60 106 Z', fill: '#43a047' }));
  s.appendChild(svg('path', { d: 'M61 96 C 75 83, 89 87, 95 94 C 84 104, 70 103, 61 96 Z', fill: '#66bb6a' }));
  const rx = Math.min(14, 9 + 30 / nPetalas);
  const petalas = [];
  for (let k = 0; k < nPetalas; k++) {
    const g = svg('g', { class: 'forca-petala' });
    g.appendChild(svg('ellipse', {
      cx: 60, cy: 26, rx, ry: 19, fill: cor[0], stroke: cor[1], 'stroke-width': 2, transform: `rotate(${(360 / nPetalas) * k} 60 46)`,
    }));
    s.appendChild(g);
    petalas.push(g);
  }
  // miolo com um sorriso
  s.appendChild(svg('circle', { cx: 60, cy: 46, r: 15, fill: '#ffd54f', stroke: '#f9a825', 'stroke-width': 2.5 }));
  s.appendChild(svg('circle', { cx: 54.5, cy: 43, r: 2.2, fill: '#5d4037' }));
  s.appendChild(svg('circle', { cx: 65.5, cy: 43, r: 2.2, fill: '#5d4037' }));
  s.appendChild(svg('path', { d: 'M53 49 Q60 56 67 49', stroke: '#5d4037', 'stroke-width': 2.2, fill: 'none', 'stroke-linecap': 'round' }));
  return { s, petalas, chao };
}

export async function forca(alvo, { nivel, curto, aoTerminar }) {
  const { SOPA_TEMAS, ANAGRAMAS } = await import('../dados/conteudos.js');
  const cfg = FORCA_NIVEIS[nivel] || FORCA_NIVEIS[1];
  const total = curto ? 3 : 5;
  const candidatas = palavrasForca(SOPA_TEMAS, ANAGRAMAS).filter(p => p.palavra.length >= cfg.min && p.palavra.length <= cfg.max);
  const lista = escolherNaoVistos(`forca${nivel}`, candidatas, total, p => p.palavra);
  let i = 0;
  let acertadas = 0;
  let errosTotal = 0;
  let vivo = true;
  let tentarAtual = null; // letra escrita no teclado do computador
  const t0 = Date.now();

  function mostrar() {
    if (!vivo) return;
    const item = lista[i];
    const palavra = item.palavra;
    const letras = palavra.split('');
    const bases = letras.map(letraBase);
    const tentadas = new Set();
    let erros = 0;
    let terminado = false;

    const flor = desenharFlor(cfg.erros, CORES_PETALAS[i % CORES_PETALAS.length]);
    const casas = letras.map(() => el('span', { class: 'forca-casa' }, ''));
    const palavraEl = el('div', { class: `forca-palavra${letras.length >= 10 ? ' forca-longa' : ''}`, style: { '--n': letras.length } }, casas);
    const restam = el('div', { class: 'forca-restam' });
    const teclas = {};
    const teclado = el('div', { class: 'forca-teclado', role: 'group', 'aria-label': 'Letras' },
      ALFABETO.map(l => {
        teclas[l] = el('button', { class: 'forca-tecla', type: 'button', 'data-letra': l, onclick: () => tentar(l) }, l);
        return teclas[l];
      }));
    const zonaRetorno = el('div', { class: 'forca-retorno' });
    // Pista: a dica (mais certeira) ou, se a palavra não tiver dica, o tema. No Mestre só aparece no fim.
    let pista;
    if (!cfg.pista) pista = el('div', { class: 'forca-pista forca-sem' }, 'Sem pista: a dica aparece no fim.');
    else if (item.dica) pista = el('div', { class: 'forca-pista' }, el('b', {}, 'Pista: '), item.dica);
    else pista = el('div', { class: 'forca-pista' }, el('b', {}, 'Tema: '), `${item.emoji || ''} ${item.tema}`);

    limpar(alvo);
    alvo.append(el('div', { class: 'ronda forca' },
      el('div', { class: 'progresso forca-progresso' }, el('span', {}, `Palavra ${i + 1} de ${lista.length}`),
        el('div', { class: 'barra' }, el('i', { style: { width: `${(i / lista.length) * 100}%` } }))),
      el('div', { class: 'cartao-pergunta forca-cartao' },
        el('div', { class: 'forca-topo' },
          flor.s,
          el('div', { class: 'forca-lado' }, pista, restam)),
        palavraEl,
        el('p', { class: 'forca-instrucao' }, 'Toque nas letras. Cada erro faz cair uma pétala.')),
      teclado,
      zonaRetorno));

    if (cfg.primeira) {
      // Tranquilo: a primeira letra já vem à vista (e todas as que forem iguais a ela).
      const l = bases[0];
      tentadas.add(l);
      teclas[l].disabled = true;
      teclas[l].classList.add('forca-certa');
    }
    desenhar();
    tentarAtual = tentar;
    if (dados.def.voz) {
      if (!cfg.pista) falar('Descubra a palavra. Neste nível não há pista.');
      else falar(item.dica ? `Pista: ${item.dica}` : `Tema: ${item.tema}`);
    }

    function desenhar() {
      casas.forEach((c, k) => {
        const vista = tentadas.has(bases[k]);
        c.textContent = vista ? letras[k] : '';
        c.classList.toggle('forca-vista', vista);
      });
      const r = cfg.erros - erros;
      flor.petalas.forEach((p, k) => p.classList.toggle('forca-caida', k >= r));
      flor.chao.forEach((p, k) => p.classList.toggle('forca-no-chao', k < erros));
      restam.textContent = r === 0 ? 'A flor ficou sem pétalas' : r === 1 ? 'Resta 1 pétala' : `Restam ${r} pétalas`;
      palavraEl.setAttribute('aria-label', `Palavra com ${letras.length} letras: ${casas.map(c => c.textContent || 'espaço').join(' ')}`);
    }

    function tentar(l) {
      if (!vivo || terminado || tentadas.has(l)) return;
      tentadas.add(l);
      const tem = bases.indexOf(l) >= 0;
      const t = teclas[l];
      t.disabled = true;
      t.classList.add(tem ? 'forca-certa' : 'forca-errada');
      t.setAttribute('aria-label', `${l}: ${tem ? 'está na palavra' : 'não está na palavra'}`);
      if (tem) som.rapido();
      else {
        erros++;
        errosTotal++;
        som.quase();
      }
      desenhar();
      if (bases.every(b => tentadas.has(b))) ganhou();
      else if (erros >= cfg.erros) perdeu();
    }

    function ganhou() {
      terminado = true;
      acertadas++;
      palavraEl.classList.add('forca-ganha');
      som.certo();
      fimDaPalavra('bom', '😃', elogio(), `A palavra é «${palavra}».`);
    }

    function perdeu() {
      terminado = true;
      casas.forEach((c, k) => {
        if (!tentadas.has(bases[k])) { c.textContent = letras[k]; c.classList.add('forca-revelada'); }
      });
      fimDaPalavra('info', '🌱', consolo(), `A palavra era «${palavra}».`);
    }

    function fimDaPalavra(tipo, icone, titulo, extra) {
      tentarAtual = null;
      teclado.classList.add('esconder');
      const pormenor = [];
      if (!cfg.pista) {
        if (item.dica) pormenor.push(`Pista: ${item.dica}.`);
        if (item.tema) pormenor.push(`Tema: ${item.emoji || ''} ${item.tema}.`);
      }
      const b = el('button', { class: 'btn verde grande largo', type: 'button', onclick: avancar }, i + 1 < lista.length ? 'Continuar ▶' : 'Ver resultado ▶');
      limpar(zonaRetorno).append(
        el('div', { class: `retorno ${tipo}` }, el('div', { class: 'icone' }, icone),
          el('div', {}, el('b', {}, titulo), el('div', { class: 'info-extra' }, extra),
            pormenor.length ? el('div', { class: 'info-extra' }, pormenor.join(' ')) : null)),
        el('div', { class: 'fila-botoes' }, b));
      if (dados.def.voz) falar(palavra.toLowerCase());
      try { b.focus({ preventScroll: true }); } catch (e) { /* navegador antigo */ }
      zonaRetorno.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function avancar() {
    if (!vivo) return;
    i++;
    if (i < lista.length) { mostrar(); return; }
    vivo = false;
    document.removeEventListener('keydown', aoTeclar);
    aoTerminar({
      estrelas: estrelasPorPercentagem(acertadas / lista.length),
      titulo: acertadas === lista.length ? 'Todas certas! 🌼' : null,
      numeros: [
        { valor: `${acertadas} de ${lista.length}`, rotulo: 'palavras descobertas' },
        { valor: String(errosTotal), rotulo: errosTotal === 1 ? 'letra errada' : 'letras erradas' },
        { valor: duracao(Date.now() - t0), rotulo: 'tempo' },
      ],
    });
  }

  // No computador também se pode escrever as letras no teclado.
  function aoTeclar(e) {
    if (!tentarAtual || e.ctrlKey || e.metaKey || e.altKey || !e.key || e.key.length !== 1) return;
    const l = letraBase(e.key);
    if (l >= 'A' && l <= 'Z') { e.preventDefault(); tentarAtual(l); }
  }
  document.addEventListener('keydown', aoTeclar);

  mostrar();
  return () => { vivo = false; tentarAtual = null; document.removeEventListener('keydown', aoTeclar); calar(); };
}

/* ================= Sudoku ================= */
// n: lado da grelha; br × bc: linhas × colunas de cada bloco; pistas: alvo de números já dados.
// logica: nos níveis 1 a 3 só se aceita a grelha se der para a resolver sem adivinhar (fácil e justo).
const SUDOKU_NIVEIS = {
  1: { n: 4, br: 2, bc: 2, pistas: 8, logica: true, celMax: 78 },
  2: { n: 6, br: 2, bc: 3, pistas: 18, logica: true, celMax: 62 },
  3: { n: 9, br: 3, bc: 3, pistas: 40, logica: true, celMax: 50 },
  4: { n: 9, br: 3, bc: 3, pistas: 30, logica: false, celMax: 50 },
};
const SUDOKU_TEMPO_MAX = 1200; // ms a tirar pistas; se acabar, a grelha fica com mais pistas (sempre de solução única)

const BITS = [0];
for (let m = 1; m < 512; m++) BITS[m] = BITS[m >> 1] + (m & 1);

function estruturaSudoku(n, br, bc) {
  const lin = [];
  const col = [];
  const caixa = [];
  const unidades = [];
  for (let u = 0; u < 3 * n; u++) unidades.push([]);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const k = r * n + c;
      const b = Math.floor(r / br) * (n / bc) + Math.floor(c / bc);
      lin[k] = r; col[k] = c; caixa[k] = b;
      unidades[r].push(k);
      unidades[n + c].push(k);
      unidades[2 * n + b].push(k);
    }
  }
  return { n, br, bc, lin, col, caixa, unidades, cheio: (1 << n) - 1 };
}

// Solucionador com máscaras de bits (escolhe sempre a casa com menos hipóteses).
// Conta as soluções até `limite`; com `aleatorio`, experimenta os números por ordem baralhada.
function resolverSudoku(grelha, d, limite, aleatorio) {
  const { n, lin, col, caixa, cheio } = d;
  const L = new Array(n).fill(0);
  const C = new Array(n).fill(0);
  const B = new Array(n).fill(0);
  const v = grelha.slice();
  const vazias = [];
  for (let k = 0; k < n * n; k++) {
    if (!v[k]) { vazias.push(k); continue; }
    const bit = 1 << (v[k] - 1);
    if ((L[lin[k]] | C[col[k]] | B[caixa[k]]) & bit) return { conta: 0, solucao: null };
    L[lin[k]] |= bit; C[col[k]] |= bit; B[caixa[k]] |= bit;
  }
  let conta = 0;
  let solucao = null;
  function rec(falta) {
    if (falta === 0) {
      conta++;
      if (!solucao) solucao = v.slice();
      return;
    }
    let melhor = -1;
    let mascara = 0;
    let menos = 99;
    for (let q = 0; q < vazias.length; q++) {
      const k = vazias[q];
      if (v[k]) continue;
      const m = cheio & ~(L[lin[k]] | C[col[k]] | B[caixa[k]]);
      const nb = BITS[m];
      if (nb < menos) { menos = nb; melhor = k; mascara = m; if (nb <= 1) break; }
    }
    if (menos === 0) return;
    const hipoteses = [];
    for (let x = 0; x < n; x++) if (mascara & (1 << x)) hipoteses.push(x);
    const ordem = aleatorio ? baralhar(hipoteses) : hipoteses;
    const r = lin[melhor];
    const c = col[melhor];
    const b = caixa[melhor];
    for (let q = 0; q < ordem.length; q++) {
      const bit = 1 << ordem[q];
      v[melhor] = ordem[q] + 1;
      L[r] |= bit; C[c] |= bit; B[b] |= bit;
      rec(falta - 1);
      L[r] &= ~bit; C[c] &= ~bit; B[b] &= ~bit;
      v[melhor] = 0;
      if (conta >= limite) return;
    }
  }
  rec(vazias.length);
  return { conta, solucao };
}

// Resolve só com «casas que só admitem um número» e «números que só cabem numa casa» (sem adivinhar).
function resolveSemAdivinhar(grelha, d) {
  const { n, lin, col, caixa, unidades, cheio } = d;
  const v = grelha.slice();
  const L = new Array(n).fill(0);
  const C = new Array(n).fill(0);
  const B = new Array(n).fill(0);
  let falta = 0;
  const por = (k, x) => {
    const bit = 1 << (x - 1);
    v[k] = x; L[lin[k]] |= bit; C[col[k]] |= bit; B[caixa[k]] |= bit;
  };
  for (let k = 0; k < n * n; k++) { if (v[k]) por(k, v[k]); else falta++; }
  let mexeu = true;
  while (falta && mexeu) {
    mexeu = false;
    for (let k = 0; k < n * n; k++) {
      if (v[k]) continue;
      const m = cheio & ~(L[lin[k]] | C[col[k]] | B[caixa[k]]);
      if (!m) return false;
      if (BITS[m] === 1) { por(k, 32 - Math.clz32(m)); falta--; mexeu = true; }
    }
    for (let u = 0; u < unidades.length; u++) {
      const un = unidades[u];
      for (let x = 1; x <= n; x++) {
        const bit = 1 << (x - 1);
        let onde = -1;
        let quantas = 0;
        let ja = false;
        for (let q = 0; q < un.length; q++) {
          const k = un[q];
          if (v[k]) { if (v[k] === x) { ja = true; break; } continue; }
          if (!((L[lin[k]] | C[col[k]] | B[caixa[k]]) & bit)) { quantas++; onde = k; }
        }
        if (ja) continue;
        if (!quantas) return false;
        if (quantas === 1) { por(onde, x); falta--; mexeu = true; }
      }
    }
  }
  return falta === 0;
}

// Gera uma grelha cheia ao acaso e tira pistas (aos pares simétricos) enquanto a solução continuar única.
export function gerarSudoku(nivel) {
  const cfg = SUDOKU_NIVEIS[nivel] || SUDOKU_NIVEIS[1];
  const d = estruturaSudoku(cfg.n, cfg.br, cfg.bc);
  const total = cfg.n * cfg.n;
  const t0 = Date.now();
  const solucao = resolverSudoku(new Array(total).fill(0), d, 1, true).solucao;
  const g = solucao.slice();
  let pistas = total;
  const tentarTirar = casas => {
    const antes = casas.map(k => g[k]);
    casas.forEach(k => { g[k] = 0; });
    const ok = resolverSudoku(g, d, 2, false).conta === 1 && (!cfg.logica || resolveSemAdivinhar(g, d));
    if (ok) pistas -= casas.length;
    else casas.forEach((k, q) => { g[k] = antes[q]; });
  };
  const metade = [];
  for (let k = 0; k < Math.ceil(total / 2); k++) metade.push(k);
  const pares = baralhar(metade);
  for (let q = 0; q < pares.length && pistas > cfg.pistas && Date.now() - t0 < SUDOKU_TEMPO_MAX; q++) {
    const k = pares[q];
    const j = total - 1 - k;
    tentarTirar(k === j ? [k] : [k, j]);
  }
  // Se ainda sobram pistas a mais, tenta tirar casas soltas.
  const soltas = baralhar(Array.from({ length: total }, (_, k) => k));
  for (let q = 0; q < soltas.length && pistas > cfg.pistas && Date.now() - t0 < SUDOKU_TEMPO_MAX; q++) {
    if (g[soltas[q]]) tentarTirar([soltas[q]]);
  }
  return { cfg, d, inicial: g, solucao, pistas, ms: Date.now() - t0 };
}

export function sudoku(alvo, { nivel, aoTerminar }) {
  let vivo = true;
  let tDesistir = null;
  let tFim = null;
  let ajustar = null;
  let aoTeclar = null;

  limpar(alvo);
  alvo.append(el('div', { class: 'a-carregar' }, 'A preparar a grelha…'));
  // Deixa o ecrã mostrar «A preparar…» antes de gerar (nos telemóveis fracos demora um pouco).
  const tPreparar = setTimeout(() => { if (vivo) comecar(gerarSudoku(nivel)); }, 40);

  function comecar(jogo) {
    const { cfg, d, solucao } = jogo;
    const { n, br, bc, lin, col, caixa, unidades } = d;
    const valores = jogo.inicial.slice();
    const fixa = valores.map(x => x !== 0);
    const ajudada = valores.map(() => false);
    const vaziasInicio = valores.filter(x => !x).length;
    let sel = -1;
    let erros = 0;
    let ajudas = 0;
    let terminado = false;
    let confirmar = false;
    const t0 = Date.now();

    const celulas = valores.map((x, k) => {
      const r = lin[k];
      const c = col[k];
      let cls = 'sudoku-cel';
      if (c === n - 1) cls += ' sudoku-ult-col';
      else if (c % bc === bc - 1) cls += ' sudoku-borda-dir';
      if (r === n - 1) cls += ' sudoku-ult-lin';
      else if (r % br === br - 1) cls += ' sudoku-borda-baixo';
      if (fixa[k]) cls += ' sudoku-dada';
      return el('button', { class: cls, type: 'button', 'data-k': k, onclick: () => escolherCasa(k) }, x ? String(x) : '');
    });
    const grelha = el('div', {
      class: `sudoku-grelha sudoku-n${n}`, role: 'grid', 'aria-label': `Sudoku de ${n} por ${n}`, 'data-n': n, 'data-br': br, 'data-bc': bc,
    }, celulas);
    const teclas = [];
    for (let x = 1; x <= n; x++) {
      teclas.push(el('button', { class: 'sudoku-tecla', type: 'button', 'data-valor': x, onclick: () => porNumero(x) }, String(x)));
    }
    const btnApagar = el('button', { class: 'sudoku-tecla sudoku-apagar', type: 'button', 'aria-label': 'Apagar', onclick: apagar },
      el('span', { 'aria-hidden': 'true' }, '⌫'), el('small', {}, 'Apagar'));
    const teclado = el('div', { class: `sudoku-teclado sudoku-teclado-${n}` }, teclas, btnApagar);
    const btnAjuda = el('button', { class: 'btn claro sudoku-btn', type: 'button', onclick: ajuda }, '💡 Ajuda');
    const btnDesistir = el('button', { class: 'btn claro sudoku-btn', type: 'button', onclick: desistir }, 'Desistir');
    const acoes = el('div', { class: 'sudoku-acoes' }, btnAjuda, btnDesistir);
    const faltamEl = el('span', {});
    const zonaRetorno = el('div', { class: 'sudoku-retorno' });
    const caixaRonda = el('div', { class: 'ronda sudoku' },
      el('div', { class: 'info-jogo sudoku-info' }, faltamEl),
      grelha,
      teclado,
      acoes,
      zonaRetorno,
      el('p', { class: 'dica sudoku-dica' }, `Cada linha, cada coluna e cada bloco de ${br}×${bc} leva os números de 1 a ${n}, sem repetir.`));
    limpar(alvo);
    alvo.append(caixaRonda);

    // Casas quadradas, o maior possível sem sair do ecrã (no 9×9 de 320 px ficam com cerca de 32 px).
    ajustar = () => {
      // Num ecrã deitado e baixo (tablet), o teclado fica ao lado da grelha em vez de por baixo.
      const deitado = window.innerWidth >= 700 && window.innerWidth > window.innerHeight * 1.25 && window.innerHeight < 700;
      caixaRonda.classList.toggle('lado-a-lado', deitado);
      const largura = deitado ? Math.floor(window.innerWidth * 0.55) : caixaRonda.clientWidth || (window.innerWidth - 24);
      const porLargura = Math.floor((largura - 6) / n);
      const porAltura = Math.floor((window.innerHeight - (deitado ? 170 : 330)) / n);
      const lado = Math.max(28, Math.min(cfg.celMax, porLargura, Math.max(32, porAltura)));
      grelha.style.gridTemplateColumns = `repeat(${n}, ${lado}px)`;
      grelha.style.gridAutoRows = `${lado}px`;
      grelha.style.fontSize = `${Math.round(lado * (n === 9 ? 0.7 : 0.62))}px`;
    };
    ajustar();
    window.addEventListener('resize', ajustar);

    aoTeclar = e => {
      if (terminado || e.ctrlKey || e.metaKey || e.altKey) return;
      const x = Number(e.key);
      if (x >= 1 && x <= n) { e.preventDefault(); porNumero(x); return; }
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') { e.preventDefault(); apagar(); return; }
      const mov = { ArrowUp: -n, ArrowDown: n, ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (mov) {
        e.preventDefault();
        const k = sel < 0 ? 0 : sel + mov;
        if (k >= 0 && k < n * n && (Math.abs(mov) === n || lin[k] === lin[sel < 0 ? 0 : sel])) escolherCasa(k);
      }
    };
    document.addEventListener('keydown', aoTeclar);

    aviso('Toque numa casa vazia e depois num número.', 3000);
    if (dados.def.voz) falar('Toque numa casa vazia e depois num número.');
    pintar();

    function repetidos() {
      const r = new Set();
      unidades.forEach(un => {
        const onde = {};
        un.forEach(k => { if (valores[k]) (onde[valores[k]] = onde[valores[k]] || []).push(k); });
        Object.keys(onde).forEach(x => { if (onde[x].length > 1) onde[x].forEach(k => r.add(k)); });
      });
      return r;
    }

    function pintar() {
      const rep = repetidos();
      celulas.forEach((b, k) => {
        const x = valores[k];
        b.textContent = x ? String(x) : '';
        const mesmaZona = sel >= 0 && k !== sel && (lin[k] === lin[sel] || col[k] === col[sel] || caixa[k] === caixa[sel]);
        b.classList.toggle('sudoku-sel', k === sel);
        b.classList.toggle('sudoku-realce', mesmaZona);
        b.classList.toggle('sudoku-repetido', rep.has(k));
        b.classList.toggle('sudoku-ajudada', ajudada[k]);
        b.setAttribute('aria-label', `Linha ${lin[k] + 1}, coluna ${col[k] + 1}: ${x || 'vazia'}${fixa[k] && !ajudada[k] ? ' (dada)' : ''}`);
      });
      const faltam = valores.filter(x => !x).length;
      faltamEl.textContent = faltam === 0 ? 'Grelha cheia' : faltam === 1 ? 'Falta 1 casa' : `Faltam ${faltam} casas`;
      return rep;
    }

    function escolherCasa(k) {
      if (terminado) return;
      sel = k;
      som.clique();
      pintar();
    }

    function porNumero(x) {
      if (terminado) return;
      if (sel < 0) { aviso('Primeiro toque numa casa vazia da grelha.'); return; }
      if (fixa[sel]) {
        aviso(ajudada[sel] ? 'Esta casa já foi revelada pela ajuda.' : 'Esta casa já vem preenchida. Escolha uma casa vazia.');
        return;
      }
      if (valores[sel] === x) return;
      valores[sel] = x;
      // Já há este número na mesma linha, coluna ou bloco?
      const onde = [];
      for (let k = 0; k < n * n; k++) {
        if (k === sel || valores[k] !== x) continue;
        if (lin[k] === lin[sel] && onde.indexOf('linha') < 0) onde.push('linha');
        if (col[k] === col[sel] && onde.indexOf('coluna') < 0) onde.push('coluna');
        if (caixa[k] === caixa[sel] && onde.indexOf('bloco') < 0) onde.push('bloco');
      }
      if (onde.length) {
        erros++;
        som.quase();
        aviso(`Já há um ${x} nesta ${onde.length > 1 ? `${onde.slice(0, -1).join(', ')} e ${onde[onde.length - 1]}` : onde[0]}. Está a vermelho.`, 2400);
      } else som.peca();
      pintar();
      verificarFim();
    }

    function apagar() {
      if (terminado || sel < 0 || fixa[sel] || !valores[sel]) return;
      valores[sel] = 0;
      som.clique();
      pintar();
    }

    function ajuda() {
      if (terminado) return;
      let k = sel >= 0 && !fixa[sel] && valores[sel] !== solucao[sel] ? sel : -1;
      if (k < 0) {
        const erradas = [];
        valores.forEach((x, q) => { if (x && !fixa[q] && x !== solucao[q]) erradas.push(q); });
        if (erradas.length) k = escolher(erradas);
      }
      if (k < 0) {
        // a casa vazia com menos hipóteses (é a que se descobre mais facilmente)
        let menos = 99;
        let melhores = [];
        valores.forEach((x, q) => {
          if (x) return;
          const usados = new Set();
          valores.forEach((y, p) => { if (y && (lin[p] === lin[q] || col[p] === col[q] || caixa[p] === caixa[q])) usados.add(y); });
          const h = n - usados.size;
          if (h < menos) { menos = h; melhores = [q]; } else if (h === menos) melhores.push(q);
        });
        if (melhores.length) k = escolher(melhores);
      }
      if (k < 0) return;
      const corrigida = valores[k] && valores[k] !== solucao[k];
      valores[k] = solucao[k];
      fixa[k] = true;
      ajudada[k] = true;
      ajudas++;
      sel = k;
      som.certo();
      aviso(corrigida ? `Esta casa leva o ${solucao[k]}. Já está corrigida.` : `Esta casa (a verde) leva o ${solucao[k]}.`, 2400);
      pintar();
      verificarFim();
    }

    function desistir() {
      if (terminado) return;
      if (!confirmar) {
        confirmar = true;
        btnDesistir.textContent = 'Desistir? Toque outra vez';
        clearTimeout(tDesistir);
        tDesistir = setTimeout(() => { confirmar = false; btnDesistir.textContent = 'Desistir'; }, 5000);
        return;
      }
      clearTimeout(tDesistir);
      terminado = true;
      valores.forEach((x, k) => {
        if (x !== solucao[k]) { valores[k] = solucao[k]; celulas[k].classList.add('sudoku-solucao'); }
      });
      sel = -1;
      pintar();
      teclado.classList.add('esconder');
      acoes.classList.add('esconder');
      const b = el('button', {
        class: 'btn verde grande largo', type: 'button',
        onclick: () => {
          if (!vivo) return;
          vivo = false;
          aoTerminar({
            estrelas: 1,
            titulo: 'Fica para a próxima! 🌱',
            numeros: [
              { valor: `${n}×${n}`, rotulo: 'grelha' },
              { valor: duracao(Date.now() - t0), rotulo: 'tempo' },
              { valor: String(ajudas), rotulo: ajudas === 1 ? 'ajuda' : 'ajudas' },
            ],
          });
        },
      }, 'Ver resultado ▶');
      limpar(zonaRetorno).append(
        el('div', { class: 'retorno info' }, el('div', { class: 'icone' }, '💡'),
          el('div', {}, el('b', {}, 'Aqui está a solução.'),
            el('div', { class: 'info-extra' }, 'Os números a roxo eram os que faltavam. Para a próxima é que é!'))),
        el('div', { class: 'fila-botoes' }, b));
      try { b.focus({ preventScroll: true }); } catch (e) { /* navegador antigo */ }
      zonaRetorno.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function verificarFim() {
      if (valores.some(x => !x)) return;
      if (repetidos().size) {
        aviso('A grelha está cheia, mas há números repetidos (a vermelho). Corrija-os para terminar.', 3500);
        return;
      }
      // Grelha cheia e sem repetições: como a solução é única, está certa.
      terminado = true;
      sel = -1;
      pintar();
      grelha.classList.add('sudoku-certa');
      teclado.classList.add('esconder');
      acoes.classList.add('esconder');
      som.vitoria();
      aviso(`${elogio()} Grelha completa!`, 2000);
      const ms = Date.now() - t0;
      const penalidade = (ajudas + erros / 2) / Math.max(1, vaziasInicio);
      const estrelas = ajudas === 0 && erros <= 2 ? 3 : penalidade <= 0.25 ? 2 : 1;
      // O recorde de tempo só conta quando a grelha foi resolvida quase sem ajudas.
      const rec = estrelas >= 2 ? verRecorde(`sudoku-${nivel}`, Math.round(ms / 1000), true) : { bateu: false, primeiro: true };
      tFim = setTimeout(() => {
        if (!vivo) return;
        vivo = false;
        aoTerminar({
          estrelas,
          titulo: estrelas === 3 ? 'Sudoku resolvido! 🎉' : 'Grelha completa! 👏',
          recorde: rec.bateu && !rec.primeiro,
          numeros: [
            { valor: duracao(ms), rotulo: 'tempo' },
            { valor: String(ajudas), rotulo: ajudas === 1 ? 'ajuda' : 'ajudas' },
            { valor: String(erros), rotulo: erros === 1 ? 'número repetido' : 'números repetidos' },
          ],
        });
      }, 1600);
    }
  }

  return () => {
    vivo = false;
    clearTimeout(tPreparar);
    clearTimeout(tDesistir);
    clearTimeout(tFim);
    if (ajustar) window.removeEventListener('resize', ajustar);
    if (aoTeclar) document.removeEventListener('keydown', aoTeclar);
    calar();
  };
}
