// Sopa de letras e palavra baralhada.
import {
  el, limpar, baralhar, escolher, amostra, semAcentos, som, elogio, aviso, falar, dados, duracao, escolherNaoVistos, estrelasPorPercentagem, calar,
} from '../util.js';

/* ================= Sopa de letras ================= */
const CONFIG = {
  1: { lado: 8, palavras: 6, dirs: [[0, 1], [1, 0]] },
  2: { lado: 10, palavras: 8, dirs: [[0, 1], [1, 0], [1, 1]] },
  3: { lado: 11, palavras: 10, dirs: [[0, 1], [1, 0], [1, 1], [-1, 1]] },
};
// Letras de enchimento com frequência parecida à do português.
const ENCHER = 'AAAAAEEEEEOOOOSSSRRRIIINNNDDMMUUTTCCLLPPVGHQBFZJX';
const CORES = ['#1d5fd1', '#1a7f45', '#c2337a', '#6d3fd0', '#b45309', '#0e7490', '#be123c', '#4d7c0f', '#7c2d12', '#334155'];

function gerarGrelha(palavras, lado, dirs) {
  for (let tentativa = 0; tentativa < 60; tentativa++) {
    const g = Array.from({ length: lado }, () => Array(lado).fill(''));
    const colocadas = [];
    let ok = true;
    for (const p of [...palavras].sort((a, b) => b.limpa.length - a.limpa.length)) {
      const w = p.limpa;
      let colocada = false;
      for (let t = 0; t < 300 && !colocada; t++) {
        const [dr, dc] = escolher(dirs);
        const r0 = Math.floor(Math.random() * lado);
        const c0 = Math.floor(Math.random() * lado);
        const r1 = r0 + dr * (w.length - 1);
        const c1 = c0 + dc * (w.length - 1);
        if (r1 < 0 || r1 >= lado || c1 < 0 || c1 >= lado) continue;
        let cabe = true;
        for (let k = 0; k < w.length; k++) {
          const x = g[r0 + dr * k][c0 + dc * k];
          if (x && x !== w[k]) { cabe = false; break; }
        }
        if (!cabe) continue;
        for (let k = 0; k < w.length; k++) g[r0 + dr * k][c0 + dc * k] = w[k];
        colocadas.push({ ...p, r0, c0, r1, c1 });
        colocada = true;
      }
      if (!colocada) { ok = false; break; }
    }
    if (!ok) continue;
    for (const linha of g) for (let c = 0; c < lado; c++) if (!linha[c]) linha[c] = escolher(ENCHER);
    return { g, colocadas };
  }
  return null;
}

function celulasEntre(r0, c0, r1, c1) {
  const dr = Math.sign(r1 - r0);
  const dc = Math.sign(c1 - c0);
  const n = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0));
  if (!(r0 === r1 || c0 === c1 || Math.abs(r1 - r0) === Math.abs(c1 - c0))) return null;
  return Array.from({ length: n + 1 }, (_, k) => [r0 + dr * k, c0 + dc * k]);
}

