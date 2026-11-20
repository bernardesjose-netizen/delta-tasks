// Gráfico de linha simples (SVG) para mostrar a evolução ao longo dos dias.
import { el } from './util.js';

const NS = 'http://www.w3.org/2000/svg';
function s(tag, attrs, texto) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (texto != null) n.textContent = texto;
  return n;
}
const dataCurta = iso => { const [, m, d] = iso.split('-'); return `${d}/${m}`; };

/**
 * pontos: [{ d: 'aaaa-mm-dd', v: número }]
 * menorMelhor: true quando um valor mais baixo é melhor (tempos, idade da cabeça).
 */
export function graficoLinha(pontos, { titulo, formatar = v => String(v), menorMelhor = false } = {}) {
  const fig = el('figure', { class: 'grafico' }, titulo ? el('figcaption', {}, titulo) : null);
  const dados = (pontos || []).slice(-30);
  if (dados.length < 2) {
    fig.append(el('p', { class: 'grafico-vazio' }, dados.length ? `Até agora: ${formatar(dados[0].v)}. Jogue noutros dias para ver a evolução.` : 'Ainda sem resultados. Jogue para ver a evolução aqui.'));
    return fig;
  }
  const W = 600;
  const H = 230;
  const m = { e: 104, d: 20, c: 16, b: 34 };
  const vs = dados.map(p => p.v);
  let min = Math.min(...vs);
  let max = Math.max(...vs);
  if (min === max) { min -= 1; max += 1; }
  const folga = (max - min) * 0.12;
  min -= folga;
  max += folga;
  const x = i => m.e + (i / (dados.length - 1)) * (W - m.e - m.d);
  // Quando mais baixo é melhor, o eixo fica invertido: melhorar é sempre «subir».
  const y = v => {
    const t = (v - min) / (max - min);
    return m.c + (menorMelhor ? t : 1 - t) * (H - m.c - m.b);
  };
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `${titulo || 'Evolução'}: de ${formatar(vs[0])} para ${formatar(vs[vs.length - 1])}` });
  for (let k = 0; k <= 3; k++) {
    const yy = m.c + (k / 3) * (H - m.c - m.b);
    svg.append(s('line', { x1: m.e, y1: yy, x2: W - m.d, y2: yy, stroke: '#cfe3d4', 'stroke-width': 1 }));
  }
  const melhorV = menorMelhor ? Math.min(...vs) : Math.max(...vs);
  const piorV = menorMelhor ? Math.max(...vs) : Math.min(...vs);
  svg.append(s('text', { x: m.e - 8, y: y(melhorV) + 6, 'text-anchor': 'end', 'font-size': 17, fill: '#1a7f45', 'font-weight': 700 }, formatar(melhorV)));
  svg.append(s('text', { x: m.e - 8, y: y(piorV) + 6, 'text-anchor': 'end', 'font-size': 17, fill: '#3d5446' }, formatar(piorV)));
  const area = dados.map((p, i) => `${x(i)},${y(p.v)}`).join(' ');
  svg.append(s('polygon', { points: `${x(0)},${H - m.b} ${area} ${x(dados.length - 1)},${H - m.b}`, fill: 'rgba(26,127,69,.12)' }));
  svg.append(s('polyline', { points: area, fill: 'none', stroke: '#1a7f45', 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
  dados.forEach((p, i) => {
    const ehMelhor = p.v === melhorV;
    svg.append(s('circle', { cx: x(i), cy: y(p.v), r: ehMelhor ? 8 : 5, fill: ehMelhor ? '#f2b705' : '#1a7f45', stroke: '#fff', 'stroke-width': 2 }));
  });
  svg.append(s('text', { x: x(0), y: H - 8, 'text-anchor': 'start', 'font-size': 16, fill: '#3d5446' }, dataCurta(dados[0].d)));
  svg.append(s('text', { x: x(dados.length - 1), y: H - 8, 'text-anchor': 'end', 'font-size': 16, fill: '#3d5446' }, dataCurta(dados[dados.length - 1].d)));
  fig.append(svg, el('p', { class: 'grafico-nota' }, `Último: ${formatar(vs[vs.length - 1])} · Melhor: ${formatar(melhorV)} ⭐${menorMelhor ? ' (quanto mais alto no gráfico, melhor)' : ''}`));
  return fig;
}
