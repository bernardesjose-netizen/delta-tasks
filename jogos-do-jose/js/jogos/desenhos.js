// Jogos com desenhos (emoji): «O que é isto?» e «Encontre o diferente».
import { el, limpar, baralhar, amostra, escolher, som, elogio, outraVez, falar, dados, duracao, estrelasPorPercentagem, escolherNaoVistos } from '../util.js';
import { rondaEscolha } from '../motor.js';

/* ---------- O que é isto? ---------- */
// Nomes genéricos (que também serviriam para outro desenho da mesma categoria) e radicais das palavras,
// para nunca dar como errada uma opção que também está certa («Peixe» para o peixe tropical, «Carro» para o táxi).
const GENERICOS = ['passaro', 'arvore', 'flor', 'peixe', 'carro', 'pintainho', 'nuvem', 'estrela', 'lua', 'sapato', 'oculos', 'comboio', 'baleia', 'cao'];
const semAcentos = t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const radicais = t => semAcentos(t).split(/[\s-]+/).filter(p => p.length >= 4).map(p => p.slice(0, 4));
function confundivel(certo, outro) {
  if (GENERICOS.indexOf(semAcentos(outro)) >= 0) return true;
  const r = radicais(certo);
  return radicais(outro).some(p => r.indexOf(p) >= 0);
}

export async function oQueE(alvo, { nivel, curto, aoTerminar }) {
  const { EMOJIS } = await import('../dados/emojis.js');
  const n = curto ? 5 : 10;
  const escolhidos = escolherNaoVistos('oquee', EMOJIS, n, x => x.e);
  const perguntas = escolhidos.map(x => {
    const mesma = EMOJIS.filter(y => y.cat === x.cat && y.nome !== x.nome && !confundivel(x.nome, y.nome));
    const outras = EMOJIS.filter(y => y.cat !== x.cat);
    const nErradas = nivel === 3 ? 3 : 2;
    const erradas = amostra(nivel === 1 ? outras : mesma.length >= nErradas ? mesma : outras, nErradas).map(y => y.nome);
    return {
      etiqueta: x.cat,
      enunciado: el('div', {}, el('div', { class: 'centrado' }, 'O que é este desenho?'), el('div', { class: 'emoji-grande', 'aria-hidden': 'true' }, x.e)),
      ler: 'O que é este desenho?',
      centrado: true,
      opcoes: [x.nome, ...erradas],
      certa: x.nome,
    };
  });
  return rondaEscolha(alvo, { perguntas, aoTerminar });
}

/* ---------- Encontre o diferente ---------- */
export async function diferente(alvo, { nivel, curto, aoTerminar }) {
  const { EMOJIS, PARECIDOS } = await import('../dados/emojis.js');
  const lado = nivel === 1 ? 3 : nivel === 2 ? 4 : 5;
  const rondas = curto ? 5 : 10;
  let ronda = 0;
  let pontos = 0;
  let aPrimeira = 0;
  const t0 = Date.now();
  let vivo = true;
  let tProx = null;

  function par() {
    if (nivel === 3 && PARECIDOS && PARECIDOS.length) return baralhar(escolher(PARECIDOS));
    const a = escolher(EMOJIS);
    const candidatos = EMOJIS.filter(y => y.e !== a.e && (nivel === 1 ? y.cat !== a.cat : y.cat === a.cat));
    return [a.e, escolher(candidatos.length ? candidatos : EMOJIS.filter(y => y.e !== a.e)).e];
  }

  function mostrar() {
    if (!vivo) return;
    const [igual, outro] = par();
    const total = lado * lado;
    const certo = Math.floor(Math.random() * total);
    let erros = 0;
    let feito = false;
    limpar(alvo);
    const zona = el('div');
    const botoes = [];
    for (let i = 0; i < total; i++) {
      const b = el('button', { class: 'cel-dif', type: 'button', 'aria-label': `Figura ${i + 1}`, onclick: () => tocar(i, b) }, i === certo ? outro : igual);
      botoes.push(b);
    }
    alvo.append(el('div', { class: 'ronda' },
      el('div', { class: 'progresso' }, el('span', {}, `${ronda + 1} de ${rondas}`),
        el('div', { class: 'barra' }, el('i', { style: { width: `${(ronda / rondas) * 100}%` } }))),
      el('div', { class: 'cartao-pergunta' },
        el('div', { class: 'etiqueta' }, 'Encontre o diferente'),
        el('div', { class: 'enunciado centrado' }, 'Qual destas figuras é diferente das outras?'),
        el('div', { class: 'grelha-dif', style: { gridTemplateColumns: `repeat(${lado}, 1fr)`, '--lado': lado } }, botoes)),
      zona));
    alvo.querySelector('.grelha-dif').style.setProperty('--lado', lado);
    if (dados.def.voz) falar('Qual destas figuras é diferente das outras?');

    function tocar(i, b) {
      if (feito) return;
      if (i === certo) {
        feito = true;
        b.classList.add('certa');
        som.certo();
        pontos += erros === 0 ? 1 : 0.5;
        if (erros === 0) aPrimeira++;
        limpar(zona).append(el('div', { class: 'retorno bom' }, el('div', { class: 'icone' }, '😃'), el('div', {}, el('b', {}, elogio()))));
        tProx = setTimeout(avancar, 1100);
        return;
      }
      erros++;
      som.quase();
      b.classList.remove('abanar');
      void b.offsetWidth;
      b.classList.add('abanar');
      if (erros >= 2) botoes[certo].classList.add('pista');
      limpar(zona).append(el('div', { class: 'retorno quase' }, el('div', { class: 'icone' }, '🤔'),
        el('div', {}, el('b', {}, erros >= 2 ? 'É a que está a piscar!' : outraVez()))));
    }
  }

  function avancar() {
    ronda++;
    if (ronda < rondas) { mostrar(); return; }
    aoTerminar({
      estrelas: estrelasPorPercentagem(pontos / rondas),
      numeros: [
        { valor: `${aPrimeira} de ${rondas}`, rotulo: 'à primeira' },
        { valor: duracao(Date.now() - t0), rotulo: 'tempo' },
      ],
    });
  }

  mostrar();
  return () => { vivo = false; clearTimeout(tProx); };
}
