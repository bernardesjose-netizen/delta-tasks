// Jogos do José — navegação, menus, Treino do Dia, progresso e definições.
import {
  el, limpar, dados, guardar, registarJogo, diasSeguidos, hojeISO, dataPorExtenso, fraseFinal, festa, som, calar,
  geradorSemente, vozDisponivel, aviso,
} from './util.js';

const NIVEIS = [
  null,
  { nome: 'Tranquilo', icone: '🌱' },
  { nome: 'Normal', icone: '🌿' },
  { nome: 'Desafio', icone: '🌳' },
];

const cerebro = nome => () => import('./jogos/cerebro.js').then(m => m[nome]);
const palavras = nome => () => import('./jogos/palavras.js').then(m => m[nome]);
const cartas = nome => () => import('./jogos/cartas.js').then(m => m[nome]);
const fotos = nome => () => import('./jogos/fotos.js').then(m => m[nome]);
const desenhos = nome => () => import('./jogos/desenhos.js').then(m => m[nome]);

const JOGOS = {
  memfotos: {
    seccao: 'fotos', nome: 'Memória de Fotografias', icone: '🖼️', cor: '#2e7d32', tema: true,
    desc: 'Pares de fotografias: Sporting, Algarve, monumentos e muito mais.',
    ajuda: 'Escolha um tema e quantas fotografias quer. Depois vire duas cartas de cada vez e encontre os pares.',
    niveis: ['4 pares.', '6 pares.', '8 pares.'],
    carregar: fotos('memoriaFotos'),
  },
  quizfotos: {
    seccao: 'fotos', nome: 'Que Fotografia É?', icone: '📷', cor: '#00796b', tema: true,
    desc: 'Veja a fotografia e diga o que é.',
    ajuda: 'Aparece uma fotografia e escolhe o nome certo. Pode escolher o tema que preferir.',
    niveis: ['3 opções.', '4 opções.', '4 opções.'],
    carregar: fotos('quizFotos'),
  },
  puzzle: {
    seccao: 'fotos', nome: 'Puzzle de Fotografias', icone: '🧩', cor: '#558b2f',
    desc: 'Troque as peças e descubra uma fotografia de Portugal.',
    ajuda: 'Toque numa peça e depois noutra para as trocar de lugar. As peças no sítio certo ficam com um contorno verde.',
    niveis: ['4 peças grandes.', '9 peças.', '16 peças.'],
    carregar: fotos('puzzle'),
  },
  paciencia: {
    seccao: 'cartas', nome: 'Paciência', icone: '🃏', cor: '#1a7f45',
    desc: 'O clássico das cartas. Todos os jogos têm solução!',
    ajuda: 'Toque numa carta e ela vai sozinha para o melhor sítio. Também pode arrastá-la. Pode desfazer sempre que quiser.',
    niveis: ['Todas as cartas à vista. Tira-se 1 carta de cada vez.', 'A paciência de sempre. Tira-se 1 carta de cada vez.', 'Tiram-se 3 cartas de cada vez, como antigamente.'],
    carregar: () => import('./jogos/paciencia.js').then(m => m.paciencia),
  },
  memoria: {
    seccao: 'cartas', nome: 'Jogo da Memória', icone: '🎴', cor: '#1d5fd1',
    desc: 'Vire as cartas e encontre os pares iguais.',
    ajuda: 'Vire duas cartas de cada vez. Se forem iguais, ficam viradas. Se não, voltam a esconder-se — tente lembrar-se onde estavam!',
    niveis: ['6 pares de cartas.', '8 pares de cartas.', '10 pares de cartas.'],
    carregar: cartas('memoria'),
  },
  maiormenor: {
    seccao: 'cartas', nome: 'Maior ou Menor', icone: '🔼', cor: '#c2337a',
    desc: 'Adivinhe se a próxima carta é maior ou menor.',
    ajuda: 'Veja a carta e diga se a próxima vai ser maior ou menor. Se sair igual, ganha na mesma.',
    niveis: ['8 cartas.', '10 cartas.', '12 cartas.'],
    carregar: cartas('maiorMenor'),
  },
  contas: {
    seccao: 'cabeca', nome: 'Contas de Cabeça', icone: '➕', cor: '#e8590c',
    desc: 'Somas, subtrações e tabuadas com o teclado grande.',
    ajuda: 'Faça a conta de cabeça e escreva o resultado no teclado. Depois carregue em OK.',
    niveis: ['Somas e subtrações até 20.', 'Contas até 100 e tabuadas fáceis.', 'Tabuadas e divisões.'],
    carregar: cerebro('contas'),
  },
  quiz: {
    seccao: 'cabeca', nome: 'Cultura Geral', icone: '🌍', cor: '#1d5fd1',
    desc: 'Portugal, história, desporto, música, cozinha e muito mais.',
    ajuda: 'Escolha a resposta certa. Se errar, pode tentar outra vez. No fim de cada pergunta há uma curiosidade.',
    niveis: ['Perguntas fáceis, com 3 opções.', 'Perguntas do dia a dia, com 4 opções.', 'Perguntas para quem sabe muito!'],
    carregar: cerebro('quiz'),
  },
  sopa: {
    seccao: 'cabeca', nome: 'Sopa de Letras', icone: '🔤', cor: '#6d3fd0',
    desc: 'Encontre as palavras escondidas na grelha.',
    ajuda: 'Toque na primeira letra da palavra e depois na última. Também pode arrastar o dedo por cima das letras.',
    niveis: ['Grelha pequena, palavras na horizontal e na vertical.', 'Grelha média, também na diagonal.', 'Grelha grande, em todas as diagonais.'],
    carregar: palavras('sopa'),
  },
  proverbios: {
    seccao: 'cabeca', nome: 'Provérbios', icone: '💬', cor: '#b45309',
    desc: 'Complete os ditados populares portugueses.',
    ajuda: 'Leia o início do provérbio e escolha como acaba. Algumas opções são para rir!',
    niveis: ['Os provérbios mais conhecidos.', 'Provérbios do dia a dia.', 'Provérbios de quem sabe muito.'],
    carregar: cerebro('proverbios'),
  },
  adivinhas: {
    seccao: 'cabeca', nome: 'Adivinhas', icone: '🤔', cor: '#0e7490',
    desc: 'O que é, o que é? Adivinhas para puxar pela cabeça.',
    ajuda: 'Leia a adivinha com calma e escolha a resposta.',
    niveis: ['Adivinhas fáceis.', 'Adivinhas médias.', 'Adivinhas com rasteira!'],
    carregar: cerebro('adivinhas'),
  },
  intruso: {
    seccao: 'cabeca', nome: 'Qual é o Intruso?', icone: '🕵️', cor: '#be123c',
    desc: 'Descubra o que não pertence ao grupo.',
    ajuda: 'Há quatro coisas e uma delas não tem nada a ver com as outras. Qual é?',
    niveis: ['Intrusos fáceis de ver.', 'É preciso pensar um bocadinho.', 'Intrusos bem escondidos.'],
    carregar: cerebro('intruso'),
  },
  sequencias: {
    seccao: 'cabeca', nome: 'Sequências', icone: '🔢', cor: '#4d7c0f',
    desc: 'Que número vem a seguir?',
    ajuda: 'Descubra a regra da sequência e escolha o número que vem a seguir.',
    niveis: ['Saltos pequenos (de 1, 2, 5, 10…).', 'Saltos maiores e números a dobrar.', 'Sequências com truque.'],
    carregar: cerebro('sequencias'),
  },
  anagramas: {
    seccao: 'cabeca', nome: 'Palavra Baralhada', icone: '🔀', cor: '#7c2d12',
    desc: 'Ponha as letras pela ordem certa.',
    ajuda: 'Toque nas letras pela ordem certa para formar a palavra. Há uma pista para ajudar.',
    niveis: ['Palavras de 4 e 5 letras.', 'Palavras de 6 e 7 letras.', 'Palavras de 8 e 9 letras.'],
    carregar: palavras('anagramas'),
  },
  relogio: {
    seccao: 'cabeca', nome: 'Que Horas São?', icone: '🕒', cor: '#334155',
    desc: 'Leia as horas no relógio de ponteiros.',
    ajuda: 'O ponteiro pequeno (preto) marca as horas e o grande (laranja) marca os minutos.',
    niveis: ['Horas certas e meias horas.', 'Também os quartos de hora.', 'De 5 em 5 minutos.'],
    carregar: cerebro('relogio'),
  },
  mercado: {
    seccao: 'cabeca', nome: 'Contas do Mercado', icone: '🛒', cor: '#15803d',
    desc: 'Trocos e compras em euros.',
    ajuda: 'Faça as contas das compras e escolha o valor certo.',
    niveis: ['Trocos com euros redondos.', 'Cêntimos e várias unidades.', 'Duas compras de uma vez.'],
    carregar: cerebro('mercado'),
  },
  lembrar: {
    seccao: 'cabeca', nome: 'Lembra-se?', icone: '👀', cor: '#1d5fd1',
    desc: 'Decore as figuras e depois encontre-as.',
    ajuda: 'Olhe para as figuras durante alguns segundos. Depois escolha as que viu.',
    niveis: ['3 figuras para decorar.', '4 figuras para decorar.', '5 figuras para decorar.'],
    carregar: palavras('lembrar'),
  },
  oquee: {
    seccao: 'cabeca', nome: 'O Que É Isto?', icone: '🎨', cor: '#2e7d32',
    desc: 'Centenas de desenhos divertidos para adivinhar.',
    ajuda: 'Olhe para o desenho e escolha o nome certo.',
    niveis: ['3 opções bem diferentes.', '3 opções parecidas.', '4 opções parecidas.'],
    carregar: desenhos('oQueE'),
  },
  diferente: {
    seccao: 'cabeca', nome: 'Encontre o Diferente', icone: '🔍', cor: '#00796b',
    desc: 'Há uma figura diferente das outras. Qual é?',
    ajuda: 'Todas as figuras são iguais menos uma. Toque na diferente.',
    niveis: ['9 figuras.', '16 figuras.', '25 figuras muito parecidas.'],
    carregar: desenhos('diferente'),
  },
  contar: {
    seccao: 'cabeca', nome: 'Quantos São?', icone: '🍎', cor: '#c2337a',
    desc: 'Conte as figuras com atenção.',
    ajuda: 'Conte só as figuras que a pergunta pede. Com calma, sem pressa!',
    niveis: ['Poucas figuras.', 'Mais figuras e mais misturadas.', 'Muitas figuras!'],
    carregar: cerebro('contar'),
  },
};

