// Medalhas para colecionar. Cada uma tem uma condição verificada sobre os dados guardados.
import { dados, guardar, hojeISO } from './util.js';

function melhorSequencia(dias) {
  const ord = [...new Set(dias)].sort();
  let melhor = 0;
  let atual = 0;
  let anterior = null;
  for (const d of ord) {
    const data = new Date(`${d}T12:00:00`);
    if (anterior && (data - anterior) / 86400000 === 1) atual++; else atual = 1;
    melhor = Math.max(melhor, atual);
    anterior = data;
  }
  return melhor;
}
const feitos = d => d.feitos || {};
const soma = o => Object.values(o || {}).reduce((s, v) => s + (v || 0), 0);

export const MEDALHAS = [
  { id: 'primeiro', icone: '🌱', nome: 'Primeiro passo', desc: 'Jogar o primeiro jogo.', ok: d => Object.keys(d.jogos).length > 0 },
  { id: 'treino1', icone: '☀️', nome: 'Bom dia, cabeça!', desc: 'Fazer o primeiro Treino do Dia.', ok: d => d.treinos.length >= 1 },
  { id: 'treino10', icone: '🌞', nome: 'Dez treinos', desc: 'Fazer 10 Treinos do Dia.', ok: d => d.treinos.length >= 10 },
  { id: 'seguidos3', icone: '🔥', nome: 'Três dias seguidos', desc: 'Jogar 3 dias seguidos.', ok: d => melhorSequencia(d.dias) >= 3 },
  { id: 'seguidos7', icone: '📅', nome: 'Uma semana inteira', desc: 'Jogar 7 dias seguidos.', ok: d => melhorSequencia(d.dias) >= 7 },
  { id: 'seguidos30', icone: '🏆', nome: 'Um mês de treino', desc: 'Jogar 30 dias seguidos.', ok: d => melhorSequencia(d.dias) >= 30 },
  { id: 'estrelas50', icone: '⭐', nome: '50 estrelas', desc: 'Juntar 50 estrelas.', ok: d => d.estrelas >= 50 },
  { id: 'estrelas250', icone: '🌟', nome: '250 estrelas', desc: 'Juntar 250 estrelas.', ok: d => d.estrelas >= 250 },
  { id: 'estrelas1000', icone: '💫', nome: 'Mil estrelas', desc: 'Juntar 1000 estrelas.', ok: d => d.estrelas >= 1000 },
  { id: 'perfeito20', icone: '💯', nome: 'Perfeição', desc: 'Ganhar 3 estrelas em 20 jogos.', ok: d => (feitos(d).tresEstrelas || 0) >= 20 },
  { id: 'variedade', icone: '🗺️', nome: 'Explorador', desc: 'Experimentar 10 jogos diferentes.', ok: d => Object.keys(d.jogos).length >= 10 },
  { id: 'paciencia', icone: '🃏', nome: 'Paciência ganha', desc: 'Ganhar uma paciência.', ok: d => soma(d.pac.ganhos) >= 1 },
  { id: 'pacDesafio', icone: '🎓', nome: 'Mestre da paciência', desc: 'Ganhar uma paciência no nível Desafio.', ok: d => (d.pac.ganhos[3] || 0) >= 1 },
  { id: 'domino1', icone: '🎲', nome: 'Dominó!', desc: 'Ganhar um jogo de dominó.', ok: d => ((d.domino && d.domino.ganhos) || 0) >= 1 },
  { id: 'domino10', icone: '🥇', nome: 'Ás do dominó', desc: 'Ganhar 10 jogos de dominó.', ok: d => ((d.domino && d.domino.ganhos) || 0) >= 10 },
  { id: 'relampago', icone: '⚡', nome: 'Relâmpago certeiro', desc: 'Fazer as Contas Relâmpago sem enganos.', ok: d => (feitos(d).relampagoPerfeito || 0) >= 1 },
  { id: 'cores', icone: '🎨', nome: 'Olho de lince', desc: 'Fazer as Cores Trocadas sem enganos.', ok: d => (feitos(d).coresPerfeito || 0) >= 1 },
  { id: 'siga', icone: '🐘', nome: 'Memória de elefante', desc: 'Chegar ao fim do jogo Siga a Sequência no nível Desafio.', ok: d => (feitos(d).sigaDesafio || 0) >= 1 },
  { id: 'ordem', icone: '🗂️', nome: 'Tudo arrumado', desc: 'Fazer o Pôr por Ordem sem nenhum engano.', ok: d => (feitos(d).ordemPerfeita || 0) >= 1 },
  { id: 'leitor', icone: '📖', nome: 'Bom leitor', desc: 'Ler 5 textos em voz alta.', ok: d => (feitos(d).leituras || 0) >= 5 },
  { id: 'puzzle16', icone: '🖼️', nome: 'Puzzle grande', desc: 'Acabar um puzzle de 16 peças.', ok: d => ((d.jogos.puzzle && d.jogos.puzzle.melhor && d.jogos.puzzle.melhor[3]) || 0) >= 1 },
  { id: 'viajante', icone: '📷', nome: 'Viajante', desc: 'Jogar com fotografias de 10 temas diferentes.', ok: d => (d.temasVistos || []).length >= 10 },
  { id: 'teste', icone: '🎯', nome: 'Cabeça em forma', desc: 'Fazer o Teste da Cabeça.', ok: d => (d.testes || []).length >= 1 },
  { id: 'teste5', icone: '📈', nome: 'Sempre a melhorar', desc: 'Fazer o Teste da Cabeça em 5 dias diferentes.', ok: d => (d.testes || []).length >= 5 },
];

/** Verifica as medalhas e devolve as que foram ganhas agora. */
export function novasMedalhas() {
  const ganhas = dados.medalhas || (dados.medalhas = {});
  const novas = MEDALHAS.filter(m => !ganhas[m.id] && m.ok(dados));
  novas.forEach(m => { ganhas[m.id] = hojeISO(); });
  if (novas.length) guardar();
  return novas;
}
