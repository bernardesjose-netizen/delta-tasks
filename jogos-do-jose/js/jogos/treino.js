// Treino cerebral contra o relógio: Contas Relâmpago, Cores Trocadas, Memória de Palavras e
// Leitura em Voz Alta. Tudo com pausa, recordes pessoais e sem castigos.
import {
  el, limpar, baralhar, amostra, escolher, inteiro, som, aviso, falar, calar, dados,
  verRecorde, registarHistorico, marcar, escolherNaoVistos, elogio,
} from '../util.js';

/* ---------- Relógio com pausa ---------- */
function relogio() {
  let inicio = performance.now();
  let acumulado = 0;
  let aCorrer = true;
  return {
    ms: () => acumulado + (aCorrer ? performance.now() - inicio : 0),
    pausar() { if (aCorrer) { acumulado += performance.now() - inicio; aCorrer = false; } },
    retomar() { if (!aCorrer) { inicio = performance.now(); aCorrer = true; } },
    get parado() { return !aCorrer; },
  };
}
export const mmss = ms => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
export const segundos = ms => `${(ms / 1000).toFixed(1).replace('.', ',')} s`;

// Barra de cima: progresso, tempo e botão de pausa (que esconde o exercício enquanto está parado).
function topo(rel, total, conteudo, { comPausa = true } = {}) {
  const txt = el('span', {}, `1 de ${total}`);
  const barra = el('i', { style: { width: '0%' } });
  const tempo = el('span', { class: 'cronometro', 'aria-live': 'off' }, '⏱ 0:00');
  const pausa = comPausa ? el('button', { class: 'btn claro pausa', type: 'button' }, '☕ Pausa') : null;
  const fundo = el('div', { class: 'ecra-pausa', hidden: true },
    el('div', {}, el('div', { class: 'icone-grande' }, '☕'), el('h2', {}, 'Em pausa'), el('p', {}, 'O relógio está parado. Descanse o tempo que quiser.'),
      el('button', { class: 'btn verde grande', type: 'button', onclick: retomar }, '▶ Continuar')));
  function retomar() { fundo.hidden = true; conteudo.hidden = false; rel.retomar(); }
  if (pausa) pausa.addEventListener('click', () => { rel.pausar(); conteudo.hidden = true; fundo.hidden = false; calar(); });
  const intervalo = setInterval(() => { tempo.textContent = `⏱ ${mmss(rel.ms())}`; }, 250);
  return {
    elemento: el('div', {}, el('div', { class: 'progresso' }, txt, el('div', { class: 'barra' }, barra), tempo, pausa), fundo),
    atualizar(i) { txt.textContent = `${Math.min(i + 1, total)} de ${total}`; barra.style.width = `${(i / total) * 100}%`; },
    parar() { clearInterval(intervalo); },
    get emPausa() { return !fundo.hidden; },
  };
}

function resultadoTempo({ chave, ms, erros, total, modoTeste, extra = [] }) {
  const estrelas = erros === 0 ? 3 : erros <= 2 ? 2 : 1;
  let rec = { bateu: false, primeiro: true, anterior: null };
  if (!modoTeste) {
    rec = verRecorde(chave, ms, true);
    registarHistorico(chave, ms, true);
  }
  return {
    estrelas,
    recorde: rec.bateu && !rec.primeiro,
    numeros: [
      { valor: segundos(ms), rotulo: 'tempo' },
      { valor: String(erros), rotulo: erros === 1 ? 'engano' : 'enganos' },
      ...(!modoTeste && rec.anterior != null ? [{ valor: segundos(rec.anterior), rotulo: rec.bateu ? 'recorde anterior' : 'o seu recorde' }] : []),
      ...extra,
    ],
    metricas: { ms, erros, total },
  };
}

