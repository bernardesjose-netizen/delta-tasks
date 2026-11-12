// Desafios: «Siga a Sequência» (memória de cores e sons) e «Pôr por Ordem».
// Regras da casa: nada de castigos, sempre uma segunda oportunidade, letra e botões grandes.
import {
  el, limpar, baralhar, amostra, escolher, inteiro, som, elogio, consolo, duracao, verRecorde, marcar, semAcentos,
} from '../util.js';

/* ================= Siga a Sequência ================= */
const BOTOES_SIGA = [
  { nome: 'verde', cor: '#17924a', simbolo: '●' },
  { nome: 'vermelho', cor: '#d3382c', simbolo: '■' },
  { nome: 'azul', cor: '#1d5fd1', simbolo: '▲' },
  { nome: 'amarelo', cor: '#d99a00', simbolo: '★' },
  { nome: 'roxo', cor: '#7b3fd0', simbolo: '◆' },
  { nome: 'laranja', cor: '#e8590c', simbolo: '✚' },
];

export function siga(alvo, { nivel, curto, aoTerminar }) {
  const nBotoes = nivel === 3 ? 6 : 4;
  const comprimentoInicial = nivel === 1 ? 2 : 3;
  const meta = curto ? [0, 5, 6, 7][nivel] : [0, 6, 8, 9][nivel];
  const passo = [0, 800, 640, 560][nivel]; // tempo entre luzes (ms)
  const CHANCES = 3;
  const botoes = BOTOES_SIGA.slice(0, nBotoes);
  const seq = [];
  let pos = 0;
  let aJogar = false;
  let enganos = 0;
  let melhor = 0;
  let podeRever = true;
  let vivo = true;
  const t0 = Date.now();
  const temporizadores = [];
  const depois = (fn, ms) => { temporizadores.push(setTimeout(() => { if (vivo) fn(); }, ms)); };

  function novaCor() {
    // Sem a mesma cor três vezes seguidas (e, no nível 1, nunca duas seguidas).
    const n = seq.length;
    let k;
    do { k = inteiro(0, nBotoes - 1); } while (
      (nivel === 1 && n && seq[n - 1] === k) || (n >= 2 && seq[n - 1] === k && seq[n - 2] === k));
    seq.push(k);
  }
  for (let i = 0; i < comprimentoInicial; i++) novaCor();

  limpar(alvo);
  const coracoes = el('span', {}, '');
  const tamanhoInfo = el('span', {}, '');
  const msg = el('div', { class: 'siga-msg', 'aria-live': 'polite' }, '');
  const btnRever = el('button', { class: 'btn claro', type: 'button', onclick: rever, hidden: true }, '🔁 Mostrar outra vez');
  const grelha = el('div', { class: `siga-grelha n${nBotoes}` });
  const pads = botoes.map((b, k) => el('button', {
    class: 'siga-botao', type: 'button', 'aria-label': b.nome, style: { '--c': b.cor }, onclick: () => tocar(k),
  }, el('span', { 'aria-hidden': 'true' }, b.simbolo)));
  grelha.append(...pads);
  alvo.append(el('div', { class: 'ronda siga' },
    el('p', { class: 'dica siga-dica' }, 'Veja as luzes e depois toque nos botões pela mesma ordem.'),
    el('div', { class: 'info-jogo' }, tamanhoInfo, coracoes),
    msg,
    grelha,
    el('div', { class: 'fila-botoes', style: { marginTop: '10px' } }, btnRever)));

  function tamanho() {
    const est = getComputedStyle(alvo);
    const largura = Math.min((alvo.clientWidth || window.innerWidth) - parseFloat(est.paddingLeft || 0) - parseFloat(est.paddingRight || 0) - 4, 640);
    // Altura livre entre o topo da grelha e o fundo do ecrã (deixando espaço para «Mostrar outra vez»).
    const topoGrelha = grelha.getBoundingClientRect().top + (window.pageYOffset || 0);
    const altura = Math.max(200, window.innerHeight - topoGrelha - 76);
    const folga = 12;
    let melhorT = 0;
    let melhorC = 2;
    for (const colunas of nBotoes === 4 ? [2, 4] : [2, 3]) {
      const linhas = Math.ceil(nBotoes / colunas);
      const t = Math.min((largura - (colunas - 1) * folga) / colunas, (altura - (linhas - 1) * folga) / linhas);
      if (t > melhorT) { melhorT = t; melhorC = colunas; }
    }
    const t = Math.floor(Math.max(70, Math.min(melhorT, 190)));
    grelha.style.gridTemplateColumns = `repeat(${melhorC}, ${t}px)`;
    pads.forEach(p => { p.style.width = `${t}px`; p.style.height = `${t}px`; p.style.fontSize = `${Math.round(t * 0.36)}px`; });
  }
  tamanho();
  window.addEventListener('resize', tamanho);

  function atualizarInfo() {
    tamanhoInfo.textContent = `Sequência: ${seq.length} de ${meta}`;
    coracoes.textContent = `${'💚'.repeat(CHANCES - enganos)}${'♡'.repeat(enganos)}`;
    coracoes.setAttribute('aria-label', `${CHANCES - enganos} tentativas`);
  }

  function acender(k, dur) {
    const p = pads[k];
    p.classList.add('aceso');
    som.tecla(k);
    depois(() => p.classList.remove('aceso'), dur);
  }

  function mostrarSequencia(espera = 700) {
    aJogar = false;
    pos = 0;
    grelha.classList.add('a-mostrar');
    btnRever.hidden = true;
    atualizarInfo();
    msg.className = 'siga-msg ver';
    msg.textContent = '👀 Veja com atenção…';
    let t = espera;
    seq.forEach(k => { depois(() => acender(k, Math.round(passo * 0.62)), t); t += passo; });
    depois(() => {
      aJogar = true;
      grelha.classList.remove('a-mostrar');
      msg.className = 'siga-msg vez';
      msg.textContent = `👉 A sua vez! Toque ${seq.length} ${seq.length === 1 ? 'vez' : 'vezes'}.`;
      btnRever.hidden = !podeRever;
    }, t);
  }

  function rever() {
    if (!aJogar || !podeRever) return;
    podeRever = false;
    mostrarSequencia(300);
  }

  function tocar(k) {
    if (!aJogar) return;
    acender(k, 260);
    if (k === seq[pos]) {
      pos++;
      if (pos < seq.length) { msg.textContent = `👉 Muito bem… ${pos} de ${seq.length}`; return; }
      // Sequência completa
      aJogar = false;
      btnRever.hidden = true;
      melhor = seq.length;
      msg.className = 'siga-msg bom';
      if (seq.length >= meta) {
        msg.textContent = `🎉 Chegou ao fim: ${seq.length} seguidas!`;
        depois(() => som.combo(10), 350);
        depois(fim, 1500);
        return;
      }
      msg.textContent = `✅ ${elogio()} ${seq.length} certas!`;
      depois(() => (seq.length >= 5 ? som.combo(seq.length) : som.certo()), 300);
      novaCor();
      podeRever = true;
      depois(() => mostrarSequencia(400), 1500);
      return;
    }
    // Engano: mostrar qual era e repetir a mesma sequência
    aJogar = false;
    btnRever.hidden = true;
    enganos++;
    som.quase();
    pads[k].classList.add('errado');
    depois(() => pads[k].classList.remove('errado'), 500);
    const certo = seq[pos];
    depois(() => acender(certo, 650), 600);
    atualizarInfo();
    msg.className = 'siga-msg quase';
    if (enganos >= CHANCES) {
      msg.textContent = melhor ? `Era o ${botoes[certo].nome}. Chegou às ${melhor} seguidas — muito bem!` : `Era o ${botoes[certo].nome}. Para a próxima vai correr melhor!`;
      depois(fim, 2200);
      return;
    }
    msg.textContent = `${consolo()} Era o ${botoes[certo].nome}. Vamos ver outra vez.`;
    podeRever = true;
    depois(() => mostrarSequencia(400), 2000);
  }

  function fim() {
    const chegou = melhor >= meta;
    const estrelas = chegou ? (enganos <= 1 ? 3 : 2) : melhor >= meta - 2 ? 2 : 1;
    const rec = verRecorde(`siga-${nivel}`, melhor, false);
    if (chegou && nivel === 3) marcar('sigaDesafio');
    aoTerminar({
      estrelas,
      recorde: rec.bateu && !rec.primeiro && melhor > 0,
      titulo: chegou ? 'Memória de elefante! 🐘' : 'Boa memória!',
      numeros: [
        { valor: String(melhor), rotulo: 'cores seguidas' },
        { valor: String(enganos), rotulo: enganos === 1 ? 'engano' : 'enganos' },
        ...(rec.anterior != null ? [{ valor: String(rec.anterior), rotulo: rec.bateu ? 'recorde anterior' : 'o seu recorde' }] : []),
        { valor: duracao(Date.now() - t0), rotulo: 'tempo' },
      ],
    });
  }

  atualizarInfo();
  mostrarSequencia(900);
  return () => { vivo = false; temporizadores.forEach(clearTimeout); window.removeEventListener('resize', tamanho); };
}