const SECCOES = {
  fotos: { titulo: 'Fotografias de Portugal', icone: '📷', sub: 'Jogos com fotografias verdadeiras: Sporting, Algarve, monumentos, cidades e muitos outros temas.' },
  cartas: { titulo: 'Jogos de Cartas', icone: '🃏', sub: 'Escolha um jogo. Pode jogar ao seu ritmo, sem pressas.' },
  cabeca: { titulo: 'Treino da Cabeça', icone: '🧠', sub: 'Perguntas, contas, palavras e memória. Todos têm 3 níveis.' },
};

// Grupos do Treino do Dia: um exercício de cada grupo.
const GRUPOS_TREINO = [
  ['contas', 'sequencias', 'mercado'],
  ['quiz', 'proverbios', 'adivinhas'],
  ['sopa', 'anagramas', 'intruso'],
  ['lembrar', 'contar', 'relogio', 'oquee', 'diferente', 'quizfotos'],
];

/* ---------- Infraestrutura de ecrãs ---------- */
const app = document.getElementById('app');
const topoTitulo = document.getElementById('topo-titulo');
const btnVoltar = document.getElementById('btn-voltar');
const topoEstrelas = document.getElementById('topo-estrelas');
let limpeza = null;
let paiAtual = null;

function aplicarDefinicoes() {
  document.documentElement.classList.remove('letra-0', 'letra-1', 'letra-2');
  document.documentElement.classList.add(`letra-${dados.def.letra}`);
}
function atualizarEstrelas() {
  topoEstrelas.textContent = `⭐ ${dados.estrelas}`;
}

