// Jogos do José — navegação, menus, Treino do Dia, progresso e definições.
import {
  el, limpar, dados, guardar, registarJogo, diasSeguidos, hojeISO, dataPorExtenso, fraseFinal, festa, som, calar,
  geradorSemente, vozDisponivel, aviso, marcar, modoLeve, aparelhoFraco,
} from './util.js';
import { novasMedalhas, MEDALHAS } from './medalhas.js';
import { graficoLinha } from './grafico.js';

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
const treinoJ = nome => () => import('./jogos/treino.js').then(m => m[nome]);
const desafios = nome => () => import('./jogos/desafios.js').then(m => m[nome]);

const JOGOS = {
  memfotos: {
    seccao: 'fotos', nome: 'Memória de Fotografias', icone: '📸', cor: '#2e7d32', tema: true,
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
    seccao: 'fotos', nome: 'Puzzle de Fotografias', icone: '🖼️', cor: '#558b2f',
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
  domino: {
    seccao: 'cartas', nome: 'Dominó', icone: '🎲', cor: '#5d4037',
    desenho: () => import('./jogos/domino.js').then(m => m.pedraSVG([6, 6], false)),
    desc: 'O dominó de sempre, contra o computador.',
    ajuda: 'Toque numa pedra que brilha para a jogar. Se não tiver pedra, compre ao monte. Ganha quem ficar primeiro sem pedras!',
    niveis: ['O computador joga ao acaso e há sugestões.', 'O computador joga as pedras mais pesadas.', 'O computador pensa e tenta fechar o jogo.'],
    carregar: () => import('./jogos/domino.js').then(m => m.domino),
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
  relampago: {
    seccao: 'cabeca', grupo: 'rapido', nome: 'Contas Relâmpago', icone: '⚡', cor: '#e8590c',
    desc: '20 contas seguidas contra o relógio. Bata o seu recorde!',
    ajuda: 'Escreva o resultado no teclado: quando estiver certo, passa sozinho para a conta seguinte. O relógio pode parar com «Pausa».',
    niveis: ['Somas e subtrações até 10.', 'Até 20 e tabuadas do 2 ao 5.', 'Até 50, tabuadas e divisões.'],
    carregar: treinoJ('relampago'),
  },
  cores: {
    seccao: 'cabeca', grupo: 'rapido', nome: 'Cores Trocadas', icone: '🎨', cor: '#c2337a',
    desc: 'Diga a cor da tinta, não a palavra. Mais difícil do que parece!',
    ajuda: 'Aparece o nome de uma cor pintado com outra cor. Toque na cor da TINTA, sem ler a palavra.',
    niveis: ['4 cores, muitas vezes iguais à palavra.', '4 cores, quase sempre trocadas.', '6 cores, sempre trocadas.'],
    carregar: treinoJ('cores'),
  },
  palavras: {
    seccao: 'cabeca', grupo: 'rapido', nome: 'Memória de Palavras', icone: '📝', cor: '#1d5fd1',
    desc: 'Decore uma lista de palavras e depois encontre-as.',
    ajuda: 'Tem alguns segundos para decorar as palavras. Depois toque nas que viu, no meio de outras.',
    niveis: ['6 palavras, com desenhos.', '9 palavras.', '12 palavras.'],
    carregar: treinoJ('palavras'),
  },
  leitura: {
    seccao: 'cabeca', grupo: 'rapido', nome: 'Leitura em Voz Alta', icone: '📖', cor: '#7c2d12',
    desc: 'Camões, Pessoa, Florbela, Eça, cantigas e trava-línguas para ler em voz alta.',
    ajuda: 'Leia o texto em voz alta, com calma. O relógio mede o tempo e mostra quantas palavras leu por minuto.',
    niveis: ['Textos curtos e provérbios.', 'Poemas de tamanho médio.', 'Poemas e prosa mais longos.'],
    carregar: treinoJ('leitura'),
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
  ordem: {
    seccao: 'cabeca', nome: 'Pôr por Ordem', icone: '🔢', cor: '#00796b',
    desc: 'Números, meses, tamanhos, preços e datas da História: arrume tudo.',
    ajuda: 'Toque nos cartões pela ordem certa: primeiro o 1.º, depois o 2.º, e assim por diante. Se se enganar, tente outra vez — não há pressa.',
    niveis: ['4 cartões: números, tamanhos, dias e dinheiro.', '4 ou 5 cartões: meses, horas, contas e História.', '5 ou 6 cartões, um pouco mais parecidos.'],
    carregar: desafios('ordem'),
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
  siga: {
    seccao: 'cabeca', nome: 'Siga a Sequência', icone: '🚦', cor: '#6d3fd0',
    desc: 'Luzes e música: repita a sequência, que vai crescendo.',
    ajuda: 'Os botões acendem-se um a um, com música. Depois toque neles pela mesma ordem. Sempre que acerta, a sequência cresce mais uma. Tem 3 tentativas e pode pedir para ver outra vez.',
    niveis: ['4 botões, devagar, até 6 seguidas.', '4 botões, até 8 seguidas.', '6 botões, até 9 seguidas.'],
    carregar: desafios('siga'),
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
  cartas: { titulo: 'Cartas e Dominó', icone: '🃏', sub: 'Escolha um jogo. Pode jogar ao seu ritmo, sem pressas.' },
  cabeca: { titulo: 'Treino da Cabeça', icone: '💡', sub: 'Exercícios rápidos com recorde, perguntas, contas, palavras e memória. Todos têm 3 níveis.' },
};

// Grupos do Treino do Dia: um exercício de cada grupo.
const GRUPOS_TREINO = [
  ['relampago', 'contas', 'sequencias', 'mercado', 'ordem'],
  ['quiz', 'proverbios', 'adivinhas', 'leitura'],
  ['sopa', 'anagramas', 'intruso', 'palavras'],
  ['cores', 'lembrar', 'contar', 'relogio', 'oquee', 'diferente', 'quizfotos', 'siga'],
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
  document.documentElement.classList.toggle('leve', modoLeve());
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
      botaoMenu('azul', '🎯', 'Teste da Cabeça', ultimoTeste() ? `Da última vez: ${ultimoTeste().idade} anos. Consegue melhorar?` : 'Que idade tem a sua cabeça? 3 exercícios rápidos.', '#/teste'),
      botaoMenu('verde', '🃏', 'Cartas e Dominó', 'Paciência, dominó, memória e maior ou menor.', '#/cartas'),
      botaoMenu('foto', '📷', 'Fotografias de Portugal', 'Memória, puzzles e adivinhas com fotografias.', '#/fotos'),
      botaoMenu('azul', '💡', 'Treino da Cabeça', 'Contas relâmpago, cores, leitura, cultura geral, sopa de letras…', '#/cabeca'),
      botaoMenu('roxo', '🏅', 'O Meu Progresso', 'Calendário, medalhas, recordes e gráficos.', '#/progresso'),
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

/* ---------- Ícone de um jogo (texto ou desenho) ---------- */
function iconeJogo(j, classe, estilo) {
  const caixa = el('div', { class: `${classe}${j.desenho ? ' com-desenho' : ''}`, style: estilo, 'aria-hidden': 'true' }, j.desenho ? '' : j.icone);
  if (j.desenho) j.desenho().then(n => caixa.append(n)).catch(() => { caixa.textContent = j.icone; });
  return caixa;
}

/* ---------- Secções ---------- */
function seccao(id) {
  const s = SECCOES[id];
  const a = ecra(s.titulo, '#/');
  a.append(el('h2', { class: 'titulo-seccao' }, `${s.icone} ${s.titulo}`), el('p', { class: 'sub' }, s.sub));
  const grupos = id === 'cabeca' ? [['rapido', '⏱️ Treino rápido, com recorde'], [undefined, '💬 Perguntas, palavras e memória']] : [[undefined, null]];
  for (const [grupo, tituloGrupo] of grupos) {
  if (tituloGrupo) a.append(el('h3', { class: 'titulo-grupo' }, tituloGrupo));
  const grelha = el('div', { class: 'grelha-jogos' });
  for (const [jid, j] of Object.entries(JOGOS)) {
    if (j.seccao !== id || j.grupo !== grupo) continue;
    const reg = dados.jogos[jid];
    const melhor = reg ? Math.max(0, ...Object.values(reg.melhor || {})) : 0;
    grelha.append(el('button', { class: 'ficha-jogo', type: 'button', style: { '--cor': j.cor }, onclick: () => ir(`#/jogo/${jid}`) },
      iconeJogo(j, 'icone', { background: j.cor }),
      el('div', {},
        el('b', {}, j.nome),
        el('span', {}, j.desc),
        reg ? el('div', { class: 'estrelas-jogo' }, `${'★'.repeat(melhor)}${'☆'.repeat(3 - melhor)} · jogado ${reg.vezes} ${reg.vezes === 1 ? 'vez' : 'vezes'}`) : null)));
    grelha.lastChild.style.setProperty('--cor', j.cor);
  }
  a.append(grelha);
  }
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
      iconeJogo(j, 'icone-grande'),
      el('h2', {}, j.nome),
      el('p', {}, j.ajuda)),
    el('div', { class: 'niveis' },
      [1, 2, 3].map(n => {
        const estrelas = (reg && reg.melhor && reg.melhor[n]) || 0;
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
      registar(jid, nivel, res, extra);
      mostrarResultado(res, {
        repetir: () => router(),
        outro: () => ir(j.tema ? `#/jogo/${jid}` : `#/${j.seccao}`),
        nivelAcima: !j.tema && nivel < 3 && res.estrelas >= 2 ? () => ir(`#/jogo/${jid}/${nivel + 1}`) : null,
        nivelAbaixo: !j.tema && nivel > 1 && res.estrelas === 1 ? () => ir(`#/jogo/${jid}/${nivel - 1}`) : null,
      });
    },
  });
  limpeza = r instanceof Promise ? null : r;
  if (r instanceof Promise) r.then(f => { if (ecraAtual === minhaVez) limpeza = f; else if (typeof f === 'function') f(); }).catch(e => mostrarErro(a, e));
}
let ecraAtual = null;

// Regista o jogo, conta as rondas perfeitas e os temas de fotografias vistos.
function registar(jid, nivel, res, extra = {}) {
  registarJogo(jid, nivel, res.estrelas);
  if (res.estrelas >= 3) marcar('tresEstrelas');
  if (extra.tema && extra.tema !== 'todos') {
    const t = dados.temasVistos || (dados.temasVistos = []);
    if (!t.includes(extra.tema)) { t.push(extra.tema); guardar(); }
  }
}

// Medalhas ganhas agora: um cartão que fica no ecrã (não se perde se a pessoa avançar depressa).
function blocoMedalhas(atrasoSom = 2400) {
  const novas = novasMedalhas();
  if (!novas.length) return null;
  setTimeout(() => som.medalha(), atrasoSom);
  return el('div', { class: 'novas-medalhas' },
    el('h3', {}, novas.length === 1 ? '🏅 Ganhou uma medalha nova!' : `🏅 Ganhou ${novas.length} medalhas novas!`),
    el('div', { class: 'medalhas' }, novas.map(m => el('div', { class: 'medalha ganha nova' },
      el('div', { class: 'medalha-icone', 'aria-hidden': 'true' }, m.icone), el('b', {}, m.nome), el('span', {}, m.desc)))));
}

function mostrarErro(a, e) {
  console.error(e);
  limpar(a).append(el('div', { class: 'resultado' },
    el('h2', {}, 'Ups! Algo correu mal.'),
    el('p', { class: 'frase' }, 'Não é culpa sua. Experimente voltar ao início e abrir o jogo outra vez.'),
    el('div', { class: 'fila-botoes' }, el('button', { class: 'btn laranja grande', type: 'button', onclick: () => ir('#/') }, '🏠 Ir para o início'))));
}

function mostrarResultado(res, { repetir, outro, nivelAcima, nivelAbaixo }) {
  if (typeof limpeza === 'function') { try { limpeza(); } catch { /* ignora */ } }
  limpeza = null;
  app.classList.remove('ecra-cheio');
  limpar(app);
  atualizarEstrelas();
  window.scrollTo(0, 0);
  for (let k = 0; k < res.estrelas; k++) setTimeout(() => som.estrela(k), 250 + k * 380);
  if (res.recorde) setTimeout(() => { som.recorde(); festa(['🏆', '⭐', '✨', '🎉']); }, 250 + 3 * 380);
  else if (res.estrelas >= 3) setTimeout(() => { som.vitoria(); festa(); }, 250 + 3 * 380);
  app.append(el('div', { class: 'resultado' },
    el('div', { class: 'grande-estrelas', 'aria-label': `${res.estrelas} de 3 estrelas` },
      [1, 2, 3].map(k => el('span', { class: k <= res.estrelas ? '' : 'apagada', style: { animationDelay: `${0.25 + (k - 1) * 0.38}s` } }, '⭐'))),
    res.recorde ? el('div', { class: 'faixa-recorde' }, '🏆 Novo recorde pessoal!') : null,
    el('h2', {}, res.titulo || (res.estrelas >= 3 ? 'Fantástico!' : res.estrelas === 2 ? 'Muito bem!' : 'Ronda terminada!')),
    el('p', { class: 'frase' }, fraseFinal(res.estrelas)),
    el('div', { class: 'numeros' }, (res.numeros || []).map(n => el('div', {}, el('b', {}, n.valor), el('span', {}, n.rotulo)))),
    blocoMedalhas(),
    el('div', { class: 'fila-botoes' },
      el('button', { class: 'btn verde grande', type: 'button', onclick: repetir }, '🔁 Jogar outra vez'),
      nivelAcima ? el('button', { class: 'btn roxo grande', type: 'button', onclick: nivelAcima }, '⬆ Experimentar o nível seguinte') : null,
      nivelAbaixo ? el('button', { class: 'btn claro grande', type: 'button', onclick: nivelAbaixo }, '🌱 Experimentar um nível mais calmo') : null,
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
  correrSequencia(lista.map(jid => ({ jid, nivel, opcoes: { curto: true } })), {
    titulo: 'Treino do Dia', pai: '#/treino', registarCada: true,
    aoFim: resultados => {
      const h = hojeISO();
      if (!dados.treinos.includes(h)) dados.treinos.push(h);
      if (dados.treinos.length > 400) dados.treinos = dados.treinos.slice(-400);
      guardar();
      const a = ecra('Treino do Dia', '#/');
      const total = resultados.reduce((t, r) => t + r.res.estrelas, 0);
      const media = Math.round(total / resultados.length);
      som.vitoria();
      festa(['☀️', '⭐', '🎉', '🌟', '👏']);
      a.append(el('div', { class: 'resultado' },
        el('div', { class: 'carimbo-grande', 'aria-hidden': 'true' }, el('span', {}, '✔'), el('small', {}, new Date().getDate())),
        el('h2', {}, 'Treino do dia concluído!'),
        el('p', { class: 'frase' }, `${fraseFinal(media)} Ganhou ${total} estrelas hoje e o carimbo de hoje já está no calendário.`),
        el('div', { class: 'painel', style: { marginTop: '18px', textAlign: 'left' } },
          el('table', { class: 'tabela-prog' }, el('tbody', {},
            resultados.map(r => el('tr', {}, el('td', {}, `${JOGOS[r.jid].icone} ${JOGOS[r.jid].nome}`), el('td', {}, '⭐'.repeat(r.res.estrelas))))))),
        el('p', { class: 'frase' }, `🔥 ${diasSeguidos()} ${diasSeguidos() === 1 ? 'dia seguido' : 'dias seguidos'} a treinar. Volte amanhã para manter a sequência!`),
        blocoMedalhas(1500),
        el('div', { class: 'fila-botoes' },
          el('button', { class: 'btn laranja grande', type: 'button', onclick: () => ir('#/') }, '🏠 Voltar ao início'),
          el('button', { class: 'btn claro grande', type: 'button', onclick: () => ir('#/progresso') }, '📅 Ver o calendário'))));
    },
  });
}

// Corre uma sequência de exercícios com um ecrã de passagem entre eles.
function correrSequencia(passos, { titulo, pai, registarCada, aoFim }) {
  const resultados = [];
  const minhaVez = Symbol('sequencia');
  ecraAtual = minhaVez;

  function intervalo(k) {
    if (ecraAtual !== minhaVez) return;
    const { jid } = passos[k];
    const j = JOGOS[jid];
    const a = ecra(`${titulo} · ${k + 1} de ${passos.length}`, pai);
    ecraAtual = minhaVez;
    a.append(el('div', { class: 'resultado' },
      iconeJogo(j, 'icone-grande'),
      el('h2', {}, `Exercício ${k + 1} de ${passos.length}`),
      el('p', { class: 'frase', style: { fontWeight: 800, color: 'var(--texto)' } }, j.nome),
      el('p', { class: 'frase' }, j.ajuda),
      el('div', { class: 'fila-botoes' }, el('button', { class: 'btn verde grande', type: 'button', onclick: () => correr(k) }, k === 0 ? 'Começar ▶' : 'Continuar ▶'))));
    a.querySelector('.btn').focus({ preventScroll: true });
  }

  async function correr(k) {
    const { jid, nivel, opcoes } = passos[k];
    const j = JOGOS[jid];
    const a = ecra(`${titulo} · ${j.nome}`, pai);
    ecraAtual = minhaVez;
    a.append(el('div', { class: 'a-carregar' }, 'A preparar…'));
    let iniciar;
    try { iniciar = await j.carregar(); } catch (e) { mostrarErro(a, e); return; }
    if (ecraAtual !== minhaVez) return;
    limpar(a);
    const r = iniciar(a, {
      ...opcoes,
      nivel,
      aoTerminar: res => {
        if (ecraAtual !== minhaVez) return;
        if (registarCada) registar(jid, nivel, res);
        resultados.push({ jid, res });
        if (k + 1 < passos.length) intervalo(k + 1);
        else aoFim(resultados);
      },
    });
    limpeza = r instanceof Promise ? null : r;
    if (r instanceof Promise) r.then(f => { if (ecraAtual === minhaVez) limpeza = f; else if (typeof f === 'function') f(); }).catch(e => mostrarErro(a, e));
  }

  intervalo(0);
}

/* ---------- Teste da Cabeça ---------- */
const pontosTeste = () => (dados.testes || []).map(t => ({ d: t.d, v: t.idade }));
const ultimoTeste = () => (dados.testes && dados.testes.length ? dados.testes[dados.testes.length - 1] : null);

function frasePorIdade(idade) {
  if (idade <= 35) return 'Uma cabeça jovem e ágil! 💡✨';
  if (idade <= 50) return 'Está em grande forma! 💪';
  if (idade <= 65) return 'Boa forma — e treinar um bocadinho todos os dias ajuda sempre! 🌿';
  return 'Cada treino conta. Volte amanhã e veja a diferença! 🌱';
}

function teste() {
  const a = ecra('Teste da Cabeça', '#/');
  const ultimo = ultimoTeste();
  a.append(
    el('div', { class: 'cabeca-jogo' },
      el('div', { class: 'icone-grande', 'aria-hidden': 'true' }, '🎯'),
      el('h2', {}, 'Que idade tem a sua cabeça?'),
      el('p', {}, 'São três exercícios rápidos: Cores Trocadas, Contas Relâmpago e Memória de Palavras. Demora uns 3 minutos. Faça com calma, mas sem distrações.')),
    ultimo ? el('div', { class: 'painel centrado' }, el('h3', {}, 'Da última vez'), el('p', { class: 'idade-pequena' }, `${ultimo.idade} anos`), el('p', { class: 'nota' }, `em ${ultimo.d.split('-').reverse().join('/')}`)) : '',
    el('div', { class: 'fila-botoes' }, el('button', { class: 'btn verde grande', type: 'button', onclick: correrTeste }, '▶ Começar o teste')),
    el('div', { class: 'painel' }, graficoLinha(pontosTeste(), { titulo: '📈 A sua evolução', formatar: v => `${v} anos`, menorMelhor: true })),
    el('p', { class: 'nota' }, 'É só um jogo para treinar a cabeça a brincar — não é um teste médico.'),
  );
}

function correrTeste() {
  correrSequencia([
    { jid: 'cores', nivel: 2, opcoes: { rondas: 10, modoTeste: true } },
    { jid: 'relampago', nivel: 2, opcoes: { rondas: 10, modoTeste: true } },
    { jid: 'palavras', nivel: 1, opcoes: { modoTeste: true } },
  ], {
    titulo: 'Teste da Cabeça', pai: '#/teste',
    aoFim: async resultados => {
      const { idadeDaCabeca } = await import('./jogos/treino.js');
      const m = {};
      resultados.forEach(r => { m[r.jid] = r.res.metricas; });
      const idade = idadeDaCabeca(m);
      const lista = dados.testes || (dados.testes = []);
      const hoje = hojeISO();
      const anterior = lista.filter(t => t.d !== hoje).slice(-1)[0];
      const deHoje = lista.find(t => t.d === hoje);
      if (deHoje) deHoje.idade = Math.min(deHoje.idade, idade); else lista.push({ d: hoje, idade });
      if (lista.length > 200) lista.splice(0, lista.length - 200);
      registarJogo('teste', 1, idade <= 50 ? 3 : idade <= 65 ? 2 : 1);
      guardar();
      const a = ecra('Teste da Cabeça', '#/');
      som.vitoria();
      festa(['💡', '⭐', '✨', '🎯']);
      const melhorou = anterior && idade < anterior.idade;
      a.append(el('div', { class: 'resultado' },
        el('p', { class: 'frase' }, 'A sua cabeça está em forma de quem tem'),
        el('div', { class: 'idade-cabeca' }, String(idade), el('small', {}, 'anos')),
        el('h2', {}, frasePorIdade(idade)),
        anterior ? el('p', { class: 'frase' }, melhorou ? `🎉 Da última vez foram ${anterior.idade} anos — melhorou ${anterior.idade - idade}!` : `Da última vez foram ${anterior.idade} anos. Amanhã há mais!`) : null,
        el('div', { class: 'numeros' },
          el('div', {}, el('b', {}, `${(m.cores.ms / 1000).toFixed(1).replace('.', ',')} s`), el('span', {}, 'cores trocadas')),
          el('div', {}, el('b', {}, `${(m.relampago.ms / 1000).toFixed(1).replace('.', ',')} s`), el('span', {}, 'contas relâmpago')),
          el('div', {}, el('b', {}, `${m.palavras.acertos} de ${m.palavras.total}`), el('span', {}, 'palavras lembradas'))),
        el('div', { class: 'painel', style: { marginTop: '18px' } }, graficoLinha(pontosTeste(), { titulo: '📈 A sua evolução', formatar: v => `${v} anos`, menorMelhor: true })),
        blocoMedalhas(1800),
        el('p', { class: 'nota' }, 'É só um jogo para treinar a cabeça a brincar — não é um teste médico.'),
        el('div', { class: 'fila-botoes' },
          el('button', { class: 'btn laranja grande', type: 'button', onclick: () => ir('#/') }, '🏠 Voltar ao início'),
          el('button', { class: 'btn claro grande', type: 'button', onclick: () => ir('#/cabeca') }, '💡 Treinar mais'))));
    },
  });
}

/* ---------- Progresso ---------- */
const MESES_NOME = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

// Calendário do mês com um carimbo em cada dia de treino.
function calendario(ano, mes) {
  const caixa = el('div', { class: 'calendario' });
  const dias = new Set(dados.dias);
  const treinos = new Set(dados.treinos);
  const desenhar = (y, m) => {
    limpar(caixa);
    const primeiro = new Date(y, m, 1);
    const nDias = new Date(y, m + 1, 0).getDate();
    const vazio = (primeiro.getDay() + 6) % 7; // segunda-feira primeiro
    const hoje = hojeISO();
    let jogados = 0;
    const celulas = [];
    for (let k = 0; k < vazio; k++) celulas.push(el('div', { class: 'cal-dia vazio' }));
    for (let d = 1; d <= nDias; d++) {
      const iso = hojeISO(new Date(y, m, d));
      const treinou = treinos.has(iso);
      const jogou = dias.has(iso);
      if (jogou) jogados++;
      celulas.push(el('div', { class: `cal-dia${jogou ? ' jogou' : ''}${treinou ? ' treinou' : ''}${iso === hoje ? ' hoje' : ''}`, title: treinou ? 'Treino do Dia feito' : jogou ? 'Jogou neste dia' : '' },
        el('span', { class: 'num' }, d), jogou ? el('span', { class: 'carimbo', 'aria-label': treinou ? 'treino feito' : 'jogou' }, treinou ? '★' : '✔') : null));
    }
    const anterior = el('button', { class: 'btn claro', type: 'button', 'aria-label': 'Mês anterior', onclick: () => { const d = new Date(y, m - 1, 1); desenhar(d.getFullYear(), d.getMonth()); } }, '◀');
    const seguinte = el('button', { class: 'btn claro', type: 'button', 'aria-label': 'Mês seguinte', onclick: () => { const d = new Date(y, m + 1, 1); desenhar(d.getFullYear(), d.getMonth()); } }, '▶');
    caixa.append(
      el('div', { class: 'cal-topo' }, anterior, el('b', {}, `${MESES_NOME[m][0].toUpperCase()}${MESES_NOME[m].slice(1)} de ${y}`), seguinte),
      el('div', { class: 'cal-grelha' }, ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(n => el('div', { class: 'cal-nome' }, n)), celulas),
      el('p', { class: 'nota' }, `${jogados} ${jogados === 1 ? 'dia' : 'dias'} com jogos neste mês · ✔ jogou · ★ fez o Treino do Dia`));
  };
  desenhar(ano, mes);
  return caixa;
}

function progresso() {
  const a = ecra('O Meu Progresso', '#/');
  novasMedalhas(); // atribui as que já foram merecidas (ex.: dias seguidos)
  const seguidos = diasSeguidos();
  const jogados = Object.entries(dados.jogos).filter(([jid]) => JOGOS[jid]).sort((x, y) => y[1].vezes - x[1].vezes);
  const ganhas = dados.medalhas || {};
  const nGanhas = MEDALHAS.filter(m => ganhas[m.id]).length;
  const hist = dados.historico || {};
  const graficos = [];
  for (const n of [1, 2, 3]) {
    const k = `relampago-${n}-20`;
    if (hist[k]) graficos.push(graficoLinha(hist[k], { titulo: `⚡ Contas Relâmpago · ${NIVEIS[n].nome} (tempo)`, formatar: v => `${Math.round(v / 1000)} s`, menorMelhor: true }));
  }
  for (const n of [1, 2, 3]) {
    const k = `cores-${n}-15`;
    if (hist[k]) graficos.push(graficoLinha(hist[k], { titulo: `🎨 Cores Trocadas · ${NIVEIS[n].nome} (tempo)`, formatar: v => `${Math.round(v / 1000)} s`, menorMelhor: true }));
  }
  if (hist['leitura-ppm']) graficos.push(graficoLinha(hist['leitura-ppm'], { titulo: '📖 Leitura em voz alta (palavras por minuto)', formatar: v => `${v}` }));
  if (dados.testes && dados.testes.length) graficos.unshift(graficoLinha(pontosTeste(), { titulo: '🎯 Teste da Cabeça (idade)', formatar: v => `${v} anos`, menorMelhor: true }));
  const hoje = new Date();
  a.append(
    el('h2', { class: 'titulo-seccao' }, '🏅 O Meu Progresso'),
    el('p', { class: 'sub' }, 'Tudo fica guardado neste aparelho.'),
    el('div', { class: 'resumo' },
      el('div', { class: 'resumo-item' }, el('div', { class: 'icone' }, '⭐'), el('div', {}, el('b', {}, dados.estrelas), el('span', {}, 'estrelas'))),
      el('div', { class: 'resumo-item' }, el('div', { class: 'icone' }, '🔥'), el('div', {}, el('b', {}, seguidos), el('span', {}, 'dias seguidos'))),
      el('div', { class: 'resumo-item' }, el('div', { class: 'icone' }, '🏅'), el('div', {}, el('b', {}, `${nGanhas}/${MEDALHAS.length}`), el('span', {}, 'medalhas')))),
    el('div', { class: 'painel' }, el('h3', {}, '📅 Calendário de treinos'), calendario(hoje.getFullYear(), hoje.getMonth())),
    el('div', { class: 'painel' },
      el('h3', {}, `🏅 Medalhas (${nGanhas} de ${MEDALHAS.length})`),
      el('div', { class: 'medalhas' }, MEDALHAS.map(m => el('div', { class: `medalha${ganhas[m.id] ? ' ganha' : ''}` },
        el('div', { class: 'medalha-icone', 'aria-hidden': 'true' }, m.icone),
        el('b', {}, m.nome),
        el('span', {}, ganhas[m.id] ? `Ganha a ${ganhas[m.id].split('-').reverse().join('/')}` : m.desc))))),
    graficos.length ? el('div', { class: 'painel' }, el('h3', {}, '📈 A sua evolução'), graficos) : '',
    el('div', { class: 'painel' },
      el('h3', {}, '🃏 Cartas e dominó'),
      el('table', { class: 'tabela-prog' }, el('tbody', {},
        [1, 2, 3].map(n => el('tr', {},
          el('td', {}, `Paciência · ${NIVEIS[n].nome}`),
          el('td', {}, `${dados.pac.ganhos[n] || 0} ${dados.pac.ganhos[n] === 1 ? 'vitória' : 'vitórias'} em ${dados.pac.jogados[n] || 0} ${dados.pac.jogados[n] === 1 ? 'jogo' : 'jogos'}`))),
        el('tr', {}, el('td', {}, 'Dominó'), el('td', {}, dados.domino ? `${dados.domino.ganhos} ganhos · ${dados.domino.perdidos} perdidos` : 'ainda por jogar'))))),
    el('div', { class: 'painel' },
      el('h3', {}, '🎲 Jogos'),
      jogados.length
        ? el('table', { class: 'tabela-prog' }, el('tbody', {}, jogados.map(([jid, r]) => el('tr', {},
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
    Object.assign(dados, { nome, def, estrelas: 0, jogos: {}, dias: [], treinos: [], vistos: {}, pac: { ganhos: { 1: 0, 2: 0, 3: 0 }, jogados: { 1: 0, 2: 0, 3: 0 } }, medalhas: {}, recordes: {}, historico: {}, feitos: {}, testes: [], temasVistos: [] });
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
      'vibrate' in navigator ? el('div', { class: 'opcao-def' }, el('span', { class: 'rotulo' }, 'Vibrar ao acertar e ao errar'),
        segmentos([[true, 'Sim'], [false, 'Não']], dados.def.vibrar !== false, v => { dados.def.vibrar = v; if (v) navigator.vibrate(30); })) : null,
      el('div', { class: 'opcao-def' }, el('span', { class: 'rotulo' }, `Animações${aparelhoFraco() ? ' (este aparelho é mais lento: «Automático» poupa-o)' : ''}`),
        segmentos([['auto', 'Automático'], [false, 'Completas'], [true, 'Leves']], dados.def.leve == null ? 'auto' : dados.def.leve, v => { dados.def.leve = v === 'auto' ? null : v; aplicarDefinicoes(); })),
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
  const fichaTema = t => el('button', { class: 'tema-foto', type: 'button', onclick: () => ir(`#/jogo/${jid}/${t.id}`) },
    el('div', { class: 'capa', 'aria-hidden': 'true' }, t.fotos.slice(0, 2).map(f => el('img', { src: f.f, alt: '', loading: 'lazy', decoding: 'async' }))),
    el('b', {}, `${t.icone} ${t.tema}`),
    el('span', {}, `${t.fotos.length} fotografias`));
  const todos = el('div', { class: 'grelha-temas' }, el('button', { class: 'tema-foto todos', type: 'button', onclick: () => ir(`#/jogo/${jid}/todos`) },
    el('div', { class: 'capa', 'aria-hidden': 'true' }, '🎲'),
    el('b', {}, 'Todos misturados'),
    el('span', {}, `${new Set(temas.flatMap(t => t.fotos.map(f => f.fonte || f.f))).size} fotografias`)));
  // Temas arrumados por grupos (pela ordem de GRUPOS_FOTOS; grupos desconhecidos vão para o fim).
  const nomesGrupos = GRUPOS_FOTOS.map(g => g[0]);
  temas.forEach(t => { if (t.grupo && !nomesGrupos.includes(t.grupo)) nomesGrupos.push(t.grupo); });
  const blocos = [];
  for (const nome of nomesGrupos) {
    const lista = temas.filter(t => t.grupo === nome);
    if (!lista.length) continue;
    const g = GRUPOS_FOTOS.find(x => x[0] === nome);
    blocos.push(el('h3', { class: 'titulo-grupo' }, `${g ? g[1] : '📷'} ${nome}`), el('div', { class: 'grelha-temas' }, lista.map(fichaTema)));
  }
  const semGrupo = temas.filter(t => !t.grupo);
  if (semGrupo.length) blocos.push(el('div', { class: 'grelha-temas' }, semGrupo.map(fichaTema)));
  a.append(
    el('div', { class: 'cabeca-jogo' },
      el('div', { class: 'icone-grande', 'aria-hidden': 'true' }, j.icone),
      el('h2', {}, j.nome),
      el('p', {}, `Escolha um dos ${temas.length} temas.`)),
    todos,
    ...blocos,
    el('p', { class: 'nota' }, el('a', { href: '#/creditos' }, 'Créditos das fotografias')));
}
const GRUPOS_FOTOS = [
  ['Sporting e desporto', '🦁'],
  ['Terras e monumentos', '🏰'],
  ['Natureza e animais', '🌳'],
  ['Comida e sabores', '🍲'],
  ['História, arte e tradições', '🎨'],
];

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
  if (p0 === 'jogo' && JOGOS[p1] && JOGOS[p1].tema) {
    if (!p2) return escolherTema(p1);
    if (p1 === 'memfotos' && !partes[3]) return escolherPares(p2);
    return jogar(p1, p1 === 'memfotos' ? nivelDePares(Number(partes[3])) : 1, { tema: p2, pares: Number(partes[3]) || undefined });
  }
  if (p0 === 'treino') return treino();
  if (p0 === 'teste') return teste();
  if (p0 === 'progresso') return progresso();
  if (p0 === 'definicoes') return definicoes();
  if (p0 === 'jogo' && p1 && !p2) return escolherNivel(p1);
  if (p0 === 'jogo' && p1 && p2) return jogar(p1, Number(p2));
  return inicio();
}

window.addEventListener('hashchange', router);
aplicarDefinicoes();
router();

// Modo sem internet: o registo é imediato, mas a descarga das fotografias só começa uns
// segundos depois de a página abrir, para não atrapalhar telemóveis mais fracos.
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
    navigator.serviceWorker.ready.then(reg => {
      setTimeout(() => { if (reg.active) reg.active.postMessage({ tipo: 'guardar' }); }, 5000);
    }).catch(() => {});
  });
}
