// Jogos de tabuleiro contra o computador: Jogo do Galo, 4 em Linha e Damas.
// Tudo desenhado com CSS e SVG (sem imagens). O computador espera cerca de 0,6 s antes de jogar,
// para a pessoa ver o que acontece, e nunca passa de ~0,25 s a calcular, mesmo num telemóvel fraco
// (se o tempo acabar, usa a última profundidade de pesquisa que conseguiu completar).
import { el, limpar, som, aviso, elogio, consolo, dados, guardar, escolher, inteiro, festa, falar } from '../util.js';

const ESPERA = 600; // ms que o computador «pensa» antes de jogar
const LIMITE_CALCULO = 250; // ms máximos de cálculo
const FIM = 2800; // ms com o tabuleiro final à vista antes de mostrar o resultado
const SUA_VEZ = '👉 A sua vez';
const A_PENSAR = '⏳ O computador está a pensar…';
const NS = 'http://www.w3.org/2000/svg';
const INF = 1e9;

function svg(tag, attrs) {
  const n = document.createElementNS(NS, tag);
  Object.keys(attrs).forEach(k => n.setAttribute(k, attrs[k]));
  return n;
}
const modoLeveAtivo = () => document.documentElement.classList.contains('leve');

/* ---------- Estrutura comum aos três jogos ---------- */
// Instrução, informações, linha de estado grande, tabuleiro e botões. Também guarda os temporizadores,
// para tudo parar se a pessoa sair a meio.
function preparar(alvo, classe, instrucao) {
  limpar(alvo);
  alvo.classList.add('ecra-cheio');
  const info = el('div', { class: 'info-jogo tab-info' });
  const estado = el('div', { class: 'tab-estado', role: 'status', 'aria-live': 'polite' });
  const area = el('div', { class: 'tab-area' });
  const acoes = el('div', { class: 'tab-acoes' });
  const raiz = el('div', { class: `ronda tab ${classe}` }, el('p', { class: 'dica tab-dica' }, instrucao), info, estado, area, acoes);
  alvo.append(raiz);
  const tempos = [];
  const j = {
    raiz, info, estado, area, acoes, vivo: true, ajustar: null,
    depois(fn, ms) {
      const t = setTimeout(() => {
        const k = tempos.indexOf(t);
        if (k >= 0) tempos.splice(k, 1);
        if (j.vivo) fn();
      }, ms);
      tempos.push(t);
      return t;
    },
    dizer(tipo, texto, voz) {
      estado.className = `tab-estado ${tipo}`;
      estado.textContent = texto;
      if (voz && dados.def.voz) falar(texto.replace(/^[^A-Za-zÀ-ú]+/, ''));
    },
    // O computador espera ~0,6 s: mostra que está a pensar, calcula e só depois joga.
    computador(calcular, jogar) {
      j.dizer('pensa', A_PENSAR);
      j.depois(() => {
        const t0 = Date.now();
        const jogada = calcular();
        const gasto = Date.now() - t0;
        raiz.setAttribute('data-calculo-ms', String(gasto));
        if (gasto >= Number(raiz.getAttribute('data-calculo-max') || 0)) raiz.setAttribute('data-calculo-max', String(gasto));
        j.depois(() => jogar(jogada), Math.max(0, ESPERA - 60 - gasto));
      }, 60);
    },
    // O aviso simpático do fim aparece pouco antes do resultado, para não tapar o tabuleiro final.
    avisoFinal(texto, espera) {
      j.depois(() => aviso(texto), Math.max(0, (espera || FIM) - 900));
    },
    fechar() {
      j.vivo = false;
      tempos.forEach(clearTimeout);
      tempos.length = 0;
      window.removeEventListener('resize', aoRedimensionar);
      alvo.classList.remove('ecra-cheio');
    },
  };
  function aoRedimensionar() { if (j.ajustar && j.vivo) j.ajustar(); }
  window.addEventListener('resize', aoRedimensionar);
  return j;
}

// Largura útil e altura livre por baixo do elemento (deixando `reserva` px para os botões de baixo).
function espaco(alvo, elemento, reserva) {
  const est = getComputedStyle(alvo);
  const largura = (alvo.clientWidth || window.innerWidth) - (parseFloat(est.paddingLeft) || 0) - (parseFloat(est.paddingRight) || 0);
  const topo = elemento.getBoundingClientRect().top + (window.pageYOffset || 0);
  return { largura: Math.max(200, Math.min(largura, 820)), altura: window.innerHeight - topo - reserva };
}

// Vitórias e derrotas guardadas no aparelho (aparecem no resultado).
function registo(jogo) {
  const t = dados.tabuleiro || (dados.tabuleiro = {});
  return t[jogo] || (t[jogo] = { ganhos: 0, perdidos: 0, empates: 0 });
}
function contar(jogo, campo) {
  const r = registo(jogo);
  r[campo]++;
  guardar();
  return r;
}

/* =====================================================================
   Jogo do Galo
   ===================================================================== */
const LINHAS_GALO = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const NOME_CASA = ['Em cima, à esquerda', 'Em cima, ao meio', 'Em cima, à direita', 'Ao meio, à esquerda', 'Mesmo ao centro',
  'Ao meio, à direita', 'Em baixo, à esquerda', 'Em baixo, ao meio', 'Em baixo, à direita'];

function linhaGalo(t, cor) {
  for (const l of LINHAS_GALO) if (t[l[0]] === cor && t[l[1]] === cor && t[l[2]] === cor) return l;
  return null;
}
const vaziasGalo = t => t.filter(v => v === 0).length;

// Minimax completo com memória (o Galo tem poucos milhares de posições).
// Nota de uma jogada para `cor`: >0 ganha (mais cedo vale mais), 0 empata, <0 perde.
const memoGalo = {};
function valorGalo(t, cor) {
  const k = t.join('') + cor;
  if (memoGalo[k] !== undefined) return memoGalo[k];
  let melhor = -INF;
  for (let i = 0; i < 9; i++) if (t[i] === 0) melhor = Math.max(melhor, notaGalo(t, i, cor));
  if (melhor === -INF) melhor = 0;
  memoGalo[k] = melhor;
  return melhor;
}
function notaGalo(t, i, cor) {
  t[i] = cor;
  let v;
  if (linhaGalo(t, cor)) v = 10 + vaziasGalo(t);
  else if (!vaziasGalo(t)) v = 0;
  else v = -valorGalo(t, -cor);
  t[i] = 0;
  return v;
}
function venceGalo(t, i, cor) {
  t[i] = cor;
  const v = Boolean(linhaGalo(t, cor));
  t[i] = 0;
  return v;
}