export async function sopa(alvo, { nivel, curto, aoTerminar }) {
  const { SOPA_TEMAS } = await import('../dados/conteudos.js');
  const cfg = { ...CONFIG[nivel] };
  if (curto) cfg.palavras = Math.max(5, cfg.palavras - 2);
  const t0 = Date.now();
  let ajudas = 0;

  const [tema] = escolherNaoVistos('sopa', SOPA_TEMAS, 1, t => t.tema);
  const candidatas = tema.palavras
    .map(p => ({ texto: p, limpa: semAcentos(p).toUpperCase() }))
    .filter(p => p.limpa.length >= 3 && p.limpa.length <= cfg.lado && /^[A-Z]+$/.test(p.limpa));
  let grelha = null;
  for (let t = 0; t < 10 && !grelha; t++) grelha = gerarGrelha(amostra(candidatas, cfg.palavras), cfg.lado, cfg.dirs);
  if (!grelha) grelha = gerarGrelha(amostra(candidatas.filter(p => p.limpa.length <= 6), cfg.palavras), cfg.lado, cfg.dirs);
  const { g, colocadas } = grelha;

  limpar(alvo);
  const n = cfg.lado;
  const tabuleiro = el('div', { class: 'sopa', style: { '--n': n }, role: 'grid', 'aria-label': 'Sopa de letras' });
  tabuleiro.style.setProperty('--n', n);
  const cels = [];
  for (let r = 0; r < n; r++) {
    cels.push([]);
    for (let c = 0; c < n; c++) {
      const d = el('div', { class: 'cel', 'data-r': r, 'data-c': c }, g[r][c]);
      cels[r].push(d);
      tabuleiro.append(d);
    }
  }
  const itens = colocadas.map(p => el('li', {}, p.texto));
  const lista = el('ul', { class: 'lista-palavras', 'aria-label': 'Palavras a encontrar' }, itens);
  const contador = el('div', { class: 'info-jogo' }, el('span', {}, `Encontradas: 0 de ${colocadas.length}`));
  const direcoes = nivel === 1 ? 'As palavras estão na horizontal (→) ou na vertical (↓).'
    : nivel === 2 ? 'As palavras estão na horizontal, na vertical ou na diagonal (↘).'
      : 'Horizontal, vertical e nas duas diagonais (↘ ↗). Nunca de trás para a frente.';
  const btnAjuda = el('button', { class: 'btn claro', type: 'button', onclick: ajuda }, '💡 Dar uma ajuda');
  alvo.append(el('div', { class: 'sopa-wrap' },
    tabuleiro,
    el('div', { class: 'sopa-lado' },
      el('div', { class: 'sopa-tema' }, `${tema.emoji} ${tema.tema}`),
      contador, lista, btnAjuda,
      el('p', { class: 'dica' }, 'Toque na primeira letra e depois na última letra da palavra. Também pode arrastar o dedo.'),
      el('p', { class: 'dica' }, direcoes))));

  aviso('Toque na primeira letra de uma palavra e depois na última.', 3800);
  const achadas = new Set();
  let inicio = null;
  let arrasto = null;
  let selecaoAtual = [];

  function pintarSelecao(cells) {
    selecaoAtual.forEach(([r, c]) => cels[r][c].classList.remove('sel'));
    selecaoAtual = cells || [];
    selecaoAtual.forEach(([r, c]) => cels[r][c].classList.add('sel'));
  }

  function tentar(r0, c0, r1, c1) {
    const cells = celulasEntre(r0, c0, r1, c1);
    if (!cells) return false;
    // Aceita a palavra onde quer que as letras a formem (pode aparecer mais do que uma vez por acaso).
    const texto = cells.map(([r, c]) => g[r][c]).join('');
    const aoContrario = [...texto].reverse().join('');
    let idx = colocadas.findIndex((p, i) => !achadas.has(i) && (
      (p.r0 === r0 && p.c0 === c0 && p.r1 === r1 && p.c1 === c1) || (p.r0 === r1 && p.c0 === c1 && p.r1 === r0 && p.c1 === c0)));
    if (idx < 0) idx = colocadas.findIndex((p, i) => !achadas.has(i) && (p.limpa === texto || p.limpa === aoContrario));
    if (idx < 0) return false;
    achadas.add(idx);
    const cor = CORES[achadas.size % CORES.length];
    cells.forEach(([r, c]) => { cels[r][c].classList.add('achada'); cels[r][c].style.background = cor; });
    itens[idx].classList.add('achada');
    itens[idx].style.background = cor;
    contador.firstChild.textContent = `Encontradas: ${achadas.size} de ${colocadas.length}`;
    som.certo();
    aviso(`${elogio()} Encontrou «${colocadas[idx].texto}».`, 2000);
    if (dados.def.voz) falar(colocadas[idx].texto);
    if (achadas.size === colocadas.length) setTimeout(fim, 900);
    return true;
  }

  function celDe(e) {
    const t = document.elementFromPoint(e.clientX, e.clientY);
    const d = t && t.closest && t.closest('.cel');
    if (!d || !tabuleiro.contains(d)) return null;
    return [Number(d.dataset.r), Number(d.dataset.c)];
  }

  function limparInicio() {
    if (inicio) cels[inicio[0]][inicio[1]].classList.remove('inicio');
    inicio = null;
  }

  tabuleiro.addEventListener('pointerdown', e => {
    const p = celDe(e);
    if (!p) return;
    e.preventDefault();
    arrasto = { de: p, moveu: false };
  });
  tabuleiro.addEventListener('pointermove', e => {
    if (!arrasto) return;
    const p = celDe(e);
    if (!p) return;
    if (p[0] !== arrasto.de[0] || p[1] !== arrasto.de[1]) arrasto.moveu = true;
    if (arrasto.moveu) pintarSelecao(celulasEntre(arrasto.de[0], arrasto.de[1], p[0], p[1]));
  });
  const largar = e => {
    if (!arrasto) return;
    const p = celDe(e) || arrasto.de;
    const { de, moveu } = arrasto;
    arrasto = null;
    pintarSelecao(null);
    if (moveu) {
      limparInicio();
      if (!tentar(de[0], de[1], p[0], p[1])) som.quase();
      return;
    }
    // toque simples: primeiro toque marca o início, segundo toque marca o fim
    if (!inicio) {
      inicio = p;
      cels[p[0]][p[1]].classList.add('inicio');
      som.clique();
      return;
    }
    if (inicio[0] === p[0] && inicio[1] === p[1]) { limparInicio(); return; }
    const [r0, c0] = inicio;
    limparInicio();
    if (!tentar(r0, c0, p[0], p[1])) {
      som.quase();
      aviso('Essa não é uma das palavras. Experimente outra vez!', 2200);
    }
  };
  tabuleiro.addEventListener('pointerup', largar);
  tabuleiro.addEventListener('pointercancel', () => { arrasto = null; pintarSelecao(null); });

  function ajuda() {
    const falta = colocadas.findIndex((_, i) => !achadas.has(i));
    if (falta < 0) return;
    ajudas++;
    const p = colocadas[falta];
    const d = cels[p.r0][p.c0];
    d.classList.remove('pista');
    void d.offsetWidth;
    d.classList.add('pista');
    setTimeout(() => d.classList.remove('pista'), 1600);
    aviso(`A palavra «${p.texto}» começa na letra que está a piscar.`, 3000);
  }

  function fim() {
    const estrelas = ajudas === 0 ? 3 : ajudas <= 2 ? 2 : 1;
    aoTerminar({
      estrelas,
      numeros: [
        { valor: `${colocadas.length}`, rotulo: 'palavras encontradas' },
        { valor: duracao(Date.now() - t0), rotulo: 'tempo' },
        { valor: String(ajudas), rotulo: ajudas === 1 ? 'ajuda' : 'ajudas' },
      ],
    });
  }

  return () => {};
}