function ecra(titulo, pai) {
  if (typeof limpeza === 'function') { try { limpeza(); } catch { /* ignora */ } }
  limpeza = null;
  calar();
  limparEfeitos();
  app.classList.remove('ecra-cheio');
  limpar(app);
  topoTitulo.textContent = titulo;
  document.title = titulo === 'Jogos do José' ? titulo : `${titulo} · Jogos do José`;
  paiAtual = pai;
  btnVoltar.hidden = !pai;
  atualizarEstrelas();
  window.scrollTo(0, 0);
  return app;
}

function limparEfeitos() {
  document.querySelectorAll('.festa').forEach(f => f.remove());
  const m = document.getElementById('mensagem');
  if (m) m.hidden = true;
}

btnVoltar.addEventListener('click', () => { if (paiAtual) ir(paiAtual); });

function ir(rota) {
  if (location.hash === rota) router();
  else location.hash = rota;
}

/* ---------- Início ---------- */
function saudacao() {
  const h = new Date().getHours();
  return h < 6 ? 'Boa noite' : h < 13 ? 'Bom dia' : h < 20 ? 'Boa tarde' : 'Boa noite';
}

function inicio() {
  const a = ecra('Jogos do José', null);
  const feito = dados.treinos.includes(hojeISO());
  const seguidos = diasSeguidos();
  const frase = el('p', {}, '…');
  a.append(
    el('div', { class: 'saudacao' },
      el('h2', {}, `${saudacao()}${dados.nome ? `, ${dados.nome}` : ''}! 👋`),
      el('p', {}, `${dataPorExtenso()}. Vamos treinar a cabeça a brincar?`)),
    el('div', { class: 'resumo' },
      el('div', { class: 'resumo-item' }, el('div', { class: 'icone' }, '⭐'), el('div', {}, el('b', {}, dados.estrelas), el('span', {}, 'estrelas ganhas'))),
      el('div', { class: 'resumo-item' }, el('div', { class: 'icone' }, '🔥'), el('div', {}, el('b', {}, seguidos), el('span', {}, seguidos === 1 ? 'dia seguido' : 'dias seguidos'))),
      el('div', { class: 'resumo-item' }, el('div', { class: 'icone' }, feito ? '✅' : '☀️'), el('div', {}, el('b', {}, feito ? 'Feito!' : 'Por fazer'), el('span', {}, 'treino de hoje')))),
    el('div', { class: 'menu-principal' },
      botaoMenu('laranja destaque', '☀️', 'Treino do Dia', feito ? 'Já está feito! Pode repetir se quiser.' : '4 exercícios rápidos, diferentes todos os dias.', '#/treino', feito ? '✅' : null),
      botaoMenu('verde', '🃏', 'Jogos de Cartas', 'Paciência, jogo da memória e maior ou menor.', '#/cartas'),
      botaoMenu('foto', '📷', 'Fotografias de Portugal', 'Memória, puzzles e adivinhas com fotografias.', '#/fotos'),
      botaoMenu('azul', '🧠', 'Treino da Cabeça', 'Cultura geral, contas, sopa de letras, desenhos…', '#/cabeca'),
      botaoMenu('roxo', '🏅', 'O Meu Progresso', 'Estrelas, dias seguidos e vitórias.', '#/progresso'),
      botaoMenu('claro', '⚙️', 'Definições', 'Tamanho da letra, sons, voz e nome.', '#/definicoes')),
    el('div', { class: 'frase-dia' }, el('small', {}, 'Provérbio do dia'), frase),
  );
  import('./dados/conteudos.js').then(({ PROVERBIOS }) => {
    const r = geradorSemente(hojeISO());
    const p = PROVERBIOS[Math.floor(r() * PROVERBIOS.length)];
    frase.textContent = `«${p.inicio} ${p.certa}.»`;
  }).catch(() => { frase.textContent = '«Devagar se vai ao longe.»'; });
}

function botaoMenu(cor, icone, titulo, texto, rota, extra) {
  return el('button', { class: `botao-menu ${cor}`, type: 'button', onclick: () => ir(rota) },
    el('div', { class: 'icone', 'aria-hidden': 'true' }, icone),
    el('div', {}, el('b', {}, titulo), el('span', {}, texto)),
    extra ? el('div', { class: 'feito', 'aria-hidden': 'true' }, extra) : null);
}

