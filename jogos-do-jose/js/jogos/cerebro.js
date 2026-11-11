// Treino da cabeça: jogos de perguntas (contas, sequências, relógio, mercado, contar, cultura geral, provérbios, adivinhas, intruso).
import { el, inteiro, escolher, baralhar, amostra, euros, escolherNaoVistos } from '../util.js';
import { rondaEscolha, rondaTeclado } from '../motor.js';

const N = curto => (curto ? 5 : 10);

function unicos(gerar, n, chave = q => q.chave) {
  const vistos = new Set();
  const lista = [];
  let tentativas = 0;
  while (lista.length < n && tentativas++ < 500) {
    const q = gerar();
    const k = chave(q);
    if (vistos.has(k)) continue;
    vistos.add(k);
    lista.push(q);
  }
  return lista;
}

function opcoesNumericas(certa, candidatos, n = 4, formatar = String) {
  const set = new Set([certa]);
  for (const c of baralhar(candidatos)) {
    if (set.size >= n) break;
    if (c >= 0 && c !== certa) set.add(c);
  }
  let extra = 1;
  while (set.size < n) { set.add(certa + extra); extra++; }
  return [...set].sort((a, b) => a - b).map(formatar);
}

/* ---------- Contas ---------- */
const SIMBOLO = { '+': '+', '-': '−', 'x': '×', ':': '÷' };
const LER = { '+': 'mais', '-': 'menos', 'x': 'vezes', ':': 'a dividir por' };

function gerarConta(nivel) {
  let a, b, op;
  const r = Math.random();
  if (nivel === 1) {
    if (r < 0.55) { op = '+'; a = inteiro(1, 10); b = inteiro(1, 10); }
    else { op = '-'; a = inteiro(5, 20); b = inteiro(1, Math.min(10, a - 1)); }
  } else if (nivel === 2) {
    if (r < 0.35) { op = '+'; a = inteiro(10, 50); b = inteiro(3, 30); }
    else if (r < 0.65) { op = '-'; a = inteiro(20, 60); b = inteiro(3, a - 5); }
    else { op = 'x'; a = escolher([2, 3, 4, 5, 10]); b = inteiro(2, 10); }
  } else if (r < 0.25) { op = '+'; a = inteiro(25, 99); b = inteiro(12, 99); }
  else if (r < 0.5) { op = '-'; a = inteiro(40, 120); b = inteiro(12, a - 10); }
  else if (r < 0.8) { op = 'x'; a = inteiro(3, 9); b = inteiro(3, 9); }
  else { op = ':'; b = inteiro(2, 9); a = b * inteiro(2, 10); }
  const resposta = op === '+' ? a + b : op === '-' ? a - b : op === 'x' ? a * b : a / b;
  return {
    chave: `${a}${op}${b}`,
    etiqueta: 'Quanto é?',
    enunciado: `${a} ${SIMBOLO[op]} ${b} = ?`,
    ler: `Quanto é ${a} ${LER[op]} ${b}?`,
    resposta,
  };
}

export function contas(alvo, { nivel, curto, aoTerminar }) {
  return rondaTeclado(alvo, { perguntas: unicos(() => gerarConta(nivel), N(curto)), aoTerminar });
}