// O computador joga com ⭕ (-1); a pessoa com ✖ (1).
function jogadaGalo(t, nivel, errarAgora) {
  const livres = [];
  for (let i = 0; i < 9; i++) if (t[i] === 0) livres.push(i);
  if (nivel === 1) return escolher(livres);
  if (nivel === 2) {
    const ganhar = livres.filter(i => venceGalo(t, i, -1));
    if (ganhar.length) return escolher(ganhar);
    const travar = livres.filter(i => venceGalo(t, i, 1));
    if (travar.length) return escolher(travar);
    return escolher(livres);
  }
  const notas = livres.map(i => ({ i, v: notaGalo(t, i, -1) }));
  const max = Math.max.apply(null, notas.map(n => n.v));
  if (nivel === 3 && errarAgora()) {
    const piores = notas.filter(n => n.v < max).map(n => n.i);
    return escolher(piores.length ? piores : livres);
  }
  return escolher(notas.filter(n => n.v === max).map(n => n.i));
}

function marcaX() {
  const s = svg('svg', { viewBox: '0 0 100 100', 'aria-hidden': 'true' });
  s.append(svg('path', { d: 'M24 24 L76 76 M76 24 L24 76', stroke: '#1d2633', 'stroke-width': 15, 'stroke-linecap': 'round', fill: 'none' }));
  return s;
}
function marcaO() {
  const s = svg('svg', { viewBox: '0 0 100 100', 'aria-hidden': 'true' });
  s.append(svg('circle', { cx: 50, cy: 50, r: 29, stroke: '#d32f2f', 'stroke-width': 14, fill: 'none' }));
  return s;
}

export function galo(alvo, { nivel, aoTerminar }) {
  const j = preparar(alvo, 'tab-galo',
    'Faça três ✖ seguidos, em qualquer direção, antes do computador (⭕). São até 3 partidas.');
  const infoPartida = el('span', {});
  const infoPlacar = el('span', {});
  j.info.append(infoPartida, infoPlacar);
  const casas = [];
  for (let i = 0; i < 9; i++) casas.push(el('button', { class: 'tab-galo-casa vazia', type: 'button', onclick: () => tocar(i) }));
  const grelha = el('div', { class: 'tab-galo-grelha' }, casas);
  j.area.append(grelha);

  let t = [];
  let partida = 0;
  let ganhos = 0;
  let perdas = 0;
  let empates = 0;
  let aJogar = false;
  let entrePartidas = false;
  let linha = null;
  let quemLinha = 0;
  let ultima = -1;
  // Nível 3: em cada 4 jogadas do computador, uma (ao acaso) é um erro.
  let jogadasPC = 0;
  let erroEm = inteiro(0, 3);
  function errarAgora() {
    const e = jogadasPC % 4 === erroEm;
    jogadasPC++;
    if (jogadasPC % 4 === 0) erroEm = inteiro(0, 3);
    return e;
  }

  j.ajustar = () => {
    const { largura, altura } = espaco(alvo, grelha, 100);
    const tam = Math.floor(Math.min(largura, 420, Math.max(altura, 240)));
    grelha.style.width = `${tam}px`;
    grelha.style.height = `${tam}px`;
  };
  j.ajustar();

  function desenhar() {
    casas.forEach((b, i) => {
      const v = t[i];
      limpar(b);
      if (v === 1) b.append(marcaX()); else if (v === -1) b.append(marcaO());
      let cls = `tab-galo-casa${v ? '' : ' vazia'}${i === ultima ? ' nova' : ''}`;
      if (linha && linha.indexOf(i) >= 0) cls += quemLinha === 1 ? ' ganha' : ' ganha pc';
      else if (linha) cls += ' apagada';
      b.className = cls;
      b.setAttribute('aria-label', `${NOME_CASA[i]}: ${v === 1 ? 'cruz' : v === -1 ? 'bola' : 'vazia'}`);
    });
    infoPartida.textContent = `Partida ${partida} de 3`;
    infoPlacar.textContent = `Você ${ganhos} – ${perdas} Computador`;
  }

  function novaPartida() {
    entrePartidas = false;
    partida++;
    t = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    linha = null;
    ultima = -1;
    limpar(j.acoes);
    desenhar();
    // O primeiro a jogar alterna: a pessoa começa a 1.ª e a 3.ª partidas, o computador a 2.ª.
    if (partida % 2 === 1) {
      if (partida > 1) aviso(`Partida ${partida}: começa você.`);
      suaVez(`${SUA_VEZ}: toque numa casa vazia.`);
    } else {
      aviso(`Partida ${partida}: desta vez começa o computador.`);
      vezDele();
    }
  }

  function suaVez(texto) {
    aJogar = true;
    j.dizer('vez', texto || SUA_VEZ);
  }

  function tocar(i) {
    if (!aJogar) return;
    if (t[i] !== 0) { som.quase(); aviso('Essa casa já está ocupada. Escolha uma vazia.'); return; }
    aJogar = false;
    jogar(i, 1);
  }

  function jogar(i, cor) {
    t[i] = cor;
    ultima = i;
    som.peca();
    const l = linhaGalo(t, cor);
    if (l) { linha = l; quemLinha = cor; fimPartida(cor); return; }
    if (!vaziasGalo(t)) { fimPartida(0); return; }
    desenhar();
    if (cor === 1) vezDele(); else suaVez();
  }

  function vezDele() {
    aJogar = false;
    j.computador(() => jogadaGalo(t, nivel, errarAgora), i => jogar(i, -1));
  }

  function fimPartida(quem) {
    aJogar = false;
    if (quem === 1) ganhos++; else if (quem === -1) perdas++; else empates++;
    desenhar();
    if (ganhos >= 2 || perdas >= 2 || partida >= 3) { fimSerie(); return; }
    if (quem === 1) {
      som.certo();
      j.dizer('bom', `🎉 Ganhou a ${partida}.ª partida! ${escolher(['Muito bem!', 'Bravo!', 'Boa jogada!'])}`);
    } else if (quem === -1) {
      som.quase();
      j.dizer('quase', `O computador ganhou a ${partida}.ª. Não faz mal, há mais!`);
    } else {
      som.clique();
      j.dizer('info', '🤝 Empate! Está renhido.');
    }
    entrePartidas = true;
    limpar(j.acoes).append(el('button', {
      class: 'btn verde grande tab-seguinte', type: 'button',
      onclick: () => { if (entrePartidas) novaPartida(); },
    }, `▶ Jogar a ${partida + 1}.ª partida`));
  }

  function fimSerie() {
    let estrelas;
    let titulo;
    if (ganhos > perdas) {
      estrelas = 3;
      titulo = 'Ganhou a série! 🎉';
      contar('galo', 'ganhos');
      som.vitoria();
      festa(['✖', '⭕', '⭐', '🎉', '✨']);
      j.avisoFinal(`${elogio()} Ganhou a série!`);
      j.dizer('bom', `🏆 Ganhou a série por ${ganhos} – ${perdas}!`, true);
    } else if (ganhos === perdas) {
      estrelas = 2;
      titulo = 'Série empatada 🤝';
      contar('galo', 'empates');
      som.certo();
      j.avisoFinal('Série empatada! Foi muito equilibrado.');
      j.dizer('info', `🤝 Série empatada: ${ganhos} – ${perdas}.`, true);
    } else {
      estrelas = ganhos >= 1 ? 2 : 1;
      titulo = 'Desta vez ganhou o computador';
      contar('galo', 'perdidos');
      som.quase();
      j.avisoFinal(`${consolo()} Para a próxima é que é!`);
      j.dizer('quase', `O computador ganhou a série por ${perdas} – ${ganhos}.`, true);
    }
    const r = registo('galo');
    j.depois(() => aoTerminar({
      estrelas,
      titulo,
      numeros: [
        { valor: `${ganhos} – ${perdas}`, rotulo: 'partidas: suas – do computador' },
        { valor: String(empates), rotulo: empates === 1 ? 'empate' : 'empates' },
        { valor: `${r.ganhos} – ${r.perdidos}`, rotulo: 'séries ganhas: suas – do computador' },
      ],
      recorde: false,
    }), FIM);
  }

  novaPartida();
  return () => j.fechar();
}

