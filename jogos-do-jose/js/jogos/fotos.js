// Jogos com fotografias: memória, «Que fotografia é?» e puzzle.
import { el, limpar, baralhar, amostra, som, elogio, aviso, falar, dados, duracao, festa, escolherNaoVistos } from '../util.js';
import { rondaEscolha } from '../motor.js';
import { memoria } from './cartas.js';

export async function carregarTemas() {
  const { TEMAS_FOTOS } = await import('../dados/fotos.js');
  return TEMAS_FOTOS;
}

function fotosDoTema(temas, id) {
  if (!id || id === 'todos') {
    // A mesma fotografia pode estar em dois temas (ex.: Torre de Belém): fica só uma vez.
    const vistas = new Set();
    return temas.flatMap(t => t.fotos.map(f => ({ ...f, tema: t.tema, temaId: t.id })))
      .filter(f => {
        const chaves = [f.fonte || f.f, `nome:${f.nome}`];
        if (chaves.some(k => vistas.has(k))) return false;
        chaves.forEach(k => vistas.add(k));
        return true;
      });
  }
  const t = temas.find(x => x.id === id) || temas[0];
  return t.fotos.map(f => ({ ...f, tema: t.tema, temaId: t.id }));
}

/* ---------- Memória de fotografias ---------- */
export async function memoriaFotos(alvo, { tema, pares, nivel, aoTerminar }) {
  const temas = await carregarTemas();
  const fotos = fotosDoTema(temas, tema);
  const itens = fotos.map(f => ({ chave: f.f, nome: f.nome, curto: f.c, foto: f.f }));
  return memoria(alvo, { nivel, aoTerminar, itens, pares: pares || (nivel === 1 ? 4 : nivel === 2 ? 6 : 8) });
}

/* ---------- Que fotografia é? ---------- */
export async function quizFotos(alvo, { tema, nivel = 1, curto, aoTerminar }) {
  const temas = await carregarTemas();
  const todas = fotosDoTema(temas, tema);
  const n = curto ? 5 : 10;
  const escolhidas = escolherNaoVistos(`qf-${tema || 'todos'}`, todas, Math.min(n, todas.length), f => f.f);
  const nOpcoes = nivel === 1 ? 3 : 4;
  const perguntas = escolhidas.map(f => {
    const mesmoTema = todas.filter(x => x.temaId === f.temaId && x.nome !== f.nome);
    const outras = amostra(mesmoTema.length >= nOpcoes - 1 ? mesmoTema : todas.filter(x => x.nome !== f.nome), nOpcoes - 1).map(x => x.nome);
    return {
      etiqueta: f.tema,
      enunciado: el('div', {},
        el('div', { class: 'centrado' }, 'O que mostra esta fotografia?'),
        el('img', { class: 'foto-quiz', src: f.f, alt: 'Fotografia para adivinhar', decoding: 'async', draggable: 'false' })),
      ler: 'O que mostra esta fotografia?',
      centrado: true,
      opcoes: [f.nome, ...new Set(outras)].slice(0, nOpcoes),
      certa: f.nome,
      explicacao: `📷 ${f.nome}.`,
    };
  });
  return rondaEscolha(alvo, { perguntas, aoTerminar });
}