/* ---------- Sequências ---------- */
function gerarSequencia(nivel) {
  let termos;
  let passoErro;
  const tipo = Math.random();
  if (nivel === 1) {
    const passo = escolher([1, 2, 2, 5, 10, 3]);
    if (tipo < 0.75) {
      const ini = inteiro(1, 12) * (passo >= 5 ? passo : 1);
      termos = [0, 1, 2, 3, 4].map(k => ini + k * passo);
    } else {
      const ini = inteiro(15, 30);
      const p = escolher([1, 2]);
      termos = [0, 1, 2, 3, 4].map(k => ini - k * p);
    }
    passoErro = passo;
  } else if (nivel === 2) {
    if (tipo < 0.55) {
      const passo = escolher([3, 4, 6, 7, 9, 11, 15, 25]);
      const ini = inteiro(1, 20);
      termos = [0, 1, 2, 3, 4].map(k => ini + k * passo);
      passoErro = passo;
    } else if (tipo < 0.8) {
      const passo = escolher([3, 4, 5]);
      const ini = inteiro(30, 60);
      termos = [0, 1, 2, 3, 4].map(k => ini - k * passo);
      passoErro = passo;
    } else {
      const ini = escolher([1, 2, 3, 5]);
      termos = [0, 1, 2, 3, 4].map(k => ini * 2 ** k);
      passoErro = termos[3];
    }
  } else if (tipo < 0.35) {
    // diferenças crescentes: +1, +2, +3, +4
    const ini = inteiro(1, 10);
    termos = [ini];
    for (let k = 1; k <= 4; k++) termos.push(termos[k - 1] + k + (tipo < 0.17 ? k : 0));
    passoErro = termos[4] - termos[3];
  } else if (tipo < 0.6) {
    const f = escolher([2, 3]);
    const ini = f === 3 ? escolher([1, 2]) : escolher([1, 3, 5, 6]);
    termos = [0, 1, 2, 3, 4].map(k => ini * f ** k);
    passoErro = termos[3];
  } else if (tipo < 0.8) {
    // alternada: +a, +b, +a, +b
    const a = inteiro(2, 5);
    const b = inteiro(1, 3) * 5;
    const ini = inteiro(1, 10);
    termos = [ini];
    for (let k = 1; k <= 4; k++) termos.push(termos[k - 1] + (k % 2 ? a : b));
    passoErro = a;
  } else {
    const passo = escolher([12, 15, 19, 21, 25, 50]);
    const ini = inteiro(5, 40);
    termos = [0, 1, 2, 3, 4].map(k => ini + k * passo);
    passoErro = passo;
  }
  const certa = termos[4];
  const opcoes = opcoesNumericas(certa, [certa + 1, certa - 1, certa + passoErro, certa - passoErro, certa + 2, certa + 10, certa - 10]);
  return {
    chave: termos.join(','),
    etiqueta: 'Qual é o número seguinte?',
    enunciado: el('div', {},
      el('div', { class: 'sequencia' }, ...termos.slice(0, 4).map(t => el('span', {}, t)), el('span', { class: 'falta' }, '?'))),
    ler: `Qual é o número que vem a seguir: ${termos.slice(0, 4).join(', ')}?`,
    centrado: true,
    opcoes,
    certa: String(certa),
    manterOrdem: true,
    explicacao: `A sequência completa é ${termos.join(', ')}.`,
  };
}

export function sequencias(alvo, { nivel, curto, aoTerminar }) {
  return rondaEscolha(alvo, { perguntas: unicos(() => gerarSequencia(nivel), N(curto)), aoTerminar });
}

