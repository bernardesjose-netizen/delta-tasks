// Textos para ler em voz alta. Todos em domínio público (autores falecidos há mais de 70 anos)
// ou da tradição popular. Ortografia atual. n = nível (1 curto, 2 médio, 3 mais longo).
export const TEXTOS = [
  {
    id: 'liberdade', n: 1, titulo: 'Liberdade (início)', autor: 'Fernando Pessoa',
    texto: 'Ai que prazer\nNão cumprir um dever,\nTer um livro para ler\nE não o fazer!\nLer é maçada,\nEstudar é nada.\nO sol doira\nSem literatura.',
  },
  {
    id: 'indo-eu', n: 1, titulo: 'Indo eu, indo eu', autor: 'Cantiga popular',
    texto: 'Indo eu, indo eu,\nA caminho de Viseu,\nEncontrei o meu amor,\nAi Jesus, que lá vou eu!',
  },
  {
    id: 'descalca', n: 1, titulo: 'Descalça vai para a fonte (mote)', autor: 'Luís de Camões',
    texto: 'Descalça vai para a fonte\nLianor pela verdura;\nVai fermosa, e não segura.',
  },
  {
    id: 'lusiadas-1', n: 2, titulo: 'Os Lusíadas, Canto I (estância 1)', autor: 'Luís de Camões',
    texto: 'As armas e os barões assinalados,\nQue da ocidental praia Lusitana,\nPor mares nunca de antes navegados,\nPassaram ainda além da Taprobana,\nEm perigos e guerras esforçados,\nMais do que prometia a força humana,\nE entre gente remota edificaram\nNovo Reino, que tanto sublimaram;',
  },
  {
    id: 'autopsicografia', n: 2, titulo: 'Autopsicografia', autor: 'Fernando Pessoa',
    texto: 'O poeta é um fingidor.\nFinge tão completamente\nQue chega a fingir que é dor\nA dor que deveras sente.\n\nE os que leem o que escreve,\nNa dor lida sentem bem,\nNão as duas que ele teve,\nMas só a que eles não têm.\n\nE assim nas calhas de roda\nGira, a entreter a razão,\nEsse comboio de corda\nQue se chama coração.',
  },
  {
    id: 'ser-grande', n: 2, titulo: 'Para ser grande, sê inteiro', autor: 'Fernando Pessoa (Ricardo Reis)',
    texto: 'Para ser grande, sê inteiro: nada\nTeu exclui ou exagera.\nSê todo em cada coisa. Põe quanto és\nNo mínimo que fazes.\nAssim em cada lago a lua toda\nBrilha, porque alta vive.',
  },
  {
    id: 'ser-poeta', n: 2, titulo: 'Ser Poeta (primeira quadra)', autor: 'Florbela Espanca',
    texto: 'Ser poeta é ser mais alto, é ser maior\nDo que os homens! Morder como quem beija!\nÉ ser mendigo e dar como quem seja\nRei do Reino de Aquém e de Além Dor!',
  },
  {
    id: 'ocidental', n: 2, titulo: 'O Sentimento dum Ocidental (início)', autor: 'Cesário Verde',
    texto: 'Nas nossas ruas, ao anoitecer,\nHá tal soturnidade, há tal melancolia,\nQue as sombras, o bulício, o Tejo, a maresia\nDespertam-me um desejo absurdo de sofrer.',
  },
  {
    id: 'inferno-amar', n: 2, titulo: 'Este inferno de amar (início)', autor: 'Almeida Garrett',
    texto: 'Este inferno de amar — como eu amo! —\nQuem mo pôs aqui n\'alma… quem foi?\nEsta chama que alenta e consome,\nQue é a vida — e que a vida destrói —\nComo é que se veio a atear,\nQuando — ai quando se há de ela apagar?',
  },
  {
    id: 'amor-fogo', n: 3, titulo: 'Amor é fogo que arde sem se ver', autor: 'Luís de Camões',
    texto: 'Amor é fogo que arde sem se ver,\né ferida que dói, e não se sente;\né um contentamento descontente,\né dor que desatina sem doer.\n\nÉ um não querer mais que bem querer;\né um andar solitário entre a gente;\né nunca contentar-se de contente;\né um cuidar que ganha em se perder.\n\nÉ querer estar preso por vontade;\né servir a quem vence, o vencedor;\né ter com quem nos mata, lealdade.\n\nMas como causar pode seu favor\nnos corações humanos amizade,\nse tão contrário a si é o mesmo Amor?',
  },
  {
    id: 'mar-portugues', n: 3, titulo: 'Mar Português', autor: 'Fernando Pessoa',
    texto: 'Ó mar salgado, quanto do teu sal\nSão lágrimas de Portugal!\nPor te cruzarmos, quantas mães choraram,\nQuantos filhos em vão rezaram!\nQuantas noivas ficaram por casar\nPara que fosses nosso, ó mar!\n\nValeu a pena? Tudo vale a pena\nSe a alma não é pequena.\nQuem quer passar além do Bojador\nTem que passar além da dor.\nDeus ao mar o perigo e o abismo deu,\nMas nele é que espelhou o céu.',
  },
  {
    id: 'girassol', n: 3, titulo: 'O Guardador de Rebanhos, II (início)', autor: 'Fernando Pessoa (Alberto Caeiro)',
    texto: 'O meu olhar é nítido como um girassol.\nTenho o costume de andar pelas estradas\nOlhando para a direita e para a esquerda,\nE de vez em quando olhando para trás…\nE o que vejo a cada momento\nÉ aquilo que nunca antes eu tinha visto,\nE eu sei dar por isso muito bem…\nSei ter o pasmo essencial\nQue tem uma criança se, ao nascer,\nReparasse que nascera deveras…\nSinto-me nascido a cada momento\nPara a eterna novidade do Mundo…',
  },
  {
    id: 'lusiadas-2', n: 3, titulo: 'Os Lusíadas, Canto I (estâncias 1 e 2)', autor: 'Luís de Camões',
    texto: 'As armas e os barões assinalados,\nQue da ocidental praia Lusitana,\nPor mares nunca de antes navegados,\nPassaram ainda além da Taprobana,\nEm perigos e guerras esforçados,\nMais do que prometia a força humana,\nE entre gente remota edificaram\nNovo Reino, que tanto sublimaram;\n\nE também as memórias gloriosas\nDaqueles Reis que foram dilatando\nA Fé, o Império, e as terras viciosas\nDe África e de Ásia andaram devastando,\nE aqueles que por obras valerosas\nSe vão da lei da Morte libertando,\nCantando espalharei por toda parte,\nSe a tanto me ajudar o engenho e arte.',
  },
  {
    id: 'maias', n: 3, titulo: 'Os Maias (início)', autor: 'Eça de Queirós',
    texto: 'A casa que os Maias vieram habitar em Lisboa, no outono de 1875, era conhecida na vizinhança da Rua de S. Francisco de Paula, e em todo o bairro das Janelas Verdes, pela Casa do Ramalhete ou simplesmente o Ramalhete.',
  },
];