/* =====================================================================
   4 em Linha (7 colunas × 6 linhas)
   ===================================================================== */
const C4 = 7;
const L4 = 6;
const ORDEM4 = [3, 2, 4, 1, 5, 0, 6]; // ver primeiro as colunas do meio poupa muito cálculo
const VIT4 = 1000000;
const DIR4 = [[0, 1], [1, 0], [1, 1], [1, -1]];
// Todas as «janelas» de 4 casas seguidas (índice = linha * 7 + coluna; a linha 0 é a de baixo).
const JANELAS4 = (() => {
  const w = [];
  for (let r = 0; r < L4; r++) {
    for (let c = 0; c < C4; c++) {
      DIR4.forEach(([dr, dc]) => {
        const r3 = r + 3 * dr;
        const c3 = c + 3 * dc;
        if (r3 < L4 && c3 >= 0 && c3 < C4) w.push([0, 1, 2, 3].map(k => (r + k * dr) * C4 + c + k * dc));
      });
    }
  }
  return w;
})();

function ganha4(g, r, c, cor) {
  for (let d = 0; d < 4; d++) {
    const dr = DIR4[d][0];
    const dc = DIR4[d][1];
    let n = 1;
    for (let s = -1; s <= 1; s += 2) {
      let rr = r + dr * s;
      let cc = c + dc * s;
      while (rr >= 0 && rr < L4 && cc >= 0 && cc < C4 && g[rr * C4 + cc] === cor) { n++; rr += dr * s; cc += dc * s; }
    }
    if (n >= 4) return true;
  }
  return false;
}

// Avaliação de uma posição para `cor`: janelas quase completas e peças na coluna do meio.
function avaliar4(g, cor) {
  let s = 0;
  for (let r = 0; r < L4; r++) {
    const v = g[r * C4 + 3];
    if (v === cor) s += 3; else if (v === -cor) s -= 3;
  }
  for (let k = 0; k < JANELAS4.length; k++) {
    const w = JANELAS4[k];
    let a = 0;
    let b = 0;
    for (let m = 0; m < 4; m++) {
      const v = g[w[m]];
      if (v === cor) a++; else if (v === -cor) b++;
    }
    if (b === 0) { if (a === 3) s += 5; else if (a === 2) s += 2; } else if (a === 0) { if (b === 3) s -= 5; else if (b === 2) s -= 2; }
  }
  return s;
}

// Minimax (forma «negamax»): devolve a nota para quem vai jogar. Com `poda`, faz cortes alfa-beta.
function negamax4(g, alt, cor, prof, alfa, beta, poda, ctx) {
  if ((++ctx.nos & 511) === 0 && Date.now() > ctx.limite) throw ctx;
  if (prof === 0) return avaliar4(g, cor);
  let melhor = -INF;
  let jogou = false;
  for (let k = 0; k < 7; k++) {
    const c = ORDEM4[k];
    if (alt[c] >= L4) continue;
    jogou = true;
    const r = alt[c];
    const i = r * C4 + c;
    g[i] = cor;
    alt[c]++;
    const v = ganha4(g, r, c, cor) ? VIT4 + prof : -negamax4(g, alt, -cor, prof - 1, -beta, -alfa, poda, ctx);
    g[i] = 0;
    alt[c]--;
    if (v > melhor) melhor = v;
    if (poda) {
      if (v > alfa) alfa = v;
      if (alfa >= beta) break;
    }
  }
  return jogou ? melhor : 0; // tabuleiro cheio: empate
}

