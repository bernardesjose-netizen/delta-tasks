// Arrumar Peças: caixas de madeira descem devagar e arrumam-se em linhas. Quando uma linha fica cheia,
// de ponta a ponta, desaparece. Ganha-se ao fazer o número de linhas do nível.
// É do género «blocos a cair», mas com identidade própria: caixas de madeira com as cores da app,
// um conjunto de peças diferente em cada nível (de 1 a 5 quadrados), uma sombra clara a mostrar onde a
// peça vai cair, botões grandes e um ritmo calmo.
// Desenhado com elementos HTML simples (sem imagens nem canvas): em cada passo só mudam as casas que
// mudaram, o que é leve mesmo num telemóvel fraco. Num ecrã deitado (tablet), a informação fica à
// esquerda do tabuleiro e os botões à direita, para tudo caber sem deslizar.
import { el, limpar, som, elogio, dados, verRecorde, baralhar, falar } from '../util.js';

/* ---------- Partes comuns ---------- */
const ehLeve = () => document.documentElement.classList.contains('leve') ||
  Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

function nivelValido(n) {
  const v = Math.round(Number(n) || 1);
  return Math.min(4, Math.max(1, v));
}

// Ecrã deitado (largo e baixo): os controlos vão para os lados do tabuleiro.
function ecraDeitado() {
  const w = window.innerWidth || 0;
  const h = window.innerHeight || 0;
  return w >= 480 && w >= h * 1.25;
}

// Há rato ou teclado (computador)? Só serve para explicar as teclas.
const temTeclado = () => Boolean(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);

// Guarda temporizadores e «ouvintes» globais, para os parar todos de uma vez.
function criarControlo() {
  const temporizadores = [];
  const ouvintes = [];
  const c = {
    vivo: true,
    depois(ms, f) {
      const id = setTimeout(() => {
        const k = temporizadores.indexOf(id);
        if (k >= 0) temporizadores.splice(k, 1);
        if (c.vivo) f();
      }, ms);
      temporizadores.push(id);
      return id;
    },
    cancelar(id) {
      if (!id) return;
      clearTimeout(id);
      const k = temporizadores.indexOf(id);
      if (k >= 0) temporizadores.splice(k, 1);
    },
    ouvir(alvo, tipo, f, opcoes) { alvo.addEventListener(tipo, f, opcoes); ouvintes.push([alvo, tipo, f, opcoes]); },
    acabar() {
      c.vivo = false;
      temporizadores.forEach(id => clearTimeout(id));
      temporizadores.length = 0;
      ouvintes.forEach(o => o[0].removeEventListener(o[1], o[2], o[3]));
      ouvintes.length = 0;
    },
  };
  return c;
}

// Botão que reage logo ao toque, sem esperar que o dedo se levante (toque, rato, teclado e Safari antigo).
function premir(botao, f) {
  if (window.PointerEvent) {
    botao.addEventListener('pointerdown', e => {
      if (e.button > 0) return;
      if (e.cancelable) e.preventDefault();
      f();
    });
  } else {
    let ultimoToque = 0;
    botao.addEventListener('touchstart', e => { if (e.cancelable) e.preventDefault(); ultimoToque = Date.now(); f(); }, { passive: false });
    botao.addEventListener('mousedown', e => { if (e.button > 0) return; if (Date.now() - ultimoToque > 800) f(); });
  }
  // teclado (Enter ou espaço com o botão em foco)
  botao.addEventListener('click', e => { if (e.detail === 0) f(); });
  botao.addEventListener('contextmenu', e => e.preventDefault());
}

/* ---------- As peças ---------- */
// Cores (classes .blocos-c0 a .blocos-c5): 0 verde, 1 laranja, 2 azul, 3 roxo, 4 rosa, 5 âmbar.
// Os quadrados de cada peça estão na posição em que ela aparece (deitada).
const FORMAS = {
  ponto: { cor: 5, cel: [[0, 0]] },
  dupla: { cor: 2, cel: [[0, 0], [1, 0]] },
  trio: { cor: 4, cel: [[0, 0], [1, 0], [2, 0]] },
  canto: { cor: 0, cel: [[0, 0], [0, 1], [1, 1]] },
  quadrado: { cor: 3, cel: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  barra: { cor: 1, cel: [[0, 0], [1, 0], [2, 0], [3, 0]] },
  gancho: { cor: 2, cel: [[2, 0], [0, 1], [1, 1], [2, 1]] },
  bengala: { cor: 0, cel: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  telhado: { cor: 5, cel: [[1, 0], [0, 1], [1, 1], [2, 1]] },
  degrau: { cor: 4, cel: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  bota: { cor: 1, cel: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1]] },
  esquina: { cor: 3, cel: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]] },
  vara: { cor: 2, cel: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },
};