/* ---------- Puzzle de fotografias ---------- */
export async function puzzle(alvo, { nivel, tema, aoTerminar }) {
  // Só temas com fotografias cheias de pormenor (num fundo branco liso as peças seriam todas iguais).
  const BONS = ['monumentos', 'patrimonio', 'cidades', 'castelos', 'aldeias', 'ilhas', 'paisagens', 'pontes', 'algarve', 'aves', 'selvagens', 'quinta', 'transportes', 'pratos', 'doces',
    'lisboa', 'porto', 'alentejo', 'norte', 'beiras', 'palacios', 'igrejas', 'farois', 'praias', 'rios', 'jardins', 'mar', 'aves-rapina', 'racas', 'pintura', 'descobrimentos', 'comboios', 'artesanato', 'leiria', 'espanha', 'ue', 'estadios'];
  const temas = (await carregarTemas()).filter(t => tema ? t.id === tema : BONS.includes(t.id));
  const [foto] = escolherNaoVistos('puzzle', fotosDoTema(temas.length ? temas : await carregarTemas(), 'todos'), 1, f => f.f);
  const n = nivel === 1 ? 2 : nivel === 2 ? 3 : 4;
  const total = n * n;
  let ordem;
  do { ordem = baralhar([...Array(total).keys()]); } while (ordem.filter((v, i) => v === i).length > (n === 2 ? 1 : n));
  let selecionada = null;
  let jogadas = 0;
  let acabado = false;
  const t0 = Date.now();

  limpar(alvo);
  const tabuleiro = el('div', { class: 'puzzle', style: { gridTemplateColumns: `repeat(${n}, 1fr)` } });
  const zona = el('div');
  const contador = el('span', {}, 'Trocas: 0');
  alvo.append(el('div', { class: 'ronda' },
    el('div', { class: 'puzzle-topo' },
      el('figure', { class: 'puzzle-modelo' }, el('img', { src: foto.f, alt: foto.nome, decoding: 'async' }), el('figcaption', {}, 'Assim fica no fim')),
      el('div', {},
        el('div', { class: 'etiqueta' }, foto.tema),
        el('p', { class: 'enunciado' }, 'Toque numa peça e depois noutra para as trocar.'),
        el('div', { class: 'info-jogo', style: { justifyContent: 'flex-start' } }, contador))),
    tabuleiro, zona));
  if (dados.def.voz) falar('Toque numa peça e depois noutra para as trocar.');

  const pecas = [];
  function desenhar() {
    ordem.forEach((p, i) => {
      const b = pecas[i];
      const col = p % n;
      const lin = Math.floor(p / n);
      b.style.backgroundPosition = `${(col / (n - 1)) * 100}% ${(lin / (n - 1)) * 100}%`;
      b.classList.toggle('no-sitio', p === i);
      b.classList.toggle('escolhida', selecionada === i);
    });
  }
  for (let i = 0; i < total; i++) {
    const b = el('button', { class: 'peca', type: 'button', 'aria-label': `Peça ${i + 1}`, onclick: () => tocar(i) });
    b.style.backgroundImage = `url("${foto.f}")`;
    b.style.backgroundSize = `${n * 100}% ${n * 100}%`;
    pecas.push(b);
    tabuleiro.append(b);
  }
  desenhar();
  // Navegadores antigos sem «aspect-ratio»: o tabuleiro fica quadrado à mão.
  const semProporcao = !(window.CSS && CSS.supports && CSS.supports('aspect-ratio', '1 / 1'));
  const quadrar = () => { tabuleiro.style.height = `${tabuleiro.offsetWidth}px`; };
  if (semProporcao) { quadrar(); window.addEventListener('resize', quadrar); }

  function tocar(i) {
    if (acabado) return;
    if (selecionada === null) { selecionada = i; som.clique(); desenhar(); return; }
    if (selecionada === i) { selecionada = null; desenhar(); return; }
    [ordem[selecionada], ordem[i]] = [ordem[i], ordem[selecionada]];
    const ficouBem = ordem[i] === i || ordem[selecionada] === selecionada;
    selecionada = null;
    jogadas++;
    contador.textContent = `Trocas: ${jogadas}`;
    if (ficouBem) som.par(); else som.carta();
    desenhar();
    if (ordem.every((v, k) => v === k)) concluir();
  }

  function concluir() {
    acabado = true;
    tabuleiro.classList.add('feito');
    som.vitoria();
    festa(['📷', '⭐', '🎉', '✨', '🌟']);
    if (dados.def.voz) falar(`Muito bem! É ${foto.nome}.`);
    const b = el('button', { class: 'btn verde grande largo', type: 'button', onclick: () => {
      const minimo = total - 1;
      aoTerminar({
        estrelas: jogadas <= minimo + 1 ? 3 : jogadas <= minimo * 1.6 + 1 ? 2 : 1,
        titulo: 'Puzzle completo!',
        numeros: [
          { valor: foto.nome, rotulo: 'a fotografia' },
          { valor: String(jogadas), rotulo: 'trocas' },
          { valor: duracao(Date.now() - t0), rotulo: 'tempo' },
        ],
      });
    } }, 'Continuar ▶');
    limpar(zona).append(
      el('div', { class: 'retorno bom' }, el('div', { class: 'icone' }, '😃'),
        el('div', {}, el('b', {}, `${elogio()} É ${foto.nome}.`), el('div', { class: 'info-extra' }, foto.tema))),
      el('div', { class: 'fila-botoes' }, b));
    aviso(`${foto.nome} ✨`, 2500);
    zona.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  return () => { if (semProporcao) window.removeEventListener('resize', quadrar); };
}
