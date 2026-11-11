// Utilitários partilhados: DOM, aleatoriedade, memória (localStorage), som, voz e frases de incentivo.

/* ---------- DOM ---------- */
export function el(tag, attrs = {}, ...filhos) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (v === true) n.setAttribute(k, '');
    else n.setAttribute(k, v);
  }
  for (const f of filhos.flat()) {
    if (f == null || f === false) continue;
    n.append(f instanceof Node ? f : document.createTextNode(String(f)));
  }
  return n;
}

export function limpar(n) { while (n.firstChild) n.removeChild(n.firstChild); return n; }

export function esperar(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ---------- Aleatoriedade ---------- */
export const inteiro = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const escolher = arr => arr[Math.floor(Math.random() * arr.length)];
export function baralhar(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export const amostra = (arr, n) => baralhar(arr).slice(0, n);

// Gerador previsível (mesma semente → mesma sequência), usado no Treino do Dia.
export function geradorSemente(semente) {
  let h = 2166136261;
  for (const c of String(semente)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return function () {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- Datas ---------- */
export function hojeISO(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export function dataPorExtenso(d = new Date()) {
  const dia = DIAS[d.getDay()];
  return `${dia[0].toUpperCase() + dia.slice(1)}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
}
export function duracao(ms) {
  const s = Math.max(1, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (!m) return `${r} s`;
  return `${m} min ${String(r).padStart(2, '0')} s`;
}
export const euros = v => `${v.toFixed(2).replace('.', ',')} €`;
export const semAcentos = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

/* ---------- Memória (fica guardada no aparelho) ---------- */
const CHAVE = 'jogos-do-jose-v1';
const PADRAO = () => ({
  nome: 'José',
  def: { som: true, voz: false, letra: 1 },
  estrelas: 0,
  jogos: {},
  dias: [],
  treinos: [],
  vistos: {},
  pac: { ganhos: { 1: 0, 2: 0, 3: 0 }, jogados: { 1: 0, 2: 0, 3: 0 } },
});

function ler() {
  try {
    const t = localStorage.getItem(CHAVE);
    if (!t) return PADRAO();
    const d = JSON.parse(t);
    const p = PADRAO();
    return { ...p, ...d, def: { ...p.def, ...(d.def || {}) }, pac: { ...p.pac, ...(d.pac || {}) } };
  } catch {
    return PADRAO();
  }
}

export const dados = ler();

export function guardar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch { /* sem espaço ou modo privado: segue sem guardar */ }
}

export function marcarDiaJogado() {
  const h = hojeISO();
  if (!dados.dias.includes(h)) {
    dados.dias.push(h);
    if (dados.dias.length > 400) dados.dias = dados.dias.slice(-400);
    guardar();
  }
}

export function diasSeguidos() {
  const set = new Set(dados.dias);
  let n = 0;
  const d = new Date();
  if (!set.has(hojeISO(d))) d.setDate(d.getDate() - 1); // ainda pode jogar hoje
  while (set.has(hojeISO(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export function registarJogo(id, nivel, estrelas, extra = {}) {
  const j = dados.jogos[id] || (dados.jogos[id] = { vezes: 0, melhor: {}, ultimoNivel: 1 });
  j.vezes++;
  j.ultimoNivel = nivel;
  if (nivel) j.melhor[nivel] = Math.max(j.melhor[nivel] || 0, estrelas);
  Object.assign(j, extra);
  dados.estrelas += estrelas;
  marcarDiaJogado();
  guardar();
}

// Evita repetir as mesmas perguntas: devolve primeiro as que ainda não saíram.
export function escolherNaoVistos(chave, lista, n, idDe = x => x) {
  const vistos = new Set(dados.vistos[chave] || []);
  let novos = lista.filter(x => !vistos.has(idDe(x)));
  if (novos.length < n) {
    dados.vistos[chave] = [];
    novos = lista;
  }
  const escolhidos = amostra(novos, n);
  dados.vistos[chave] = [...(dados.vistos[chave] || []), ...escolhidos.map(idDe)];
  guardar();
  return escolhidos;
}

/* ---------- Som (sintetizado, sem ficheiros) ---------- */
let ctx = null;
function audio() {
  if (!dados.def.som) return null;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}
function nota(freq, inicio, dur, tipo = 'sine', vol = 0.18) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + inicio;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = tipo;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(saida(a));
  o.start(t);
  o.stop(t + dur + 0.05);
}
// Saída com um eco suave, para os sons ficarem mais «redondos».
let mistura = null;
function saida(a) {
  if (mistura && mistura.ctx === a) return mistura.no;
  const entrada = a.createGain();
  const atraso = a.createDelay(1);
  const retorno = a.createGain();
  const filtro = a.createBiquadFilter();
  atraso.delayTime.value = 0.13;
  retorno.gain.value = 0.22;
  filtro.type = 'lowpass';
  filtro.frequency.value = 2600;
  entrada.connect(a.destination);
  entrada.connect(atraso);
  atraso.connect(filtro).connect(retorno).connect(atraso);
  retorno.connect(a.destination);
  mistura = { ctx: a, no: entrada };
  return entrada;
}
// Sino: fundamental + harmónicos que se apagam depressa.
function sino(freq, inicio = 0, vol = 0.16, dur = 0.9) {
  nota(freq, inicio, dur, 'sine', vol);
  nota(freq * 2, inicio, dur * 0.6, 'sine', vol * 0.35);
  nota(freq * 3.01, inicio, dur * 0.35, 'sine', vol * 0.12);
}
// Estalido curto de ruído (cartas a deslizar).
function ruido(inicio, dur, freq, vol) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + inicio;
  const n = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, n, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  f.Q.value = 0.9;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(a.destination);
  src.start(t);
}
export const som = {
  certo() { sino(1046.5, 0, 0.13); sino(1568, 0.09, 0.12, 1.1); },
  quase() { nota(392, 0, 0.18, 'triangle', 0.09); nota(330, 0.12, 0.28, 'triangle', 0.08); },
  clique() { ruido(0, 0.03, 3200, 0.18); },
  carta() { ruido(0, 0.07, 2400, 0.35); nota(880, 0, 0.05, 'triangle', 0.025); },
  par() { sino(784, 0, 0.12); sino(988, 0.07, 0.11); sino(1175, 0.14, 0.11, 1.2); },
  estrela(k = 0) { sino([1046.5, 1318.5, 1568][k] || 1568, 0, 0.14, 1.1); nota(([1046.5, 1318.5, 1568][k] || 1568) * 4, 0.02, 0.25, 'sine', 0.02); },
  vitoria() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => sino(f, i * 0.11, 0.12, 0.7));
    [1318.5, 1568, 2093].forEach((f, i) => sino(f, 0.5 + i * 0.09, 0.09, 1.2));
    nota(261.6, 0.5, 1.4, 'triangle', 0.06);
    nota(392, 0.5, 1.4, 'triangle', 0.05);
  },
};

/* ---------- Voz ---------- */
let vozPT = null;
function escolherVoz() {
  if (!('speechSynthesis' in window)) return;
  const vozes = speechSynthesis.getVoices();
  vozPT = vozes.find(v => /pt[-_]PT/i.test(v.lang)) || vozes.find(v => /^pt/i.test(v.lang)) || null;
}
if ('speechSynthesis' in window) {
  escolherVoz();
  speechSynthesis.addEventListener?.('voiceschanged', escolherVoz);
}
export const vozDisponivel = () => 'speechSynthesis' in window;
export function falar(texto) {
  if (!vozDisponivel() || !texto) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'pt-PT';
    if (vozPT) u.voice = vozPT;
    u.rate = 0.92;
    speechSynthesis.speak(u);
  } catch { /* sem voz neste aparelho */ }
}
export function calar() { try { speechSynthesis.cancel(); } catch { /* nada */ } }

/* ---------- Frases de incentivo ---------- */
const ELOGIOS = [
  'Muito bem!', 'Excelente!', 'Isso mesmo!', 'Fantástico!', 'Que cabeça!', 'Bravo!',
  'Certíssimo!', 'Assim é que é!', 'Impecável!', 'Espetacular!', 'Em cheio!',
  'Está em grande forma!', 'Nem o Eusébio marcava melhor!', 'Mais certo do que um relógio!',
  'Está a voar!', 'Que pontaria!', 'Parabéns!', 'Uma maravilha!',
];
const ELOGIOS_NOME = ['Muito bem, {n}!', 'Boa, {n}!', 'Isso mesmo, {n}!', 'Grande {n}!', '{n}, está imparável!'];
const OUTRA_VEZ = [
  'Ainda não… tente outra vez!', 'Quase! Mais uma tentativa?', 'Hum, não é essa. Tente de novo!',
  'Está perto! Experimente outra.', 'Não desista, tente outra vez!',
];
const CONSOLO = [
  'Não faz mal — agora já sabe!', 'Esta era difícil!', 'Ninguém nasce ensinado!',
  'Boa tentativa! Para a próxima é que é.', 'Aprender também é ganhar!',
  'Errar é humano, continuar é de campeão!', 'Esta enganava qualquer um!',
];
export function elogio() {
  if (Math.random() < 0.3 && dados.nome) return escolher(ELOGIOS_NOME).replace('{n}', dados.nome);
  return escolher(ELOGIOS);
}
export const outraVez = () => escolher(OUTRA_VEZ);
export const consolo = () => escolher(CONSOLO);

export function fraseFinal(estrelas) {
  const nome = dados.nome ? `, ${dados.nome}` : '';
  if (estrelas >= 3) return escolher([`Uma ronda de mestre${nome}! 🏆`, `Perfeito${nome}! Que cabeça! 🏆`, `Brilhante${nome}! Ninguém o para! 🏆`]);
  if (estrelas === 2) return escolher([`Muito bom trabalho${nome}! 👏`, `Grande ronda${nome}! 👏`, `Está cada vez melhor${nome}! 👏`]);
  return escolher([`Bom treino${nome}! Cada jogo deixa a cabeça mais ágil. 🌱`, `Bem jogado${nome}! O importante é treinar. 🌱`, `Boa${nome}! Amanhã ainda vai correr melhor. 🌱`]);
}

/* ---------- Mensagem rápida e festa ---------- */
let tMsg = null;
export function aviso(texto, ms = 2600) {
  const m = document.getElementById('mensagem');
  if (!m) return;
  m.textContent = texto;
  m.hidden = false;
  m.style.animation = 'none';
  void m.offsetWidth;
  m.style.animation = '';
  clearTimeout(tMsg);
  tMsg = setTimeout(() => { m.hidden = true; }, ms);
}

export function festa(simbolos = ['🎉', '⭐', '🎊', '✨', '🌟']) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const f = el('div', { class: 'festa', 'aria-hidden': 'true' });
  for (let i = 0; i < 36; i++) {
    const s = el('i', {}, escolher(simbolos));
    s.style.left = `${Math.random() * 100}%`;
    s.style.animationDuration = `${2 + Math.random() * 2.5}s`;
    s.style.animationDelay = `${Math.random() * 0.8}s`;
    s.style.fontSize = `${1.4 + Math.random() * 1.6}rem`;
    f.append(s);
  }
  document.body.append(f);
  setTimeout(() => f.remove(), 5500);
}

export function estrelasPorPercentagem(p) {
  if (p >= 0.8) return 3;
  if (p >= 0.5) return 2;
  return 1;
}
