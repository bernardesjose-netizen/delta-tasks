// Dominó tradicional (duplo-seis, 28 pedras): o jogador contra o computador.
// 7 pedras para cada um; as outras ficam no monte. Quem não tem pedra compra ao monte;
// com o monte vazio, passa. Ganha quem jogar primeiro todas as pedras («Dominó!»).
// Se o jogo fechar, ganha quem tiver menos pontos na mão.
import { el, limpar, baralhar, som, aviso, festa, dados, guardar, elogio, falar, esperar } from '../util.js';

const NOMES = ['branco', 'ás', 'duque', 'terno', 'quadra', 'quina', 'sena'];
const nomePedra = ([a, b]) => (a === b ? `duplo ${NOMES[a]}` : `${NOMES[a]} e ${NOMES[b]}`);
const pontos = mao => mao.reduce((s, [a, b]) => s + a + b, 0);

/* ---------- Desenho das pedras ---------- */
const NS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
}
// Posições das pintas numa metade de 100×100 (o seis muda de orientação).
function pintas(v, deitada) {
  const P = {
    0: [], 1: [[50, 50]], 2: [[27, 27], [73, 73]], 3: [[25, 25], [50, 50], [75, 75]],
    4: [[27, 27], [73, 27], [27, 73], [73, 73]], 5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: deitada ? [[24, 28], [50, 28], [76, 28], [24, 72], [50, 72], [76, 72]] : [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]],
  };
  return P[v];
}
export function pedraSVG([a, b], deitada) {
  const w = deitada ? 200 : 100;
  const h = deitada ? 100 : 200;
  const s = svg('svg', { viewBox: `0 0 ${w} ${h}`, class: 'pedra-svg', 'aria-hidden': 'true' });
  s.append(svg('rect', { x: 3, y: 3, width: w - 6, height: h - 6, rx: 14, fill: '#fffdf4', stroke: '#2b2b2b', 'stroke-width': 4 }));
  if (deitada) s.append(svg('line', { x1: 100, y1: 14, x2: 100, y2: 86, stroke: '#2b2b2b', 'stroke-width': 4 }));
  else s.append(svg('line', { x1: 14, y1: 100, x2: 86, y2: 100, stroke: '#2b2b2b', 'stroke-width': 4 }));
  [[a, 0], [b, 1]].forEach(([v, metade]) => {
    for (const [x, y] of pintas(v, deitada)) {
      const cx = deitada ? x + metade * 100 : x;
      const cy = deitada ? y : y + metade * 100;
      s.append(svg('circle', { cx, cy, r: 9.5, fill: '#1a1a1a' }));
    }
  });
  return s;
}

/* ---------- Inteligência do computador ---------- */
function jogadasPossiveis(mao, pontas) {
  if (!pontas) return mao.map((p, i) => ({ i, lado: 'dir' }));
  const [esq, dir] = pontas;
  const r = [];
  mao.forEach(([a, b], i) => {
    if (a === esq || b === esq) r.push({ i, lado: 'esq' });
    if ((a === dir || b === dir) && !(esq === dir && (a === esq || b === esq))) r.push({ i, lado: 'dir' });
  });
  return r;
}
function novaPonta([a, b], valor) { return a === valor ? b : a; }

function escolherJogada(nivel, mao, pontas, faltaJogador) {
  const op = jogadasPossiveis(mao, pontas);
  if (!op.length) return null;
  if (nivel === 1) return op[Math.floor(Math.random() * op.length)];
  const nota = j => {
    const [a, b] = mao[j.i];
    let n = a + b;
    if (nivel === 2) return n + (a === b ? 3 : 0);
    if (a === b) n += 6; // livrar-se dos duplos cedo
    const resto = mao.filter((_, k) => k !== j.i);
    const ponta = pontas ? novaPonta(mao[j.i], j.lado === 'esq' ? pontas[0] : pontas[1]) : b;
    const outra = pontas ? (j.lado === 'esq' ? pontas[1] : pontas[0]) : a;
    n += resto.filter(([x, y]) => x === ponta || y === ponta || x === outra || y === outra).length * 3; // guardar opções
    if (faltaJogador.has(ponta)) n += 8; // fechar o número que o jogador não tem
    if (faltaJogador.has(outra)) n += 4;
    return n;
  };
  return op.reduce((m, j) => (nota(j) > nota(m) ? j : m), op[0]);
}