// As 4 posições de cada peça, rodada no sentido dos ponteiros do relógio à volta do seu centro.
// Cada posição é calculada a partir da inicial (e não da anterior): rodar 4 vezes volta exatamente
// ao mesmo sítio, sem a peça «fugir» para um dos lados.
function rodarForma(base) {
  let mx = 0;
  let my = 0;
  base.forEach(c => { mx = Math.max(mx, c[0]); my = Math.max(my, c[1]); });
  const cx = mx / 2;
  const cy = my / 2;
  const estados = [];
  for (let k = 0; k < 4; k++) {
    estados.push(base.map(c => {
      let dx = c[0] - cx;
      let dy = c[1] - cy;
      for (let r = 0; r < k; r++) { const t = dx; dx = -dy; dy = t; }
      return [Math.round(cx + dx) + 0, Math.round(cy + dy) + 0];
    }));
  }
  return estados;
}
const ROT = {};
Object.keys(FORMAS).forEach(k => { ROT[k] = rodarForma(FORMAS[k].cel); });

function limites(cel) {
  const b = { minX: 99, maxX: -99, minY: 99, maxY: -99 };
  cel.forEach(c => {
    b.minX = Math.min(b.minX, c[0]); b.maxX = Math.max(b.maxX, c[0]);
    b.minY = Math.min(b.minY, c[1]); b.maxY = Math.max(b.maxY, c[1]);
  });
  return b;
}

// Tentativas quando a peça não cabe ao rodar (encostada à parede ou a outras peças): um pouco para o lado ou para cima.
const AJUSTES = [[0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0], [-1, -1], [1, -1]];

// Cada nível tem o seu tabuleiro, a sua velocidade (milissegundos por casa) e o seu saco de peças.
// O saco é baralhado e tirado até ao fim antes de se encher outra vez: as peças saem bem misturadas.
const CFG = [null,
  { cols: 7, rows: 13, passo: 1100, objetivo: 8, sombra: true,
    saco: ['ponto', 'dupla', 'dupla', 'trio', 'trio', 'canto', 'canto'] },
  { cols: 8, rows: 15, passo: 850, objetivo: 12, sombra: true,
    saco: ['dupla', 'trio', 'canto', 'canto', 'quadrado', 'barra', 'gancho', 'telhado'] },
  { cols: 9, rows: 16, passo: 650, objetivo: 16, sombra: true,
    saco: ['trio', 'canto', 'quadrado', 'barra', 'gancho', 'bengala', 'telhado', 'degrau'] },
  { cols: 10, rows: 16, passo: 480, objetivo: 20, sombra: false,
    saco: ['canto', 'quadrado', 'barra', 'gancho', 'bengala', 'telhado', 'degrau', 'bota', 'esquina', 'vara'] },
];

// Tempos (ms). Nos testes automáticos tudo é mais curto, menos a queda das peças.
const TEMPOS = { nascer: 220, limpar: 420, limparLeve: 160, ganhar: 2000, topo: 2900, bloqueio: 350, retomar: 600, elogio: 2000 };
const TEMPOS_TESTE = { nascer: 20, limpar: 60, limparLeve: 20, ganhar: 250, topo: 300, bloqueio: 0, retomar: 60, elogio: 400 };

// Medidas do tabuleiro (iguais às do CSS): moldura de madeira, folga interior e espaço entre casas.
const BORDA = 5;
const FOLGA = 2;
const ESPACO = 2;
const MOLDURA = 2 * BORDA + 2 * FOLGA - ESPACO;
const MARGEM_FUNDO = 10;

const fraseTopo = n => (n > 0
  ? `Quase! Já fez ${n} ${n === 1 ? 'linha' : 'linhas'}. Vamos outra vez?`
  : 'Boa tentativa! Vamos outra vez?');

/* =====================================================================
   Arrumar Peças
   ===================================================================== */