/* ================= Pôr por Ordem ================= */
// Cada gerador devolve { pedido, itens: [{ t, e?, extra? }] } com os itens JÁ pela ordem certa.
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const DIAS = ['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado', 'domingo'];
const maiuscula = s => s.charAt(0).toUpperCase() + s.slice(1);

// Tamanhos: só um item de cada «degrau», para nunca haver dúvidas.
const ANIMAIS = [
  [['🐜', 'Formiga'], ['🐞', 'Joaninha']],
  [['🐁', 'Rato'], ['🐤', 'Pintainho']],
  [['🐈', 'Gato'], ['🐔', 'Galinha'], ['🐇', 'Coelho']],
  [['🐑', 'Ovelha'], ['🐖', 'Porco']],
  [['🐎', 'Cavalo'], ['🐄', 'Vaca']],
  [['🐘', 'Elefante']],
  [['🐋', 'Baleia']],
];
const COISAS = [
  [['🔑', 'Chave'], ['💍', 'Anel']],
  [['📱', 'Telemóvel'], ['☕', 'Chávena']],
  [['👞', 'Sapato'], ['📚', 'Livros']],
  [['🚲', 'Bicicleta']],
  [['🚗', 'Carro']],
  [['🚌', 'Autocarro']],
  [['✈️', 'Avião']],
  [['🚢', 'Navio']],
];
// Factos confirmados (ano em que aconteceu).
const HISTORIA = [
  [1143, 'Portugal é reconhecido como reino (Tratado de Zamora)'],
  [1147, 'D. Afonso Henriques conquista Lisboa'],
  [1290, 'D. Dinis cria a primeira universidade portuguesa'],
  [1385, 'Batalha de Aljubarrota'],
  [1415, 'Conquista de Ceuta'],
  [1492, 'Cristóvão Colombo chega à América'],
  [1498, 'Vasco da Gama chega à Índia'],
  [1500, 'Pedro Álvares Cabral chega ao Brasil'],
  [1640, 'Restauração da Independência'],
  [1755, 'Grande terramoto de Lisboa'],
  [1807, 'Primeira invasão francesa'],
  [1906, 'Fundação do Sporting Clube de Portugal'],
  [1910, 'Implantação da República'],
  [1945, 'Fim da Segunda Guerra Mundial'],
  [1957, 'Começam as emissões regulares da RTP'],
  [1964, 'O Sporting ganha a Taça das Taças'],
  [1966, 'Inauguração da ponte sobre o Tejo, em Lisboa'],
  [1969, 'O Homem chega à Lua'],
  [1974, 'Revolução do 25 de Abril'],
  [1986, 'Portugal entra na Comunidade Europeia'],
  [1998, 'Expo 98, em Lisboa'],
  [2002, 'Chegam as notas e moedas de euro'],
  [2004, 'Portugal organiza o Euro 2004'],
  [2016, 'Portugal é campeão europeu de futebol'],
];
const CIDADES = ['Aveiro', 'Beja', 'Braga', 'Bragança', 'Castelo Branco', 'Coimbra', 'Évora', 'Faro', 'Guarda', 'Leiria', 'Lisboa', 'Portalegre', 'Porto', 'Santarém', 'Setúbal', 'Viana do Castelo', 'Vila Real', 'Viseu', 'Funchal', 'Ponta Delgada', 'Horta', 'Tavira', 'Lagos', 'Tomar', 'Chaves', 'Elvas', 'Sintra', 'Nazaré', 'Olhão', 'Amarante'];
const NOMES = ['Ana', 'Bernardo', 'Carlos', 'Diana', 'Eduardo', 'Fernanda', 'Gonçalo', 'Helena', 'Inês', 'João', 'Joaquim', 'Luísa', 'Manuel', 'Maria', 'Marta', 'Nuno', 'Olga', 'Pedro', 'Paula', 'Rita', 'Rui', 'Sofia', 'Sérgio', 'Teresa', 'Tiago', 'Vasco', 'Zulmira', 'Alberto', 'Beatriz', 'Celeste'];
const FRUTAS = [['🍎', 'Maçã'], ['🍌', 'Banana'], ['🍒', 'Cereja'], ['🍓', 'Morango'], ['🍇', 'Uva'], ['🍐', 'Pera'], ['🍊', 'Laranja'], ['🍋', 'Limão'], ['🍉', 'Melancia'], ['🍑', 'Pêssego'], ['🍍', 'Ananás'], ['🥝', 'Kiwi']];
const EXTENSO = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezasseis', 'dezassete', 'dezoito', 'dezanove', 'vinte'];
const DEZENAS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const porExtenso = n => (n <= 20 ? EXTENSO[n] : DEZENAS[Math.floor(n / 10)] + (n % 10 ? ` e ${EXTENSO[n % 10]}` : ''));
const SEQUENCIAS_FIXAS = [
  { pedido: 'Ponha pela ordem em que acontecem, do princípio ao fim.', itens: [['🥚', 'Ovo'], ['🐣', 'Pinto a nascer'], ['🐥', 'Pintainho'], ['🐔', 'Galinha']] },
  { pedido: 'Ponha as partes do dia pela ordem certa, começando de manhã.', itens: [['🌅', 'Nascer do sol'], ['☀️', 'Meio-dia'], ['🌇', 'Pôr do sol'], ['🌙', 'Noite']] },
  { pedido: 'Ponha as idades da vida pela ordem certa.', itens: [['👶', 'Bebé'], ['👦', 'Criança'], ['👨', 'Adulto'], ['👴', 'Avô']] },
  { pedido: 'Ponha as estações do ano por ordem, começando na primavera.', itens: [['🌷', 'Primavera'], ['☀️', 'Verão'], ['🍂', 'Outono'], ['⛄', 'Inverno']] },
  { pedido: 'Ponha as refeições do dia pela ordem certa.', itens: [['☕', 'Pequeno-almoço'], ['🍲', 'Almoço'], ['🍰', 'Lanche'], ['🍽️', 'Jantar']] },
];
const NOTAS = ['Dó', 'Ré', 'Mi', 'Fá', 'Sol', 'Lá', 'Si'];