/* ================= Contas Relâmpago ================= */
function gerarConta(nivel) {
  let a; let b; let op;
  const r = Math.random();
  if (nivel === 1) {
    if (r < 0.55) { op = '+'; a = inteiro(1, 9); b = inteiro(1, 10 - a); } else { op = '−'; a = inteiro(2, 10); b = inteiro(1, a - 1); }
  } else if (nivel === 2) {
    if (r < 0.4) { op = '+'; a = inteiro(2, 15); b = inteiro(2, 20 - a); } else if (r < 0.7) { op = '−'; a = inteiro(8, 20); b = inteiro(2, a - 1); } else { op = '×'; a = escolher([2, 3, 4, 5]); b = inteiro(2, 9); }
  } else if (r < 0.3) { op = '+'; a = inteiro(11, 39); b = inteiro(3, 50 - a); } else if (r < 0.55) { op = '−'; a = inteiro(20, 50); b = inteiro(3, a - 2); } else if (r < 0.85) { op = '×'; a = inteiro(2, 9); b = inteiro(2, 9); } else { op = '÷'; b = inteiro(2, 9); a = b * inteiro(2, 9); }
  const resp = op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b;
  const ler = { '+': 'mais', '−': 'menos', '×': 'vezes', '÷': 'a dividir por' }[op];
  return { txt: `${a} ${op} ${b}`, ler: `${a} ${ler} ${b}`, r: resp, chave: `${a}${op}${b}` };
}

export function relampago(alvo, { nivel, curto, rondas, aoTerminar, modoTeste }) {
  const total = rondas || (curto ? 10 : 20);
  const contas = [];
  const vistas = new Set();
  while (contas.length < total) {
    const c = gerarConta(nivel);
    if (vistas.has(c.chave) && vistas.size < 60) continue;
    vistas.add(c.chave);
    contas.push(c);
  }
  let i = 0;
  let erros = 0;
  let errosAqui = 0;
  let valor = '';
  let bloqueado = false;
  let vivo = true;
  const rel = relogio();

  limpar(alvo);
  const conteudo = el('div');
  const barra = topo(rel, total, conteudo);
  const conta = el('div', { class: 'conta-grande relampago' });
  const visor = el('div', { class: 'visor vazio' }, '?');
  const msg = el('div', { class: 'msg-curta', 'aria-live': 'polite' });
  const teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'apagar', '0', 'ok'].map(d => el('button', {
    class: `tecla${d === 'ok' ? ' ok' : ''}${d === 'apagar' ? ' apagar' : ''}`, type: 'button',
    'aria-label': d === 'apagar' ? 'Apagar' : d === 'ok' ? 'Confirmar' : d,
    onclick: () => tecla(d),
  }, d === 'apagar' ? '⌫' : d === 'ok' ? '✔ OK' : d));
  conteudo.append(el('div', { class: 'cartao-pergunta' }, el('div', { class: 'etiqueta' }, 'Contas Relâmpago'), conta), visor, msg, el('div', { class: 'teclado' }, teclas));
  alvo.append(el('div', { class: 'ronda compacto' }, barra.elemento, conteudo));

  function mostrar() {
    const c = contas[i];
    conta.textContent = `${c.txt} =`;
    valor = '';
    errosAqui = 0;
    atualizar();
    barra.atualizar(i);
    if (dados.def.voz) falar(c.ler);
  }
  function atualizar() { visor.textContent = valor || '?'; visor.classList.toggle('vazio', !valor); visor.classList.remove('certo'); }
  function tecla(d) {
    if (bloqueado || barra.emPausa) return;
    if (d === 'apagar') { valor = valor.slice(0, -1); atualizar(); return; }
    if (d === 'ok') { if (valor) verificar(false); return; }
    if (valor.length >= 4) return;
    som.clique();
    valor += d;
    atualizar();
    verificar(true);
  }
  function verificar(automatico) {
    const certa = String(contas[i].r);
    if (valor === certa) {
      bloqueado = true;
      som.rapido();
      visor.classList.add('certo');
      msg.textContent = '';
      setTimeout(seguinte, 230);
      return;
    }
    if (automatico && valor.length < certa.length && certa.startsWith(valor)) return; // ainda a escrever
    if (automatico && valor.length < certa.length) return;
    erros++;
    errosAqui++;
    som.quase();
    visor.classList.remove('abanar');
    void visor.offsetWidth;
    visor.classList.add('abanar');
    valor = '';
    atualizar();
    if (errosAqui >= 2) {
      bloqueado = true;
      msg.textContent = `Era ${certa}. Vamos à próxima!`;
      setTimeout(() => { msg.textContent = ''; seguinte(); }, 1300);
    } else msg.textContent = 'Quase! Tente outra vez.';
  }
  function seguinte() {
    if (!vivo) return;
    bloqueado = false;
    i++;
    if (i < total) { mostrar(); return; }
    rel.pausar();
    barra.parar();
    const ms = rel.ms();
    if (erros === 0) marcar('relampagoPerfeito');
    const res = resultadoTempo({ chave: `relampago-${nivel}-${total}`, ms, erros, total, modoTeste, extra: [{ valor: segundos(ms / total), rotulo: 'por conta' }] });
    res.titulo = erros === 0 ? 'Sem enganos! ⚡' : 'Contas feitas!';
    aoTerminar(res);
  }
  const teclado = e => {
    if (/^[0-9]$/.test(e.key)) tecla(e.key);
    else if (e.key === 'Backspace') tecla('apagar');
    else if (e.key === 'Enter') { e.preventDefault(); tecla('ok'); }
  };
  document.addEventListener('keydown', teclado);
  mostrar();
  return () => { vivo = false; barra.parar(); document.removeEventListener('keydown', teclado); calar(); };
}