/* ---------- Secções ---------- */
function seccao(id) {
  const s = SECCOES[id];
  const a = ecra(s.titulo, '#/');
  a.append(el('h2', { class: 'titulo-seccao' }, `${s.icone} ${s.titulo}`), el('p', { class: 'sub' }, s.sub));
  const grelha = el('div', { class: 'grelha-jogos' });
  for (const [jid, j] of Object.entries(JOGOS)) {
    if (j.seccao !== id) continue;
    const reg = dados.jogos[jid];
    const melhor = reg ? Math.max(0, ...Object.values(reg.melhor || {})) : 0;
    grelha.append(el('button', { class: 'ficha-jogo', type: 'button', style: { '--cor': j.cor }, onclick: () => ir(`#/jogo/${jid}`) },
      el('div', { class: 'icone', style: { background: j.cor }, 'aria-hidden': 'true' }, j.icone),
      el('div', {},
        el('b', {}, j.nome),
        el('span', {}, j.desc),
        reg ? el('div', { class: 'estrelas-jogo' }, `${'★'.repeat(melhor)}${'☆'.repeat(3 - melhor)} · jogado ${reg.vezes} ${reg.vezes === 1 ? 'vez' : 'vezes'}`) : null)));
    grelha.lastChild.style.setProperty('--cor', j.cor);
  }
  a.append(grelha);
}

/* ---------- Escolha de nível ---------- */
function escolherNivel(jid) {
  const j = JOGOS[jid];
  if (!j) { ir('#/'); return; }
  const a = ecra(j.nome, `#/${j.seccao}`);
  const reg = dados.jogos[jid];
  const ultimo = reg ? reg.ultimoNivel : null;
  a.append(
    el('div', { class: 'cabeca-jogo' },
      el('div', { class: 'icone-grande', 'aria-hidden': 'true' }, j.icone),
      el('h2', {}, j.nome),
      el('p', {}, j.ajuda)),
    el('div', { class: 'niveis' },
      [1, 2, 3].map(n => {
        const estrelas = reg?.melhor?.[n] || 0;
        return el('button', { class: `nivel-btn n${n}`, type: 'button', onclick: () => ir(`#/jogo/${jid}/${n}`) },
          el('div', { class: 'icone', 'aria-hidden': 'true' }, NIVEIS[n].icone),
          el('div', {},
            el('b', {}, `${NIVEIS[n].nome}`),
            el('span', {}, j.niveis[n - 1]),
            estrelas ? el('div', { class: 'estrelas-jogo' }, '★'.repeat(estrelas) + '☆'.repeat(3 - estrelas)) : null),
          ultimo === n ? el('div', { class: 'ultimo' }, 'Último jogado') : null);
      })),
    el('p', { class: 'nota' }, 'Nenhum nível é difícil demais: pode sempre tentar outra vez e pedir ajuda.'),
  );
}

/* ---------- Jogar ---------- */
async function jogar(jid, nivel, extra = {}) {
  const j = JOGOS[jid];
  if (!j || ![1, 2, 3].includes(nivel)) { ir('#/'); return; }
  const titulo = j.tema ? j.nome : `${j.nome} · ${NIVEIS[nivel].nome}`;
  const pai = j.tema ? (jid === 'memfotos' && extra.tema ? `#/jogo/${jid}/${extra.tema}` : `#/jogo/${jid}`) : `#/jogo/${jid}`;
  const a = ecra(titulo, pai);
  a.append(el('div', { class: 'a-carregar' }, 'A preparar…'));
  const minhaVez = Symbol('jogo');
  ecraAtual = minhaVez;
  let iniciar;
  try { iniciar = await j.carregar(); } catch (e) { mostrarErro(a, e); return; }
  if (ecraAtual !== minhaVez) return;
  limpar(a);
  const r = iniciar(a, {
    ...extra,
    nivel,
    curto: false,
    aoTerminar: res => {
      if (ecraAtual !== minhaVez) return;
      registarJogo(jid, nivel, res.estrelas);
      mostrarResultado(res, {
        repetir: () => router(),
        outro: () => ir(j.tema ? `#/jogo/${jid}` : `#/${j.seccao}`),
        nivelAcima: !j.tema && nivel < 3 && res.estrelas >= 2 ? () => ir(`#/jogo/${jid}/${nivel + 1}`) : null,
      });
    },
  });
  limpeza = r instanceof Promise ? null : r;
  if (r instanceof Promise) r.then(f => { if (ecraAtual === minhaVez) limpeza = f; else if (typeof f === 'function') f(); }).catch(e => mostrarErro(a, e));
}
let ecraAtual = null;

function mostrarErro(a, e) {
  console.error(e);
  limpar(a).append(el('div', { class: 'resultado' },
    el('h2', {}, 'Ups! Algo correu mal.'),
    el('p', { class: 'frase' }, 'Não é culpa sua. Experimente voltar ao início e abrir o jogo outra vez.'),
    el('div', { class: 'fila-botoes' }, el('button', { class: 'btn laranja grande', type: 'button', onclick: () => ir('#/') }, '🏠 Ir para o início'))));
}