// Nota exata de cada coluna para o computador (-1) e escolha ao acaso entre as melhores.
function raiz4(g, alt, prof, poda, ctx) {
  const notas = [];
  for (let k = 0; k < 7; k++) {
    const c = ORDEM4[k];
    if (alt[c] >= L4) continue;
    const r = alt[c];
    const i = r * C4 + c;
    g[i] = -1;
    alt[c]++;
    const v = ganha4(g, r, c, -1) ? VIT4 + prof : -negamax4(g, alt, 1, prof - 1, -INF, INF, poda, ctx);
    g[i] = 0;
    alt[c]--;
    notas.push({ c, v });
  }
  const max = Math.max.apply(null, notas.map(n => n.v));
  return { c: escolher(notas.filter(n => n.v === max)).c, ganha: max >= VIT4 };
}

function vence4(g, alt, c, cor) {
  if (alt[c] >= L4) return false;
  const r = alt[c];
  g[r * C4 + c] = cor;
  const v = ganha4(g, r, c, cor);
  g[r * C4 + c] = 0;
  return v;
}

function jogada4(g, alt, nivel) {
  const livres = [];
  for (let c = 0; c < C4; c++) if (alt[c] < L4) livres.push(c);
  const ganhaPC = livres.filter(c => vence4(g, alt, c, -1));
  const ganhaPessoa = livres.filter(c => vence4(g, alt, c, 1));
  if (nivel === 1) {
    if (ganhaPessoa.length && Math.random() < 0.5) return escolher(ganhaPessoa);
    return escolher(livres);
  }
  if (nivel === 2 || livres.length === 1) {
    if (ganhaPC.length) return escolher(ganhaPC);
    if (ganhaPessoa.length) return escolher(ganhaPessoa);
    return escolher(livres);
  }
  // Nível 3: minimax de profundidade 3. Nível 4: profundidade 5 com cortes alfa-beta, por aprofundamento
  // progressivo: se o tempo acabar (telemóvel fraco), fica a melhor jogada da última profundidade completa.
  const ctx = { nos: 0, limite: Date.now() + LIMITE_CALCULO };
  const profMax = nivel === 3 ? 3 : 5;
  let melhor = null;
  for (let p = nivel === 3 ? 3 : 1; p <= profMax; p++) {
    try {
      const r = raiz4(g.slice(), alt.slice(), p, nivel === 4, ctx);
      melhor = r.c;
      if (r.ganha) break;
    } catch (e) {
      if (e !== ctx) throw e;
      break;
    }
  }
  if (melhor !== null) return melhor;
  if (ganhaPC.length) return ganhaPC[0];
  if (ganhaPessoa.length) return ganhaPessoa[0];
  return ORDEM4.filter(c => alt[c] < L4)[0];
}

export function quatroEmLinha(alvo, { nivel, aoTerminar }) {
  const j = preparar(alvo, 'tab-4l',
    'Toque numa coluna para deixar cair a sua peça. Junte 4 seguidas, em qualquer direção!');
  j.info.append(
    el('span', {}, el('i', { class: 'tab-mini vermelha', 'aria-hidden': 'true' }), 'Você'),
    el('span', {}, el('i', { class: 'tab-mini amarela', 'aria-hidden': 'true' }), 'Computador'));
  const g = [];
  for (let i = 0; i < C4 * L4; i++) g.push(0);
  const alt = [0, 0, 0, 0, 0, 0, 0];
  const buracos = [];
  const colunas = [];
  for (let c = 0; c < C4; c++) {
    const furos = [];
    for (let r = L4 - 1; r >= 0; r--) {
      const b = el('span', { class: 'tab-4l-buraco' });
      buracos[r * C4 + c] = b;
      furos.push(b);
    }
    colunas.push(el('button', { class: 'tab-4l-col', type: 'button', 'aria-label': `Coluna ${c + 1}`, onclick: () => tocar(c) },
      el('span', { class: 'tab-4l-seta', 'aria-hidden': 'true' }, '▼'), furos));
  }
  const tabuleiro = el('div', { class: 'tab-4l-tabuleiro espera' }, colunas);
  j.area.append(tabuleiro);

  let aJogar = false;
  let acabou = false;
  let pecasPessoa = 0;
  let cel = 44;
  let folga = 6;

  j.ajustar = () => {
    const { largura, altura } = espaco(alvo, tabuleiro, 24);
    folga = largura < 420 ? 4 : 7;
    const porLargura = (Math.min(largura, 640) - folga * 8) / 7;
    const porAltura = (altura - folga * 8 - 6) / 6.8; // 6 buracos + a seta por cima
    cel = Math.floor(Math.max(28, Math.min(porLargura, Math.max(porAltura, 38), 76)));
    tabuleiro.style.setProperty('--cel', `${cel}px`);
    tabuleiro.style.setProperty('--folga', `${folga}px`);
  };
  j.ajustar();

  function pintar(i, cor) {
    const b = buracos[i];
    limpar(b);
    const f = el('span', { class: `tab-4l-ficha ${cor === 1 ? 'v' : 'a'}` });
    b.append(f);
    if (modoLeveAtivo()) return;
    // A peça cai de cima da coluna até ao seu lugar (devagar, sem saltos bruscos).
    const r = Math.floor(i / C4);
    const linhasAcima = L4 - r;
    f.style.transform = `translateY(${-linhasAcima * (cel + folga)}px)`;
    void f.offsetWidth;
    f.style.transition = `transform ${(0.18 + linhasAcima * 0.05).toFixed(2)}s ease-in`;
    f.style.transform = 'translateY(0)';
  }

  function suaVez() {
    if (acabou) return;
    aJogar = true;
    tabuleiro.classList.remove('espera');
    j.dizer('vez', pecasPessoa ? SUA_VEZ : `${SUA_VEZ}: toque numa coluna.`);
  }

  function tocar(c) {
    if (!aJogar) return;
    if (alt[c] >= L4) { som.quase(); aviso('Essa coluna já está cheia. Escolha outra.'); return; }
    aJogar = false;
    jogar(c, 1);
  }

  function jogar(c, cor) {
    if (acabou) return;
    const r = alt[c];
    const i = r * C4 + c;
    g[i] = cor;
    alt[c]++;
    if (alt[c] >= L4) colunas[c].classList.add('cheia');
    if (cor === 1) pecasPessoa++;
    pintar(i, cor);
    som.peca();
    if (ganha4(g, r, c, cor)) { acabou = true; tabuleiro.classList.add('espera'); j.depois(() => fim(cor), 450); return; }
    if (alt.every(a => a >= L4)) { acabou = true; tabuleiro.classList.add('espera'); j.depois(() => fim(0), 450); return; }
    if (cor === 1) {
      tabuleiro.classList.add('espera');
      j.computador(() => jogada4(g, alt, nivel), col => jogar(col, -1));
    } else suaVez();
  }

  function fim(quem) {
    aJogar = false;
    tabuleiro.classList.add('fim');
    if (quem) {
      // Destaca a linha vencedora (todas as janelas de 4 da mesma cor).
      JANELAS4.forEach(w => { if (w.every(k => g[k] === quem)) w.forEach(k => buracos[k].classList.add('ganha')); });
    }
    let estrelas;
    let titulo;
    if (quem === 1) {
      estrelas = 3;
      titulo = 'Ganhou! 🎉';
      contar('4emlinha', 'ganhos');
      som.vitoria();
      festa(['🔴', '⭐', '🎉', '✨']);
      j.avisoFinal(`${elogio()} Fez 4 em linha!`);
      j.dizer('bom', '🎉 Ganhou! Fez 4 em linha!', true);
    } else if (quem === -1) {
      estrelas = 1;
      titulo = 'Desta vez ganhou o computador';
      contar('4emlinha', 'perdidos');
      som.quase();
      j.avisoFinal(`${consolo()} Para a próxima é que é!`);
      j.dizer('quase', 'O computador juntou 4 seguidas.', true);
    } else {
      estrelas = 2;
      titulo = 'Empate 🤝';
      contar('4emlinha', 'empates');
      som.certo();
      j.avisoFinal('Empate! Foi um jogo muito equilibrado.');
      j.dizer('info', '🤝 Empate: o tabuleiro encheu.', true);
    }
    const r = registo('4emlinha');
    j.depois(() => aoTerminar({
      estrelas,
      titulo,
      numeros: [
        { valor: String(pecasPessoa), rotulo: 'peças jogadas' },
        { valor: `${r.ganhos} – ${r.perdidos}`, rotulo: 'vitórias suas – do computador' },
      ],
      recorde: false,
    }), FIM);
  }

  suaVez();
  return () => j.fechar();
}

