# Jogos do José

Jogos simples e encorajadores para treinar a cabeça, pensados para seniores: letra grande,
botões largos, sem pressas e sempre com uma palavra de incentivo.

- **Fotografias de Portugal:** Memória de Fotografias (escolhe-se o tema e o número de pares), Que Fotografia É?
  e Puzzle de Fotografias. 815 fotografias em 51 temas, arrumados em 6 grupos: Sporting, Algarve, Lisboa, Porto,
  monumentos, Património Mundial, faróis, reis e rainhas, pintura portuguesa e muitos outros.
  Fotografias do Wikimedia Commons com licenças livres (créditos dentro da app, em Definições).
- **Cartas e Dominó:** Dominó tradicional contra o computador (3 níveis); cartas com desenho tradicional:
  Paciência (3 níveis, todos os jogos verificados para terem solução), Jogo da Memória, Maior ou Menor.
- **Treino da Cabeça:** Cultura Geral (656 perguntas), Contas de Cabeça, Sopa de Letras (46 temas),
  Provérbios (287), Adivinhas (103), Qual é o Intruso? (134), Sequências, Pôr por Ordem, Palavra Baralhada (242),
  Que Horas São?, Contas do Mercado, Lembra-se?, Siga a Sequência (luzes e música), Quantos São?,
  O Que É Isto? (487 desenhos) e Encontre o Diferente.
- **Treino rápido, com recorde:** Contas Relâmpago, Cores Trocadas (tocar na cor da tinta), Memória de
  Palavras e Leitura em Voz Alta (32 textos: Camões, Pessoa, Florbela, Cesário Verde, Garrett, Eça, Antero,
  Júlio Dinis, cantigas e trava-línguas, tudo em domínio público). Relógio com pausa, recordes pessoais e gráficos de evolução.
- **Teste da Cabeça:** 3 exercícios rápidos que dão uma «idade da cabeça» (só um jogo, não é um teste médico),
  com gráfico da evolução.
- **Treino do Dia:** 4 exercícios curtos, diferentes todos os dias, com carimbo no calendário e contagem de
  dias seguidos.
- **O Meu Progresso:** calendário mensal de carimbos, 24 medalhas para colecionar, recordes e gráficos.
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
