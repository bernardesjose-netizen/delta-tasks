// Jogo da memória (pares) e Maior ou Menor.
import { el, limpar, baralhar, amostra, som, elogio, aviso, duracao, inteiro, consolo } from '../util.js';

/* ================= Jogo da memória ================= */
const TEMAS_MEMORIA = [
  ['🍎', '🍌', '🍇', '🍓', '🍒', '🍐', '🍊', '🍋', '🍉', '🍍', '🥝', '🍑'],
  ['🐶', '🐱', '🐔', '🐷', '🐮', '🐴', '🐑', '🐰', '🦆', '🐟', '🐢', '🦉'],
  ['⚽', '🎺', '🎩', '☂️', '🔑', '📚', '⏰', '🚲', '⚓', '🏠', '🚗', '✈️'],
  ['🌻', '🌷', '🌹', '🌳', '🍄', '🌵', '🍀', '🌙', '⭐', '☀️', '🌈', '❄️'],
];

export function memoria(alvo, { nivel, aoTerminar }) {
  const pares = nivel === 1 ? 6 : nivel === 2 ? 8 : 10;
  const colunas = nivel === 1 ? 4 : nivel === 2 ? 4 : 5;
  const figuras = amostra(TEMAS_MEMORIA[inteiro(0, TEMAS_MEMORIA.length - 1)], pares);
  const baralho = baralhar([...figuras, ...figuras]);
  let abertas = [];
  let encontrados = 0;
  let tentativas = 0;
  let bloqueado = false;
  const t0 = Date.now();
  let vivo = true;

  limpar(alvo);
  const grelha = el('div', { class: 'memoria', style: { gridTemplateColumns: `repeat(${colunas}, auto)` } });
  const linhas = Math.ceil(baralho.length / colunas);
  function tamanho() {
    const largura = Math.min((alvo.clientWidth || window.innerWidth) - 24, 900);
    const altura = window.innerHeight - 260;
    const t = Math.floor(Math.min((largura - (colunas - 1) * 12) / colunas, (altura - (linhas - 1) * 12) / (linhas * 1.2), 150));
    grelha.style.setProperty('--tam', `${Math.max(58, t)}px`);
  }
  const infoT = el('span', {}, 'Tentativas: 0');
  const infoP = el('span', {}, `Pares: 0 de ${pares}`);
  const cartas = baralho.map((f, k) => {
    const b = el('button', { class: 'mem-carta', type: 'button', 'aria-label': `Carta ${k + 1}`, onclick: () => virar(k) },
      el('div', { class: 'lado costas', 'aria-hidden': 'true' }, 'J'),
      el('div', { class: 'lado face', 'aria-hidden': 'true' }, f));
    return b;
  });
  grelha.append(...cartas);
  alvo.append(
    el('p', { class: 'dica', style: { marginBottom: '10px' } }, 'Vire duas cartas de cada vez e encontre os pares iguais.'),
    el('div', { class: 'info-jogo' }, infoT, infoP),
    grelha);
  tamanho();
  window.addEventListener('resize', tamanho);

  function virar(k) {
    const c = cartas[k];
    if (bloqueado || c.classList.contains('virada')) return;
    som.carta();
    c.classList.add('virada');
    c.setAttribute('aria-label', `Carta ${k + 1}: ${baralho[k]}`);
    abertas.push(k);
    if (abertas.length < 2) return;
    tentativas++;
    infoT.textContent = `Tentativas: ${tentativas}`;
    const [a, b] = abertas;
    abertas = [];
    if (baralho[a] === baralho[b]) {
      encontrados++;
      infoP.textContent = `Pares: ${encontrados} de ${pares}`;
      setTimeout(() => { cartas[a].classList.add('par'); cartas[b].classList.add('par'); som.certo(); }, 300);
      if (encontrados % 2 === 0 && encontrados < pares) aviso(elogio(), 1500);
      if (encontrados === pares) setTimeout(fim, 1000);
      return;
    }
    bloqueado = true;
    setTimeout(() => {
      if (!vivo) return;
      cartas[a].classList.remove('virada');
      cartas[b].classList.remove('virada');
      cartas[a].setAttribute('aria-label', `Carta ${a + 1}`);
      cartas[b].setAttribute('aria-label', `Carta ${b + 1}`);
      bloqueado = false;
    }, 1300);
  }

  function fim() {
    const estrelas = tentativas <= pares * 1.6 ? 3 : tentativas <= pares * 2.4 ? 2 : 1;
    aoTerminar({
      estrelas,
      numeros: [
        { valor: String(tentativas), rotulo: 'tentativas' },
        { valor: duracao(Date.now() - t0), rotulo: 'tempo' },
      ],
    });
  }

  return () => { vivo = false; window.removeEventListener('resize', tamanho); };
}