/* ---------- Jogo ---------- */
export function domino(alvo, { nivel, aoTerminar }) {
  const todas = [];
  for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) todas.push([a, b]);
  const monte = baralhar(todas);
  const minha = monte.splice(0, 7);
  const dele = monte.splice(0, 7);
  const cadeia = []; // pedras na mesa, já orientadas da esquerda para a direita
  const faltaJogador = new Set();
  let vez = null;
  let passesSeguidos = 0;
  let escolhaPendente = null;
  let vivo = true;
  let acabou = false;
  const t0 = Date.now();

  limpar(alvo);
  alvo.classList.add('ecra-cheio');
  const infoDele = el('span', {});
  const infoMonte = el('span', {});
  const infoMinha = el('span', {});
  const mesa = el('div', { class: 'dom-cadeia', 'aria-live': 'polite' });
  const estado = el('div', { class: 'dom-estado' });
  const maoEl = el('div', { class: 'dom-mao', role: 'group', 'aria-label': 'As suas pedras' });
  const maoDeleEl = el('div', { class: 'dom-mao-dele', 'aria-hidden': 'true' });
  const acoes = el('div', { class: 'dom-acoes' });
  alvo.append(el('div', { class: 'dom' },
    el('div', { class: 'pac-info' }, infoDele, infoMonte, infoMinha),
    el('div', { class: 'dom-topo' }, el('span', { class: 'dom-quem' }, '🖥️ Computador'), maoDeleEl),
    el('div', { class: 'dom-mesa' }, mesa),
    estado,
    acoes,
    el('div', { class: 'dom-baixo' }, maoEl)));

  const pontas = () => (cadeia.length ? [cadeia[0][0], cadeia[cadeia.length - 1][1]] : null);

  // As pedras da mesa encolhem à medida que a fila cresce, para caber tudo sem deslizar.
  function tamanhoMesa() {
    const caixa = mesa.parentElement;
    const largura = (caixa && caixa.clientWidth) || 600;
    const altura = Math.max(140, ((caixa && caixa.clientHeight) || 260) - 16);
    const n = cadeia.length + 1.5;
    const u = Math.max(16, Math.min(40, Math.floor(Math.sqrt((largura * altura) / (n * 2.2 * 1.9)))));
    mesa.style.setProperty('--u', `${u}px`);
  }

  function desenhar(destaque) {
    // informações
    infoDele.textContent = `Computador: ${dele.length} ${dele.length === 1 ? 'pedra' : 'pedras'}`;
    infoMonte.textContent = `Monte: ${monte.length}`;
    infoMinha.textContent = `As suas: ${minha.length}`;
    limpar(maoDeleEl).append(...dele.map(() => el('span', { class: 'dom-costas' })));
    // mesa
    limpar(mesa);
    if (!cadeia.length) {
      mesa.append(el('div', { class: 'dom-vazia' }, 'A mesa está vazia'));
    } else {
      const [esq, dir] = pontas();
      mesa.append(el('span', { class: 'dom-ponta' }, `◀ ${esq}`));
      cadeia.forEach((p, k) => {
        const dobro = p[0] === p[1];
        const e = el('span', { class: `dom-peca-mesa${dobro ? ' dobro' : ''}${destaque === k ? ' nova' : ''}`, title: nomePedra(p), 'data-v': `${p[0]}-${p[1]}` }, pedraSVG(p, !dobro));
        mesa.append(e);
      });
      mesa.append(el('span', { class: 'dom-ponta' }, `${dir} ▶`));
    }
    tamanhoMesa();
    // a minha mão
    const op = vez === 'eu' && !acabou ? jogadasPossiveis(minha, pontas()) : [];
    const jogaveis = new Set(op.map(j => j.i));
    limpar(maoEl).append(...minha.map((p, i) => el('button', {
      class: `dom-peca${jogaveis.has(i) ? ' jogavel' : ''}${vez === 'eu' && !jogaveis.has(i) ? ' apagada' : ''}${escolhaPendente === i ? ' escolhida' : ''}`,
      type: 'button',
      'aria-label': `Pedra ${nomePedra(p)}${jogaveis.has(i) ? ', pode jogar' : ''}`,
      onclick: () => tocar(i),
    }, pedraSVG(p, false))));
    // ações
    limpar(acoes);
    if (acabou) return;
    if (vez === 'eu') {
      if (escolhaPendente !== null) {
        const [esq, dir] = pontas();
        acoes.append(
          el('button', { class: 'btn grande', type: 'button', onclick: () => jogar('eu', escolhaPendente, 'esq') }, `◀ Pôr na esquerda (${esq})`),
          el('button', { class: 'btn grande', type: 'button', onclick: () => jogar('eu', escolhaPendente, 'dir') }, `Pôr na direita (${dir}) ▶`),
          el('button', { class: 'btn claro', type: 'button', onclick: () => { escolhaPendente = null; desenhar(); } }, 'Escolher outra'));
      } else if (!op.length) {
        if (monte.length) acoes.append(el('button', { class: 'btn laranja grande', type: 'button', onclick: comprar }, '➕ Não tenho pedra: comprar ao monte'));
        else acoes.append(el('button', { class: 'btn laranja grande', type: 'button', onclick: passar }, 'Não tenho pedra: passar a vez'));
      } else if (nivel === 1) {
        acoes.append(el('button', { class: 'btn claro', type: 'button', onclick: sugerir }, '💡 Sugestão'));
      }
    }
  }

  function dizer(texto, falarTambem = false) {
    estado.textContent = texto;
    if (falarTambem && dados.def.voz) falar(texto);
  }

  function colocar(p, lado) {
    const ps = pontas();
    if (!ps) { cadeia.push(p); return 0; }
    if (lado === 'esq') {
      const v = ps[0];
      cadeia.unshift(p[1] === v ? [p[0], p[1]] : [p[1], p[0]]);
      return 0;
    }
    const v = ps[1];
    cadeia.push(p[0] === v ? [p[0], p[1]] : [p[1], p[0]]);
    return cadeia.length - 1;
  }

  function jogar(quem, i, lado) {
    const mao = quem === 'eu' ? minha : dele;
    const p = mao[i];
    const ps = pontas();
    if (ps) {
      const v = lado === 'esq' ? ps[0] : ps[1];
      if (p[0] !== v && p[1] !== v) return;
    }
    mao.splice(i, 1);
    const pos = colocar(p, lado);
    escolhaPendente = null;
    passesSeguidos = 0;
    som.peca();
    if (mao.length === 0) { desenhar(pos); fim(quem); return; }
    vez = quem === 'eu' ? 'ele' : 'eu';
    desenhar(pos);
    if (quem === 'eu') { dizer(`${elogio()} O computador está a pensar…`); setTimeout(vezDele, 1100); } else {
      dizer(`O computador jogou o ${nomePedra(p)}. É a sua vez!`, true);
    }
  }

  function tocar(i) {
    if (vez !== 'eu' || acabou) return;
    const op = jogadasPossiveis(minha, pontas()).filter(j => j.i === i);
    if (!op.length) {
      som.quase();
      aviso('Essa pedra não serve em nenhuma das pontas. Experimente uma das que brilham.', 2600);
      return;
    }
    const lados = [...new Set(op.map(j => j.lado))];
    if (lados.length === 1) { jogar('eu', i, lados[0]); return; }
    escolhaPendente = i;
    som.clique();
    dizer('Esta pedra serve nas duas pontas. Onde a quer pôr?');
    desenhar();
  }

  function sugerir() {
    const j = escolherJogada(3, minha, pontas(), new Set());
    if (!j) return;
    const b = maoEl.children[j.i];
    b.classList.remove('sugerida');
    void b.offsetWidth;
    b.classList.add('sugerida');
    aviso(`Experimente o ${nomePedra(minha[j.i])}.`, 2500);
  }

  function comprar() {
    if (!monte.length) return;
    const p = monte.pop();
    minha.push(p);
    const ps = pontas();
    if (ps) { faltaJogador.add(ps[0]); faltaJogador.add(ps[1]); }
    som.carta();
    const serve = jogadasPossiveis([p], ps).length > 0;
    dizer(serve ? `Comprou o ${nomePedra(p)} — e serve! Toque nela para jogar.` : `Comprou o ${nomePedra(p)}. Ainda não serve…`);
    desenhar();
  }

  function passar() {
    const ps = pontas();
    if (ps) { faltaJogador.add(ps[0]); faltaJogador.add(ps[1]); }
    passesSeguidos++;
    vez = 'ele';
    dizer('Passou a vez. O computador está a pensar…');
    desenhar();
    if (passesSeguidos >= 2) { fim(null); return; }
    setTimeout(vezDele, 1100);
  }

  async function vezDele() {
    if (!vivo || acabou) return;
    let j = escolherJogada(nivel, dele, pontas(), faltaJogador);
    let compradas = 0;
    while (!j && monte.length) {
      dele.push(monte.pop());
      compradas++;
      j = escolherJogada(nivel, dele, pontas(), faltaJogador);
    }
    if (compradas) {
      som.carta();
      dizer(`O computador comprou ${compradas} ${compradas === 1 ? 'pedra' : 'pedras'}…`);
      desenhar();
      await esperar(1000);
      if (!vivo) return;
    }
    if (!j) {
      passesSeguidos++;
      vez = 'eu';
      dizer('O computador não tem pedra e passou. É a sua vez!', true);
      desenhar();
      if (passesSeguidos >= 2) fim(null);
      return;
    }
    jogar('ele', j.i, j.lado);
  }

  function fim(quemFechou) {
    acabou = true;
    vez = null;
    const meus = pontos(minha);
    const deles = pontos(dele);
    let ganhei;
    let titulo;
    let frase;
    if (quemFechou === 'eu') { ganhei = true; titulo = 'Dominó! Ganhou!'; frase = `Jogou todas as pedras. O computador ficou com ${deles} pontos na mão.`; } else if (quemFechou === 'ele') { ganhei = false; titulo = 'Desta vez ganhou o computador'; frase = `Ficou com ${meus} pontos na mão. Para a próxima é que é!`; } else {
      ganhei = meus <= deles;
      titulo = ganhei ? 'Jogo fechado — ganhou!' : 'Jogo fechado — ganhou o computador';
      frase = `Ninguém podia jogar. Tinha ${meus} pontos na mão e o computador ${deles}.`;
    }
    const d = dados.domino || (dados.domino = { ganhos: 0, perdidos: 0 });
    if (ganhei) d.ganhos++; else d.perdidos++;
    guardar();
    desenhar();
    dizer(frase, true);
    if (ganhei) { som.vitoria(); festa(['🎲', '⭐', '🎉', '✨']); } else som.quase();
    setTimeout(() => {
      if (!vivo) return;
      const pts = ganhei ? deles : meus;
      aoTerminar({
        estrelas: ganhei ? 3 : meus - deles <= 10 ? 2 : 1,
        titulo,
        numeros: [
          { valor: `${d.ganhos} – ${d.perdidos}`, rotulo: 'vitórias suas – do computador' },
          { valor: String(pts), rotulo: ganhei ? 'pontos ganhos' : 'pontos que ficaram na mão' },
          { valor: `${Math.max(1, Math.round((Date.now() - t0) / 60000))} min`, rotulo: 'tempo' },
        ],
      });
    }, 2600);
  }

  // Começa quem tem o duplo mais alto (ou, se ninguém tiver duplos, a pedra mais alta).
  function arranque() {
    const melhor = mao => {
      let k = -1;
      mao.forEach((p, i) => {
        const v = (p[0] === p[1] ? 100 : 0) + p[0] + p[1];
        const atual = k < 0 ? -1 : (mao[k][0] === mao[k][1] ? 100 : 0) + mao[k][0] + mao[k][1];
        if (v > atual) k = i;
      });
      return k;
    };
    const im = melhor(minha);
    const ie = melhor(dele);
    const valor = (m, i) => (m[i][0] === m[i][1] ? 100 : 0) + m[i][0] + m[i][1];
    const comecoEu = valor(minha, im) > valor(dele, ie);
    const quem = comecoEu ? 'eu' : 'ele';
    const p = comecoEu ? minha[im] : dele[ie];
    dizer(comecoEu ? `Começa o ${dados.nome || 'jogador'}, com o ${nomePedra(p)}!` : `Começa o computador, com o ${nomePedra(p)}.`, true);
    vez = null; // ninguém toca nas pedras enquanto se anuncia quem começa
    desenhar();
    setTimeout(() => { if (vivo) jogar(quem, comecoEu ? im : ie, 'dir'); }, 1600);
  }

  const aoRedimensionar = () => tamanhoMesa();
  window.addEventListener('resize', aoRedimensionar);
  vez = null;
  desenhar();
  setTimeout(arranque, 400);

  return () => {
    vivo = false;
    window.removeEventListener('resize', aoRedimensionar);
    alvo.classList.remove('ecra-cheio');
  };
}