/* =====================================================================
   Damas (regras portuguesas simples, 8×8)
   - As peças andam uma casa na diagonal, para a frente, e comem para a frente.
   - Comer é obrigatório e pode-se comer várias peças seguidas (é tudo a mesma jogada).
   - Quem chega ao fim do tabuleiro passa a dama: anda e come várias casas na diagonal, para trás e para a frente.
   - Perde quem ficar sem peças ou sem jogadas. 40 jogadas seguidas sem ninguém comer: empate.
   Tabuleiro: índice = linha * 8 + coluna; linha 0 em cima. Valores: 1 peça da pessoa (brancas), 2 dama da pessoa,
   -1 peça do computador (pretas), -2 dama do computador. A pessoa joga para cima.
   ===================================================================== */
const ESCURAS = [];
for (let i = 0; i < 64; i++) if (((i >> 3) + (i & 7)) % 2 === 1) ESCURAS.push(i);
const DR = [-1, -1, 1, 1];
const DC = [-1, 1, -1, 1];
const VIT_D = 100000;
const SEM_CAPTURAS = 40;

function inicialDamas() {
  const t = [];
  for (let i = 0; i < 64; i++) t.push(0);
  ESCURAS.forEach(i => { const r = i >> 3; if (r <= 2) t[i] = -1; else if (r >= 5) t[i] = 1; });
  return t;
}
const livreD = (t, k, origem) => t[k] === 0 || k === origem;

// Procura todas as sequências de capturas a partir de `pos`. As peças já comidas ficam no tabuleiro
// até ao fim da jogada (não se pode passar por cima delas nem comê-las duas vezes).
function buscarCapturas(t, origem, pos, cor, dama, passos, comidas, res) {
  const r = pos >> 3;
  const c = pos & 7;
  let continuou = false;
  for (let d = 0; d < 4; d++) {
    const dr = DR[d];
    const dc = DC[d];
    if (!dama && dr !== -cor) continue; // as peças só comem para a frente
    if (dama) {
      let rr = r + dr;
      let cc = c + dc;
      while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && livreD(t, rr * 8 + cc, origem)) { rr += dr; cc += dc; }
      if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;
      const k = rr * 8 + cc;
      if (t[k] * cor >= 0 || comidas.indexOf(k) >= 0) continue;
      let r2 = rr + dr;
      let c2 = cc + dc;
      while (r2 >= 0 && r2 < 8 && c2 >= 0 && c2 < 8 && livreD(t, r2 * 8 + c2, origem)) {
        continuou = true;
        const destino = r2 * 8 + c2;
        buscarCapturas(t, origem, destino, cor, dama, passos.concat(destino), comidas.concat(k), res);
        r2 += dr;
        c2 += dc;
      }
    } else {
      const r2 = r + 2 * dr;
      const c2 = c + 2 * dc;
      if (r2 < 0 || r2 > 7 || c2 < 0 || c2 > 7) continue;
      const k = (r + dr) * 8 + c + dc;
      const destino = r2 * 8 + c2;
      if (t[k] * cor < 0 && comidas.indexOf(k) < 0 && livreD(t, destino, origem)) {
        continuou = true;
        buscarCapturas(t, origem, destino, cor, dama, passos.concat(destino), comidas.concat(k), res);
      }
    }
  }
  if (!continuou && passos.length) res.push({ de: origem, passos, comidas });
}