/* ---------- Que horas são? ---------- */
const NS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs, ...filhos) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  n.append(...filhos);
  return n;
}
export function relogioSVG(h, m) {
  const s = svg('svg', { viewBox: '0 0 200 200', class: 'relogio', role: 'img', 'aria-label': 'Relógio de ponteiros' });
  s.append(svg('circle', { cx: 100, cy: 100, r: 94, fill: '#fffdf8', stroke: '#1d2633', 'stroke-width': 6 }));
  for (let k = 0; k < 60; k++) {
    const a = (k * 6 * Math.PI) / 180;
    const grande = k % 5 === 0;
    const r1 = grande ? 80 : 85;
    s.append(svg('line', {
      x1: 100 + r1 * Math.sin(a), y1: 100 - r1 * Math.cos(a), x2: 100 + 89 * Math.sin(a), y2: 100 - 89 * Math.cos(a),
      stroke: '#1d2633', 'stroke-width': grande ? 3 : 1, 'stroke-linecap': 'round',
    }));
  }
  for (let k = 1; k <= 12; k++) {
    const a = (k * 30 * Math.PI) / 180;
    const t = svg('text', {
      x: 100 + 66 * Math.sin(a), y: 100 - 66 * Math.cos(a) + 7, 'text-anchor': 'middle',
      'font-size': 20, 'font-weight': 800, fill: '#1d2633', 'font-family': 'system-ui, sans-serif',
    });
    t.textContent = k;
    s.append(t);
  }
  const ah = (((h % 12) + m / 60) * 30 * Math.PI) / 180;
  const am = (m * 6 * Math.PI) / 180;
  s.append(svg('line', { x1: 100, y1: 100, x2: 100 + 44 * Math.sin(ah), y2: 100 - 44 * Math.cos(ah), stroke: '#1d2633', 'stroke-width': 9, 'stroke-linecap': 'round' }));
  s.append(svg('line', { x1: 100, y1: 100, x2: 100 + 72 * Math.sin(am), y2: 100 - 72 * Math.cos(am), stroke: '#e8590c', 'stroke-width': 5, 'stroke-linecap': 'round' }));
  s.append(svg('circle', { cx: 100, cy: 100, r: 7, fill: '#1d2633' }));
  return s;
}
const hora = (h, m) => `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}`;
const POR_EXTENSO = ['doze', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze'];
function horaFalada(h, m) {
  const hh = POR_EXTENSO[h % 12 || 12];
  if (m === 0) return `${hh} em ponto`;
  if (m === 30) return `${hh} e meia`;
  if (m === 15) return `${hh} e um quarto`;
  if (m === 45) return `um quarto para as ${POR_EXTENSO[(h % 12) + 1]}`;
  return `${hh} e ${m} minutos`;
}

function gerarHora(nivel) {
  const h = inteiro(1, 12);
  const m = nivel === 1 ? escolher([0, 30]) : nivel === 2 ? escolher([0, 15, 30, 45]) : escolher([5, 10, 20, 25, 35, 40, 50, 55, 15, 45]);
  const certa = hora(h, m);
  const cand = new Set();
  const troca = m / 5;
  if (troca >= 1 && troca <= 12 && troca !== h) cand.add(hora(troca, (h % 12) * 5));
  cand.add(hora(h + 1, m));
  cand.add(hora(h === 1 ? 12 : h - 1, m));
  cand.add(hora(h, (m + 30) % 60));
  if (nivel > 1) { cand.add(hora(h, (m + 15) % 60)); cand.add(hora(h, (m + 45) % 60)); }
  if (nivel > 2) { cand.add(hora(h, (m + 5) % 60)); cand.add(hora(h, (m + 55) % 60)); }
  cand.delete(certa);
  const opcoes = [certa, ...amostra([...cand], 3)];
  return {
    chave: certa,
    etiqueta: 'Que horas são?',
    enunciado: el('div', {}, el('div', { class: 'centrado' }, 'Que horas marca este relógio?'), relogioSVG(h, m)),
    ler: 'Que horas marca este relógio?',
    centrado: true,
    opcoes,
    certa,
    explicacao: `São ${horaFalada(h, m)}. O ponteiro pequeno marca as horas; o grande, laranja, marca os minutos.`,
  };
}

export function relogio(alvo, { nivel, curto, aoTerminar }) {
  return rondaEscolha(alvo, { perguntas: unicos(() => gerarHora(nivel), N(curto)), aoTerminar });
}

/* ---------- Contas do mercado ---------- */
// Preços inventados, só para o jogo (valores em cêntimos).
const PRODUTOS = [
  ['🍞', 'um saco de pão', [120, 250]], ['🥛', 'um litro de leite', [80, 120]], ['☕', 'um café', [60, 90]],
  ['🍉', 'uma melancia', [200, 500]], ['🧀', 'um queijo', [250, 600]], ['🐟', 'um quilo de carapau', [300, 700]],
  ['🍊', 'um quilo de laranjas', [100, 250]], ['📰', 'o jornal', [100, 200]], ['🥚', 'uma dúzia de ovos', [200, 350]],
  ['🫒', 'um frasco de azeitonas', [150, 300]], ['🍫', 'uma tablete de chocolate', [100, 250]], ['🥖', 'uma broa', [150, 300]],
  ['🍷', 'uma garrafa de vinho', [300, 900]], ['💐', 'um ramo de flores', [400, 1000]], ['🎫', 'um bilhete de autocarro', [150, 200]],
  ['🍦', 'um gelado', [150, 300]], ['🥐', 'um pastel de nata', [100, 150]], ['🍅', 'um quilo de tomate', [150, 300]],
  ['🥔', 'um saco de batatas', [200, 450]], ['🧴', 'um frasco de champô', [250, 500]],
];

function precoAleatorio([min, max], passo) {
  const a = Math.ceil(min / passo);
  const b = Math.floor(max / passo);
  return Math.max(1, inteiro(a, Math.max(a, b))) * passo;
}

function gerarMercado(nivel) {
  const [emoji, nome, faixa] = escolher(PRODUTOS);
  let texto;
  let certa;
  let explicacao;
  const e = c => euros(c / 100);
  const notaPara = v => (v < 500 ? 500 : v < 1000 ? 1000 : 2000);
  const desvios = [10, 50, 100, -10, -50, -100, 20, -20, 200, -200];
  if (nivel === 1) {
    const preco = precoAleatorio(faixa, 100);
    const nota = notaPara(preco);
    certa = nota - preco;
    texto = `Comprou ${emoji} ${nome} por ${e(preco)} e pagou com uma nota de ${nota / 100} €. Quanto recebe de troco?`;
    explicacao = `${e(nota)} − ${e(preco)} = ${e(certa)}`;
    desvios.splice(0, desvios.length, 100, -100, 200, -200, 300);
  } else if (nivel === 2) {
    if (Math.random() < 0.6) {
      const preco = precoAleatorio(faixa, 10);
      const nota = notaPara(preco);
      certa = nota - preco;
      texto = `Comprou ${emoji} ${nome} por ${e(preco)} e pagou com uma nota de ${nota / 100} €. Quanto recebe de troco?`;
      explicacao = `${e(nota)} − ${e(preco)} = ${e(certa)}`;
    } else {
      const preco = precoAleatorio(faixa, 10);
      const qt = inteiro(2, 4);
      certa = preco * qt;
      texto = `Cada ${nome.replace(/^(um|uma|o) /, '')} ${emoji} custa ${e(preco)}. Quanto custam ${qt}?`;
      explicacao = `${qt} × ${e(preco)} = ${e(certa)}`;
    }
  } else {
    let [e2, n2, f2] = escolher(PRODUTOS);
    while (n2 === nome) [e2, n2, f2] = escolher(PRODUTOS);
    const p1 = precoAleatorio(faixa, 10);
    const p2 = precoAleatorio(f2, 10);
    const soma = p1 + p2;
    const nota = notaPara(soma);
    certa = nota - soma;
    texto = `Comprou ${emoji} ${nome} (${e(p1)}) e ${e2} ${n2} (${e(p2)}). Pagou com ${nota / 100} €. Quanto recebe de troco?`;
    explicacao = `${e(p1)} + ${e(p2)} = ${e(soma)}. Depois, ${e(nota)} − ${e(soma)} = ${e(certa)}`;
  }
  const ler = texto.replace(/€/g, 'euros');
  const opcoes = opcoesNumericas(certa, desvios.map(d => certa + d), 4, v => euros(v / 100));
  return {
    chave: texto,
    etiqueta: 'No mercado',
    enunciado: texto,
    ler,
    opcoes,
    certa: euros(certa / 100),
    manterOrdem: true,
    explicacao: `A conta: ${explicacao}.`,
  };
}

export function mercado(alvo, { nivel, curto, aoTerminar }) {
  return rondaEscolha(alvo, { perguntas: unicos(() => gerarMercado(nivel), N(curto)), aoTerminar });
}

/* ---------- Quantos são? ---------- */
const COISAS = [
  ['🍎', 'maçãs', 'Quantas'], ['🐟', 'peixes', 'Quantos'], ['⭐', 'estrelas', 'Quantas'], ['🌻', 'girassóis', 'Quantos'],
  ['🐱', 'gatos', 'Quantos'], ['🚗', 'carros', 'Quantos'], ['🎈', 'balões', 'Quantos'], ['🍌', 'bananas', 'Quantas'],
  ['🐔', 'galinhas', 'Quantas'], ['⚽', 'bolas', 'Quantas'], ['🌳', 'árvores', 'Quantas'], ['🐶', 'cães', 'Quantos'],
  ['🦋', 'borboletas', 'Quantas'], ['🎁', 'presentes', 'Quantos'], ['🍓', 'morangos', 'Quantos'], ['🐑', 'ovelhas', 'Quantas'],
  ['🌷', 'túlipas', 'Quantas'], ['🚲', 'bicicletas', 'Quantas'], ['🐢', 'tartarugas', 'Quantas'], ['🍋', 'limões', 'Quantos'],
];

function gerarContar(nivel) {
  const [lado, alvoMin, alvoMax, tiposDistr, distrMin, distrMax] = nivel === 1
    ? [4, 3, 7, 1, 2, 4] : nivel === 2 ? [5, 6, 11, 2, 3, 7] : [6, 9, 15, 3, 6, 12];
  const [alvoE, nome, quantos] = escolher(COISAS);
  const outros = amostra(COISAS.filter(c => c[0] !== alvoE), tiposDistr).map(c => c[0]);
  const n = inteiro(alvoMin, alvoMax);
  const nd = inteiro(distrMin, distrMax);
  const total = lado * lado;
  const celulas = Array(total).fill('');
  const livres = baralhar([...Array(total).keys()]);
  for (let k = 0; k < n; k++) celulas[livres[k]] = alvoE;
  for (let k = n; k < Math.min(total, n + nd); k++) celulas[livres[k]] = escolher(outros);
  const campo = el('div', { class: 'campo-contar', style: { gridTemplateColumns: `repeat(${lado}, auto)` } },
    ...celulas.map(c => el('span', { 'aria-hidden': 'true' }, c)));
  const pergunta = `${quantos} ${nome} ${alvoE} consegue contar?`;
  return {
    chave: celulas.join(''),
    etiqueta: 'Conte com calma',
    enunciado: el('div', {}, el('div', { class: 'centrado' }, pergunta), campo),
    ler: `${quantos} ${nome} consegue contar?`,
    centrado: true,
    opcoes: opcoesNumericas(n, [n - 1, n + 1, n - 2, n + 2, n + 3]),
    certa: String(n),
    manterOrdem: true,
    explicacao: `Eram ${n} ${nome}.`,
  };
}

export function contar(alvo, { nivel, curto, aoTerminar }) {
  return rondaEscolha(alvo, { perguntas: unicos(() => gerarContar(nivel), N(curto)), aoTerminar });
}

/* ---------- Jogos com banco de conteúdos ---------- */
export async function quiz(alvo, { nivel, curto, aoTerminar }) {
  const { PERGUNTAS } = await import('../dados/perguntas.js');
  const lista = PERGUNTAS.filter(q => q.n === nivel);
  const escolhidas = escolherNaoVistos(`quiz${nivel}`, lista, N(curto), q => `${q.p}|${q.certa}`);
  const perguntas = escolhidas.map(q => ({
    etiqueta: q.cat,
    enunciado: q.p,
    opcoes: [q.certa, ...(nivel === 1 ? amostra(q.erradas, 2) : q.erradas)],
    certa: q.certa,
    explicacao: q.info,
  }));
  return rondaEscolha(alvo, { perguntas, aoTerminar });
}

export async function proverbios(alvo, { nivel, curto, aoTerminar }) {
  const { PROVERBIOS } = await import('../dados/conteudos.js');
  const lista = PROVERBIOS.filter(q => q.n === nivel);
  const escolhidas = escolherNaoVistos(`prov${nivel}`, lista, N(curto), q => q.inicio);
  const perguntas = escolhidas.map(q => ({
    etiqueta: 'Complete o provérbio',
    enunciado: `«${q.inicio}…»`,
    ler: `Complete o provérbio: ${q.inicio}…`,
    opcoes: [q.certa, ...(nivel === 1 ? amostra(q.erradas, 2) : q.erradas)],
    certa: q.certa,
    explicacao: `«${q.inicio} ${q.certa}.»`,
  }));
  return rondaEscolha(alvo, { perguntas, aoTerminar, duasColunas: false });
}

export async function adivinhas(alvo, { nivel, curto, aoTerminar }) {
  const { ADIVINHAS } = await import('../dados/conteudos.js');
  const lista = ADIVINHAS.filter(q => q.n === nivel);
  const escolhidas = escolherNaoVistos(`adiv${nivel}`, lista, N(curto), q => q.p);
  const perguntas = escolhidas.map(q => ({
    etiqueta: 'Adivinha',
    enunciado: q.p,
    opcoes: [q.certa, ...q.erradas],
    certa: q.certa,
    explicacao: q.info,
  }));
  return rondaEscolha(alvo, { perguntas, aoTerminar });
}

export async function intruso(alvo, { nivel, curto, aoTerminar }) {
  const { INTRUSOS } = await import('../dados/conteudos.js');
  const lista = INTRUSOS.filter(q => q.n === nivel);
  const escolhidas = escolherNaoVistos(`intr${nivel}`, lista, N(curto), q => q.itens.join('|'));
  const perguntas = escolhidas.map(q => ({
    etiqueta: 'Qual é o intruso?',
    enunciado: 'Qual destes não pertence ao grupo?',
    opcoes: q.itens,
    certa: q.intruso,
    explicacao: q.porque,
  }));
  return rondaEscolha(alvo, { perguntas, aoTerminar });
}