export function blocos(alvo, { nivel, aoTerminar, rapidoTeste }) {
  const N = nivelValido(nivel);
  const cfg = CFG[N];
  const cols = cfg.cols;
  const rows = cfg.rows;
  const T = rapidoTeste ? TEMPOS_TESTE : TEMPOS;
  const leve = ehLeve();
  const ctl = criarControlo();
  const linhaVazia = () => { const l = []; for (let c = 0; c < cols; c++) l.push(-1); return l; };
  const tab = [];
  for (let r = 0; r < rows; r++) tab.push(linhaVazia());

  let peca = null; // { tipo, rot, x, y }
  let proxima = null;
  let saco = [];
  let ultimoTipo = null;
  let estado = 'inicio'; // inicio, jogo, espera, limpar, pausa, fim
  let antesPausa = null;
  let faltaNascer = false;
  let linhas = 0;
  let pecas = 0;
  let limpezas = 0;
  let idPeca = 0;
  let nasceuEm = 0;
  let avisouTopo = false;
  let terminou = false;
  let tQueda = 0;
  let tElogio = 0;
  let deitado = null;
  const recAntes = dados.recordes ? dados.recordes[`blocos-${N}`] : null;

  limpar(alvo);
  alvo.classList.add('ecra-cheio');

  /* ---------- Ecrã ---------- */
  const elLinhas = el('b', {}, `0 de ${cfg.objetivo}`);
  const chip = el('div', { class: 'blocos-chip', 'aria-live': 'polite' }, el('span', {}, 'Linhas'), elLinhas);
  const mini = el('div', { class: 'blocos-mini', 'aria-hidden': 'true' });
  const caixaProxima = el('div', { class: 'blocos-proxima', role: 'img', 'aria-label': 'Próxima peça' }, el('small', {}, 'Próxima'), mini);
  const btnPausa = el('button', { class: 'btn claro pausa blocos-pausa', type: 'button', onclick: () => pausar() }, '⏸ Pausa');

  const casas = [];
  const classes = [];
  for (let i = 0; i < rows * cols; i++) { casas.push(el('div', { class: 'blocos-casa' })); classes.push('blocos-casa'); }
  const grelha = el('div', { class: 'blocos-grelha' }, casas);
  const elElogio = el('div', { class: 'blocos-elogio', 'aria-live': 'polite' });
  const campo = el('div', { class: `blocos-campo blocos-n${N}`, role: 'img', 'aria-label': 'Tabuleiro das peças' }, grelha, elElogio);
  const caixa = el('div', { class: 'blocos-caixa' }, campo);

  function botao(classe, rotulo, icone, texto, f) {
    const b = el('button', { class: `btn ${classe}`, type: 'button', 'aria-label': rotulo },
      el('span', { class: 'blocos-icone', 'aria-hidden': 'true' }, icone),
      texto ? el('span', { class: 'blocos-rotulo', 'aria-hidden': 'true' }, texto) : null);
    premir(b, f);
    return b;
  }
  const comandos = el('div', { class: 'blocos-comandos' },
    botao('claro blocos-seta blocos-esq', 'Mover para a esquerda', '◀', null, () => mover(-1)),
    botao('claro blocos-seta blocos-dir', 'Mover para a direita', '▶', null, () => mover(1)),
    botao('blocos-rodar', 'Rodar a peça', '↻', 'Rodar', () => rodar()),
    botao('blocos-descer', 'Descer a peça até ao fundo', '⬇', 'Descer', () => descer()));

  const sobre = el('div', { class: 'blocos-sobre', hidden: true });
  const topo = el('div', { class: 'blocos-topo' });
  const ladoEsq = el('div', { class: 'blocos-lado' });
  const ladoDir = el('div', { class: 'blocos-lado blocos-lado-comandos' });
  const ronda = el('div', { class: 'ronda blocos-jogo' });
  alvo.append(ronda);

  function painel(...filhos) {
    limpar(sobre);
    sobre.append(el('div', { class: 'blocos-cartao' }, ...filhos));
    sobre.hidden = false;
    ajustarPainel();
  }
  // Se o cartão não couber (ecrã baixo ou letra grande), a letra encolhe um pouco, até duas vezes:
  // o botão «Começar» ou «Continuar» fica sempre à vista.
  function ajustarPainel() {
    const cartao = sobre.firstChild;
    if (!cartao || sobre.hidden) return;
    cartao.classList.remove('blocos-justo', 'blocos-justo2');
    if (sobre.scrollHeight > sobre.clientHeight + 1) cartao.classList.add('blocos-justo');
    if (sobre.scrollHeight > sobre.clientHeight + 1) cartao.classList.add('blocos-justo2');
  }
  function esconderPainel() { sobre.hidden = true; limpar(sobre); }

  // Ao alto: informação em cima, tabuleiro, botões em baixo. Deitado: informação | tabuleiro | botões.
  function organizar() {
    const d = ecraDeitado();
    if (d === deitado) return;
    deitado = d;
    ronda.classList.toggle('blocos-deitado', d);
    limpar(ronda); limpar(topo); limpar(ladoEsq); limpar(ladoDir);
    if (d) {
      ladoEsq.append(chip, caixaProxima, btnPausa);
      ladoDir.append(comandos);
      ronda.append(ladoEsq, caixa, ladoDir, sobre);
    } else {
      topo.append(chip, caixaProxima, btnPausa);
      ronda.append(topo, caixa, comandos, sobre);
    }
    desenharProxima();
  }

  // O tamanho das casas vem da largura e da altura livres, para o jogo caber sem deslizar.
  function dimensionar() {
    organizar();
    const H = window.innerHeight || 600;
    const sobe = window.pageYOffset || 0;
    let p;
    if (deitado) {
      const altura = H - (ronda.getBoundingClientRect().top + sobe) - MARGEM_FUNDO;
      const largura = (ronda.clientWidth || 600) - 2 * 16 - 2 * 150; // 150 px, pelo menos, para cada lado
      p = Math.floor(Math.min((largura - MOLDURA) / cols, (altura - MOLDURA) / rows));
    } else {
      const altura = H - (caixa.getBoundingClientRect().top + sobe) - comandos.offsetHeight - 8 - MARGEM_FUNDO;
      const largura = ronda.clientWidth || 300;
      p = Math.floor(Math.min((largura - MOLDURA) / cols, (altura - MOLDURA) / rows));
    }
    p = Math.max(10, Math.min(48, p));
    const t = p - ESPACO;
    grelha.style.gridTemplateColumns = `repeat(${cols}, ${t}px)`;
    grelha.style.gridTemplateRows = `repeat(${rows}, ${t}px)`;
    campo.classList.toggle('blocos-pequeno', t < 22);
    ajustarPainel();
  }

  /* ---------- Regras ---------- */
  function cabe(tipo, rot, x, y) {
    const cel = ROT[tipo][rot];
    for (let i = 0; i < cel.length; i++) {
      const cx = x + cel[i][0];
      const cy = y + cel[i][1];
      if (cx < 0 || cx >= cols || cy >= rows) return false;
      if (cy >= 0 && tab[cy][cx] >= 0) return false;
    }
    return true;
  }
  function quedaY() {
    let y = peca.y;
    while (cabe(peca.tipo, peca.rot, peca.x, y + 1)) y++;
    return y;
  }
  function tirarDoSaco() {
    if (!saco.length) {
      saco = baralhar(cfg.saco);
      // a mesma peça não sai duas vezes seguidas na passagem de um saco para o outro
      if (saco[0] === ultimoTipo) {
        const j = saco.findIndex(t => t !== ultimoTipo);
        if (j > 0) { const t = saco[0]; saco[0] = saco[j]; saco[j] = t; }
      }
    }
    ultimoTipo = saco.shift();
    return ultimoTipo;
  }

  /* ---------- Desenho ---------- */
  function desenhar() {
    const quer = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = tab[r][c];
        quer.push(v >= 0 ? `blocos-casa blocos-cheia blocos-c${v}` : 'blocos-casa');
      }
    }
    if (peca) {
      const cor = FORMAS[peca.tipo].cor;
      const cel = ROT[peca.tipo][peca.rot];
      if (cfg.sombra && estado === 'jogo') {
        const ys = quedaY();
        if (ys !== peca.y) {
          cel.forEach(q => {
            const y = ys + q[1];
            if (y >= 0) quer[y * cols + peca.x + q[0]] = `blocos-casa blocos-sombra blocos-c${cor}`;
          });
        }
      }
      cel.forEach(q => {
        const y = peca.y + q[1];
        if (y >= 0) quer[y * cols + peca.x + q[0]] = `blocos-casa blocos-cheia blocos-ativa blocos-c${cor}`;
      });
    }
    for (let i = 0; i < quer.length; i++) {
      if (classes[i] !== quer[i]) { casas[i].className = quer[i]; classes[i] = quer[i]; }
    }
  }
  function desenharProxima() {
    limpar(mini);
    if (!proxima) return;
    const cel = ROT[proxima][0];
    const b = limites(cel);
    const w = b.maxX - b.minX + 1;
    const h = b.maxY - b.minY + 1;
    const m = deitado ? 20 : Math.max(6, Math.min(12, Math.floor((58 - (w - 1)) / w), Math.floor((33 - (h - 1)) / h)));
    mini.style.gridTemplateColumns = `repeat(${w}, ${m}px)`;
    mini.style.gridTemplateRows = `repeat(${h}, ${m}px)`;
    const cor = FORMAS[proxima].cor;
    cel.forEach(q => {
      mini.append(el('i', { class: `blocos-mini-casa blocos-c${cor}`, style: { gridColumn: String(q[0] - b.minX + 1), gridRow: String(q[1] - b.minY + 1) } }));
    });
  }
  function atualizarInfo() {
    const feitas = Math.min(linhas, cfg.objetivo);
    elLinhas.textContent = `${feitas} de ${cfg.objetivo}`;
    const pc = Math.round((feitas / cfg.objetivo) * 100);
    chip.style.background = `linear-gradient(90deg, var(--verde-claro) ${pc}%, var(--cartao) ${pc}%)`;
  }
  function mostrarElogio(texto) {
    ctl.cancelar(tElogio);
    elElogio.textContent = texto;
    elElogio.classList.add('blocos-ver');
    if (dados.def.voz) falar(texto.replace(/^[^A-Za-zÀ-ú]+/, ''));
    tElogio = ctl.depois(T.elogio, () => elElogio.classList.remove('blocos-ver'));
  }

  /* ---------- Movimentos ---------- */
  function agendarQueda(ms) { ctl.cancelar(tQueda); tQueda = ctl.depois(ms, cair); }
  function cair() {
    tQueda = 0;
    if (estado !== 'jogo' || !peca) return;
    if (cabe(peca.tipo, peca.rot, peca.x, peca.y + 1)) {
      peca.y++;
      desenhar();
      agendarQueda(cfg.passo);
    } else fixar();
  }
  function mover(dx) {
    if (estado !== 'jogo' || !peca) return;
    if (!cabe(peca.tipo, peca.rot, peca.x + dx, peca.y)) return;
    peca.x += dx;
    desenhar();
  }
  function rodar() {
    if (estado !== 'jogo' || !peca) return;
    const r = (peca.rot + 1) % 4;
    for (let k = 0; k < AJUSTES.length; k++) {
      const a = AJUSTES[k];
      if (cabe(peca.tipo, r, peca.x + a[0], peca.y + a[1])) {
        peca.rot = r;
        peca.x += a[0];
        peca.y += a[1];
        som.clique();
        desenhar();
        return;
      }
    }
  }
  // Uma casa para baixo (seta ↓ do teclado).
  function descerUma() {
    if (estado !== 'jogo' || !peca) return;
    if (cabe(peca.tipo, peca.rot, peca.x, peca.y + 1)) {
      peca.y++;
      desenhar();
      agendarQueda(cfg.passo);
    } else fixar();
  }
  // «⬇ Descer»: a peça cai já para onde está a sombra. Logo a seguir a uma peça nova aparecer,
  // um toque a mais (dois toques seguidos sem querer) não a deixa cair.
  function descer() {
    if (estado !== 'jogo' || !peca) return;
    if (Date.now() - nasceuEm < T.bloqueio) return;
    peca.y = quedaY();
    fixar();
  }

  function nascer() {
    if (!ctl.vivo || estado === 'fim') return;
    if (estado === 'pausa') { faltaNascer = true; return; }
    const tipo = proxima || tirarDoSaco();
    proxima = tirarDoSaco();
    desenharProxima();
    const b = limites(ROT[tipo][0]);
    const x = Math.floor((cols - (b.maxX - b.minX + 1)) / 2) - b.minX;
    const y = -b.minY;
    idPeca++;
    if (!cabe(tipo, 0, x, y)) { peca = null; desenhar(); chegouAoTopo(); return; }
    peca = { tipo, rot: 0, x, y };
    estado = 'jogo';
    nasceuEm = Date.now();
    desenhar();
    agendarQueda(cfg.passo);
  }

  // A peça assenta. Se encheu linhas, estas brilham, encolhem e desaparecem (no modo leve, sem animação).
  function fixar() {
    ctl.cancelar(tQueda);
    tQueda = 0;
    const cor = FORMAS[peca.tipo].cor;
    let fora = false;
    ROT[peca.tipo][peca.rot].forEach(q => {
      const x = peca.x + q[0];
      const y = peca.y + q[1];
      if (y < 0) fora = true; else tab[y][x] = cor;
    });
    peca = null;
    pecas++;
    desenhar();
    if (fora) { chegouAoTopo(); return; }
    const cheias = [];
    for (let r = 0; r < rows; r++) if (tab[r].every(v => v >= 0)) cheias.push(r);
    if (!cheias.length) {
      som.peca();
      avisarTopo();
      estado = 'espera';
      ctl.depois(T.nascer, nascer);
      return;
    }
    estado = 'limpar';
    if (cheias.length > 1) som.combo(3); else som.certo();
    if (!leve) {
      cheias.forEach(r => {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          casas[i].classList.add('blocos-sai');
          classes[i] = null;
        }
      });
    }
    ctl.depois(leve ? T.limparLeve : T.limpar, () => {
      for (let k = cheias.length - 1; k >= 0; k--) tab.splice(cheias[k], 1);
      for (let k = 0; k < cheias.length; k++) tab.unshift(linhaVazia());
      linhas += cheias.length;
      limpezas++;
      atualizarInfo();
      desenhar();
      if (linhas >= cfg.objetivo) { ganhar(); return; }
      const faltam = cfg.objetivo - linhas;
      if (faltam === 1) mostrarElogio('💪 Falta só uma linha!');
      else if (cheias.length > 1) mostrarElogio(`🎉 ${cheias.length} linhas de uma vez! ${elogio()}`);
      else if (limpezas % 3 === 1) mostrarElogio(`👏 ${elogio()}`);
      nascer();
    });
  }
  // Um aviso simpático (uma só vez) quando as peças já estão perto do topo.
  function avisarTopo() {
    if (avisouTopo) return;
    let alto = rows;
    for (let r = 0; r < rows && alto === rows; r++) if (tab[r].some(v => v >= 0)) alto = r;
    if (alto <= 3) {
      avisouTopo = true;
      mostrarElogio('Cuidado: as peças estão perto do topo!');
    }
  }

  /* ---------- Começo, pausa e fim ---------- */
  function comecar() {
    if (estado !== 'inicio') return;
    esconderPainel();
    estado = 'espera';
    btnPausa.disabled = false;
    nascer();
  }
  function pausar() {
    if (estado !== 'jogo' && estado !== 'espera' && estado !== 'limpar') return;
    antesPausa = estado;
    estado = 'pausa';
    ctl.cancelar(tQueda);
    tQueda = 0;
    btnPausa.disabled = true;
    painel(
      el('h2', {}, '⏸ Em pausa'),
      el('p', {}, 'As peças estão à espera. Descanse o tempo que quiser.'),
      el('button', { class: 'btn verde blocos-continuar', type: 'button', onclick: continuar }, '▶ Continuar'));
  }
  function continuar() {
    if (estado !== 'pausa') return;
    esconderPainel();
    btnPausa.disabled = false;
    estado = antesPausa;
    if (estado === 'jogo') {
      // um pequeno descanso antes de a peça voltar a descer
      nasceuEm = Date.now();
      agendarQueda(T.retomar + cfg.passo);
    } else if (faltaNascer) {
      faltaNascer = false;
      ctl.depois(T.retomar, nascer);
    }
  }
  function ganhar() {
    estado = 'fim';
    btnPausa.disabled = true;
    ctl.cancelar(tElogio);
    elElogio.classList.remove('blocos-ver');
    painel(
      el('h2', {}, '🎉 Conseguiu!'),
      el('p', {}, `Fez as ${cfg.objetivo} linhas. Está tudo bem arrumado!`));
    ctl.depois(T.ganhar, () => terminar(true));
  }
  function chegouAoTopo() {
    estado = 'fim';
    btnPausa.disabled = true;
    ctl.cancelar(tElogio);
    elElogio.classList.remove('blocos-ver');
    som.quase();
    painel(
      el('h2', {}, 'As peças chegaram ao topo'),
      el('p', { class: 'blocos-frase' }, fraseTopo(linhas)));
    if (dados.def.voz) falar(fraseTopo(linhas));
    ctl.depois(T.topo, () => terminar(false));
  }
  function terminar(chegou) {
    if (terminou) return;
    terminou = true;
    const rec = verRecorde(`blocos-${N}`, linhas, false);
    const estrelas = chegou ? 3 : linhas / cfg.objetivo >= 0.5 ? 2 : 1;
    aoTerminar({
      estrelas,
      titulo: chegou ? 'Arrumou tudo! 🎉' : fraseTopo(linhas),
      numeros: [
        { valor: String(linhas), rotulo: `${linhas === 1 ? 'linha feita' : 'linhas feitas'} (objetivo: ${cfg.objetivo})` },
        { valor: String(pecas), rotulo: pecas === 1 ? 'peça arrumada' : 'peças arrumadas' },
        rec.anterior != null ? { valor: String(Math.max(rec.anterior, linhas)), rotulo: 'o seu recorde de linhas' } : null,
      ].filter(Boolean),
      recorde: rec.bateu && !rec.primeiro,
    });
  }

  /* ---------- Teclado e ecrã ---------- */
  ctl.ouvir(document, 'keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key;
    const espaco = k === ' ' || k === 'Spacebar';
    // Enter ou espaço num botão em foco: quem trata é o próprio botão
    if ((espaco || k === 'Enter') && e.target && e.target.tagName === 'BUTTON') return;
    if (estado === 'inicio' && (espaco || k === 'Enter')) { e.preventDefault(); comecar(); return; }
    if (estado === 'pausa' && (espaco || k === 'Enter')) { e.preventDefault(); continuar(); return; }
    if (estado !== 'jogo') return;
    if (k === 'ArrowLeft' || k === 'Left') mover(-1);
    else if (k === 'ArrowRight' || k === 'Right') mover(1);
    else if (k === 'ArrowUp' || k === 'Up') rodar();
    else if (k === 'ArrowDown' || k === 'Down') descerUma();
    else if (espaco) descer();
    else if (k === 'p' || k === 'P' || k === 'Escape' || k === 'Esc') pausar();
    else return;
    e.preventDefault();
  });
  ctl.ouvir(document, 'visibilitychange', () => { if (document.hidden) pausar(); });
  let tRedim = 0;
  ctl.ouvir(window, 'resize', () => { ctl.cancelar(tRedim); tRedim = ctl.depois(150, dimensionar); });

  proxima = tirarDoSaco();
  dimensionar();
  atualizarInfo();
  desenhar();
  btnPausa.disabled = true;
  painel(
    el('h2', {}, '📦 Arrumar Peças'),
    el('p', {}, 'As peças descem devagar. Mova-as com ◀ ▶, vire-as com ↻ Rodar e deixe-as cair com ⬇ Descer.'),
    el('p', {}, 'Encha uma linha de ponta a ponta e ela desaparece. ', el('b', {}, `Faça ${cfg.objetivo} linhas!`)),
    el('p', {}, cfg.sombra ? 'A sombra clara mostra onde a peça vai cair.' : 'No nível Mestre não há sombra: veja bem onde a peça vai cair.'),
    temTeclado() ? el('p', {}, 'No computador: setas para mover e rodar, barra de espaço para descer.') : null,
    recAntes != null ? el('p', {}, `O seu recorde neste nível: ${recAntes} ${recAntes === 1 ? 'linha' : 'linhas'}.`) : null,
    el('button', { class: 'btn verde blocos-comecar', type: 'button', onclick: comecar }, '▶ Começar'));

  if (rapidoTeste) {
    // só para os testes automáticos (a app nunca passa esta opção)
    window.__blocos = () => ({
      estado, cols, rows, linhas, objetivo: cfg.objetivo, pecas, id: idPeca, sombra: cfg.sombra, passo: cfg.passo,
      deitado, proxima, saco: cfg.saco.slice(),
      tab: tab.map(l => l.slice()),
      peca: peca ? { tipo: peca.tipo, rot: peca.rot, x: peca.x, y: peca.y, formas: ROT[peca.tipo] } : null,
    });
  }

  return () => {
    ctl.acabar();
    alvo.classList.remove('ecra-cheio');
    if (rapidoTeste) window.__blocos = null;
  };
}