function mostrarResultado(res, { repetir, outro, nivelAcima }) {
  if (typeof limpeza === 'function') { try { limpeza(); } catch { /* ignora */ } }
  limpeza = null;
  app.classList.remove('ecra-cheio');
  limpar(app);
  atualizarEstrelas();
  window.scrollTo(0, 0);
  for (let k = 0; k < res.estrelas; k++) setTimeout(() => som.estrela(k), 250 + k * 380);
  if (res.estrelas >= 3) setTimeout(() => { som.vitoria(); festa(); }, 250 + 3 * 380);
  app.append(el('div', { class: 'resultado' },
    el('div', { class: 'grande-estrelas', 'aria-label': `${res.estrelas} de 3 estrelas` },
      [1, 2, 3].map(k => el('span', { class: k <= res.estrelas ? '' : 'apagada', style: { animationDelay: `${0.25 + (k - 1) * 0.38}s` } }, '⭐'))),
    el('h2', {}, res.titulo || (res.estrelas >= 3 ? 'Fantástico!' : res.estrelas === 2 ? 'Muito bem!' : 'Ronda terminada!')),
    el('p', { class: 'frase' }, fraseFinal(res.estrelas)),
    el('div', { class: 'numeros' }, (res.numeros || []).map(n => el('div', {}, el('b', {}, n.valor), el('span', {}, n.rotulo)))),
    el('div', { class: 'fila-botoes' },
      el('button', { class: 'btn verde grande', type: 'button', onclick: repetir }, '🔁 Jogar outra vez'),
      nivelAcima ? el('button', { class: 'btn roxo grande', type: 'button', onclick: nivelAcima }, '⬆ Experimentar o nível seguinte') : null,
      el('button', { class: 'btn claro grande', type: 'button', onclick: outro }, '🎲 Escolher outro'))));
}

/* ---------- Treino do Dia ---------- */
function exerciciosDeHoje() {
  const r = geradorSemente(`treino-${hojeISO()}`);
  return GRUPOS_TREINO.map(g => g[Math.floor(r() * g.length)]);
}

function treino() {
  const a = ecra('Treino do Dia', '#/');
  const lista = exerciciosDeHoje();
  const feito = dados.treinos.includes(hojeISO());
  a.append(
    el('div', { class: 'cabeca-jogo' },
      el('div', { class: 'icone-grande', 'aria-hidden': 'true' }, '☀️'),
      el('h2', {}, feito ? 'Treino de hoje concluído! ✅' : 'O treino de hoje'),
      el('p', {}, feito ? 'Muito bem! Amanhã há exercícios novos. Se quiser, pode repetir o de hoje.' : 'Quatro exercícios curtos, um de cada tipo. Demora uns 10 minutos.')),
    el('div', { class: 'painel', style: { maxWidth: '640px', margin: '0 auto 16px' } },
      el('h3', {}, 'Exercícios de hoje'),
      el('table', { class: 'tabela-prog' }, el('tbody', {},
        lista.map((jid, k) => el('tr', {}, el('td', {}, `${k + 1}. ${JOGOS[jid].icone} ${JOGOS[jid].nome}`), el('td', {}, JOGOS[jid].desc)))))),
    el('p', { class: 'centrado', style: { fontWeight: 700, marginBottom: '8px' } }, 'Escolha o nível do treino:'),
    el('div', { class: 'niveis' }, [1, 2, 3].map(n => el('button', {
      class: `nivel-btn n${n}`, type: 'button',
      onclick: () => { dados.def.nivelTreino = n; guardar(); correrTreino(lista, n); },
    },
    el('div', { class: 'icone', 'aria-hidden': 'true' }, NIVEIS[n].icone),
    el('div', {}, el('b', {}, NIVEIS[n].nome), el('span', {}, ['Para começar o dia com calma.', 'Um bom equilíbrio.', 'Para quem está em grande forma.'][n - 1])),
    dados.def.nivelTreino === n ? el('div', { class: 'ultimo' }, 'Último usado') : null))),
  );
}

