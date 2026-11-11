// Jogo da memória (com desenhos ou fotografias) e Maior ou Menor.
import { el, limpar, baralhar, amostra, som, elogio, aviso, duracao, inteiro, consolo, falar, dados } from '../util.js';
import { cartaSolta } from '../baralho.js';

/* ================= Jogo da memória ================= */
const TEMAS_MEMORIA = [
  ['🍎', '🍌', '🍇', '🍓', '🍒', '🍐', '🍊', '🍋', '🍉', '🍍', '🥝', '🍑'],
  ['🐶', '🐱', '🐔', '🐷', '🐮', '🐴', '🐑', '🐰', '🦆', '🐟', '🐢', '🦉'],
  ['⚽', '🎺', '🎩', '☂️', '🔑', '📚', '⏰', '🚲', '⚓', '🏠', '🚗', '✈️'],
  ['🌻', '🌷', '🌹', '🌳', '🍄', '🌵', '🍀', '🌙', '⭐', '☀️', '🌈', '❄️'],
];

// Escolhe o número de colunas que dá cartas maiores no espaço disponível.
function melhorGrelha(n, largura, altura, proporcao, folga = 12) {
  let melhor = { colunas: 4, tam: 60 };
  for (let colunas = 2; colunas <= 8; colunas++) {
    const linhas = Math.ceil(n / colunas);
    const tam = Math.min((largura - (colunas - 1) * folga) / colunas, (altura - (linhas - 1) * folga) / (linhas * proporcao));
    if (tam > melhor.tam) melhor = { colunas, tam };
  }
  melhor.tam = Math.floor(Math.min(melhor.tam, 190));
  return melhor;
}

/**
 * itens (opcional): [{ chave, nome, foto }] — fotografias com legenda. Sem itens, usa desenhos.
 * pares (opcional): quantos pares; por omissão depende do nível.
 */
export function memoria(alvo, { nivel, aoTerminar, itens, pares: paresPedidos, costas }) {
  const pares = paresPedidos || (nivel === 1 ? 6 : nivel === 2 ? 8 : 10);
  const comFotos = Array.isArray(itens);
  const escolhidos = comFotos
    ? amostra(itens, Math.min(pares, itens.length))
    : amostra(TEMAS_MEMORIA[inteiro(0, TEMAS_MEMORIA.length - 1)], pares).map(e => ({ chave: e, emoji: e }));
  const baralho = baralhar([...escolhidos, ...escolhidos]);
  const proporcao = comFotos ? 1.22 : 1.2;
  let abertas = [];
  let encontrados = 0;
  let tentativas = 0;
  let bloqueado = false;
  const t0 = Date.now();
  let vivo = true;

  limpar(alvo);
  const grelha = el('div', { class: `memoria${comFotos ? ' com-fotos' : ''}` });
  function tamanho() {
    const largura = Math.min((alvo.clientWidth || window.innerWidth) - 8, 1100);
    const altura = Math.max(320, window.innerHeight - 230);
    const { colunas, tam } = melhorGrelha(baralho.length, largura, altura, proporcao);
    grelha.style.gridTemplateColumns = `repeat(${colunas}, auto)`;
    grelha.style.setProperty('--tam', `${Math.max(64, tam)}px`);
  }
  const infoT = el('span', {}, 'Tentativas: 0');
  const infoP = el('span', {}, `Pares: 0 de ${escolhidos.length}`);
  const cartas = baralho.map((it, k) => el('button', { class: 'mem-carta', type: 'button', 'aria-label': `Carta ${k + 1}`, onclick: () => virar(k) },
    costas
      ? el('div', { class: 'lado costas com-img', 'aria-hidden': 'true' }, el('img', { src: costas, alt: '', draggable: 'false' }))
      : el('div', { class: 'lado costas', 'aria-hidden': 'true' }, 'J'),
    comFotos
      ? el('div', { class: 'lado face', 'aria-hidden': 'true' },
        el('img', { src: it.foto, alt: '', loading: 'eager', draggable: 'false' }),
        el('span', { class: 'legenda' }, it.nome))
      : el('div', { class: 'lado face', 'aria-hidden': 'true' }, it.emoji)));
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
    c.setAttribute('aria-label', `Carta ${k + 1}: ${baralho[k].nome || baralho[k].emoji}`);
    abertas.push(k);
    if (abertas.length < 2) return;
    tentativas++;
    infoT.textContent = `Tentativas: ${tentativas}`;
    const [a, b] = abertas;
    abertas = [];
    if (baralho[a].chave === baralho[b].chave) {
      encontrados++;
      infoP.textContent = `Pares: ${encontrados} de ${escolhidos.length}`;
      setTimeout(() => { cartas[a].classList.add('par'); cartas[b].classList.add('par'); som.par(); }, 300);
      if (comFotos) {
        aviso(`${baralho[a].nome}! ${encontrados < escolhidos.length ? elogio() : ''}`, 2000);
        if (dados.def.voz) falar(baralho[a].nome);
      } else if (encontrados % 2 === 0 && encontrados < escolhidos.length) aviso(elogio(), 1500);
      if (encontrados === escolhidos.length) setTimeout(fim, 1100);
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
    }, comFotos ? 1600 : 1300);
  }

  function fim() {
    const n = escolhidos.length;
    const estrelas = tentativas <= n * 1.6 ? 3 : tentativas <= n * 2.4 ? 2 : 1;
    aoTerminar({
      estrelas,
      numeros: [
        { valor: String(tentativas), rotulo: 'tentativas' },
        { valor: `${n}`, rotulo: 'pares encontrados' },
        { valor: duracao(Date.now() - t0), rotulo: 'tempo' },
      ],
    });
  }

  return () => { vivo = false; window.removeEventListener('resize', tamanho); };
}

/* ================= Maior ou Menor ================= */
export function maiorMenor(alvo, { nivel, curto, aoTerminar }) {
  const total = curto ? 6 : nivel === 1 ? 8 : nivel === 2 ? 10 : 12;
  const baralho = baralhar(Array.from({ length: 52 }, (_, k) => ({ s: k % 4, r: Math.floor(k / 4) + 1 })));
  let atual = baralho.pop();
  let jogada = 0;
  let certas = 0;
  let seguidas = 0;
  let melhorSeguidas = 0;
  const t0 = Date.now();
  const largura = () => Math.min(150, Math.floor((window.innerWidth - 120) / 2));

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
        el('div', { class: 'mm-mesa' }, cartaSolta(atual, largura()), el('div', { class: 'mm-seta', 'aria-hidden': 'true' }, '➜'), cartaSolta(proxima, largura())),
        el('p', { class: 'dica' }, 'Ás é a mais baixa e o Rei a mais alta. Se sair igual, ganha na mesma!')),
      zona));
    if (!proxima) {
      zona.append(el('div', { class: 'fila-botoes' },
        el('button', { class: 'btn verde grande', type: 'button', onclick: () => apostar(1) }, '⬆ Maior'),
        el('button', { class: 'btn grande', type: 'button', onclick: () => apostar(-1) }, '⬇ Menor')));
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
