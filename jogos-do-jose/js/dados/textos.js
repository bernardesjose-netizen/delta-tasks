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

  // ───────────── Nível 1 — curtos ─────────────
  {
    id: 'trava-linguas', n: 1, titulo: 'Trava-línguas', autor: 'Tradição popular',
    texto: 'O rato roeu a rolha da garrafa do rei da Rússia.\nTrês pratos de trigo para três tigres tristes.\nO peito do pé do Pedro é preto.\nA aranha arranha a rã, a rã arranha a aranha.',
  },
  {
    id: 'lengalengas', n: 1, titulo: 'Lengalengas', autor: 'Tradição popular',
    texto: 'Era uma vez um gato maltês,\nTocava piano e falava francês.\nQueres que te conte outra vez?\n\nLagarto pintado,\nQuem te pintou?\nFoi uma velha\nQue por aqui passou.\nNo tempo da eira\nFazia poeira.\nPuxa, lagarto,\nPor esta orelha!',
  },
  {
    id: 'machadinha', n: 1, titulo: 'A machadinha', autor: 'Cantiga popular',
    texto: 'Ai, ai, ai, minha machadinha,\nAi, ai, ai, minha machadinha,\nQuem te pôs a mão,\nSabendo que és minha?\n\nSabendo que és minha,\nTambém eu sou tua;\nSalta, machadinha,\nPara o meio da rua.\n\nNo meio da rua\nNão hei de eu ficar;\nEu hei de ir à roda\nEscolher o meu par.',
  },
  {
    id: 'quadras-pessoa-1', n: 1, titulo: 'Quadras ao gosto popular (I)', autor: 'Fernando Pessoa',
    texto: 'Ai, os pratos de arroz-doce\nCom as linhas de canela!\nAi a mão branca que os trouxe!\nAi essa mão ser a dela!\n\nAndorinha que vais alta,\nPorque não me vens trazer\nQualquer coisa que me falta\nE que te não sei dizer?',
  },
  {
    id: 'quadras-pessoa-2', n: 1, titulo: 'Quadras ao gosto popular (II)', autor: 'Fernando Pessoa',
    texto: 'Baila o trigo quando há vento\nBaila porque o vento o toca\nTambém baila o pensamento\nQuando o coração provoca.\n\nCantigas de portugueses\nSão como barcos no mar —\nVão de uma alma para outra\nCom riscos de naufragar.',
  },

  // ───────────── Nível 2 — médios ─────────────
  {
    id: 'trava-linguas-2', n: 2, titulo: 'Mais trava-línguas', autor: 'Tradição popular',
    texto: 'O tempo perguntou ao tempo quanto tempo o tempo tem.\nO tempo respondeu ao tempo que o tempo tem tanto tempo quanto tempo o tempo tem.\n\nNum ninho de mafagafos, cinco mafagafinhos há;\nQuem os desmafagafizar, bom desmafagafizador será.\n\nSe o Papa papasse papa, se o Papa papasse pão,\nSe o Papa tudo papasse, seria um Papa papão.',
  },
  {
    id: 'sino-aldeia', n: 2, titulo: 'Ó sino da minha aldeia', autor: 'Fernando Pessoa',
    texto: 'Ó sino da minha aldeia,\nDolente na tarde calma,\nCada tua badalada\nSoa dentro da minha alma.\n\nE é tão lento o teu soar,\nTão como triste da vida,\nQue já a primeira pancada\nTem o som de repetida.\n\nPor mais que me tanjas perto,\nQuando passo, sempre errante,\nÉs para mim como um sonho,\nSoas-me na alma distante.\n\nA cada pancada tua,\nVibrante no céu aberto,\nSinto mais longe o passado,\nSinto a saudade mais perto.',
  },
  {
    id: 'barca-bela', n: 2, titulo: 'Barca Bela', autor: 'Almeida Garrett',
    texto: 'Pescador da barca bela,\nOnde vás pescar com ela,\nQue é tão bela,\nÓ pescador?\n\nNão vês que a última estrela\nNo céu nublado se vela?\nColhe a vela,\nÓ pescador!\n\nDeita o lanço com cautela,\nQue a sereia canta bela…\nMas cautela,\nÓ pescador!\n\nNão se enrede a rede nela,\nQue perdido é remo e vela\nSó de vê-la,\nÓ pescador.\n\nPescador da barca bela,\nInda é tempo, foge dela,\nFoge dela,\nÓ pescador!',
  },
  {
    id: 'o-infante', n: 2, titulo: 'O Infante (Mensagem)', autor: 'Fernando Pessoa',
    texto: 'Deus quer, o homem sonha, a obra nasce.\nDeus quis que a terra fosse toda uma,\nQue o mar unisse, já não separasse.\nSagrou-te, e foste desvendando a espuma,\n\nE a orla branca foi de ilha em continente,\nClareou, correndo, até ao fim do mundo,\nE viu-se a terra inteira, de repente,\nSurgir, redonda, do azul profundo.\n\nQuem te sagrou criou-te português.\nDo mar e nós em ti nos deu sinal.\nCumpriu-se o Mar, e o Império se desfez.\nSenhor, falta cumprir-se Portugal!',
  },
  {
    id: 'de-tarde', n: 3, titulo: 'De Tarde', autor: 'Cesário Verde',
    texto: 'Naquele piquenique de burguesas,\nHouve uma coisa simplesmente bela,\nE que, sem ter histórias nem grandezas,\nEm todo o caso dava uma aguarela.\n\nFoi quando tu, descendo do burrico,\nFoste colher, sem imposturas tolas,\nA um granzoal azul de grão-de-bico\nUm ramalhete rubro de papoulas.\n\nPouco depois, em cima duns penhascos,\nNós acampámos, inda o sol se via;\nE houve talhadas de melão, damascos,\nE pão-de-ló molhado em malvasia.\n\nMas, todo púrpuro a sair da renda\nDos teus dois seios como duas rolas,\nEra o supremo encanto da merenda\nO ramalhete rubro das papoulas!',
  },
  {
    id: 'moleirinha', n: 2, titulo: 'A Moleirinha (início)', autor: 'Guerra Junqueiro',
    texto: 'Pela estrada plana, toc, toc, toc,\nGuia o jumentinho uma velhinha errante.\nComo vão ligeiros, ambos a reboque,\nAntes que anoiteça, toc, toc, toc,\nA velhinha atrás, o jumentito adiante!…\n\nToc, toc, a velha vai para o moinho,\nTem oitenta anos, bem bonito rol!…\nE contudo alegre como um passarinho,\nToc, toc, e fresca como o branco linho,\nDe manhã nas relvas a corar ao sol.',
  },

  // ───────────── Nível 3 — mais longos ─────────────
  {
    id: 'alma-minha', n: 3, titulo: 'Alma minha gentil, que te partiste', autor: 'Luís de Camões',
    texto: 'Alma minha gentil, que te partiste\nTão cedo desta vida descontente,\nRepousa lá no Céu eternamente,\nE viva eu cá na terra sempre triste.\n\nSe lá no assento etéreo, onde subiste,\nMemória desta vida se consente,\nNão te esqueças daquele amor ardente,\nQue já nos olhos meus tão puro viste.\n\nE se vires que pode merecer-te\nAlguma cousa a dor que me ficou\nDa mágoa, sem remédio, de perder-te;\n\nRoga a Deus que teus anos encurtou,\nQue tão cedo de cá me leve a ver-te,\nQuão cedo de meus olhos te levou.',
  },
  {
    id: 'sete-anos', n: 3, titulo: 'Sete anos de pastor Jacob servia', autor: 'Luís de Camões',
    texto: 'Sete anos de pastor Jacob servia\nLabão, pai de Raquel, serrana bela:\nMas não servia ao pai, servia a ela,\nQue a ela só por prémio pretendia.\n\nOs dias na esperança de um só dia\nPassava, contentando-se com vê-la:\nPorém o pai, usando de cautela,\nEm lugar de Raquel lhe deu a Lia.\n\nVendo o triste pastor que com enganos\nAssim lhe era negada a sua pastora,\nComo se a não tivera merecida;\n\nComeçou a servir outros sete anos,\nDizendo: «Mais servira, se não fora\nPara tão longo amor tão curta a vida.»',
  },
  {
    id: 'fanatismo', n: 3, titulo: 'Fanatismo', autor: 'Florbela Espanca',
    texto: 'Minh\'alma, de sonhar-te, anda perdida.\nMeus olhos andam cegos de te ver.\nNão és sequer razão do meu viver\nPois que tu és já toda a minha vida!\n\nNão vejo nada assim enlouquecida…\nPasso no mundo, meu Amor, a ler\nNo misterioso livro do teu ser\nA mesma história tantas vezes lida!…\n\n«Tudo no mundo é frágil, tudo passa…»\nQuando me dizem isto, toda a graça\nDuma boca divina fala em mim!\n\nE, olhos postos em ti, digo de rastros:\n«Ah! podem voar mundos, morrer astros,\nQue tu és como Deus: princípio e fim!…»',
  },
  {
    id: 'mao-de-deus', n: 3, titulo: 'Na mão de Deus', autor: 'Antero de Quental',
    texto: 'Na mão de Deus, na sua mão direita,\nDescansou afinal meu coração.\nDo palácio encantado da Ilusão\nDesci a passo e passo a escada estreita.\n\nComo as flores mortais, com que se enfeita\nA ignorância infantil, despojo vão,\nDepus do Ideal e da Paixão\nA forma transitória e imperfeita.\n\nComo criança, em lóbrega jornada,\nQue a mãe leva ao colo agasalhada\nE atravessa, sorrindo vagamente,\n\nSelvas, mares, areias do deserto…\nDorme o teu sono, coração liberto,\nDorme na mão de Deus eternamente!',
  },
  {
    id: 'mostrengo', n: 3, titulo: 'O Mostrengo (Mensagem)', autor: 'Fernando Pessoa',
    texto: 'O mostrengo que está no fim do mar\nNa noite de breu ergueu-se a voar;\nÀ roda da nau voou três vezes,\nVoou três vezes a chiar,\nE disse, «Quem é que ousou entrar\nNas minhas cavernas que não desvendo,\nMeus tetos negros do fim do mundo?»\nE o homem do leme disse, tremendo,\n«El-Rei D. João Segundo!»\n\n«De quem são as velas onde me roço?\nDe quem as quilhas que vejo e ouço?»\nDisse o mostrengo, e rodou três vezes,\nTrês vezes rodou imundo e grosso,\n«Quem vem poder o que só eu posso,\nQue moro onde nunca ninguém me visse\nE escorro os medos do mar sem fundo?»\nE o homem do leme tremeu, e disse,\n«El-Rei D. João Segundo!»\n\nTrês vezes do leme as mãos ergueu,\nTrês vezes ao leme as reprendeu,\nE disse no fim de temer três vezes,\n«Aqui ao leme sou mais do que eu:\nSou um Povo que quer o mar que é teu;\nE mais que o mostrengo, que me a alma teme\nE roda nas trevas do fim do mundo,\nManda a vontade, que me ata ao leme,\nDe El-Rei D. João Segundo!»',
  },
  {
    id: 'tesouro', n: 3, titulo: 'O Tesouro (início)', autor: 'Eça de Queirós',
    texto: 'Os três irmãos de Medranhos, Rui, Guanes e Rostabal, eram então, em todo o Reino das Astúrias, os fidalgos mais famintos e os mais remendados.\n\nNos Paços de Medranhos, a que o vento da serra levara vidraça e telha, passavam eles as tardes desse inverno, engelhados nos seus pelotes de camelão, batendo as solas rotas sobre as lajes da cozinha, diante da vasta lareira negra, onde desde há muito não estalava lume, nem fervia a panela de ferro. Ao escurecer devoravam uma côdea de pão negro, esfregada com alho. Depois, sem candeia, através do pátio, fendendo a neve, iam dormir à estrebaria, para aproveitar o calor das três éguas lazarentas que, esfaimadas como eles, roíam as traves da manjedoura. E a miséria tornara estes senhores mais bravios que lobos.',
  },
  {
    id: 'pupilas', n: 3, titulo: 'As Pupilas do Senhor Reitor (início)', autor: 'Júlio Dinis',
    texto: 'José das Dornas era um lavrador abastado, sadio e de uma tão feliz disposição de génio, que tudo levava a rir; mas desse rir natural, sincero e despreocupado, que lhe fazia bem, e não do rir dos Demócritos de todos os tempos — rir cético, forçado, desconsolador, que é mil vezes pior do que o chorar.\n\nEm negócio de lavoura, dava, como se costuma dizer, sota e ás ao mais pintado. Até o Sr. Morais Soares teria que aprender com ele. Apesar dos seus sessenta anos, desafiava em robustez e atividade qualquer rapaz de vinte. Era-lhe familiar o canto matinal do galo, e o amanhecer já não tinha para ele segredos não revelados. O sol encontrava-o sempre de pé, e em pé o deixava ao esconder-se.',
  },
];