const comparaTexto = (a, b) => { const x = semAcentos(a).toLowerCase(); const y = semAcentos(b).toLowerCase(); return x < y ? -1 : x > y ? 1 : 0; };
const euroTxt = c => (c < 100 ? `${c} cêntimos` : c % 100 === 0 ? `${c / 100} ${c === 100 ? 'euro' : 'euros'}` : `${(c / 100).toFixed(2).replace('.', ',')} €`);

// Números distintos, com uma distância mínima entre eles.
function numerosDistintos(n, min, max, folga) {
  for (let tentativa = 0; tentativa < 200; tentativa++) {
    const v = [];
    while (v.length < n) v.push(inteiro(min, max));
    const ord = [...v].sort((a, b) => a - b);
    if (ord.every((x, i) => i === 0 || x - ord[i - 1] >= folga)) return v;
  }
  return Array.from({ length: n }, (_, i) => min + i * folga);
}
// Um item de cada degrau, por ordem crescente.
function degraus(lista, n) {
  const idx = amostra(lista.map((_, i) => i), n).sort((a, b) => a - b);
  return idx.map(i => escolher(lista[i]));
}
// Eventos com pelo menos `folga` anos entre si.
function eventos(n, folga) {
  for (let t = 0; t < 300; t++) {
    const ev = amostra(HISTORIA, n).sort((a, b) => a[0] - b[0]);
    if (ev.every((x, i) => i === 0 || x[0] - ev[i - 1][0] >= folga)) return ev;
  }
  return HISTORIA.filter((_, i) => i % 4 === 0).slice(0, n);
}