function correrTreino(lista, nivel) {
  const resultados = [];
  const minhaVez = Symbol('treino');
  ecraAtual = minhaVez;

  function intervalo(k) {
    if (ecraAtual !== minhaVez) return;
    const jid = lista[k];
    const j = JOGOS[jid];
    const a = ecra(`Treino do Dia · ${k + 1} de ${lista.length}`, '#/treino');
    ecraAtual = minhaVez;
    a.append(el('div', { class: 'resultado' },
      el('div', { class: 'grande-estrelas', 'aria-hidden': 'true' }, j.icone),
      el('h2', {}, `Exercício ${k + 1} de ${lista.length}`),
      el('p', { class: 'frase', style: { fontWeight: 800, color: 'var(--texto)' } }, j.nome),
      el('p', { class: 'frase' }, j.ajuda),
      el('div', { class: 'fila-botoes' }, el('button', { class: 'btn verde grande', type: 'button', onclick: () => correr(k) }, k === 0 ? 'Começar ▶' : 'Continuar ▶'))));
    a.querySelector('.btn').focus({ preventScroll: true });
  }

  async function correr(k) {
    const jid = lista[k];
    const j = JOGOS[jid];
    const a = ecra(`Treino do Dia · ${j.nome}`, '#/treino');
    ecraAtual = minhaVez;
    a.append(el('div', { class: 'a-carregar' }, 'A preparar…'));
    let iniciar;
    try { iniciar = await j.carregar(); } catch (e) { mostrarErro(a, e); return; }
    if (ecraAtual !== minhaVez) return;
    limpar(a);
    const r = iniciar(a, {
      nivel,
      curto: true,
      aoTerminar: res => {
        if (ecraAtual !== minhaVez) return;
        registarJogo(jid, nivel, res.estrelas);
        resultados.push({ jid, estrelas: res.estrelas });
        if (k + 1 < lista.length) intervalo(k + 1);
        else fim();
      },
    });
    limpeza = r instanceof Promise ? null : r;
    if (r instanceof Promise) r.then(f => { if (ecraAtual === minhaVez) limpeza = f; else if (typeof f === 'function') f(); }).catch(e => mostrarErro(a, e));
  }

  function fim() {
    const h = hojeISO();
    if (!dados.treinos.includes(h)) dados.treinos.push(h);
    if (dados.treinos.length > 400) dados.treinos = dados.treinos.slice(-400);
    guardar();
    const a = ecra('Treino do Dia', '#/');
    const total = resultados.reduce((s, r) => s + r.estrelas, 0);
    const media = Math.round(total / resultados.length);
    som.vitoria();
    festa(['☀️', '⭐', '🎉', '🌟', '👏']);
    a.append(el('div', { class: 'resultado' },
      el('div', { class: 'grande-estrelas', 'aria-hidden': 'true' }, '🏆'),
      el('h2', {}, 'Treino do dia concluído!'),
      el('p', { class: 'frase' }, `${fraseFinal(media)} Ganhou ${total} estrelas hoje.`),
      el('div', { class: 'painel', style: { marginTop: '18px', textAlign: 'left' } },
        el('table', { class: 'tabela-prog' }, el('tbody', {},
          resultados.map(r => el('tr', {}, el('td', {}, `${JOGOS[r.jid].icone} ${JOGOS[r.jid].nome}`), el('td', {}, '⭐'.repeat(r.estrelas))))))),
      el('p', { class: 'frase' }, `🔥 ${diasSeguidos()} ${diasSeguidos() === 1 ? 'dia seguido' : 'dias seguidos'} a treinar. Volte amanhã para manter a sequência!`),
      el('div', { class: 'fila-botoes' },
        el('button', { class: 'btn laranja grande', type: 'button', onclick: () => ir('#/') }, '🏠 Voltar ao início'),
        el('button', { class: 'btn claro grande', type: 'button', onclick: () => ir('#/cabeca') }, '🧠 Jogar mais'))));
  }

  intervalo(0);
}

/* ---------- Progresso ---------- */
function progresso() {
  const a = ecra('O Meu Progresso', '#/');
  const seguidos = diasSeguidos();
  const dias = new Set(dados.dias);
  const semana = [];
  for (let k = 6; k >= 0; k--) {
    const d = new Date();
    d.setDate(d.getDate() - k);
    semana.push({ d, jogou: dias.has(hojeISO(d)) });
  }
  const nomesDia = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const jogados = Object.entries(dados.jogos).sort((x, y) => y[1].vezes - x[1].vezes);
  a.append(
    el('h2', { class: 'titulo-seccao' }, '🏅 O Meu Progresso'),
    el('p', { class: 'sub' }, 'Tudo fica guardado neste aparelho.'),
    el('div', { class: 'resumo' },
      el('div', { class: 'resumo-item' }, el('div', { class: 'icone' }, '⭐'), el('div', {}, el('b', {}, dados.estrelas), el('span', {}, 'estrelas'))),
      el('div', { class: 'resumo-item' }, el('div', { class: 'icone' }, '🔥'), el('div', {}, el('b', {}, seguidos), el('span', {}, 'dias seguidos'))),
      el('div', { class: 'resumo-item' }, el('div', { class: 'icone' }, '📅'), el('div', {}, el('b', {}, dados.dias.length), el('span', {}, 'dias a jogar'))),
      el('div', { class: 'resumo-item' }, el('div', { class: 'icone' }, '☀️'), el('div', {}, el('b', {}, dados.treinos.length), el('span', {}, 'treinos do dia')))),
    el('div', { class: 'painel' },
      el('h3', {}, 'Últimos 7 dias'),
      el('div', { class: 'semana' }, semana.map(s => el('div', { class: s.jogou ? 'jogou' : '' },
        nomesDia[s.d.getDay()], el('b', {}, s.jogou ? '✔' : '·'))))),
    el('div', { class: 'painel' },
      el('h3', {}, '🃏 Paciências ganhas'),
      el('table', { class: 'tabela-prog' }, el('tbody', {}, [1, 2, 3].map(n => el('tr', {},
        el('td', {}, `${NIVEIS[n].icone} ${NIVEIS[n].nome}`),
        el('td', {}, `${dados.pac.ganhos[n] || 0} ${dados.pac.ganhos[n] === 1 ? 'vitória' : 'vitórias'} em ${dados.pac.jogados[n] || 0} ${dados.pac.jogados[n] === 1 ? 'jogo' : 'jogos'}`)))))),
    el('div', { class: 'painel' },
      el('h3', {}, '🎲 Jogos'),
      jogados.length
        ? el('table', { class: 'tabela-prog' }, el('tbody', {}, jogados.filter(([jid]) => JOGOS[jid]).map(([jid, r]) => el('tr', {},
          el('td', {}, `${JOGOS[jid].icone} ${JOGOS[jid].nome}`),
          el('td', {}, `${r.vezes} ${r.vezes === 1 ? 'vez' : 'vezes'} · melhor ${'★'.repeat(Math.max(0, ...Object.values(r.melhor || {})))}`)))))
        : el('p', {}, 'Ainda não jogou nenhum jogo. Que tal começar pelo Treino do Dia?')),
  );
}