/* ================= Cores Trocadas ================= */
const CORES = [
  { nome: 'Vermelho', cor: '#d32f2f' }, { nome: 'Azul', cor: '#1e5fd1' }, { nome: 'Verde', cor: '#1b8a3a' },
  { nome: 'Amarelo', cor: '#e0a800' }, { nome: 'Preto', cor: '#1d1d1d' }, { nome: 'Roxo', cor: '#7b3fd0' },
];

export function cores(alvo, { nivel, curto, rondas, aoTerminar, modoTeste }) {
  const paleta = CORES.slice(0, nivel === 3 ? 6 : 4);
  const pIgual = nivel === 1 ? 0.5 : nivel === 2 ? 0.25 : 0.1;
  const total = rondas || (curto ? 8 : 15);
  const lista = [];
  let antes = null;
  for (let k = 0; k < total; k++) {
    const palavra = escolher(paleta);
    let tinta = Math.random() < pIgual ? palavra : escolher(paleta.filter(c => c !== palavra));
    if (tinta === antes) tinta = escolher(paleta.filter(c => c !== antes && (Math.random() < pIgual || c !== palavra)));
    antes = tinta;
    lista.push({ palavra, tinta });
  }
  let i = 0;
  let erros = 0;
  let bloqueado = false;
  let vivo = true;
  const rel = relogio();

  limpar(alvo);
  const conteudo = el('div');
  const barra = topo(rel, total, conteudo);
  const palavraEl = el('div', { class: 'palavra-cor' });
  const msg = el('div', { class: 'msg-curta', 'aria-live': 'polite' });
  const botoes = paleta.map(c => el('button', { class: 'botao-cor', type: 'button', onclick: () => tocar(c) },
    el('span', { class: 'amostra', style: { background: c.cor } }), c.nome));
  conteudo.append(
    el('div', { class: 'cartao-pergunta' },
      el('div', { class: 'etiqueta' }, 'Cores Trocadas'),
      el('div', { class: 'enunciado centrado' }, 'Toque na cor da TINTA, não na palavra!'),
      palavraEl),
    msg,
    el('div', { class: 'grelha-cores' }, botoes));
  alvo.append(el('div', { class: 'ronda compacto' }, barra.elemento, conteudo));

  function mostrar() {
    const { palavra, tinta } = lista[i];
    palavraEl.textContent = palavra.nome.toUpperCase();
    palavraEl.style.color = tinta.cor;
    palavraEl.classList.remove('entrar');
    void palavraEl.offsetWidth;
    palavraEl.classList.add('entrar');
    barra.atualizar(i);
  }
  function tocar(c) {
    if (bloqueado || barra.emPausa) return;
    if (c === lista[i].tinta) {
      som.rapido();
      msg.textContent = '';
      bloqueado = true;
      setTimeout(() => {
        if (!vivo) return;
        bloqueado = false;
        i++;
        if (i < total) { mostrar(); return; }
        rel.pausar();
        barra.parar();
        const ms = rel.ms();
        if (erros === 0) marcar('coresPerfeito');
        const res = resultadoTempo({ chave: `cores-${nivel}-${total}`, ms, erros, total, modoTeste });
        res.titulo = erros === 0 ? 'Olho de lince! 🎨' : 'Cores acabadas!';
        aoTerminar(res);
      }, 160);
      return;
    }
    erros++;
    som.quase();
    msg.textContent = c === lista[i].palavra ? 'Leu a palavra! O que conta é a cor da tinta.' : 'Quase! Olhe bem para a cor da tinta.';
  }
  mostrar();
  return () => { vivo = false; barra.parar(); };
}

