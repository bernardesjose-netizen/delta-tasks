// Paciência (Klondike) com 3 níveis. Todos os jogos são verificados antes de começar: têm sempre solução.
//  Nível 1 — todas as cartas da mesa à vista, tira-se 1 carta de cada vez.
//  Nível 2 — clássico, tira-se 1 carta de cada vez.
//  Nível 3 — clássico, tiram-se 3 cartas de cada vez.
// Em todos: desfazer ilimitado, ajudas e voltas ao baralho sem limite.
import { el, limpar, baralhar, som, aviso, festa, duracao, dados, guardar } from '../util.js';

const NAIPES = ['♥', '♦', '♣', '♠'];
const NOMES_NAIPES = ['copas', 'ouros', 'paus', 'espadas'];
const VAL = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'V', 'D', 'R'];
const NOMES = ['Ás', 'Dois', 'Três', 'Quatro', 'Cinco', 'Seis', 'Sete', 'Oito', 'Nove', 'Dez', 'Valete', 'Dama', 'Rei'];
const FIG = { 11: '💂', 12: '👸', 13: '🤴' };
const vermelho = s => s < 2;

/* ---------- Distribuição e verificação de solução ---------- */
function distribuir() {
  const b = baralhar(Array.from({ length: 52 }, (_, k) => ({ id: k, s: k % 4, r: Math.floor(k / 4) + 1, up: false })));
  const tab = [[], [], [], [], [], [], []];
  for (let c = 0; c < 7; c++) {
    for (let k = 0; k <= c; k++) {
      const carta = b.pop();
      carta.up = k === c;
      tab[c].push(carta);
    }
  }
  return { tab, stock: b };
}

// Jogador automático simples (e guloso). Se ele consegue ganhar, o jogo tem solução.
export function temSolucao(deal, draw) {
  const tab = deal.tab.map(col => col.map(c => ({ s: c.s, r: c.r, up: c.up })));
  let stock = deal.stock.map(c => ({ s: c.s, r: c.r }));
  let waste = [];
  const f = [0, 0, 0, 0];
  let progresso = false;
  const podeF = c => f[c.s] === c.r - 1;
  const encaixa = (c, d) => d.up && vermelho(c.s) !== vermelho(d.s) && d.r === c.r + 1;
  const virar = col => { if (col.length && !col[col.length - 1].up) col[col.length - 1].up = true; };
  for (let it = 0; it < 5000; it++) {
    if (f[0] + f[1] + f[2] + f[3] === 52) return true;
    let mexeu = false;
    for (const col of tab) {
      const c = col[col.length - 1];
      if (c && podeF(c)) { f[c.s]++; col.pop(); virar(col); mexeu = true; break; }
    }
    if (!mexeu && waste.length && podeF(waste[waste.length - 1])) { f[waste.pop().s]++; mexeu = true; }
    if (!mexeu) {
      fora: for (let a = 0; a < 7; a++) {
        const col = tab[a];
        const i = col.findIndex(c => c.up);
        if (i <= 0) continue; // só interessa se destapar uma carta virada
        for (let b = 0; b < 7; b++) {
          if (b === a) continue;
          const topo = tab[b][tab[b].length - 1];
          if (topo ? encaixa(col[i], topo) : col[i].r === 13) {
            tab[b].push(...col.splice(i));
            virar(col);
            mexeu = true;
            break fora;
          }
        }
      }
    }
    if (!mexeu && waste.length) {
      const c = waste[waste.length - 1];
      for (const dest of tab) {
        const topo = dest[dest.length - 1];
        if (topo ? encaixa(c, topo) : c.r === 13) { dest.push({ ...c, up: true }); waste.pop(); mexeu = true; break; }
      }
    }
    if (mexeu) { progresso = true; continue; }
    if (stock.length) { for (let k = 0; k < draw && stock.length; k++) waste.push(stock.pop()); continue; }
    if (waste.length) {
      if (!progresso) return false;
      progresso = false;
      stock = waste.reverse();
      waste = [];
      continue;
    }
    return false;
  }
  return false;
}