/* ---------- Estado offline ---------- */
function estadoOffline() {
  const e = el('div', { class: 'estado-offline' }, '⏳ A verificar…');
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    e.textContent = location.protocol === 'https:' ? '⏳ Ainda a guardar… volte a abrir os jogos daqui a pouco.' : 'ℹ️ Só funciona no site publicado.';
    return e;
  }
  const canal = new MessageChannel();
  canal.port1.onmessage = ({ data }) => {
    const pronto = data && data.guardados >= data.total;
    e.classList.toggle('pronto', pronto);
    e.textContent = pronto ? '✅ Pronto para jogar sem internet' : `⏳ A guardar: ${data.guardados} de ${data.total} ficheiros`;
  };
  navigator.serviceWorker.controller.postMessage({ tipo: 'estado' }, [canal.port2]);
  return e;
}

/* ---------- Definições ---------- */
function definicoes() {
  const a = ecra('Definições', '#/');
  function segmentos(opcoes, atual, aoMudar) {
    const caixa = el('div', { class: 'segmentos' });
    opcoes.forEach(([valor, texto]) => {
      caixa.append(el('button', {
        type: 'button', 'aria-pressed': String(valor === atual),
        onclick: e => {
          caixa.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', 'false'));
          e.currentTarget.setAttribute('aria-pressed', 'true');
          aoMudar(valor);
          guardar();
        },
      }, texto));
    });
    return caixa;
  }
  const campoNome = el('input', { class: 'campo-nome', id: 'nome', type: 'text', maxlength: 20, value: dados.nome, autocomplete: 'given-name' });
  campoNome.addEventListener('change', () => { dados.nome = campoNome.value.trim(); guardar(); aviso('Nome guardado. 👍'); });
  let tApagar = null;
  const btnApagar = el('button', { class: 'btn claro', type: 'button' }, '🗑️ Apagar o progresso');
  btnApagar.addEventListener('click', () => {
    if (!btnApagar.dataset.confirmar) {
      btnApagar.dataset.confirmar = '1';
      btnApagar.textContent = 'Tem a certeza? Toque outra vez';
      tApagar = setTimeout(() => { delete btnApagar.dataset.confirmar; btnApagar.textContent = '🗑️ Apagar o progresso'; }, 4000);
      return;
    }
    clearTimeout(tApagar);
    const def = dados.def;
    const nome = dados.nome;
    Object.keys(dados).forEach(k => delete dados[k]);
    Object.assign(dados, { nome, def, estrelas: 0, jogos: {}, dias: [], treinos: [], vistos: {}, pac: { ganhos: { 1: 0, 2: 0, 3: 0 }, jogados: { 1: 0, 2: 0, 3: 0 } } });
    guardar();
    atualizarEstrelas();
    aviso('O progresso foi apagado. Começamos do zero! 🌱');
    delete btnApagar.dataset.confirmar;
    btnApagar.textContent = '🗑️ Apagar o progresso';
  });

  a.append(
    el('h2', { class: 'titulo-seccao' }, '⚙️ Definições'),
    el('p', { class: 'sub' }, 'As alterações ficam guardadas automaticamente.'),
    el('div', { class: 'painel' },
      el('div', { class: 'opcao-def' }, el('label', { for: 'nome' }, 'Como se chama?'), campoNome),
      el('div', { class: 'opcao-def' }, el('span', { class: 'rotulo' }, 'Tamanho da letra'),
        segmentos([[0, 'Normal'], [1, 'Grande'], [2, 'Muito grande']], dados.def.letra, v => { dados.def.letra = v; aplicarDefinicoes(); })),
      el('div', { class: 'opcao-def' }, el('span', { class: 'rotulo' }, 'Sons'),
        segmentos([[true, '🔊 Ligados'], [false, '🔇 Desligados']], dados.def.som, v => { dados.def.som = v; if (v) som.certo(); })),
      vozDisponivel() ? el('div', { class: 'opcao-def' }, el('span', { class: 'rotulo' }, 'Ler as perguntas em voz alta'),
        segmentos([[true, 'Sim'], [false, 'Não']], dados.def.voz, v => { dados.def.voz = v; })) : null,
      el('div', { class: 'opcao-def' }, el('span', { class: 'rotulo' }, 'Letras das cartas'),
        segmentos([['int', 'A K Q J'], ['pt', 'A R D V']], dados.def.letras === 'pt' ? 'pt' : 'int', v => { dados.def.letras = v; }))),
    el('div', { class: 'painel' },
      el('h3', {}, '📶 Jogar sem internet'),
      estadoOffline(),
      el('p', { style: { marginTop: '10px' } }, 'Depois de abrir os jogos uma vez com internet, ficam guardados neste aparelho e funcionam sem rede.')),
    el('div', { class: 'painel' },
      el('h3', {}, '📱 Pôr no ecrã inicial'),
      el('p', {}, 'Para abrir os jogos como uma aplicação: no iPhone ou iPad, toque em «Partilhar» e depois em «Adicionar ao ecrã principal». No Android, abra o menu ⋮ do Chrome e escolha «Adicionar ao ecrã principal» (ou «Instalar aplicação»). Depois de instalado, funciona mesmo sem internet.')),
    el('div', { class: 'painel' },
      el('h3', {}, '📷 Fotografias'),
      el('p', {}, el('a', { href: '#/creditos' }, 'Ver os créditos das fotografias'))),
    el('div', { class: 'painel' },
      el('h3', {}, 'Recomeçar do zero'),
      el('p', { style: { marginBottom: '12px' } }, 'Apaga as estrelas, os dias e as vitórias guardados neste aparelho.'),
      btnApagar),
  );
}

/* ---------- Fotografias: escolha de tema e de pares ---------- */
const nivelDePares = n => (!n || n <= 4 ? 1 : n <= 8 ? 2 : 3);

