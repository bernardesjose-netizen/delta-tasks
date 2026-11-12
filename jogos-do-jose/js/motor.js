// Motores reutilizáveis: ronda de escolha múltipla e ronda com teclado numérico.
import {
  el, limpar, baralhar, som, falar, calar, dados, elogio, outraVez, consolo, estrelasPorPercentagem, vozDisponivel, duracao, aviso,
} from './util.js';

// Sequências de respostas certas: um pequeno prémio aos 3, 5, 10, 15 e 20 seguidas.
const MARCOS = [3, 5, 10, 15, 20];
function celebrarSequencia(n) {
  if (!MARCOS.includes(n)) return;
  setTimeout(() => { som.combo(n); aviso(`🔥 ${n} certas seguidas!`, 2200); }, 380);
}

function barraProgresso(i, total) {
  return el('div', { class: 'progresso' },
    el('span', {}, `${i + 1} de ${total}`),
    el('div', { class: 'barra', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': total, 'aria-valuenow': i },
      el('i', { style: { width: `${(i / total) * 100}%` } })),
  );
}

function textoDe(n) {
  if (n == null) return '';
  if (typeof n === 'string') return n;
  return n.textContent || '';
}

function botaoOuvir(texto) {
  if (!vozDisponivel()) return null;
  return el('button', { class: 'btn-ouvir', type: 'button', 'aria-label': 'Ouvir a pergunta', onclick: () => falar(texto) }, '🔊');
}

function retorno(tipo, icone, titulo, extra) {
  return el('div', { class: `retorno ${tipo}` },
    el('div', { class: 'icone', 'aria-hidden': 'true' }, icone),
    el('div', {}, el('b', {}, titulo), extra ? el('div', { class: 'info-extra' }, extra) : null));
}

/**
 * Ronda de escolha múltipla.
 * perguntas: [{ etiqueta?, enunciado: string|Node, centrado?, opcoes: string[], certa: string, explicacao?, ler?, manterOrdem? }]
 * Errar à primeira dá direito a nova tentativa — a ideia é aprender, não castigar.
 */
export function rondaEscolha(alvo, { perguntas, aoTerminar, duasColunas = true }) {
  let i = 0;
  let pontos = 0;
  let aPrimeira = 0;
  let seguidas = 0;
  let melhorSeguidas = 0;
  const t0 = Date.now();
  let vivo = true;

  function mostrar() {
    if (!vivo) return;
    const q = perguntas[i];
    let tentativas = 0;
    limpar(alvo);
    const ronda = el('div', { class: 'ronda' });
    const textoLer = q.ler || textoDe(q.enunciado);
    const cartao = el('div', { class: 'cartao-pergunta' },
      q.etiqueta ? el('div', { class: 'etiqueta' }, q.etiqueta) : null,
      el('div', { class: `enunciado${q.centrado ? ' centrado' : ''}` }, q.enunciado),
      botaoOuvir(`${textoLer}. ${q.opcoes.join('; ')}`),
    );
    const opcoes = q.manterOrdem ? q.opcoes.slice() : baralhar(q.opcoes);
    const caixa = el('div', { class: `opcoes${duasColunas ? ' duas' : ''}` });
    const zonaRetorno = el('div');
    const botoes = opcoes.map(o => el('button', { class: 'opcao', type: 'button', onclick: () => responder(o, botao(o)) }, o));
    function botao(o) { return botoes[opcoes.indexOf(o)]; }
    caixa.append(...botoes);
    ronda.append(barraProgresso(i, perguntas.length), cartao, caixa, zonaRetorno);
    alvo.append(ronda);
    if (dados.def.voz) falar(textoLer);

    function terminarPergunta(bloco) {
      botoes.forEach(b => { b.disabled = true; });
      const seguinte = el('button', { class: 'btn verde grande largo', type: 'button', onclick: avancar },
        i + 1 < perguntas.length ? 'Continuar ▶' : 'Ver resultado ▶');
      limpar(zonaRetorno).append(bloco, el('div', { class: 'fila-botoes' }, seguinte));
      seguinte.focus({ preventScroll: true });
      zonaRetorno.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function responder(o, b) {
      if (b.disabled) return;
      calar();
      if (o === q.certa) {
        som.certo();
        b.classList.add('certa');
        pontos += tentativas === 0 ? 1 : 0.5;
        if (tentativas === 0) { aPrimeira++; seguidas++; melhorSeguidas = Math.max(melhorSeguidas, seguidas); celebrarSequencia(seguidas); } else seguidas = 0;
        botoes.forEach(x => { if (x !== b) x.classList.add('esbatida'); });
        terminarPergunta(retorno('bom', '😃', elogio(), q.explicacao));
        return;
      }
      tentativas++;
      seguidas = 0;
      b.disabled = true;
      b.classList.add('tentada');
      som.quase();
      if (tentativas === 1 && opcoes.length > 2) {
        limpar(zonaRetorno).append(retorno('quase', '🤔', outraVez()));
        return;
      }
      botao(q.certa).classList.add('mostrar');
      terminarPergunta(retorno('info', '💡', consolo(), [
        el('div', {}, 'A resposta certa é: ', el('b', { style: { display: 'inline' } }, q.certa)),
        q.explicacao ? el('div', { style: { marginTop: '4px' } }, q.explicacao) : null,
      ]));
    }
  }

  function avancar() {
    calar();
    i++;
    if (i < perguntas.length) { mostrar(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const total = perguntas.length;
    aoTerminar({
      estrelas: estrelasPorPercentagem(pontos / total),
      numeros: [
        { valor: `${aPrimeira} de ${total}`, rotulo: 'certas à primeira' },
        ...(melhorSeguidas >= 3 ? [{ valor: `🔥 ${melhorSeguidas}`, rotulo: 'certas seguidas' }] : []),
        { valor: duracao(Date.now() - t0), rotulo: 'tempo' },
      ],
    });
  }

  mostrar();
  return () => { vivo = false; calar(); };
}

/**
 * Ronda com teclado numérico (contas).
 * perguntas: [{ etiqueta?, enunciado: string|Node, resposta: number, ler? }]
 */
export function rondaTeclado(alvo, { perguntas, aoTerminar }) {
  let i = 0;
  let pontos = 0;
  let aPrimeira = 0;
  let seguidas = 0;
  const t0 = Date.now();
  let atual = null;

  function mostrar() {
    const q = perguntas[i];
    let tentativas = 0;
    let valor = '';
    let bloqueado = false;
    limpar(alvo);
    const visor = el('div', { class: 'visor vazio', 'aria-live': 'polite' }, '?');
    const zonaRetorno = el('div');
    const textoLer = q.ler || textoDe(q.enunciado);

    function atualizar() {
      visor.textContent = valor || '?';
      visor.classList.toggle('vazio', !valor);
    }
    function tecla(d) {
      if (bloqueado) return;
      if (d === 'apagar') { valor = valor.slice(0, -1); atualizar(); return; }
      if (d === 'ok') { confirmar(); return; }
      if (valor.length >= 5) return;
      som.clique();
      valor = valor === '0' ? d : valor + d;
      atualizar();
      limpar(zonaRetorno);
    }
    function confirmar() {
      if (!valor || bloqueado) return;
      if (Number(valor) === q.resposta) {
        bloqueado = true;
        som.certo();
        pontos += tentativas === 0 ? 1 : 0.5;
        if (tentativas === 0) { aPrimeira++; seguidas++; celebrarSequencia(seguidas); } else seguidas = 0;
        visor.style.borderColor = 'var(--verde)';
        visor.style.background = 'var(--verde-claro)';
        limpar(zonaRetorno).append(retorno('bom', '😃', elogio()));
        setTimeout(avancar, 1100);
        return;
      }
      tentativas++;
      seguidas = 0;
      som.quase();
      visor.classList.add('abanar');
      setTimeout(() => visor.classList.remove('abanar'), 450);
      if (tentativas === 1) {
        limpar(zonaRetorno).append(retorno('quase', '🤔', outraVez()));
        valor = '';
        atualizar();
        return;
      }
      bloqueado = true;
      const seguinte = el('button', { class: 'btn verde grande largo', type: 'button', onclick: avancar },
        i + 1 < perguntas.length ? 'Continuar ▶' : 'Ver resultado ▶');
      limpar(zonaRetorno).append(
        retorno('info', '💡', consolo(), ['A resposta certa é: ', el('b', { style: { display: 'inline' } }, String(q.resposta))]),
        el('div', { class: 'fila-botoes' }, seguinte));
      seguinte.focus({ preventScroll: true });
      zonaRetorno.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    const teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'apagar', '0', 'ok'].map(d => el('button', {
      class: `tecla${d === 'ok' ? ' ok' : ''}${d === 'apagar' ? ' apagar' : ''}`,
      type: 'button',
      'aria-label': d === 'apagar' ? 'Apagar' : d === 'ok' ? 'Confirmar' : d,
      onclick: () => tecla(d),
    }, d === 'apagar' ? '⌫ Apagar' : d === 'ok' ? '✔ OK' : d));

    alvo.append(el('div', { class: 'ronda' },
      barraProgresso(i, perguntas.length),
      el('div', { class: 'cartao-pergunta' },
        q.etiqueta ? el('div', { class: 'etiqueta' }, q.etiqueta) : null,
        el('div', { class: 'conta-grande' }, q.enunciado),
        botaoOuvir(textoLer)),
      visor,
      el('div', { class: 'teclado' }, teclas),
      zonaRetorno));
    if (dados.def.voz) falar(textoLer);

    atual = e => {
      if (/^[0-9]$/.test(e.key)) tecla(e.key);
      else if (e.key === 'Backspace') tecla('apagar');
      else if (e.key === 'Enter') { e.preventDefault(); if (bloqueado) { const b = zonaRetorno.querySelector('button'); if (b) b.click(); } else tecla('ok'); }
    };
  }

  function avancar() {
    calar();
    i++;
    if (i < perguntas.length) { mostrar(); return; }
    const total = perguntas.length;
    document.removeEventListener('keydown', ouvinte);
    aoTerminar({
      estrelas: estrelasPorPercentagem(pontos / total),
      numeros: [
        { valor: `${aPrimeira} de ${total}`, rotulo: 'certas à primeira' },
        { valor: duracao(Date.now() - t0), rotulo: 'tempo' },
      ],
    });
  }

  const ouvinte = e => atual && atual(e);
  document.addEventListener('keydown', ouvinte);
  mostrar();
  return () => { document.removeEventListener('keydown', ouvinte); calar(); };
}