/* ================= Memória de Palavras ================= */
export async function palavras(alvo, { nivel, aoTerminar, modoTeste, nPalavras }) {
  const { EMOJIS } = await import('../dados/emojis.js');
  const pool = EMOJIS.filter(x => !/\s/.test(x.nome) && x.nome.length <= 11);
  const n = nPalavras || (nivel === 1 ? 6 : nivel === 2 ? 9 : 12);
  const segs = nivel === 1 ? 40 : nivel === 2 ? 50 : 60;
  const comDesenho = nivel === 1;
  const vistas = amostra(pool, n);
  const outras = amostra(pool.filter(x => !vistas.includes(x)), n);
  let vivo = true;
  let temporizador = null;

  const cartao = (x, extra = {}) => el(extra.botao ? 'button' : 'div', { class: `palavra-cartao${extra.classe || ''}`, type: extra.botao ? 'button' : null, onclick: extra.onclick },
    comDesenho ? el('span', { class: 'desenho', 'aria-hidden': 'true' }, x.e) : null, el('span', {}, x.nome));

  function fase1() {
    limpar(alvo);
    const barraTempo = el('i', {});
    alvo.append(el('div', { class: 'ronda' },
      el('div', { class: 'cartao-pergunta' },
        el('div', { class: 'etiqueta' }, 'Memória de Palavras'),
        el('div', { class: 'enunciado centrado' }, `Decore estas ${n} palavras. Tem ${segs} segundos.`),
        el('div', { class: 'grelha-palavras' }, vistas.map(x => cartao(x))),
        el('div', { class: 'contagem' }, barraTempo)),
      el('div', { class: 'fila-botoes' }, el('button', { class: 'btn verde grande', type: 'button', onclick: fase2 }, 'Já decorei ▶'))));
    if (dados.def.voz) falar(`Decore estas palavras: ${vistas.map(x => x.nome).join(', ')}`);
    requestAnimationFrame(() => {
      barraTempo.style.transitionDuration = `${segs}s`;
      requestAnimationFrame(() => { barraTempo.style.width = '0%'; });
    });
    temporizador = setTimeout(fase2, segs * 1000);
  }

  function fase2() {
    clearTimeout(temporizador);
    if (!vivo) return;
    calar();
    const todas = baralhar([...vistas, ...outras]);
    const marcadas = new Set();
    limpar(alvo);
    const zona = el('div');
    const confirmar = el('button', { class: 'btn verde grande', type: 'button', disabled: true, onclick: corrigir }, 'Confirmar ✔');
    const botoes = todas.map(x => cartao(x, {
      botao: true,
      onclick: e => {
        if (confirmar.dataset.feito) return;
        const b = e.currentTarget;
        if (marcadas.has(x)) marcadas.delete(x); else marcadas.add(x);
        b.classList.toggle('marcada', marcadas.has(x));
        som.clique();
        confirmar.disabled = marcadas.size === 0;
        confirmar.textContent = `Confirmar ✔ (${marcadas.size} escolhidas)`;
      },
    }));
    alvo.append(el('div', { class: 'ronda' },
      el('div', { class: 'cartao-pergunta' },
        el('div', { class: 'etiqueta' }, 'Memória de Palavras'),
        el('div', { class: 'enunciado centrado' }, `Toque nas palavras que viu (eram ${n}).`),
        el('div', { class: 'grelha-palavras' }, botoes)),
      el('div', { class: 'fila-botoes' }, confirmar), zona));

    function corrigir() {
      confirmar.dataset.feito = '1';
      confirmar.disabled = true;
      let acertos = 0;
      let erradas = 0;
      botoes.forEach((b, k) => {
        const x = todas[k];
        const era = vistas.includes(x);
        if (era && marcadas.has(x)) { b.classList.add('certa'); acertos++; } else if (era) b.classList.add('faltou');
        else if (marcadas.has(x)) { b.classList.add('errada'); erradas++; }
      });
      const pontos = Math.max(0, acertos - erradas);
      if (acertos === n && erradas === 0) som.certo(); else som.par();
      const rec = modoTeste ? { bateu: false } : verRecorde(`palavras-${nivel}`, pontos, false);
      if (!modoTeste) registarHistorico(`palavras-${nivel}`, pontos, false);
      const seguinte = el('button', { class: 'btn verde grande largo', type: 'button', onclick: () => aoTerminar({
        estrelas: pontos / n >= 0.8 ? 3 : pontos / n >= 0.5 ? 2 : 1,
        titulo: acertos === n && erradas === 0 ? 'Memória de elefante! 🐘' : 'Boa memória!',
        recorde: rec.bateu && rec.anterior != null,
        numeros: [
          { valor: `${acertos} de ${n}`, rotulo: 'palavras lembradas' },
          { valor: String(erradas), rotulo: erradas === 1 ? 'palavra a mais' : 'palavras a mais' },
        ],
        metricas: { acertos, erradas, total: n },
      }) }, 'Continuar ▶');
      limpar(zona).append(
        el('div', { class: `retorno ${acertos === n ? 'bom' : 'info'}` }, el('div', { class: 'icone' }, acertos === n ? '😃' : '💡'),
          el('div', {}, el('b', {}, acertos === n ? elogio() : `Lembrou-se de ${acertos} de ${n}. Muito bem!`),
            el('div', { class: 'info-extra' }, 'As que faltaram estão a amarelo.'))),
        el('div', { class: 'fila-botoes' }, seguinte));
      zona.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  fase1();
  return () => { vivo = false; clearTimeout(temporizador); calar(); };
}

/* ================= Leitura em Voz Alta ================= */
export async function leitura(alvo, { nivel, aoTerminar }) {
  const { TEXTOS } = await import('../dados/textos.js');
  const lista = TEXTOS.filter(t => t.n === nivel);
  if (nivel === 1) {
    const { PROVERBIOS } = await import('../dados/conteudos.js');
    const cinco = amostra(PROVERBIOS.filter(p => p.n === 1), 5);
    lista.push({ id: 'proverbios', n: 1, titulo: 'Cinco provérbios', autor: 'Sabedoria popular', texto: cinco.map(p => `${p.inicio} ${p.certa}.`).join('\n') });
  }
  const [t] = escolherNaoVistos(`leit${nivel}`, lista, 1, x => x.id);
  const nPalavras = t.texto.split(/\s+/).filter(w => /[\p{L}\d]/u.test(w)).length;
  let rel = null;
  let intervalo = null;

  limpar(alvo);
  const corpo = el('div', { class: 'texto-leitura', hidden: true }, t.texto);
  const tempo = el('span', { class: 'cronometro' }, '⏱ 0:00');
  const zona = el('div', { class: 'fila-botoes' });
  const comecar = el('button', { class: 'btn verde grande', type: 'button', onclick: iniciar }, '▶ Começar a ler');
  const instrucao = el('p', { class: 'dica' }, 'Leia o texto em voz alta, com calma. No fim, carregue em «Terminei».');
  // Os botões ficam no topo, logo antes do texto; no fim do texto há só um «Terminei» de reserva.
  const fimTexto = el('div', { class: 'fila-botoes leitura-fim', hidden: true },
    el('button', { class: 'btn verde grande', type: 'button', onclick: terminar }, '✔ Terminei'));
  // o cronómetro só aparece depois de começar, para o botão «Começar a ler» caber logo no ecrã
  const linhaTempo = el('div', { class: 'progresso' }, tempo);
  linhaTempo.style.display = 'none';
  const controlos = el('div', { class: 'leitura-controlos' }, linhaTempo, zona);
  alvo.append(el('div', { class: 'ronda' },
    el('div', { class: 'cartao-pergunta' },
      el('div', { class: 'etiqueta' }, 'Leitura em Voz Alta'),
      el('div', { class: 'enunciado' }, t.titulo),
      el('p', { class: 'autor-texto' }, `${t.autor} · ${nPalavras} palavras`),
      controlos,
      instrucao,
      corpo),
    fimTexto));
  zona.append(comecar);

  function iniciar() {
    corpo.hidden = false;
    instrucao.hidden = true;
    fimTexto.hidden = false;
    linhaTempo.style.display = '';
    rel = relogio();
    intervalo = setInterval(() => { tempo.textContent = `⏱ ${mmss(rel.ms())}`; }, 250);
    limpar(zona).append(el('button', { class: 'btn verde grande', type: 'button', onclick: terminar }, '✔ Terminei'));
  }

  function terminar() {
    rel.pausar();
    clearInterval(intervalo);
    const ms = rel.ms();
    const ppm = Math.round(nPalavras / (ms / 60000));
    const rec = verRecorde(`leitura-${t.id}`, ms, true);
    registarHistorico('leitura-ppm', ppm, false);
    marcar('leituras');
    som.certo();
    const continuar = el('button', { class: 'btn verde grande', type: 'button', onclick: () => {
      calar();
      aoTerminar({
        estrelas: ppm >= 90 ? 3 : ppm >= 55 ? 2 : 1,
        titulo: 'Leitura feita! 📖',
        recorde: rec.bateu && !rec.primeiro,
        numeros: [
          { valor: segundos(ms), rotulo: 'tempo' },
          { valor: String(ppm), rotulo: 'palavras por minuto' },
          ...(rec.anterior != null ? [{ valor: segundos(rec.anterior), rotulo: rec.bateu ? 'melhor tempo anterior' : 'o seu melhor tempo' }] : []),
        ],
      });
    } }, 'Continuar ▶');
    fimTexto.hidden = true;
    limpar(zona).append(
      el('button', { class: 'btn claro grande', type: 'button', onclick: () => falar(t.texto) }, '🔊 Ouvir o texto'),
      continuar);
    // volta ao topo do texto, onde estão agora «Ouvir» e «Continuar»
    if (controlos.getBoundingClientRect().top < 70) window.scrollTo(0, Math.max(0, controlos.getBoundingClientRect().top + window.pageYOffset - 90));
    aviso(`Leu ${nPalavras} palavras em ${segundos(ms)}. ${elogio()}`, 3500);
  }

  return () => { clearInterval(intervalo); calar(); };
}

/* ================= Idade da cabeça (só um jogo, não é um teste médico) ================= */
export function idadeDaCabeca({ cores: c, relampago: r, palavras: p }) {
  const lim = v => Math.max(0, Math.min(1, v));
  const sc = c ? lim(1 - ((c.ms / c.total / 1000) - 0.9) / 2.6) - 0.06 * c.erros : 0.5;
  const sr = r ? lim(1 - ((r.ms / r.total / 1000) - 1.5) / 5) - 0.06 * r.erros : 0.5;
  const sp = p ? lim((p.acertos - 0.5 * p.erradas) / p.total) : 0.5;
  const desempenho = lim((lim(sc) + lim(sr) + sp) / 3);
  return Math.round(20 + (1 - desempenho) * 60);
}