const GERADORES = {
  numeros(nivel) {
    const n = [0, 4, 5, 6][nivel];
    const v = nivel === 1 ? numerosDistintos(n, 1, 20, 2) : nivel === 2 ? numerosDistintos(n, 10, 99, 3) : (() => {
      // Nível 3: centenas parecidas (ex.: 315, 351, 305…)
      const c = inteiro(1, 8);
      return numerosDistintos(n, c * 100, c * 100 + 199, 4);
    })();
    const desc = nivel > 1 && Math.random() < 0.35;
    v.sort((a, b) => (desc ? b - a : a - b));
    return { pedido: desc ? 'Do número MAIOR para o mais pequeno.' : 'Do número mais pequeno para o MAIOR.', itens: v.map(x => ({ t: String(x) })) };
  },
  tamanho(nivel) {
    const n = [0, 4, 5, 6][nivel];
    const lista = Math.random() < 0.6 ? ANIMAIS : COISAS;
    const itens = degraus(lista, Math.min(n, lista.length)).map(([e, t]) => ({ e, t }));
    return { pedido: 'Do mais pequeno para o MAIOR.', itens };
  },
  dias(nivel) {
    const n = [0, 4, 5, 6][nivel];
    const idx = amostra(DIAS.map((_, i) => i), n).sort((a, b) => a - b);
    return { pedido: 'Ponha os dias pela ordem da semana, começando na segunda-feira.', itens: idx.map(i => ({ t: maiuscula(DIAS[i]) })) };
  },
  meses(nivel) {
    const n = [0, 4, 5, 6][nivel];
    const idx = amostra(MESES.map((_, i) => i), n).sort((a, b) => a - b);
    return { pedido: 'Ponha os meses pela ordem do ano, de janeiro para dezembro.', itens: idx.map(i => ({ t: maiuscula(MESES[i]) })) };
  },
  historia(nivel) {
    const ev = nivel === 2 ? eventos(4, 40) : eventos(5, 12);
    return { pedido: 'Do acontecimento mais ANTIGO para o mais recente.', itens: ev.map(([a, t]) => ({ t, extra: String(a) })) };
  },
  alfabeto(nivel) {
    const n = [0, 4, 5, 6][nivel];
    const fonte = escolher(['cidades', 'nomes', 'frutas']);
    let lista = fonte === 'frutas' ? FRUTAS.map(([e, t]) => ({ e, t })) : (fonte === 'cidades' ? CIDADES : NOMES).map(t => ({ t }));
    let escolhidos;
    for (let k = 0; k < 200; k++) {
      escolhidos = amostra(lista, Math.min(n, lista.length));
      const iniciais = escolhidos.map(x => semAcentos(x.t)[0]);
      const distintas = new Set(iniciais).size === iniciais.length;
      if (nivel < 3 ? distintas : !distintas) break;
    }
    escolhidos.sort((a, b) => comparaTexto(a.t, b.t));
    return { pedido: 'Ponha por ordem alfabética (de A para Z).', itens: escolhidos };
  },
  sequencia() {
    const s = escolher(SEQUENCIAS_FIXAS);
    return { pedido: s.pedido, itens: s.itens.map(([e, t]) => ({ e, t })) };
  },
  dinheiro(nivel) {
    let cent;
    if (nivel === 1) cent = amostra([5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000], 4);
    else if (nivel === 2) cent = numerosDistintos(5, 30, 600, 25);
    else { const base = inteiro(1, 4) * 100; cent = numerosDistintos(5, base - 20, base + 120, 6); }
    cent.sort((a, b) => a - b);
    return { pedido: nivel === 1 ? 'Do valor mais BAIXO para o mais alto.' : 'Do preço mais BARATO para o mais caro.', itens: cent.map(c => ({ t: euroTxt(c) })) };
  },
  horas(nivel) {
    const n = [0, 4, 5, 6][nivel];
    const folga = nivel === 2 ? 45 : 12;
    const mins = numerosDistintos(n, 6 * 60, 23 * 60, folga).map(m => (nivel === 2 ? Math.round(m / 15) * 15 : Math.round(m / 5) * 5));
    const unicos = [...new Set(mins)].sort((a, b) => a - b);
    return { pedido: 'Da hora mais CEDO para a mais tarde.', itens: unicos.map(m => ({ t: `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` })) };
  },
  contas(nivel) {
    const n = nivel === 2 ? 4 : 5;
    const usados = new Set();
    const itens = [];
    while (itens.length < n) {
      const tipo = nivel === 2 ? escolher(['+', '−']) : escolher(['+', '−', '×']);
      let a; let b; let r;
      if (tipo === '+') { a = inteiro(2, nivel === 2 ? 12 : 30); b = inteiro(2, nivel === 2 ? 9 : 25); r = a + b; }
      else if (tipo === '−') { a = inteiro(8, nivel === 2 ? 20 : 50); b = inteiro(1, a - 2); r = a - b; }
      else { a = inteiro(2, 9); b = inteiro(2, 6); r = a * b; }
      if (usados.has(r)) continue;
      usados.add(r);
      itens.push({ t: `${a} ${tipo} ${b}`, extra: `= ${r}`, v: r });
    }
    itens.sort((x, y) => x.v - y.v);
    return { pedido: 'Do resultado mais PEQUENO para o maior.', itens };
  },
  extenso(nivel) {
    const v = numerosDistintos(nivel === 2 ? 4 : 5, nivel === 2 ? 1 : 11, nivel === 2 ? 20 : 99, nivel === 2 ? 2 : 4).sort((a, b) => a - b);
    return { pedido: 'Do número mais pequeno para o MAIOR.', itens: v.map(x => ({ t: maiuscula(porExtenso(x)), extra: String(x) })) };
  },
  notas() {
    const idx = amostra(NOTAS.map((_, i) => i), 5).sort((a, b) => a - b);
    return { pedido: 'Ponha as notas musicais por ordem: dó, ré, mi…', itens: idx.map(i => ({ e: '🎵', t: NOTAS[i] })) };
  },
};
const TIPOS = {
  1: ['numeros', 'tamanho', 'dias', 'sequencia', 'sequencia', 'dinheiro', 'alfabeto'],
  2: ['numeros', 'tamanho', 'meses', 'historia', 'alfabeto', 'dinheiro', 'horas', 'contas', 'extenso', 'notas'],
  3: ['numeros', 'tamanho', 'meses', 'historia', 'historia', 'alfabeto', 'dinheiro', 'horas', 'contas', 'extenso'],
};

