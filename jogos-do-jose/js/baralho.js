// Desenho das cartas de jogar com aspeto tradicional: índices nos cantos, naipes distribuídos
// como nas cartas verdadeiras e figuras (Rei, Dama, Valete) de dupla cabeça.
import { el, dados } from './util.js';

export const NAIPES = ['♥', '♦', '♣', '♠'];
export const NOMES_NAIPES = ['copas', 'ouros', 'paus', 'espadas'];
export const NOMES = ['Ás', 'Dois', 'Três', 'Quatro', 'Cinco', 'Seis', 'Sete', 'Oito', 'Nove', 'Dez', 'Valete', 'Dama', 'Rei'];
export const vermelho = s => s < 2;

export function letra(r) {
  if (r === 1) return 'A';
  if (r <= 10) return String(r);
  return (dados.def.letras === 'pt' ? ['V', 'D', 'R'] : ['J', 'Q', 'K'])[r - 11];
}

// Posições dos naipes (0–100 dentro da zona central), como nas cartas reais.
const PIPS = {
  1: [[50, 50]],
  2: [[50, 0], [50, 100]],
  3: [[50, 0], [50, 50], [50, 100]],
  4: [[0, 0], [100, 0], [0, 100], [100, 100]],
  5: [[0, 0], [100, 0], [50, 50], [0, 100], [100, 100]],
  6: [[0, 0], [100, 0], [0, 50], [100, 50], [0, 100], [100, 100]],
  7: [[0, 0], [100, 0], [50, 25], [0, 50], [100, 50], [0, 100], [100, 100]],
  8: [[0, 0], [100, 0], [50, 25], [0, 50], [100, 50], [50, 75], [0, 100], [100, 100]],
  9: [[0, 0], [100, 0], [0, 33.3], [100, 33.3], [50, 50], [0, 66.7], [100, 66.7], [0, 100], [100, 100]],
  10: [[0, 0], [100, 0], [50, 16.7], [0, 33.3], [100, 33.3], [0, 66.7], [100, 66.7], [50, 83.3], [0, 100], [100, 100]],
};

const NS = 'http://www.w3.org/2000/svg';
function s(tag, attrs) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
}

// Meia figura (a outra metade é a mesma rodada 180°, como nas cartas antigas).
function meiaFigura(r, naipe) {
  const verm = vermelho(naipe);
  const manto = verm ? '#c62828' : '#1f4fa8';
  const outro = verm ? '#1f4fa8' : '#c62828';
  const ouro = '#e5a913';
  const pele = '#f6d3ad';
  const g = s('g', {});
  // manto e ombros
  g.append(s('path', { d: 'M4 42 L8 30 Q16 25 24 25 L36 25 Q44 25 52 30 L56 42 Z', fill: manto, stroke: '#111', 'stroke-width': 0.8 }));
  g.append(s('path', { d: 'M24 25 L30 42 L36 25 Z', fill: ouro, stroke: '#111', 'stroke-width': 0.6 }));
  g.append(s('path', { d: 'M8 33 Q16 30 22 31 L20 42 L6 42 Z', fill: outro, stroke: '#111', 'stroke-width': 0.6 }));
  g.append(s('path', { d: 'M52 33 Q44 30 38 31 L40 42 L54 42 Z', fill: outro, stroke: '#111', 'stroke-width': 0.6 }));
  // cabeça
  g.append(s('circle', { cx: 30, cy: 17, r: 7.5, fill: pele, stroke: '#111', 'stroke-width': 0.8 }));
  g.append(s('circle', { cx: 27.2, cy: 16.5, r: 0.9, fill: '#111' }));
  g.append(s('circle', { cx: 32.8, cy: 16.5, r: 0.9, fill: '#111' }));
  if (r === 13) {
    // Rei: coroa grande e barba
    g.append(s('path', { d: 'M21 11 L22 3 L25.5 8 L30 1.5 L34.5 8 L38 3 L39 11 Z', fill: ouro, stroke: '#111', 'stroke-width': 0.8 }));
    g.append(s('path', { d: 'M23 19 Q30 31 37 19 Q34 22.5 30 22.5 Q26 22.5 23 19 Z', fill: '#8a5a2b', stroke: '#111', 'stroke-width': 0.6 }));
  } else if (r === 12) {
    // Dama: coroa pequena, cabelo e uma flor
    g.append(s('path', { d: 'M22.5 15 Q21 24 25 26 L24 14 Z M37.5 15 Q39 24 35 26 L36 14 Z', fill: '#e0b040', stroke: '#111', 'stroke-width': 0.5 }));
    g.append(s('path', { d: 'M23 10.5 L24 5 L27 8.5 L30 4 L33 8.5 L36 5 L37 10.5 Z', fill: ouro, stroke: '#111', 'stroke-width': 0.8 }));
    g.append(s('circle', { cx: 46, cy: 29, r: 3, fill: '#d81b60', stroke: '#111', 'stroke-width': 0.5 }));
    g.append(s('path', { d: 'M28.5 20.5 Q30 21.8 31.5 20.5', fill: 'none', stroke: '#b71c1c', 'stroke-width': 0.8 }));
  } else {
    // Valete: chapéu com pena e bigode
    g.append(s('path', { d: 'M20 11.5 Q30 2 40 11.5 Z', fill: outro, stroke: '#111', 'stroke-width': 0.8 }));
    g.append(s('path', { d: 'M38 9 Q47 2 50 9 Q44 7 39 11 Z', fill: ouro, stroke: '#111', 'stroke-width': 0.6 }));
    g.append(s('path', { d: 'M26.5 20 Q30 18.5 33.5 20', fill: 'none', stroke: '#5d3a1a', 'stroke-width': 1.2 }));
  }
  return g;
}

