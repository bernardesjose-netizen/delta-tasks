# Jogos do José

Jogos simples e encorajadores para treinar a cabeça, pensados para seniores: letra grande,
botões largos, sem pressas e sempre com uma palavra de incentivo.

- **Fotografias de Portugal:** Memória de Fotografias (escolhe-se o tema e o número de pares), Que Fotografia É?
  e Puzzle de Fotografias. Temas como Sporting, Algarve, monumentos, Património Mundial, cidades e muitos outros.
  Fotografias do Wikimedia Commons com licenças livres (créditos dentro da app, em Definições).
- **Cartas** com desenho tradicional: Paciência (3 níveis, todos os jogos verificados para terem solução),
  Jogo da Memória, Maior ou Menor.
- **Treino da Cabeça:** Cultura Geral (314 perguntas), Contas de Cabeça, Sopa de Letras, Provérbios,
  Adivinhas, Qual é o Intruso?, Sequências, Palavra Baralhada, Que Horas São?, Contas do Mercado,
  Lembra-se?, Quantos São?, O Que É Isto? (centenas de desenhos) e Encontre o Diferente.
- **Treino do Dia:** 4 exercícios curtos, diferentes todos os dias, com contagem de dias seguidos.
- Três níveis em tudo: 🌱 Tranquilo, 🌿 Normal e 🌳 Desafio.
- Funciona sem internet depois de aberto uma vez (pode ser instalado no ecrã inicial).
- O progresso fica guardado só no próprio aparelho (`localStorage`); não há contas nem recolha de dados.

## Como funciona

HTML, CSS e JavaScript simples, sem dependências nem passo de compilação. Para experimentar
localmente basta servir esta pasta, por exemplo:

```
python3 -m http.server 8000
```

## Publicar

É um site estático: publica-se esta pasta tal como está (no Netlify, diretório de publicação `.`).
Antes de publicar, correr `node ferramentas/gerar-lista.mjs`: atualiza `ficheiros.js`, a lista do que fica
guardado no aparelho para jogar sem internet (e a versão, para os aparelhos receberem as alterações).
