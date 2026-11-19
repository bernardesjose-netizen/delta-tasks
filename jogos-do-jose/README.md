# Jogos e Passatempos

Jogos simples e encorajadores para treinar o cérebro, pensados para seniores (e para toda a gente): letra grande,
botões largos, sem pressas e sempre com uma palavra de incentivo. (A pasta chama-se `jogos-do-jose` por razões históricas.)

- **Fotografias de Portugal:** Memória de Fotografias (escolhe-se o tema e o número de pares), Que Fotografia É?
  e Puzzle de Fotografias. 1241 fotografias leves (cerca de 16 MB) em 65 temas, arrumados em 7 grupos: futebol e desporto
  (Sporting, Benfica e FC Porto, cada um com o seu tema e o seu emblema ou cores nas costas das cartas; futebol português e
  Seleção, lendas do futebol mundial, estádios, ciclismo clássico de Portugal e desportistas), cidades e regiões (Algarve,
  Lisboa, Porto, Leiria, Zona Centro, Norte…), monumentos e paisagens, natureza e animais, comida e sabores, história, arte
  e tradições (com o Natal) e viagens pelo mundo (Espanha, União Europeia, Europa, Estados Unidos, comidas do mundo e carros
  clássicos e modernos).
  Fotografias do Wikimedia Commons com licenças livres (créditos dentro da app, em Definições).
- **Cartas e Tabuleiro:** Dominó tradicional contra o computador; cartas com desenho tradicional: Paciência (todos os
  jogos verificados para terem solução), Jogo da Memória e Maior ou Menor (o Ás é a carta mais alta); jogos de tabuleiro
  contra o computador: Jogo do Galo, 4 em Linha e Damas.
- **Treino do Cérebro:** Cultura Geral (1020 perguntas, por nível ou num de 28 temas: Futebol, Sporting, Benfica, FC Porto,
  Ciclismo, Leiria, Zona Centro, Norte de Portugal, Espanha, União Europeia, Europa, Estados Unidos, Natal, Comidas do mundo,
  Inglês básico, Carros e mais), Contas de Cabeça, Sopa de Letras (72 temas, quase 3000 palavras), Palavras Cruzadas
  (grelha nova em cada partida, mais de 1100 palavras com pistas), Jogo da Forca, Sudoku (do 4×4 ao 9×9, grelha nova em cada
  partida e sempre com uma só solução), Provérbios (431), Adivinhas (129), Qual é o Intruso? (168), Sequências, Pôr por Ordem,
  Palavra Baralhada (303), Que Horas São?, Contas do Mercado, Lembra-se?, Siga a Sequência (luzes e música), Quantos São?,
  O Que É Isto? (603 desenhos) e Encontre o Diferente.
- **Treino rápido, com recorde:** Contas Relâmpago, Cores Trocadas (tocar na cor da tinta), Memória de
  Palavras e Leitura em Voz Alta (42 textos: Camões, Pessoa, Florbela, Cesário Verde, Garrett, Eça, Antero,
  Júlio Dinis, Camilo Pessanha, Raul Brandão, cantigas e trava-línguas, tudo em domínio público). Relógio com pausa, recordes pessoais e gráficos de evolução.
- **Para Ler e Rir** (só para entretenimento, sem pontos nem relógio): 125 anedotas, fábulas, contos e lendas,
  histórias divertidas, poemas e quadras e Clássicos portugueses (páginas de Camões, Gil Vicente, Garrett, Camilo, Eça,
  Júlio Dinis, Pessoa e outros), com letra grande e botão para ouvir em voz alta (sempre com voz de Portugal).
- **Teste do Cérebro:** 3 exercícios rápidos que dão uma «idade do cérebro» (só um jogo, não é um teste médico),
  com gráfico da evolução.
- **Treino do Dia:** 4 exercícios curtos, diferentes todos os dias, com carimbo no calendário e contagem de
  dias seguidos.
- **O Meu Progresso:** calendário mensal de carimbos, 25 medalhas para colecionar, recordes e gráficos.
- Quatro níveis em tudo: 🌱 Tranquilo, 🌿 Normal, 🌳 Desafio e 🏆 Mestre (o mais difícil).
- Funciona sem internet depois de aberto uma vez (pode ser instalado no ecrã inicial).
- Personalização sem complicações: nome opcional (pedido uma vez, nas boas-vindas), várias pessoas no mesmo
  aparelho, cada uma com o seu progresso, e clube do coração opcional (só muda as cores das costas das cartas).
- O progresso fica guardado só no próprio aparelho (`localStorage`); não há contas, palavras-passe nem recolha de dados.

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