export function distribuirComSolucao(draw) {
  let deal = null;
  for (let t = 0; t < 600; t++) {
    deal = distribuir();
    if (temSolucao(deal, draw)) return { deal, verificado: true };
  }
  return { deal, verificado: false };
}

/* ---------- Jogo ---------- */
export function paciencia(alvo, { nivel, aoTerminar }) {
  const draw = nivel === 3 ? 3 : 1;
  const CARTAS = Array.from({ length: 52 }, (_, k) => ({ id: k, s: k % 4, r: Math.floor(k / 4) + 1, up: false }));
  let st;
  let historico = [];
  let t0;
  let autoAtivo = false;
  let vivo = true;
  let L = null; // medidas atuais

  // ---- estrutura do ecrã
  limpar(alvo);
  alvo.classList.add('ecra-cheio');
  const infoNivel = el('span', {}, `Nível ${nivel} · ${draw === 1 ? 'tira-se 1 carta' : 'tiram-se 3 cartas'}`);
  const infoJogadas = el('span', {}, 'Jogadas: 0');
  const mesa = el('div', { class: 'pac-mesa' });
  const btnDesfazer = el('button', { class: 'btn claro', type: 'button', onclick: desfazer }, '↶ Desfazer');
  const btnAjuda = el('button', { class: 'btn', type: 'button', onclick: ajuda }, '💡 Ajuda');
  const btnNovo = el('button', { class: 'btn roxo', type: 'button', onclick: pedirNovo }, '🔄 Novo jogo');
  const btnTerminar = el('button', { class: 'btn laranja esconder', type: 'button', onclick: terminarAuto }, '✨ Terminar');
  alvo.append(el('div', { class: 'pac' },
    el('div', { class: 'pac-info' }, infoNivel, el('span', {}, '✔ Este jogo tem solução'), infoJogadas),
    mesa,
    el('div', { class: 'pac-barra' }, btnDesfazer, btnAjuda, btnTerminar, btnNovo)));

  // lugares vazios
  const lugarBaralho = el('div', { class: 'lugar baralho', 'data-tipo': 'stock', 'aria-label': 'Baralho: toque para tirar cartas' }, '↻');
  const lugaresFund = NAIPES.map((n, s) => el('div', { class: 'lugar', 'data-tipo': 'found', 'data-s': s }, n));
  const lugaresCol = Array.from({ length: 7 }, (_, k) => el('div', { class: 'lugar', 'data-tipo': 'tab', 'data-k': k }, 'R'));
  mesa.append(lugarBaralho, ...lugaresFund, ...lugaresCol);

  // cartas
  const ELS = CARTAS.map(c => {
    const e = el('div', {
      class: `carta ${vermelho(c.s) ? 'vermelha' : 'preta'}`, 'data-id': c.id,
      'aria-label': `${NOMES[c.r - 1]} de ${NOMES_NAIPES[c.s]}`,
    },
    el('div', { class: 'canto' }, VAL[c.r - 1], el('small', {}, NAIPES[c.s])),
    el('div', { class: `centro${FIG[c.r] ? ' figura-carta' : ''}` }, FIG[c.r] || NAIPES[c.s]));
    mesa.append(e);
    return e;
  });

  /* ---- estado ---- */
  function foto() {
    return {
      tab: st.tab.map(col => col.map(c => [c.id, c.up ? 1 : 0])),
      stock: st.stock.map(c => c.id),
      waste: st.waste.map(c => c.id),
      found: st.found.map(f => f.map(c => c.id)),
      jogadas: st.jogadas,
    };
  }
  function repor(f) {
    st = {
      tab: f.tab.map(col => col.map(([id, up]) => Object.assign(CARTAS[id], { up: !!up }))),
      stock: f.stock.map(id => Object.assign(CARTAS[id], { up: false })),
      waste: f.waste.map(id => Object.assign(CARTAS[id], { up: true })),
      found: f.found.map(fl => fl.map(id => Object.assign(CARTAS[id], { up: true }))),
      jogadas: f.jogadas,
    };
  }
  function gravar() {
    dados.pacJogos = dados.pacJogos || {};
    dados.pacJogos[nivel] = { foto: foto(), historico: historico.slice(-150), t0 };
    guardar();
  }

  function novoJogo() {
    const { deal } = distribuirComSolucao(draw);
    st = {
      tab: deal.tab.map(col => col.map(c => Object.assign(CARTAS[c.id], { up: nivel === 1 ? true : c.up }))),
      stock: deal.stock.map(c => Object.assign(CARTAS[c.id], { up: false })),
      waste: [],
      found: [[], [], [], []],
      jogadas: 0,
    };
    historico = [];
    t0 = Date.now();
    dados.pac.jogados[nivel] = (dados.pac.jogados[nivel] || 0) + 1;
    gravar();
    medir();
    desenhar(null, false);
  }

  /* ---- regras ---- */
  const topo = arr => arr[arr.length - 1];
  const podeFundacao = c => st.found[c.s].length === c.r - 1;
  function podeColuna(c, k) {
    const t = topo(st.tab[k]);
    return t ? (t.up && vermelho(t.s) !== vermelho(c.s) && t.r === c.r + 1) : c.r === 13;
  }
  function sequenciaValida(col, i) {
    if (!col[i] || !col[i].up) return false;
    for (let k = i; k < col.length - 1; k++) {
      const a = col[k];
      const b = col[k + 1];
      if (!b.up || vermelho(a.s) === vermelho(b.s) || a.r !== b.r + 1) return false;
    }
    return true;
  }
  function origem(c) {
    for (let k = 0; k < 7; k++) {
      const i = st.tab[k].indexOf(c);
      if (i >= 0) return { tipo: 'tab', k, i };
    }
    if (st.waste.includes(c)) return { tipo: 'waste' };
    if (st.stock.includes(c)) return { tipo: 'stock' };
    return { tipo: 'found', s: c.s };
  }
  function grupoDe(o) {
    if (o.tipo === 'tab') return st.tab[o.k].slice(o.i);
    if (o.tipo === 'waste') return [topo(st.waste)];
    return [topo(st.found[o.s])];
  }

  function mover(o, destino) {
    historico.push(foto());
    let grupo;
    if (o.tipo === 'tab') grupo = st.tab[o.k].splice(o.i);
    else if (o.tipo === 'waste') grupo = [st.waste.pop()];
    else grupo = [st.found[o.s].pop()];
    if (destino.tipo === 'tab') st.tab[destino.k].push(...grupo);
    else st.found[grupo[0].s].push(grupo[0]);
    if (o.tipo === 'tab') {
      const t = topo(st.tab[o.k]);
      if (t && !t.up) t.up = true;
    }
    st.jogadas++;
    som.carta();
    depoisDeMexer(grupo);
  }

  function tirar() {
    if (autoAtivo) return;
    if (!st.stock.length) {
      if (!st.waste.length) { aviso('O baralho já está vazio.'); return; }
      historico.push(foto());
      st.stock = st.waste.reverse().map(c => Object.assign(c, { up: false }));
      st.waste = [];
      st.jogadas++;
      som.clique();
      depoisDeMexer([]);
      return;
    }
    historico.push(foto());
    const tiradas = [];
    for (let k = 0; k < draw && st.stock.length; k++) {
      const c = st.stock.pop();
      c.up = true;
      st.waste.push(c);
      tiradas.push(c);
    }
    st.jogadas++;
    som.carta();
    depoisDeMexer(tiradas);
  }

  function depoisDeMexer(movidas) {
    gravar();
    desenhar(movidas);
    if (st.found.every(f => f.length === 13)) { setTimeout(vitoria, 500); return; }
    btnTerminar.classList.toggle('esconder', !podeAcabar());
  }

  function desfazer() {
    if (autoAtivo) return;
    if (!historico.length) { aviso('Ainda não há nada para desfazer.'); return; }
    repor(historico.pop());
    som.clique();
    gravar();
    desenhar([], true);
    btnTerminar.classList.toggle('esconder', !podeAcabar());
  }

  /* ---- toque: a carta vai sozinha para o melhor sítio ---- */
  function destinoAutomatico(c, o) {
    const grupo = grupoDe(o);
    if (o.tipo === 'tab' && !sequenciaValida(st.tab[o.k], o.i)) return null;
    if (grupo.length === 1 && o.tipo !== 'found' && podeFundacao(c)) return { tipo: 'found' };
    const cheias = [];
    const vazias = [];
    for (let k = 0; k < 7; k++) {
      if (o.tipo === 'tab' && o.k === k) continue;
      if (!podeColuna(c, k)) continue;
      (st.tab[k].length ? cheias : vazias).push(k);
    }
    if (cheias.length) return { tipo: 'tab', k: cheias[0] };
    if (vazias.length && !(o.tipo === 'tab' && o.i === 0)) return { tipo: 'tab', k: vazias[0] };
    return null;
  }
  function tocar(c) {
    const o = origem(c);
    if (o.tipo === 'stock') { tirar(); return; }
    const d = destinoAutomatico(c, o);
    if (d) { mover(o, d); return; }
    som.quase();
    const e = ELS[c.id];
    e.classList.remove('abanar');
    void e.offsetWidth;
    e.classList.add('abanar');
    aviso('Esta carta ainda não tem para onde ir. Experimente a 💡 Ajuda.', 2400);
  }

  /* ---- ajuda ---- */
  function procurarJogada() {
    const tops = [];
    for (let k = 0; k < 7; k++) { const t = topo(st.tab[k]); if (t) tops.push({ c: t, o: { tipo: 'tab', k, i: st.tab[k].length - 1 } }); }
    if (st.waste.length) tops.push({ c: topo(st.waste), o: { tipo: 'waste' } });
    for (const { c, o } of tops) if (podeFundacao(c)) return { c, o, d: { tipo: 'found' } };
    // mover sequências que destapam cartas
    for (let k = 0; k < 7; k++) {
      const col = st.tab[k];
      for (let i = 0; i < col.length; i++) {
        if (!sequenciaValida(col, i)) continue;
        const c = col[i];
        const debaixo = col[i - 1];
        const util = i > 0 && !(debaixo.up && vermelho(debaixo.s) !== vermelho(c.s) && debaixo.r === c.r + 1);
        if (!util) continue;
        for (let d = 0; d < 7; d++) if (d !== k && podeColuna(c, d)) return { c, o: { tipo: 'tab', k, i }, d: { tipo: 'tab', k: d } };
      }
    }
    if (st.waste.length) {
      const c = topo(st.waste);
      for (let d = 0; d < 7; d++) if (podeColuna(c, d)) return { c, o: { tipo: 'waste' }, d: { tipo: 'tab', k: d } };
    }
    return null;
  }
  let tRealce = null;
  function realcar(nos) {
    const tirar = n => { n.classList.remove('realce'); delete n.dataset.realce; };
    mesa.querySelectorAll('.realce').forEach(tirar);
    nos.forEach((n, i) => { if (n) { n.classList.add('realce'); n.dataset.realce = i === 0 ? 'origem' : 'destino'; } });
    clearTimeout(tRealce);
    tRealce = setTimeout(() => nos.forEach(n => n && tirar(n)), 2200);
  }
  function ajuda() {
    if (autoAtivo) return;
    const j = procurarJogada();
    if (j) {
      let alvoD;
      if (j.d.tipo === 'found') alvoD = st.found[j.c.s].length ? ELS[topo(st.found[j.c.s]).id] : lugaresFund[j.c.s];
      else alvoD = st.tab[j.d.k].length ? ELS[topo(st.tab[j.d.k]).id] : lugaresCol[j.d.k];
      realcar([ELS[j.c.id], alvoD]);
      aviso(`Experimente mover ${NOMES[j.c.r - 1].toLowerCase()} de ${NOMES_NAIPES[j.c.s]} para o sítio que está a brilhar.`, 3200);
      return;
    }
    if (st.stock.length || st.waste.length) {
      realcar([st.stock.length ? ELS[topo(st.stock).id] : lugarBaralho]);
      aviso(st.stock.length ? 'Tire uma carta do baralho (toque no monte a brilhar).' : 'Toque no monte para voltar a pôr as cartas no baralho.', 3000);
      return;
    }
    aviso('Não encontro mais jogadas. Use «Desfazer» para voltar atrás — o jogo tem solução!', 3600);
  }

  /* ---- terminar automaticamente ---- */
  function podeAcabar() {
    if (st.stock.length || st.waste.length) return false;
    return st.tab.every(col => !col.length || sequenciaValida(col, 0));
  }
  function terminarAuto() {
    if (autoAtivo) return;
    autoAtivo = true;
    btnTerminar.classList.add('esconder');
    const passo = () => {
      if (!vivo) return;
      for (let k = 0; k < 7; k++) {
        const c = topo(st.tab[k]);
        if (c && podeFundacao(c)) {
          historico.push(foto());
          st.tab[k].pop();
          st.found[c.s].push(c);
          st.jogadas++;
          som.carta();
          desenhar([c]);
          setTimeout(passo, 110);
          return;
        }
      }
      autoAtivo = false;
      gravar();
      if (st.found.every(f => f.length === 13)) setTimeout(vitoria, 400);
    };
    passo();
  }

  /* ---- fim ---- */
  function vitoria() {
    if (!vivo) return;
    dados.pac.ganhos[nivel] = (dados.pac.ganhos[nivel] || 0) + 1;
    if (dados.pacJogos) delete dados.pacJogos[nivel];
    guardar();
    som.vitoria();
    festa(['🃏', '♥️', '♠️', '♦️', '♣️', '⭐', '🎉']);
    aoTerminar({
      estrelas: 3,
      titulo: 'Ganhou a paciência!',
      numeros: [
        { valor: String(st.jogadas), rotulo: 'jogadas' },
        { valor: duracao(Date.now() - t0), rotulo: 'tempo' },
        { valor: String(dados.pac.ganhos[nivel]), rotulo: `vitórias no nível ${nivel}` },
      ],
    });
  }

  let tNovo = null;
  function pedirNovo() {
    if (autoAtivo) return;
    if (st.jogadas === 0 || btnNovo.dataset.confirmar) {
      clearTimeout(tNovo);
      delete btnNovo.dataset.confirmar;
      btnNovo.textContent = '🔄 Novo jogo';
      novoJogo();
      aviso('Cartas novas! Boa sorte! 🍀');
      return;
    }
    btnNovo.dataset.confirmar = '1';
    btnNovo.textContent = 'Tem a certeza? Toque outra vez';
    tNovo = setTimeout(() => { delete btnNovo.dataset.confirmar; btnNovo.textContent = '🔄 Novo jogo'; }, 3500);
  }

  /* ---- medidas e desenho ---- */
  function medir() {
    const W = mesa.clientWidth;
    const H = mesa.clientHeight;
    const gap = Math.max(4, Math.round(W * 0.012));
    let cw = Math.floor((W - gap * 8) / 7);
    cw = Math.max(36, Math.min(cw, 124, Math.floor((H - gap * 3) / 1.4 / 2.7)));
    const ch = Math.round(cw * 1.4);
    const x0 = Math.round((W - (cw * 7 + gap * 6)) / 2);
    L = { W, H, gap, cw, ch, x0, topY: gap, tabY: gap * 3 + ch, fd: Math.round(ch * 0.13), fu: Math.round(ch * (H > W * 1.1 ? 0.42 : 0.3)) };
    mesa.classList.toggle('cartas-pequenas', cw < 72);
    mesa.style.setProperty('--cw', `${cw}px`);
    mesa.style.setProperty('--ch', `${ch}px`);
    const colX = k => L.x0 + k * (cw + gap);
    L.colX = colX;
    const pos = (n, x, y) => { n.style.left = `${x}px`; n.style.top = `${y}px`; n.style.width = `${cw}px`; n.style.height = `${ch}px`; };
    pos(lugarBaralho, colX(0), L.topY);
    lugaresFund.forEach((n, s) => pos(n, colX(3 + s), L.topY));
    lugaresCol.forEach((n, k) => pos(n, colX(k), L.tabY));
  }

  function posicoes() {
    const p = new Map();
    const { cw, topY, tabY, colX } = L;
    st.stock.forEach((c, i) => p.set(c.id, [colX(0), topY, 10 + i]));
    const nVis = draw === 3 ? Math.min(3, st.waste.length) : 1;
    st.waste.forEach((c, i) => {
      const j = i - (st.waste.length - nVis);
      p.set(c.id, [colX(1) + (j > 0 ? Math.round(j * cw * 0.32) : 0), topY, 100 + i]);
    });
    st.found.forEach((f, s) => f.forEach((c, i) => p.set(c.id, [colX(3 + s), topY, 200 + i])));
    const disponivel = L.H - tabY - L.gap;
    st.tab.forEach((col, k) => {
      let soma = 0;
      col.forEach((c, i) => { if (i < col.length - 1) soma += c.up ? L.fu : L.fd; });
      const fator = soma + L.ch > disponivel && soma > 0 ? Math.max(0.2, (disponivel - L.ch) / soma) : 1;
      let y = tabY;
      col.forEach((c, i) => {
        p.set(c.id, [colX(k), Math.round(y), 300 + i]);
        y += (c.up ? L.fu : L.fd) * fator;
      });
    });
    return p;
  }

  function desenhar(movidas, animar = true) {
    if (!L) medir();
    const p = posicoes();
    const voar = new Set((movidas || []).map(c => c.id));
    CARTAS.forEach(c => {
      const e = ELS[c.id];
      const [x, y, z] = p.get(c.id);
      if (!animar) e.style.transition = 'none';
      e.style.left = `${x}px`;
      e.style.top = `${y}px`;
      e.style.zIndex = voar.has(c.id) ? 2000 + z : z;
      e.classList.toggle('costas', !c.up);
      e.classList.remove('a-arrastar');
      if (!animar) { void e.offsetWidth; e.style.transition = ''; }
    });
    if (voar.size) setTimeout(() => { if (vivo) voar.forEach(id => { ELS[id].style.zIndex = p.get(id)[2]; }); }, 260);
    lugarBaralho.textContent = st.stock.length ? '' : (st.waste.length ? '↻' : '');
    infoJogadas.textContent = `Jogadas: ${st.jogadas}`;
    btnDesfazer.disabled = !historico.length;
  }

  /* ---- arrastar com o dedo ou o rato ---- */
  let arr = null;
  mesa.addEventListener('pointerdown', e => {
    if (autoAtivo || !st) return;
    const ce = e.target.closest('.carta');
    const le = e.target.closest('.lugar');
    if (!ce) {
      if (le && le.dataset.tipo === 'stock') tirar();
      return;
    }
    const c = CARTAS[Number(ce.dataset.id)];
    const o = origem(c);
    if (o.tipo === 'stock') { tirar(); return; }
    if (!c.up) return;
    if (o.tipo === 'waste' && c !== topo(st.waste)) return;
    if (o.tipo === 'found' && c !== topo(st.found[o.s])) return;
    e.preventDefault();
    try { mesa.setPointerCapture(e.pointerId); } catch { /* ignora */ }
    const grupo = grupoDe(o);
    arr = {
      c, o, grupo, x0: e.clientX, y0: e.clientY, moveu: false,
      valido: o.tipo !== 'tab' || sequenciaValida(st.tab[o.k], o.i),
      inicio: grupo.map(g => [parseFloat(ELS[g.id].style.left), parseFloat(ELS[g.id].style.top)]),
    };
  });
  mesa.addEventListener('pointermove', e => {
    if (!arr) return;
    const dx = e.clientX - arr.x0;
    const dy = e.clientY - arr.y0;
    if (!arr.moveu && Math.hypot(dx, dy) < 10) return;
    if (!arr.valido) return;
    arr.moveu = true;
    arr.dx = dx;
    arr.dy = dy;
    arr.grupo.forEach((g, i) => {
      const n = ELS[g.id];
      n.classList.add('a-arrastar');
      n.style.left = `${arr.inicio[i][0] + dx}px`;
      n.style.top = `${arr.inicio[i][1] + dy}px`;
      n.style.zIndex = 3000 + i;
    });
  });
  const largar = () => {
    if (!arr) return;
    const a = arr;
    arr = null;
    if (!a.moveu) { tocar(a.c); return; }
    const bx = a.inicio[0][0] + a.dx;
    const by = a.inicio[0][1] + a.dy;
    const sobre = (x, y, w, h) => Math.max(0, Math.min(bx + L.cw, x + w) - Math.max(bx, x)) * Math.max(0, Math.min(by + L.ch, y + h) - Math.max(by, y));
    let melhor = null;
    let area = 0;
    for (let k = 0; k < 7; k++) {
      const col = st.tab[k];
      const fundo = col.length ? parseFloat(ELS[topo(col).id].style.top) + L.ch : L.tabY + L.ch;
      const ar = sobre(L.colX(k), L.tabY, L.cw, Math.max(fundo - L.tabY, L.ch) + L.ch * 0.4);
      if (ar > area) { area = ar; melhor = { tipo: 'tab', k }; }
    }
    for (let s = 0; s < 4; s++) {
      const ar = sobre(L.colX(3 + s), L.topY, L.cw, L.ch);
      if (ar > area) { area = ar; melhor = { tipo: 'found' }; }
    }
    if (melhor && melhor.tipo === 'tab' && !(a.o.tipo === 'tab' && a.o.k === melhor.k) && podeColuna(a.c, melhor.k)) { mover(a.o, melhor); return; }
    if (melhor && melhor.tipo === 'found' && a.grupo.length === 1 && a.o.tipo !== 'found' && podeFundacao(a.c)) { mover(a.o, melhor); return; }
    if (melhor && !(a.o.tipo === 'tab' && melhor.tipo === 'tab' && a.o.k === melhor.k)) {
      som.quase();
      aviso('Aí não pode ser. As cartas descem alternando as cores (vermelha, preta, vermelha…).', 3000);
    }
    desenhar([]);
  };
  mesa.addEventListener('pointerup', largar);
  mesa.addEventListener('pointercancel', () => { if (arr) { arr = null; desenhar([]); } });

  const ro = new ResizeObserver(() => { if (!st || !vivo) return; medir(); desenhar(null, false); });
  ro.observe(mesa);

  /* ---- arranque: retoma o jogo guardado, se houver ---- */
  requestAnimationFrame(() => {
    medir();
    const g = dados.pacJogos && dados.pacJogos[nivel];
    if (g && g.foto) {
      repor(g.foto);
      historico = g.historico || [];
      t0 = g.t0 || Date.now();
      desenhar(null, false);
      btnTerminar.classList.toggle('esconder', !podeAcabar());
      aviso('Continuámos o seu jogo anterior. Para começar outro, toque em «Novo jogo».', 3500);
    } else {
      novoJogo();
      aviso('Boa sorte! 🍀 Toque numa carta para a mover.', 2600);
    }
  });

  return () => {
    vivo = false;
    ro.disconnect();
    clearTimeout(tRealce);
    clearTimeout(tNovo);
    alvo.classList.remove('ecra-cheio');
  };
}