/* ================= Palavra baralhada ================= */
export async function anagramas(alvo, { nivel, curto, aoTerminar }) {
  const { ANAGRAMAS } = await import('../dados/conteudos.js');
  const total = curto ? 3 : 6;
  const lista = escolherNaoVistos(`anag${nivel}`, ANAGRAMAS.filter(a => a.n === nivel), total, a => a.palavra);
  let i = 0;
  let pontos = 0;
  let aPrimeira = 0;
  const t0 = Date.now();
  let vivo = true;

  function mostrar() {
    if (!vivo) return;
    const { palavra, dica } = lista[i];
    const letrasCertas = [...palavra];
    let baralhadas;
    do { baralhadas = baralhar(letrasCertas); } while (baralhadas.join('') === palavra && new Set(letrasCertas).size > 1);
    const colocadas = []; // índices das peças usadas, por ordem
    let ajudasUsadas = 0;
    let erros = 0;
    let terminado = false;

    limpar(alvo);
    const casas = letrasCertas.map(() => el('div', { class: 'casa' }, ''));
    const pecas = baralhadas.map((l, k) => el('button', { class: 'letra', type: 'button', onclick: () => usar(k) }, l));
    const zonaRetorno = el('div');
    const btnApagar = el('button', { class: 'btn claro', type: 'button', onclick: apagar }, '⌫ Apagar');
    const btnAjuda = el('button', { class: 'btn claro', type: 'button', onclick: ajudar }, '💡 Ajuda');
    const btnMostrar = el('button', { class: 'btn claro', type: 'button', onclick: () => revelar(false) }, '👀 Mostrar');
    alvo.append(el('div', { class: 'ronda' },
      el('div', { class: 'progresso' }, el('span', {}, `${i + 1} de ${lista.length}`),
        el('div', { class: 'barra' }, el('i', { style: { width: `${(i / lista.length) * 100}%` } }))),
      el('div', { class: 'cartao-pergunta' },
        el('div', { class: 'etiqueta' }, 'Palavra baralhada'),
        el('div', { class: 'enunciado centrado' }, 'Ponha as letras pela ordem certa'),
        el('p', { class: 'dica' }, `Pista: ${dica}`),
        el('div', { class: 'casas' }, casas),
        el('div', { class: 'letras' }, pecas)),
      el('div', { class: 'fila-botoes' }, btnApagar, btnAjuda, btnMostrar),
      zonaRetorno));
    if (dados.def.voz) falar(`Pista: ${dica}`);

    function desenhar() {
      casas.forEach((c, k) => {
        c.textContent = colocadas[k] != null ? baralhadas[colocadas[k]] : '';
        c.classList.toggle('ajuda', k < ajudasUsadas);
      });
      pecas.forEach((p, k) => { p.disabled = colocadas.includes(k); });
    }
    function usar(k) {
      if (terminado || colocadas.includes(k)) return;
      som.clique();
      colocadas.push(k);
      desenhar();
      if (colocadas.length === letrasCertas.length) verificar();
    }
    function apagar() {
      if (terminado || colocadas.length <= ajudasUsadas) return;
      colocadas.pop();
      desenhar();
      limpar(zonaRetorno);
    }
    function ajudar() {
      if (terminado) return;
      // mantém só as letras certas do início e acrescenta a próxima letra certa
      let k = 0;
      while (k < colocadas.length && baralhadas[colocadas[k]] === letrasCertas[k]) k++;
      colocadas.length = k;
      const proxima = baralhadas.findIndex((l, idx) => l === letrasCertas[k] && !colocadas.includes(idx));
      if (proxima < 0) return;
      colocadas.push(proxima);
      ajudasUsadas = Math.max(ajudasUsadas, colocadas.length);
      desenhar();
      if (colocadas.length === letrasCertas.length) verificar();
    }
    function verificar() {
      const feita = colocadas.map(k => baralhadas[k]).join('');
      if (feita === palavra) {
        terminado = true;
        som.certo();
        const ganho = ajudasUsadas === 0 && erros === 0 ? 1 : 0.5;
        pontos += ganho;
        if (ganho === 1) aPrimeira++;
        casas.forEach(c => { c.style.background = 'var(--verde-claro)'; });
        seguinte('bom', '😃', elogio(), `A palavra é «${palavra}».`);
        return;
      }
      erros++;
      som.quase();
      limpar(zonaRetorno).append(el('div', { class: 'retorno quase' }, el('div', { class: 'icone' }, '🤔'),
        el('div', {}, el('b', {}, 'Quase! Essa ordem não dá a palavra.'), el('div', { class: 'info-extra' }, 'Carregue em «Apagar» ou peça uma ajuda.'))));
      setTimeout(() => { if (!terminado) { colocadas.length = ajudasUsadas; desenhar(); } }, 1200);
    }
    function revelar() {
      if (terminado) return;
      terminado = true;
      colocadas.length = 0;
      letrasCertas.forEach((l, k) => {
        colocadas[k] = baralhadas.findIndex((x, idx) => x === l && !colocadas.slice(0, k).includes(idx));
      });
      desenhar();
      seguinte('info', '💡', 'Não faz mal! Fica para a próxima.', `A palavra era «${palavra}».`);
    }
    function seguinte(tipo, icone, titulo, extra) {
      [btnApagar, btnAjuda, btnMostrar].forEach(b => { b.disabled = true; });
      const b = el('button', { class: 'btn verde grande largo', type: 'button', onclick: avancar }, i + 1 < lista.length ? 'Continuar ▶' : 'Ver resultado ▶');
      limpar(zonaRetorno).append(
        el('div', { class: `retorno ${tipo}` }, el('div', { class: 'icone' }, icone), el('div', {}, el('b', {}, titulo), el('div', { class: 'info-extra' }, extra))),
        el('div', { class: 'fila-botoes' }, b));
      b.focus({ preventScroll: true });
      zonaRetorno.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function avancar() {
    i++;
    if (i < lista.length) { mostrar(); return; }
    aoTerminar({
      estrelas: estrelasPorPercentagem(pontos / lista.length),
      numeros: [
        { valor: `${aPrimeira} de ${lista.length}`, rotulo: 'sem ajudas' },
        { valor: duracao(Date.now() - t0), rotulo: 'tempo' },
      ],
    });
  }

  mostrar();
  return () => { vivo = false; calar(); };
}

/* ================= Lembra-se? (memória de figuras) ================= */
const FIGURAS = ['🍎', '🐟', '⭐', '🌻', '🐱', '🚗', '🎈', '🍌', '🐔', '⚽', '🌳', '🐶', '🦋', '🎁', '🍓', '🐑', '☂️', '🔑', '🎩', '📚', '⏰', '🚲', '🍇', '🐢', '🍋', '🎺', '🏠', '⚓', '🌙', '🧀'];

export function lembrar(alvo, { nivel, curto, aoTerminar }) {
  const [quantas, opcoesN, segundos] = nivel === 1 ? [3, 6, 5] : nivel === 2 ? [4, 8, 6] : [5, 10, 7];
  const rondas = curto ? 3 : 5;
  let ronda = 0;
  let pontos = 0;
  let perfeitas = 0;
  const t0 = Date.now();
  let temporizador = null;
  let vivo = true;

  function mostrar() {
    if (!vivo) return;
    const escolhidas = amostra(FIGURAS, quantas);
    limpar(alvo);
    const barraTempo = el('i', {});
    alvo.append(el('div', { class: 'ronda' },
      el('div', { class: 'progresso' }, el('span', {}, `${ronda + 1} de ${rondas}`),
        el('div', { class: 'barra' }, el('i', { style: { width: `${(ronda / rondas) * 100}%` } }))),
      el('div', { class: 'cartao-pergunta' },
        el('div', { class: 'etiqueta' }, 'Lembra-se?'),
        el('div', { class: 'enunciado centrado' }, `Olhe bem para estas ${quantas} figuras e tente decorá-las.`),
        el('div', { class: 'figuras' }, escolhidas.map(f => el('div', { class: 'figura', 'aria-hidden': 'true' }, f))),
        el('div', { class: 'contagem' }, barraTempo)),
      el('div', { class: 'fila-botoes' }, el('button', { class: 'btn verde grande', type: 'button', onclick: perguntar }, 'Já decorei ▶'))));
    if (dados.def.voz) falar('Olhe bem para estas figuras e tente decorá-las.');
    requestAnimationFrame(() => {
      barraTempo.style.transitionDuration = `${segundos}s`;
      requestAnimationFrame(() => { barraTempo.style.width = '0%'; });
    });
    clearTimeout(temporizador);
    temporizador = setTimeout(perguntar, segundos * 1000 + 300);

    function perguntar() {
      clearTimeout(temporizador);
      if (!vivo) return;
      const opcoes = baralhar([...escolhidas, ...amostra(FIGURAS.filter(f => !escolhidas.includes(f)), opcoesN - quantas)]);
      const marcadas = new Set();
      limpar(alvo);
      const zonaRetorno = el('div');
      const btnConfirmar = el('button', { class: 'btn verde grande', type: 'button', disabled: true, onclick: confirmar }, 'Confirmar ✔');
      const botoes = opcoes.map(f => el('button', {
        class: 'figura', type: 'button', 'aria-pressed': 'false',
        onclick: e => {
          const b = e.currentTarget;
          if (btnConfirmar.dataset.feito) return;
          if (marcadas.has(f)) marcadas.delete(f);
          else if (marcadas.size < quantas) marcadas.add(f);
          else { aviso(`Só pode escolher ${quantas}. Toque numa figura marcada para a desmarcar.`); return; }
          som.clique();
          b.classList.toggle('marcada', marcadas.has(f));
          b.setAttribute('aria-pressed', String(marcadas.has(f)));
          btnConfirmar.disabled = marcadas.size !== quantas;
          btnConfirmar.textContent = marcadas.size === quantas ? 'Confirmar ✔' : `Escolha mais ${quantas - marcadas.size}`;
        },
      }, f));
      btnConfirmar.textContent = `Escolha ${quantas}`;
      alvo.append(el('div', { class: 'ronda' },
        el('div', { class: 'progresso' }, el('span', {}, `${ronda + 1} de ${rondas}`),
          el('div', { class: 'barra' }, el('i', { style: { width: `${(ronda / rondas) * 100}%` } }))),
        el('div', { class: 'cartao-pergunta' },
          el('div', { class: 'etiqueta' }, 'Lembra-se?'),
          el('div', { class: 'enunciado centrado' }, `Quais eram as ${quantas} figuras? Toque nelas.`),
          el('div', { class: 'figuras' }, botoes)),
        el('div', { class: 'fila-botoes' }, btnConfirmar),
        zonaRetorno));
      if (dados.def.voz) falar(`Quais eram as ${quantas} figuras?`);

      function confirmar() {
        btnConfirmar.dataset.feito = '1';
        btnConfirmar.disabled = true;
        let certas = 0;
        botoes.forEach((b, k) => {
          const f = opcoes[k];
          const era = escolhidas.includes(f);
          if (era && marcadas.has(f)) { b.classList.add('certa'); certas++; } else if (era) b.classList.add('falhou');
          else if (marcadas.has(f)) b.classList.add('errada');
        });
        pontos += certas / quantas;
        if (certas === quantas) perfeitas++;
        const tudo = certas === quantas;
        if (tudo) som.certo(); else som.quase();
        const b = el('button', { class: 'btn verde grande largo', type: 'button', onclick: avancar }, ronda + 1 < rondas ? 'Continuar ▶' : 'Ver resultado ▶');
        limpar(zonaRetorno).append(
          el('div', { class: `retorno ${tudo ? 'bom' : 'info'}` }, el('div', { class: 'icone' }, tudo ? '😃' : '💡'),
            el('div', {}, el('b', {}, tudo ? elogio() : `Acertou ${certas} de ${quantas}. Boa memória!`),
              tudo ? null : el('div', { class: 'info-extra' }, 'As que faltaram estão marcadas a amarelo.'))),
          el('div', { class: 'fila-botoes' }, b));
        b.focus({ preventScroll: true });
        zonaRetorno.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  function avancar() {
    ronda++;
    if (ronda < rondas) { mostrar(); return; }
    aoTerminar({
      estrelas: estrelasPorPercentagem(pontos / rondas),
      numeros: [
        { valor: `${perfeitas} de ${rondas}`, rotulo: 'rondas perfeitas' },
        { valor: duracao(Date.now() - t0), rotulo: 'tempo' },
      ],
    });
  }

  mostrar();
  return () => { vivo = false; clearTimeout(temporizador); calar(); };
}