// Jogadas válidas de `cor`. Se houver capturas, só as capturas contam (comer é obrigatório).
function jogadasDamas(t, cor) {
  const res = [];
  for (let k = 0; k < 32; k++) {
    const i = ESCURAS[k];
    if (t[i] * cor > 0) buscarCapturas(t, i, i, cor, t[i] === 2 * cor, [], [], res);
  }
  if (res.length) return res;
  for (let k = 0; k < 32; k++) {
    const i = ESCURAS[k];
    if (t[i] * cor <= 0) continue;
    const dama = t[i] === 2 * cor;
    const r = i >> 3;
    const c = i & 7;
    for (let d = 0; d < 4; d++) {
      if (!dama && DR[d] !== -cor) continue;
      let rr = r + DR[d];
      let cc = c + DC[d];
      while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && t[rr * 8 + cc] === 0) {
        res.push({ de: i, passos: [rr * 8 + cc], comidas: [] });
        if (!dama) break;
        rr += DR[d];
        cc += DC[d];
      }
    }
  }
  return res;
}

function aplicarDamas(t, mv) {
  const n = t.slice();
  const p = n[mv.de];
  n[mv.de] = 0;
  for (let k = 0; k < mv.comidas.length; k++) n[mv.comidas[k]] = 0;
  const fim = mv.passos[mv.passos.length - 1];
  const r = fim >> 3;
  n[fim] = p === 1 && r === 0 ? 2 : p === -1 && r === 7 ? -2 : p;
  return n;
}

const valorPeca = v => (Math.abs(v) === 2 ? 3 : 1);
const valorComidas = (t, mv) => mv.comidas.reduce((s, k) => s + valorPeca(t[k]), 0);

// Avaliação para `cor`: material (dama vale 3 peças), peças avançadas, centro e última fila guardada.
function avaliarDamas(t, cor) {
  let s = 0;
  for (let k = 0; k < 32; k++) {
    const i = ESCURAS[k];
    const v = t[i];
    if (!v) continue;
    const r = i >> 3;
    const c = i & 7;
    let x;
    if (v === 1 || v === -1) {
      const avanco = v === 1 ? 7 - r : r;
      x = 100 + avanco * 3 + (avanco === 0 ? 6 : 0);
    } else x = 300;
    if (c >= 2 && c <= 5 && r >= 2 && r <= 5) x += 4;
    s += v > 0 ? x : -x;
  }
  return s * cor;
}

// Minimax com cortes alfa-beta. Com `continuar`, quando acaba a profundidade mas há capturas
// obrigatórias pendentes, vê-as até ao fim (evita «não ver» que vai perder uma peça).
function negamaxD(t, cor, prof, alfa, beta, ctx, continuar) {
  if ((++ctx.nos & 255) === 0 && Date.now() > ctx.limite) throw ctx;
  const mvs = jogadasDamas(t, cor);
  if (!mvs.length) return -(VIT_D + prof); // sem jogadas (ou sem peças): perde
  if (prof <= 0 && (!continuar || !mvs[0].comidas.length || prof <= -4)) return avaliarDamas(t, cor);
  if (mvs.length > 1 && mvs[0].comidas.length) mvs.sort((a, b) => b.comidas.length - a.comidas.length);
  let melhor = -INF;
  for (let k = 0; k < mvs.length; k++) {
    const v = -negamaxD(aplicarDamas(t, mvs[k]), -cor, prof - 1, -beta, -alfa, ctx, continuar);
    if (v > melhor) melhor = v;
    if (v > alfa) alfa = v;
    if (alfa >= beta) break;
  }
  return melhor;
}

function raizDamas(t, mvs, prof, ctx, continuar) {
  const notas = mvs.map(mv => ({ mv, v: -negamaxD(aplicarDamas(t, mv), 1, prof - 1, -INF, INF, ctx, continuar) }));
  const max = Math.max.apply(null, notas.map(n => n.v));
  return { mv: escolher(notas.filter(n => n.v === max)).mv, ganha: max >= VIT_D };
}

// Nível 2: come o máximo que puder e evita deixar peças à mercê da pessoa.
function jogadaGulosa(t, mvs) {
  let melhor = mvs[0];
  let notaMelhor = -INF;
  mvs.forEach(mv => {
    let n = valorComidas(t, mv) * 10;
    const t2 = aplicarDamas(t, mv);
    const fim = mv.passos[mv.passos.length - 1];
    if (t[mv.de] === -1 && t2[fim] === -2) n += 8;
    const resposta = jogadasDamas(t2, 1);
    if (resposta.length && resposta[0].comidas.length) n -= Math.max.apply(null, resposta.map(m => valorComidas(t2, m))) * 10;
    n += Math.random() * 3;
    if (n > notaMelhor) { notaMelhor = n; melhor = mv; }
  });
  return melhor;
}

function jogadaDamas(t, nivel) {
  const mvs = jogadasDamas(t, -1);
  if (mvs.length === 1) return mvs[0];
  if (nivel === 1) return escolher(mvs);
  if (nivel === 2) return jogadaGulosa(t, mvs);
  // Nível 3: profundidade 3. Nível 4: profundidade 5 (aprofundamento progressivo com limite de tempo).
  const ctx = { nos: 0, limite: Date.now() + LIMITE_CALCULO };
  const profMax = nivel === 3 ? 3 : 5;
  let melhor = null;
  for (let p = nivel === 3 ? 3 : 1; p <= profMax; p++) {
    try {
      const r = raizDamas(t, mvs, p, ctx, nivel === 4);
      melhor = r.mv;
      if (r.ganha) break;
    } catch (e) {
      if (e !== ctx) throw e;
      break;
    }
  }
  return melhor || jogadaGulosa(t, mvs);
}

function coroa() {
  const s = svg('svg', { viewBox: '0 0 24 24', class: 'tab-d-coroa', 'aria-hidden': 'true' });
  s.append(svg('path', {
    d: 'M3.5 18 L5 8 L9.5 12.5 L12 5 L14.5 12.5 L19 8 L20.5 18 Z',
    fill: '#f2b705', stroke: '#7a5a00', 'stroke-width': 1.6, 'stroke-linejoin': 'round',
  }));
  return s;
}