export function ordem(alvo, { nivel, curto, aoTerminar }) {
  const total = curto ? 4 : 6;
  // Tipos variados, sem repetir enquanto houver outros.
  let tipos = [];
  while (tipos.length < total) tipos = tipos.concat(baralhar([...new Set(TIPOS[nivel])]));
  tipos = tipos.slice(0, total);
  const rondas = tipos.map(t => GERADORES[t](nivel));
  let r = 0;
  let enganos = 0;
  let perfeitas = 0;
  const t0 = Date.now();
  let vivo = true;
  const temporizadores = [];
  const depois = (fn, ms) => { temporizadores.push(setTimeout(() => { if (vivo) fn(); }, ms)); };

  function mostrar() {
    const ronda = rondas[r];
    const n = ronda.itens.length;
    const misturados = (() => {
      let m;
      do { m = baralhar(ronda.itens.map((it, i) => ({ ...it, i }))); } while (m.every((x, k) => x.i === k));
      return m;
    })();
    let proximo = 0;
    let errosAqui = 0;
    let errosNoPasso = 0;
    limpar(alvo);
    const msg = el('div', { class: 'msg-curta', 'aria-live': 'polite' }, '');
    const zona = el('div');
    const botoes = misturados.map(it => {
      const b = el('button', { class: 'opcao ordem-item', type: 'button', onclick: () => tocar(it, b) },
        el('span', { class: 'ordem-num', 'aria-hidden': 'true' }, ''),
        it.e ? el('span', { class: 'ordem-emoji', 'aria-hidden': 'true' }, it.e) : null,
        el('span', { class: 'ordem-texto' }, it.t));
      return b;
    });
    alvo.append(el('div', { class: 'ronda compacto' },
      el('div', { class: 'progresso' }, el('span', {}, `${r + 1} de ${total}`),
        el('div', { class: 'barra' }, el('i', { style: { width: `${(r / total) * 100}%` } }))),
      el('div', { class: 'cartao-pergunta' },
        el('div', { class: 'etiqueta' }, 'Pôr por Ordem'),
        el('div', { class: 'enunciado centrado' }, ronda.pedido),
        el('p', { class: 'dica', style: { marginTop: '4px' } }, 'Toque pela ordem certa: 1.º, 2.º, 3.º…')),
      msg,
      el('div', { class: `ordem-grelha${misturados.some(x => x.t.length > 22) ? ' longa' : ''}` }, botoes),
      zona));

    function tocar(it, b) {
      if (b.disabled || proximo >= n) return;
      if (it.i === proximo) {
        proximo++;
        errosNoPasso = 0;
        b.disabled = true;
        b.classList.add('certa', 'feito');
        b.classList.remove('pista');
        b.querySelector('.ordem-num').textContent = String(proximo);
        msg.textContent = '';
        if (proximo < n) { som.rapido(); return; }
        // Ronda concluída
        if (errosAqui === 0) perfeitas++;
        som.certo();
        botoes.forEach(x => x.classList.remove('pista'));
        zona.append(
          el('div', { class: 'retorno bom' },
            el('div', { class: 'icone' }, errosAqui === 0 ? '😃' : '🙂'),
            el('div', {},
              el('b', {}, errosAqui === 0 ? `${elogio()} Tudo certo à primeira!` : `${elogio()} Ficou tudo por ordem.`),
              el('ol', { class: 'ordem-lista' }, ronda.itens.map(x => el('li', {}, `${x.e ? `${x.e} ` : ''}${x.t}`, x.extra ? el('small', {}, ` (${x.extra})`) : null))))),
          el('div', { class: 'fila-botoes' }, el('button', {
            class: 'btn verde grande largo', type: 'button',
            onclick: () => { r++; if (r < total) mostrar(); else terminar(); },
          }, r + 1 < total ? 'Seguinte ▶' : 'Ver resultado ▶')));
        const ultimo = zona.querySelector('.btn');
        if (ultimo && ultimo.scrollIntoView) depois(() => ultimo.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 150);
        return;
      }
      enganos++;
      errosAqui++;
      errosNoPasso++;
      som.quase();
      b.classList.remove('abanar');
      void b.offsetWidth;
      b.classList.add('abanar');
      if (errosNoPasso >= 2) {
        const certo = botoes[misturados.findIndex(x => x.i === proximo)];
        certo.classList.add('pista');
        msg.textContent = `Este é o ${proximo + 1}.º — é o que está a brilhar 😉`;
      } else msg.textContent = proximo === 0 ? 'Quase! Há outro que vem primeiro.' : 'Quase! Há outro que vem antes deste.';
    }
  }

  function terminar() {
    const estrelas = enganos <= 1 ? 3 : enganos <= 4 ? 2 : 1;
    if (enganos === 0) marcar('ordemPerfeita');
    aoTerminar({
      estrelas,
      titulo: enganos === 0 ? 'Tudo arrumadinho! 🗂️' : 'Ordem cumprida!',
      numeros: [
        { valor: `${perfeitas} de ${total}`, rotulo: 'certas à primeira' },
        { valor: String(enganos), rotulo: enganos === 1 ? 'engano' : 'enganos' },
        { valor: duracao(Date.now() - t0), rotulo: 'tempo' },
      ],
    });
  }

  mostrar();
  return () => { vivo = false; temporizadores.forEach(clearTimeout); };
}