/* ================= Maior ou Menor ================= */
const NAIPES = [['♥', 'vermelha', 'copas'], ['♦', 'vermelha', 'ouros'], ['♣', 'preta', 'paus'], ['♠', 'preta', 'espadas']];
const VALORES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'V', 'D', 'R'];
const NOMES = ['Ás', 'Dois', 'Três', 'Quatro', 'Cinco', 'Seis', 'Sete', 'Oito', 'Nove', 'Dez', 'Valete', 'Dama', 'Rei'];

function desenharCarta(c) {
  if (!c) return el('div', { class: 'mm-carta costas', 'aria-label': 'Carta virada para baixo' });
  const [s, cor] = NAIPES[c.s];
  return el('div', { class: `mm-carta ${cor}`, 'aria-label': `${NOMES[c.r - 1]} de ${NAIPES[c.s][2]}` },
    el('div', { class: 'mm-canto' }, VALORES[c.r - 1], el('br'), s),
    el('div', { class: 'mm-centro' }, c.r > 10 ? ['💂', '👸', '🤴'][c.r - 11] : s));
}

export function maiorMenor(alvo, { nivel, curto, aoTerminar }) {
  const total = curto ? 6 : nivel === 1 ? 8 : nivel === 2 ? 10 : 12;
  const baralho = baralhar(Array.from({ length: 52 }, (_, k) => ({ s: k % 4, r: Math.floor(k / 4) + 1 })));
  let atual = baralho.pop();
  let jogada = 0;
  let certas = 0;
  let seguidas = 0;
  let melhorSeguidas = 0;
  const t0 = Date.now();

  function mostrar(proxima, texto, tipo) {
    limpar(alvo);
    const zona = el('div');
    const fim = jogada >= total;
    alvo.append(el('div', { class: 'ronda' },
      el('div', { class: 'progresso' }, el('span', {}, `${Math.min(jogada + 1, total)} de ${total}`),
        el('div', { class: 'barra' }, el('i', { style: { width: `${(jogada / total) * 100}%` } }))),
      el('div', { class: 'cartao-pergunta' },
        el('div', { class: 'etiqueta' }, 'Maior ou Menor'),
        el('div', { class: 'enunciado centrado' }, proxima ? 'Vamos ver…' : 'A próxima carta vai ser maior ou menor?'),
        el('div', { class: 'mm-mesa' }, desenharCarta(atual), el('div', { class: 'mm-seta', 'aria-hidden': 'true' }, '➜'), desenharCarta(proxima)),
        el('p', { class: 'dica' }, 'Ordem: Ás (o mais baixo), 2 … 10, Valete, Dama, Rei (o mais alto). Se sair igual, ganha na mesma!')),
      zona));
    if (!proxima) {
      zona.append(el('div', { class: 'fila-botoes' },
        el('button', { class: 'btn verde grande', type: 'button', onclick: () => apostar(1) }, '⬆ Maior'),
        el('button', { class: 'btn roxo grande', type: 'button', onclick: () => apostar(-1) }, '⬇ Menor')));
      return;
    }
    zona.append(
      el('div', { class: `retorno ${tipo}` }, el('div', { class: 'icone' }, tipo === 'bom' ? '😃' : '🙂'), el('div', {}, el('b', {}, texto))),
      el('div', { class: 'fila-botoes' }, el('button', {
        class: 'btn verde grande largo', type: 'button',
        onclick: () => { if (fim) terminar(); else { atual = proxima; mostrar(); } },
      }, fim ? 'Ver resultado ▶' : 'Próxima carta ▶')));
  }

  function apostar(dir) {
    const prox = baralho.pop();
    jogada++;
    const dif = Math.sign(prox.r - atual.r);
    const acertou = dif === 0 || dif === dir;
    if (acertou) {
      certas++;
      seguidas++;
      melhorSeguidas = Math.max(melhorSeguidas, seguidas);
      som.certo();
      mostrar(prox, dif === 0 ? 'Saiu igual — conta como certo! 😉' : `${elogio()}${seguidas >= 3 ? ` Já vai com ${seguidas} seguidas!` : ''}`, 'bom');
    } else {
      seguidas = 0;
      som.quase();
      mostrar(prox, `${consolo()} Desta vez a sorte fugiu.`, 'info');
    }
  }

  function terminar() {
    const p = certas / total;
    aoTerminar({
      estrelas: p >= 0.75 ? 3 : p >= 0.5 ? 2 : 1,
      numeros: [
        { valor: `${certas} de ${total}`, rotulo: 'palpites certos' },
        { valor: String(melhorSeguidas), rotulo: 'melhor sequência' },
        { valor: duracao(Date.now() - t0), rotulo: 'tempo' },
      ],
    });
  }

  mostrar();
  return () => {};
}