const LETRAS = 'abcdefgh';
function rotuloCasa(i, p, destino) {
  const nome = `${LETRAS[i & 7]}${8 - (i >> 3)}`;
  const o = p === 1 ? 'peça sua' : p === 2 ? 'dama sua' : p === -1 ? 'peça do computador' : p === -2 ? 'dama do computador' : 'vazia';
  return `Casa ${nome}: ${o}${destino ? ', pode ir para aqui' : ''}`;
}

// `posicao` (opcional, para testes): 64 casas com os valores acima, em vez da posição inicial.
export function damas(alvo, { nivel, aoTerminar, posicao }) {
  const j = preparar(alvo, 'tab-damas',
    'Joga com as brancas: toque numa peça e depois no destino. Comer é obrigatório!');
  const infoMinhas = el('span', {});
  const infoDele = el('span', {});
  j.info.append(infoMinhas, infoDele);
  const casas = [];
  for (let i = 0; i < 64; i++) {
    const escura = ((i >> 3) + (i & 7)) % 2 === 1;
    casas.push(escura ? el('button', { class: 'tab-d-casa escura', type: 'button', onclick: () => tocar(i) }) : el('div', { class: 'tab-d-casa clara' }));
  }
  const tabEl = el('div', { class: 'tab-d-tabuleiro' }, casas);
  j.area.append(tabEl);
  const notaEmpate = el('p', { class: 'tab-nota', hidden: true });
  const btnDesistir = el('button', { class: 'btn claro tab-desistir', type: 'button', onclick: desistir }, '🏳️ Desistir');
  j.acoes.append(notaEmpate, btnDesistir);

  let tab = Array.isArray(posicao) && posicao.length === 64 ? posicao.slice() : inicialDamas();
  let opcoes = [];
  let sel = null;
  let caminho = [];
  let vista = null; // posição intermédia (a meio de uma captura múltipla)
  let aJogar = false;
  let acabou = false;
  let semCapturas = 0;
  let comiPessoa = 0;
  let comiPC = 0;
  let ultima = [];
  let ultimasComidas = [];
  let confirmar = false;
  let tConfirmar = null;

  j.ajustar = () => {
    const { largura, altura } = espaco(alvo, tabEl, 24);
    const lado = Math.min(largura, Math.max(altura, 290), 600) - 12; // 12 = moldura
    const casa = Math.max(30, Math.floor(lado / 8));
    tabEl.style.setProperty('--casa', `${casa}px`);
  };
  j.ajustar();

  const contarPecas = cor => tab.filter(v => v * cor > 0).length;

  function candidatos() {
    if (sel === null) return [];
    return opcoes.filter(m => m.de === sel && caminho.every((s, k) => m.passos[k] === s));
  }

  function vistaParcial(mv, n) {
    const t = tab.slice();
    const p = t[mv.de];
    t[mv.de] = 0;
    t[mv.passos[n - 1]] = p;
    return { t, comidas: mv.comidas.slice(0, n) };
  }

  function desenhar() {
    const v = vista ? vista.t : tab;
    const fantasmas = vista ? vista.comidas : [];
    const cands = aJogar ? candidatos() : [];
    const destinos = cands.map(m => m.passos[caminho.length]);
    const alvos = cands.map(m => m.comidas[caminho.length]).filter(x => x !== undefined);
    const obrig = aJogar && opcoes.length > 0 && opcoes[0].comidas.length > 0;
    const origens = aJogar && !caminho.length ? opcoes.map(m => m.de) : [];
    const atual = caminho.length ? caminho[caminho.length - 1] : sel;
    ESCURAS.forEach(i => {
      const b = casas[i];
      const p = v[i];
      let cls = 'tab-d-casa escura';
      if (ultima.indexOf(i) >= 0) cls += ' ultima';
      if (ultimasComidas.indexOf(i) >= 0) cls += ' comeu';
      if (aJogar && i === atual) cls += ' escolhida';
      else if (origens.indexOf(i) >= 0) cls += obrig ? ' obrigatoria' : ' movel';
      const destino = destinos.indexOf(i) >= 0;
      if (destino) cls += obrig ? ' destino come' : ' destino';
      if (alvos.indexOf(i) >= 0) cls += ' alvo';
      b.className = cls;
      limpar(b);
      if (p) {
        const peca = el('span', { class: `tab-d-peca ${p > 0 ? 'branca' : 'preta'}${Math.abs(p) === 2 ? ' dama' : ''}${fantasmas.indexOf(i) >= 0 ? ' comida' : ''}` });
        if (Math.abs(p) === 2) peca.append(coroa());
        b.append(peca);
      }
      b.setAttribute('aria-label', rotuloCasa(i, p, destino));
    });
    limpar(infoMinhas).append(el('i', { class: 'tab-mini branca', 'aria-hidden': 'true' }), `Você: ${contarPecas(1)}`);
    limpar(infoDele).append(el('i', { class: 'tab-mini preta', 'aria-hidden': 'true' }), `Computador: ${contarPecas(-1)}`);
    notaEmpate.hidden = semCapturas < 20 || acabou;
    notaEmpate.textContent = `Jogadas sem ninguém comer: ${semCapturas} de ${SEM_CAPTURAS} (às ${SEM_CAPTURAS} é empate).`;
  }

  function suaVez(ops, extra) {
    opcoes = ops;
    aJogar = true;
    caminho = [];
    vista = null;
    sel = null;
    const origens = [];
    ops.forEach(m => { if (origens.indexOf(m.de) < 0) origens.push(m.de); });
    if (origens.length === 1) sel = origens[0]; // só uma peça pode jogar: fica já escolhida
    const obrig = ops[0].comidas.length > 0;
    j.dizer('vez', obrig ? `${SUA_VEZ}: é obrigatório comer!` : `${SUA_VEZ}: toque numa peça.`);
    if (extra) aviso(extra);
    desenhar();
  }

  function tocar(i) {
    if (!aJogar || acabou) return;
    const cands = candidatos();
    const seguem = cands.filter(m => m.passos[caminho.length] === i);
    if (seguem.length) {
      caminho.push(i);
      const completa = seguem.filter(m => m.passos.length === caminho.length)[0];
      if (completa) { executar(completa, 1); return; }
      // Ainda pode comer mais: a peça fica a meio do caminho, à espera do próximo toque.
      som.peca();
      vista = vistaParcial(seguem[0], caminho.length);
      j.dizer('vez', '👉 Continue a comer!');
      desenhar();
      return;
    }
    if (caminho.length) { som.quase(); aviso('Ainda pode comer mais! Toque numa das casas marcadas.'); return; }
    if (tab[i] > 0) {
      if (sel === i) { sel = null; som.clique(); desenhar(); return; }
      if (opcoes.some(m => m.de === i)) { sel = i; som.clique(); desenhar(); return; }
      som.quase();
      aviso(opcoes[0].comidas.length
        ? 'É obrigatório comer! Toque numa das peças marcadas a laranja.'
        : 'Essa peça não tem para onde ir. Experimente outra.');
      return;
    }
    if (tab[i] < 0) { aviso('Essa é do computador. As suas peças são as brancas.'); return; }
    if (sel !== null) { som.quase(); aviso('Não pode ir para aí. Toque numa das casas com uma bolinha.'); } else aviso('Primeiro toque numa das suas peças brancas.');
  }

  function executar(mv, cor) {
    if (acabou) return;
    const antes = tab;
    tab = aplicarDamas(tab, mv);
    aJogar = false;
    vista = null;
    sel = null;
    caminho = [];
    ultima = [mv.de].concat(mv.passos);
    ultimasComidas = mv.comidas.slice();
    const n = mv.comidas.length;
    const fimCasa = mv.passos[mv.passos.length - 1];
    const promoveu = Math.abs(antes[mv.de]) === 1 && Math.abs(tab[fimCasa]) === 2;
    if (n) { semCapturas = 0; if (cor === 1) comiPessoa += n; else comiPC += n; } else semCapturas++;
    if (cor === 1 && n) som.certo(); else som.peca();
    desenhar();
    let msg = '';
    if (cor === 1 && promoveu) msg = '👑 A sua peça passou a dama! Agora anda várias casas, para a frente e para trás.';
    else if (cor === 1 && n > 1) msg = `${elogio()} Comeu ${n} peças de uma vez!`;
    else if (cor === -1 && n) msg = `O computador comeu ${n === 1 ? 'uma peça sua' : `${n} peças suas`}.${promoveu ? ' E fez uma dama.' : ''}`;
    else if (cor === -1 && promoveu) msg = 'O computador fez uma dama.';
    const ops = jogadasDamas(tab, -cor);
    if (!ops.length) { fim(cor, contarPecas(-cor) ? 'bloqueado' : 'semPecas'); return; }
    if (semCapturas >= SEM_CAPTURAS) { fim(0, 'empate'); return; }
    if (cor === 1) {
      if (msg) aviso(msg);
      j.computador(() => jogadaDamas(tab, nivel), animar);
    } else suaVez(ops, msg);
  }

  // As capturas múltiplas do computador mostram-se passo a passo, para a pessoa perceber o que aconteceu.
  function animar(mv) {
    if (acabou) return;
    const n = mv.passos.length;
    let k = 1;
    const passo = () => {
      if (acabou) return;
      if (k < n) {
        vista = vistaParcial(mv, k);
        ultima = [mv.de].concat(mv.passos.slice(0, k));
        ultimasComidas = [];
        som.peca();
        desenhar();
        k++;
        j.depois(passo, 450);
      } else executar(mv, -1);
    };
    passo();
  }

  function desistir() {
    if (acabou) return;
    if (!confirmar) {
      confirmar = true;
      btnDesistir.textContent = 'Tem a certeza? Toque outra vez';
      btnDesistir.classList.add('confirmar');
      tConfirmar = j.depois(() => {
        confirmar = false;
        btnDesistir.textContent = '🏳️ Desistir';
        btnDesistir.classList.remove('confirmar');
      }, 4000);
      return;
    }
    clearTimeout(tConfirmar);
    fim(-1, 'desistiu');
  }

  function fim(quem, motivo) {
    if (acabou) return;
    acabou = true;
    aJogar = false;
    sel = null;
    caminho = [];
    vista = null;
    btnDesistir.disabled = true;
    desenhar();
    let estrelas;
    let titulo;
    if (quem === 1) {
      estrelas = 3;
      titulo = 'Ganhou! 🎉';
      contar('damas', 'ganhos');
      som.vitoria();
      festa(['👑', '⭐', '🎉', '✨']);
      j.avisoFinal(`${elogio()} Ganhou às damas!`);
      j.dizer('bom', motivo === 'bloqueado' ? '🎉 Ganhou! O computador ficou sem jogadas.' : '🎉 Ganhou! Comeu as peças todas.', true);
    } else if (quem === 0) {
      estrelas = 2;
      titulo = 'Empate 🤝';
      contar('damas', 'empates');
      som.certo();
      j.avisoFinal('Empate! Foi um jogo renhido.');
      j.dizer('info', '🤝 Empate: 40 jogadas sem capturas.', true);
    } else {
      estrelas = 1;
      titulo = motivo === 'desistiu' ? 'Desistiu desta vez' : 'Desta vez ganhou o computador';
      contar('damas', 'perdidos');
      som.quase();
      j.avisoFinal(consolo(), motivo === 'desistiu' ? 1500 : FIM);
      j.dizer('quase', motivo === 'desistiu' ? 'Desistiu. Fica para a próxima!'
        : motivo === 'bloqueado' ? 'Ficou sem jogadas: ganhou o computador.' : 'O computador comeu as suas peças todas.', true);
    }
    const r = registo('damas');
    j.depois(() => aoTerminar({
      estrelas,
      titulo,
      numeros: [
        { valor: String(comiPessoa), rotulo: comiPessoa === 1 ? 'peça que comeu' : 'peças que comeu' },
        { valor: String(comiPC), rotulo: comiPC === 1 ? 'peça que perdeu' : 'peças que perdeu' },
        { valor: `${r.ganhos} – ${r.perdidos}`, rotulo: 'vitórias suas – do computador' },
      ],
      recorde: false,
    }), motivo === 'desistiu' ? 1500 : FIM);
  }

  suaVez(jogadasDamas(tab, 1));
  return () => j.fechar();
}