async function escolherTema(jid) {
  const j = JOGOS[jid];
  const a = ecra(j.nome, '#/fotos');
  a.append(el('div', { class: 'a-carregar' }, 'A preparar as fotografias…'));
  const minhaVez = Symbol('temas');
  ecraAtual = minhaVez;
  let temas;
  try { temas = (await import('./dados/fotos.js')).TEMAS_FOTOS; } catch (e) { mostrarErro(a, e); return; }
  if (ecraAtual !== minhaVez) return;
  limpar(a);
  const grelha = el('div', { class: 'grelha-temas' });
  grelha.append(el('button', { class: 'tema-foto todos', type: 'button', onclick: () => ir(`#/jogo/${jid}/todos`) },
    el('div', { class: 'capa', 'aria-hidden': 'true' }, '🎲'),
    el('b', {}, 'Todos misturados'),
    el('span', {}, `${new Set(temas.flatMap(t => t.fotos.map(f => f.fonte || f.f))).size} fotografias`)));
  for (const t of temas) {
    grelha.append(el('button', { class: 'tema-foto', type: 'button', onclick: () => ir(`#/jogo/${jid}/${t.id}`) },
      el('div', { class: 'capa', 'aria-hidden': 'true' }, t.fotos.slice(0, 2).map(f => el('img', { src: f.f, alt: '', loading: 'lazy' }))),
      el('b', {}, `${t.icone} ${t.tema}`),
      el('span', {}, `${t.fotos.length} fotografias`)));
  }
  a.append(
    el('div', { class: 'cabeca-jogo' },
      el('div', { class: 'icone-grande', 'aria-hidden': 'true' }, j.icone),
      el('h2', {}, j.nome),
      el('p', {}, 'Escolha um tema.')),
    grelha,
    el('p', { class: 'nota' }, el('a', { href: '#/creditos' }, 'Créditos das fotografias')));
}

async function escolherPares(temaId) {
  const a = ecra('Memória de Fotografias', '#/jogo/memfotos');
  const minhaVez = Symbol('pares');
  ecraAtual = minhaVez;
  let temas;
  try { temas = (await import('./dados/fotos.js')).TEMAS_FOTOS; } catch (e) { mostrarErro(a, e); return; }
  if (ecraAtual !== minhaVez) return;
  const t = temas.find(x => x.id === temaId);
  const maximo = t ? t.fotos.length : temas.reduce((n, x) => n + x.fotos.length, 0);
  const titulo = t ? `${t.icone} ${t.tema}` : '🎲 Todos misturados';
  const opcoes = [3, 4, 5, 6, 8, 10, 12].filter(n => n <= maximo);
  a.append(
    el('div', { class: 'cabeca-jogo' },
      el('h2', {}, titulo),
      el('p', {}, 'Quantas fotografias diferentes quer? Menos fotografias, jogo mais rápido.')),
    el('div', { class: 'escolha-pares' }, opcoes.map(n => el('button', {
      class: `btn grande ${n <= 4 ? 'verde' : n <= 8 ? '' : 'laranja'}`, type: 'button',
      onclick: () => ir(`#/jogo/memfotos/${temaId}/${n}`),
    }, String(n), el('small', {}, `${n * 2} cartas`)))));
}

function creditos() {
  const a = ecra('Créditos das fotografias', '#/definicoes');
  a.append(el('h2', { class: 'titulo-seccao' }, '📷 Créditos das fotografias'),
    el('p', { class: 'sub' }, 'As fotografias vêm do Wikimedia Commons e têm licenças livres. Obrigado aos seus autores!'));
  const lista = el('div', {}, el('p', {}, 'A carregar…'));
  a.append(lista);
  import('./dados/fotos.js').then(({ TEMAS_FOTOS }) => {
    limpar(lista);
    for (const t of TEMAS_FOTOS) {
      lista.append(el('div', { class: 'painel' }, el('h3', {}, `${t.icone} ${t.tema}`),
        el('ul', { class: 'creditos' }, t.fotos.map(f => el('li', {},
          el('b', {}, f.nome), ` — ${f.autor || 'autor desconhecido'}, ${f.licenca}. `,
          f.fonte ? el('a', { href: f.fonte, target: '_blank', rel: 'noopener' }, 'Ver original') : null)))));
    }
  }).catch(() => { limpar(lista).append(el('p', {}, 'Não foi possível carregar a lista.')); });
}

/* ---------- Encaminhamento ---------- */
function router() {
  const partes = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  ecraAtual = null;
  if (!partes.length) return inicio();
  const [p0, p1, p2] = partes;
  if (p0 === 'cartas' || p0 === 'cabeca' || p0 === 'fotos') return seccao(p0);
  if (p0 === 'creditos') return creditos();
  if (p0 === 'jogo' && JOGOS[p1]?.tema) {
    if (!p2) return escolherTema(p1);
    if (p1 === 'memfotos' && !partes[3]) return escolherPares(p2);
    return jogar(p1, p1 === 'memfotos' ? nivelDePares(Number(partes[3])) : 1, { tema: p2, pares: Number(partes[3]) || undefined });
  }
  if (p0 === 'treino') return treino();
  if (p0 === 'progresso') return progresso();
  if (p0 === 'definicoes') return definicoes();
  if (p0 === 'jogo' && p1 && !p2) return escolherNivel(p1);
  if (p0 === 'jogo' && p1 && p2) return jogar(p1, Number(p2));
  return inicio();
}

window.addEventListener('hashchange', router);
aplicarDefinicoes();
router();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}