function figuraSVG(r, naipe) {
  const svg = s('svg', { viewBox: '8 0 44 84', 'aria-hidden': 'true', preserveAspectRatio: 'xMidYMid slice' });
  svg.append(s('rect', { x: 0, y: 0, width: 60, height: 84, fill: '#fffaf0' }));
  const cima = meiaFigura(r, naipe);
  const baixo = meiaFigura(r, naipe);
  baixo.setAttribute('transform', 'rotate(180 30 42)');
  svg.append(cima, baixo);
  svg.append(s('line', { x1: 2, y1: 42, x2: 58, y2: 42, stroke: '#111', 'stroke-width': 0.6 }));
  const t1 = s('text', { x: 11, y: 10, 'font-size': 9, fill: vermelho(naipe) ? '#c62828' : '#111', 'font-family': 'serif' });
  t1.textContent = NAIPES[naipe];
  const t2 = s('text', { x: 49, y: 77, 'font-size': 9, fill: vermelho(naipe) ? '#c62828' : '#111', 'font-family': 'serif', transform: 'rotate(180 49 74)' });
  t2.textContent = NAIPES[naipe];
  svg.append(t1, t2);
  return svg;
}

/** Devolve os elementos da face de uma carta (para pôr dentro de um .carta). */
export function faceCarta(r, naipe) {
  const n = NAIPES[naipe];
  const partes = [
    el('div', { class: 'indice' }, el('b', {}, letra(r)), el('i', {}, n)),
    el('div', { class: 'naipe-canto' }, n),
    el('div', { class: 'indice baixo' }, el('b', {}, letra(r)), el('i', {}, n)),
  ];
  if (r > 10) {
    partes.push(el('div', { class: 'figura-trad' }, figuraSVG(r, naipe)));
  } else {
    for (const [x, y] of PIPS[r]) {
      partes.push(el('span', {
        class: `pip${r === 1 ? ' as' : ''}${y > 50 ? ' inv' : ''}`,
        style: { left: `${36 + x * 0.28}%`, top: `${29 + y * 0.42}%` },
      }, n));
    }
  }
  return partes;
}

/** Carta solta (fora da mesa da paciência), com largura em píxeis. */
export function cartaSolta(c, largura = 140) {
  if (!c) {
    const e = el('div', { class: 'carta solta costas', 'aria-label': 'Carta virada para baixo' });
    e.style.setProperty('--cw', `${largura}px`);
    e.style.setProperty('--ch', `${Math.round(largura * 1.4)}px`);
    return e;
  }
  const e = el('div', {
    class: `carta solta ${vermelho(c.s) ? 'vermelha' : 'preta'}`,
    'aria-label': `${NOMES[c.r - 1]} de ${NOMES_NAIPES[c.s]}`,
  }, faceCarta(c.r, c.s));
  e.style.setProperty('--cw', `${largura}px`);
  e.style.setProperty('--ch', `${Math.round(largura * 1.4)}px`);
  return e;
}
