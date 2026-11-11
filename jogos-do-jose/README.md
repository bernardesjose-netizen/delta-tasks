# Jogos do José

Jogos simples e encorajadores para treinar a cabeça, pensados para seniores: letra grande,
botões largos, sem pressas e sempre com uma palavra de incentivo.

- **Cartas:** Paciência (3 níveis, todos os jogos verificados para terem solução), Jogo da Memória, Maior ou Menor.
- **Treino da Cabeça:** Cultura Geral (314 perguntas), Contas de Cabeça, Sopa de Letras, Provérbios,
  Adivinhas, Qual é o Intruso?, Sequências, Palavra Baralhada, Que Horas São?, Contas do Mercado,
  Lembra-se? e Quantos São?
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
Sempre que se alterar algum ficheiro, aumentar `VERSAO` em `sw.js` para os aparelhos receberem a versão nova.
