const chess = new Chess();
const nomesPecas = {
  p: 'Peão',
  n: 'Cavalo',
  b: 'Bispo',
  r: 'Torre',
  q: 'Dama',
  k: 'Rei'
};
const colunas = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const svgPecas = {
  w: {
    p: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
    n: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
    b: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
    r: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
    q: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
    k: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg'
  },
  b: {
    p: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
    n: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
    b: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
    r: 'https://commons.wikimedia.org/wiki/Special:FilePath/Chess_rdt45.svg',
    q: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
    k: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg'
  }
};
let pecasQuanticas = {};
let gruposFlanco = {};
let casaSelecionada = null;
let corJogador = 'w';
let historicoDesfazer = [];
let historicoRefazer = [];
let ultimaPromocaoCasa = null;
let ultimoColapsoCasa = null;
let timerAlertaStatus = null;
let configuracaoPartida = null;
let relogioPartida = {
  ativo: false,
  ultimoInstante: 0,
  intervalId: null,
  segundos: {
    w: 0,
    b: 0
  },
  incremento: 0
};
let placarTorneio = {
  w: 0,
  b: 0,
  empates: 0,
  partida: 1
};
let partidaEncerrada = false;
let logPartida = null;

/* =========================================================
 * Alertas centrais piscantes na barra de status
 * ========================================================= */
function emitirAlertaStatus(mensagem, tipo = 'info', duracao = 4500) {
  const alertaEl = document.getElementById('statusAlerta');
  if (!alertaEl) return;
  alertaEl.textContent = mensagem;
  alertaEl.className = `status-alerta alerta-pisca alerta-${tipo}`;
  if (timerAlertaStatus) clearTimeout(timerAlertaStatus);
  timerAlertaStatus = setTimeout(() => {
    alertaEl.textContent = '';
    alertaEl.className = 'status-alerta';
  }, duracao);
}

/* =========================================================
 * Avisos discretos (toasts laterais)
 * ========================================================= */
function mostrarAviso(mensagem, tipo = 'info', duracao = 5200) {
  const container = document.getElementById('avisos');
  if (!container) return;
  const aviso = document.createElement('div');
  aviso.className = `aviso aviso-${tipo}`;
  const texto = document.createElement('span');
  texto.className = 'aviso-texto';
  texto.textContent = mensagem;
  const fechar = document.createElement('button');
  fechar.className = 'aviso-fechar';
  fechar.type = 'button';
  fechar.setAttribute('aria-label', 'Fechar aviso');
  fechar.textContent = '×';
  fechar.addEventListener('click', () => removerAviso(aviso));
  aviso.appendChild(texto);
  aviso.appendChild(fechar);
  container.appendChild(aviso);
  requestAnimationFrame(() => aviso.classList.add('mostrar'));
  const temporizador = setTimeout(() => removerAviso(aviso), duracao);
  aviso.dataset.temporizador = String(temporizador);
}

function removerAviso(aviso) {
  if (!aviso || !aviso.isConnected) return;
  clearTimeout(Number(aviso.dataset.temporizador));
  aviso.classList.remove('mostrar');
  aviso.classList.add('sair');
  setTimeout(() => aviso.remove(), 220);
}

/* =========================================================
 * Livro de aberturas clássicas
 * ========================================================= */
const aberturasClassicas = [
  {
    nome: 'Defesa Siciliana',
    lances: ['e2e4', 'c7c5'],
    dica: 'Resposta assimétrica e combativa: as Pretas abrem mão da simetria central para buscar contra-jogo pelo flanco da dama.'
  },
  {
    nome: 'Defesa Francesa',
    lances: ['e2e4', 'e7e6'],
    dica: 'Estrutura sólida: as Pretas cedem espaço no centro para golpeá-lo depois com o avanço ...d5.'
  },
  {
    nome: 'Defesa Caro-Kann',
    lances: ['e2e4', 'c7c6'],
    dica: 'Fundação sólida sem trancar o bispo de casas claras, preparando o avanço ...d5 com segurança.'
  },
  {
    nome: 'Abertura Inglesa',
    lances: ['c2c4'],
    dica: 'Controle flexível do centro pelo flanco da dama; pode transpor para diversas estruturas conhecidas.'
  },
  {
    nome: 'Gambito da Dama',
    lances: ['d2d4', 'd7d5', 'c2c4'],
    dica: 'As Brancas oferecem um peão lateral para abrir linhas e ganhar tempo de desenvolvimento.'
  },
  {
    nome: 'Defesa Eslava',
    lances: ['d2d4', 'd7d5', 'c2c4', 'c7c6'],
    dica: 'As Pretas sustentam o peão d5 sem fechar a diagonal do bispo de casas claras.'
  },
  {
    nome: 'Defesa Índia do Rei',
    lances: ['d2d4', 'g8f6', 'c2c4', 'g7g6'],
    dica: 'Fianchetto do bispo do rei: as Pretas cedem o centro de peões para pressioná-lo depois com peças.'
  },
  {
    nome: 'Abertura Réti',
    lances: ['g1f3', 'd7d5', 'c2c4'],
    dica: 'As Brancas atrasam o avanço central e pressionam com peças antes de definir a estrutura de peões.'
  },
  {
    nome: 'Ruy Lopez (Espanhola)',
    lances: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5'],
    dica: 'O bispo pressiona o cavalo que defende o peão e5 — uma das aberturas mais estudadas da história do xadrez.'
  },
  {
    nome: 'Abertura Italiana',
    lances: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4'],
    dica: 'Desenvolvimento rápido do bispo mirando a casa f7, com luta direta pelo controle do centro.'
  },
  {
    nome: 'Defesa Petrov',
    lances: ['e2e4', 'e7e5', 'g1f3', 'g8f6'],
    dica: 'As Pretas devolvem o ataque ao peão e4 em vez de defender e5, buscando simetria e solidez.'
  },
  {
    nome: 'Abertura dos Quatro Cavalos',
    lances: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'b1c3', 'g8f6'],
    dica: 'Desenvolvimento simétrico e harmonioso de cavalos antes de definir bispos e o centro.'
  }
];

function descreverLance(origem, destino) {
  return `${origem}-${destino}`;
}

function identificarAbertura(historicoUCI) {
  const candidatos = aberturasClassicas.filter(abertura => {
    if (historicoUCI.length > abertura.lances.length) return false;
    for (let i = 0; i < historicoUCI.length; i++) {
      if (historicoUCI[i] !== abertura.lances[i]) return false;
    }
    return true;
  });
  if (!candidatos.length) return null;
  const exatos = candidatos.filter(a => a.lances.length === historicoUCI.length);
  if (exatos.length) return exatos[0];
  if (historicoUCI.length < 2) return null;
  const menorTamanho = Math.min(...candidatos.map(a => a.lances.length));
  const maisProvaveis = candidatos.filter(a => a.lances.length === menorTamanho);
  return maisProvaveis.length === 1 ? maisProvaveis[0] : null;
}

function dicaPorFase() {
  const numeroLance = chess.history().length;
  const pecasNoTabuleiro = chess.board().flat().filter(Boolean);
  const materialMenor = pecasNoTabuleiro.filter(p => !['k', 'p'].includes(p.type)).length;
  const haEmaranhadasAtivas = Object.values(pecasQuanticas).some(p => p.emaranhadaComId && !p.colapsada);

  if (haEmaranhadasAtivas) {
    return '⛓️ Há peças ainda emaranhadas no tabuleiro: revelar uma delas colapsa seu par complementar. Pense em qual captura ou ameaça força esse colapso a seu favor.';
  }
  if (numeroLance < 10) {
    return 'Fase de abertura: desenvolva peças menores antes da dama, dispute o centro com peões e busque a segurança do rei (considere o roque).';
  }
  if (materialMenor > 6) {
    return 'Meio-jogo: procure atividade para suas peças, coordene ataques contra o rei adversário e observe fraquezas na estrutura de peões inimiga.';
  }
  return 'Final de jogo: ative o seu rei, avance peões passados e busque simplificar trocando peças quando estiver em vantagem material.';
}

function atualizarDidatica() {
  const historicoVerboso = chess.history({ verbose: true });
  const historicoUCI = historicoVerboso.map(m => `${m.from}${m.to}`);
  const abertura = identificarAbertura(historicoUCI);
  const painel = document.getElementById('didatica');
  if (!abertura) {
    painel.textContent = historicoUCI.length ? dicaPorFase() : 'Jogue um lance para começar a ver aberturas clássicas e dicas de estudo aqui.';
    return;
  }
  const completa = historicoUCI.length === abertura.lances.length;
  let texto = completa ? `📖 ${abertura.nome}\n${abertura.dica}` : `📖 Rumo à: ${abertura.nome}\n${abertura.dica}`;
  if (!completa) {
    const proximo = abertura.lances[historicoUCI.length];
    texto += `\nLance da teoria a seguir: ${descreverLance(proximo.slice(0, 2), proximo.slice(2, 4))}.`;
  }
  painel.textContent = texto;
}

/* =========================================================
 * Xadrez de Schrödinger — núcleo quântico (variante simplificada)
 *
 * Rei, Dama e Peões são sempre clássicos (Regra 1 do parecer técnico).
 * Cada flanco (Torre/Cavalo/Bispo de um lado) é um único sistema quântico
 * com 4 permutações possíveis — a identidade clássica mais as 3 trocas de
 * um par — em vez de peças independentes. Os dois flancos de um mesmo
 * jogador são conjuntamente restritos: os bispos de flancos opostos nunca
 * podem colapsar para a mesma cor de casa (o análogo, neste jogo, do
 * Princípio de Exclusão de Pauli). Ver PARECER_TECNICO_COERENCIA_FISICA.md.
 * ========================================================= */

function corDaCasa(casa) {
  const coluna = colunas.indexOf(casa[0]) + 1; // a=1, ..., h=8
  const linha = Number(casa[1]);
  return (coluna + linha) % 2 === 0 ? 'escura' : 'clara';
}

// As 4 permutações "identidade + uma troca" de um flanco de 3 casas.
function gerarPermutacoesFlanco(casaEsq, casaMeio, casaDir, tipoEsq, tipoMeio, tipoDir) {
  return [
    { [casaEsq]: tipoEsq, [casaMeio]: tipoMeio, [casaDir]: tipoDir },   // identidade
    { [casaEsq]: tipoMeio, [casaMeio]: tipoEsq, [casaDir]: tipoDir },   // troca esq↔meio
    { [casaEsq]: tipoDir, [casaMeio]: tipoMeio, [casaDir]: tipoEsq },   // troca esq↔dir
    { [casaEsq]: tipoEsq, [casaMeio]: tipoDir, [casaDir]: tipoMeio }    // troca meio↔dir
  ];
}

// Gera o grupo quântico de um jogador: as 10 hipóteses conjuntas (de 16
// possíveis) em que os bispos dos dois flancos caem em cores diferentes.
function gerarGrupoFlancos(cor) {
  const linha = cor === 'w' ? '1' : '8';
  const casasDama = [`a${linha}`, `b${linha}`, `c${linha}`];
  const casasRei = [`f${linha}`, `g${linha}`, `h${linha}`];
  const permsDama = gerarPermutacoesFlanco(...casasDama, 'r', 'n', 'b');
  const permsRei = gerarPermutacoesFlanco(...casasRei, 'b', 'n', 'r');

  const corDoBispo = (perm, casas) => corDaCasa(casas.find(c => perm[c] === 'b'));

  const hipoteses = [];
  for (const permDama of permsDama) {
    for (const permRei of permsRei) {
      if (corDoBispo(permDama, casasDama) !== corDoBispo(permRei, casasRei)) {
        hipoteses.push({ ...permDama, ...permRei });
      }
    }
  }
  return { cor, casas: [...casasDama, ...casasRei], hipoteses };
}

// Deriva o estado exibível de uma casa a partir das hipóteses ainda vivas do grupo.
function atualizarPecasDoGrupo(grupo) {
  for (const casa of grupo.casas) {
    const tipos = [...new Set(grupo.hipoteses.map(h => h[casa]))];
    pecasQuanticas[casa] = {
      possibilidades: tipos,
      cor: grupo.cor,
      colapsada: tipos.length === 1 ? tipos[0] : null,
      emaranhadaComId: grupo.cor
    };
  }
}

// Medição: confirma que `casa` é do tipo `tipoConfirmado`, filtra as
// hipóteses do grupo e recalcula todas as casas do flanco. Retorna as
// casas que passaram a ter um único tipo possível como resultado direto
// desta medição (efeito em cascata tipo GHZ).
function colapsarNoGrupo(casa, tipoConfirmado) {
  const grupo = gruposFlanco[pecasQuanticas[casa]?.cor];
  if (!grupo || !grupo.casas.includes(casa)) return [];
  const antesColapsadas = new Set(grupo.casas.filter(c => pecasQuanticas[c].colapsada));
  grupo.hipoteses = grupo.hipoteses.filter(h => h[casa] === tipoConfirmado);
  atualizarPecasDoGrupo(grupo);
  return grupo.casas
    .filter(c => pecasQuanticas[c].colapsada && !antesColapsadas.has(c))
    .map(c => ({ casa: c, tipo: pecasQuanticas[c].colapsada }));
}

// Uma vez que uma peça do flanco sai da casa original (por mover-se ou por
// ser capturada), aquela casa deixa de existir para fins de rastreamento do grupo.
function aposentarDoGrupo(casa, grupoId) {
  const grupo = gruposFlanco[grupoId];
  if (!grupo) return;
  const indice = grupo.casas.indexOf(casa);
  if (indice !== -1) grupo.casas.splice(indice, 1);
}

function inicializarPecasQuanticas() {
  pecasQuanticas = {};
  gruposFlanco = {};

  if (configuracaoPartida?.modo === 'classico') {
    for (const coluna of colunas) {
      pecasQuanticas[`${coluna}2`] = {
        possibilidades: ['p'],
        cor: 'w',
        colapsada: 'p',
        emaranhadaComId: null
      };
      pecasQuanticas[`${coluna}7`] = {
        possibilidades: ['p'],
        cor: 'b',
        colapsada: 'p',
        emaranhadaComId: null
      };
    }
    const pecas = {
      a: 'r',
      b: 'n',
      c: 'b',
      d: 'q',
      e: 'k',
      f: 'b',
      g: 'n',
      h: 'r'
    };
    for (const coluna of colunas) {
      pecasQuanticas[`${coluna}1`] = {
        possibilidades: [pecas[coluna]],
        cor: 'w',
        colapsada: pecas[coluna],
        emaranhadaComId: null
      };
      pecasQuanticas[`${coluna}8`] = {
        possibilidades: [pecas[coluna]],
        cor: 'b',
        colapsada: pecas[coluna],
        emaranhadaComId: null
      };
    }
    return;
  }

  // Modo Quântico (Variante Simplificada - PARECER_TECNICO_COERENCIA_FISICA.md)
  for (const coluna of colunas) {
    pecasQuanticas[`${coluna}2`] = {
      possibilidades: ['p'],
      cor: 'w',
      colapsada: 'p',
      emaranhadaComId: null
    };
    pecasQuanticas[`${coluna}7`] = {
      possibilidades: ['p'],
      cor: 'b',
      colapsada: 'p',
      emaranhadaComId: null
    };
  }

  for (const cor of ['w', 'b']) {
    const linha = cor === 'w' ? '1' : '8';
    // Rei e Dama: sempre clássicos (Regra 1 do parecer técnico).
    pecasQuanticas[`e${linha}`] = {
      possibilidades: ['k'],
      cor,
      colapsada: 'k',
      emaranhadaComId: null
    };
    pecasQuanticas[`d${linha}`] = {
      possibilidades: ['q'],
      cor,
      colapsada: 'q',
      emaranhadaComId: null
    };
    // Flancos: sistema quântico conjunto de 10 hipóteses (Regras 2-4).
    const grupo = gerarGrupoFlancos(cor);
    gruposFlanco[cor] = grupo;
    atualizarPecasDoGrupo(grupo);
  }
}

function localizarRei(cor) {
  for (const [casa, peca] of Object.entries(pecasQuanticas)) {
    if (peca && peca.cor === cor && (peca.colapsada === 'k' || peca.possibilidades.includes('k'))) {
      return casa;
    }
  }
  return null;
}

function casaEstaAmeacada(casaAlvo, corDefensora, casaOrigemRei = null) {
  const corAtacante = corDefensora === 'w' ? 'b' : 'w';
  const cAlvoIdx = colunas.indexOf(casaAlvo[0]);
  const lAlvo = parseInt(casaAlvo[1], 10);

  for (const [casaAtacante, pecaAtacante] of Object.entries(pecasQuanticas)) {
    if (!pecaAtacante || pecaAtacante.cor !== corAtacante) continue;
    if (casaAtacante === casaAlvo) continue;

    const cAtacIdx = colunas.indexOf(casaAtacante[0]);
    const lAtac = parseInt(casaAtacante[1], 10);
    const dCol = cAlvoIdx - cAtacIdx;
    const dLin = lAlvo - lAtac;
    const absDCol = Math.abs(dCol);
    const absDLin = Math.abs(dLin);

    for (const tipo of pecaAtacante.possibilidades) {
      if (tipo === 'p') {
        const sentido = corAtacante === 'w' ? 1 : -1;
        if (dLin === sentido && absDCol === 1) return true;
      } else if (tipo === 'n') {
        if ((absDCol === 1 && absDLin === 2) || (absDCol === 2 && absDLin === 1)) return true;
      } else if (tipo === 'k') {
        if (absDCol <= 1 && absDLin <= 1) return true;
      } else if (tipo === 'r' || tipo === 'b' || tipo === 'q') {
        const ehOrtogonal = (dCol === 0 && dLin !== 0) || (dLin === 0 && dCol !== 0);
        const ehDiagonal = absDCol === absDLin && absDCol > 0;

        if ((tipo === 'r' && ehOrtogonal) || (tipo === 'b' && ehDiagonal) || (tipo === 'q' && (ehOrtogonal || ehDiagonal))) {
          const stepCol = dCol === 0 ? 0 : (dCol > 0 ? 1 : -1);
          const stepLin = dLin === 0 ? 0 : (dLin > 0 ? 1 : -1);
          let currC = cAtacIdx + stepCol;
          let currL = lAtac + stepLin;
          let livre = true;

          while (currC !== cAlvoIdx || currL !== lAlvo) {
            const casaIntermediaria = `${colunas[currC]}${currL}`;
            if (casaIntermediaria !== casaOrigemRei && pecasQuanticas[casaIntermediaria]) {
              livre = false;
              break;
            }
            currC += stepCol;
            currL += stepLin;
          }

          if (livre) return true;
        }
      }
    }
  }
  return false;
}

function salvarEstadoQuantico() {
  historicoDesfazer.push({
    fen: chess.fen(),
    pecasQuanticas: JSON.parse(JSON.stringify(pecasQuanticas)),
    gruposFlanco: JSON.parse(JSON.stringify(gruposFlanco)),
    relogio: {
      w: relogioPartida.segundos.w,
      b: relogioPartida.segundos.b
    }
  });
  historicoRefazer = [];
}

function criarImagem(cor, tipo, classeExtra = '') {
  const imagem = document.createElement('img');
  imagem.src = svgPecas[cor][tipo];
  imagem.className = `peca-img ${classeExtra}`.trim();
  imagem.alt = nomesPecas[tipo];
  return imagem;
}

// Posições relativas (deslocamento X/Y em % da casa) para 2 ou 3 ícones
// sobrepostos — o layout de 2 peças mantém o visual entreaberto original;
// o de 3 organiza um pequeno leque triangular.
const DESLOCAMENTOS_SUPERPOSICAO = {
  2: [
    [-16, 0],
    [16, 0]
  ],
  3: [
    [-18, 12],
    [18, 12],
    [0, -14]
  ]
};

function criarSuperposicao(pecaQ) {
  const superposicao = document.createElement('div');
  superposicao.className = 'quantica-split';
  const total = pecaQ.possibilidades.length;
  const deslocamentos = DESLOCAMENTOS_SUPERPOSICAO[total] || [[0, 0]];
  const tamanho = total >= 3 ? '58%' : '68%';
  pecaQ.possibilidades.forEach((tipo, indice) => {
    const imagem = criarImagem(pecaQ.cor, tipo);
    const [x, y] = deslocamentos[indice] || [0, 0];
    imagem.style.position = 'absolute';
    imagem.style.top = '50%';
    imagem.style.left = '50%';
    imagem.style.width = tamanho;
    imagem.style.height = tamanho;
    imagem.style.opacity = '0.62';
    imagem.style.filter = 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.5))';
    imagem.style.transform = `translate(calc(-50% + ${x}%), calc(-50% + ${y}%))`;
    superposicao.appendChild(imagem);
  });
  return superposicao;
}

function renderizarTabuleiro() {
  const tabuleiro = document.getElementById('tabuleiro');
  tabuleiro.innerHTML = '';

  const invertido = corJogador === 'b';
  const linhasIndices = invertido ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  const colunasIndices = invertido ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  for (let i = 0; i < 8; i++) {
    const linha = linhasIndices[i];
    for (let j = 0; j < 8; j++) {
      const colIdx = colunasIndices[j];
      const casa = `${colunas[colIdx]}${linha}`;
      const elemento = document.createElement('div');
      // Convenção oficial FIDE: casa clara no canto inferior direito (branco na direita) e dama na sua cor
      const casaClara = (linha + colIdx) % 2 === 0;
      elemento.className = `casa ${casaClara ? 'clara' : 'escura'}`;
      elemento.dataset.casa = casa;
      if (casaSelecionada === casa) elemento.classList.add('selecionada');
      elemento.addEventListener('click', () => clicarCasa(casa));
      elemento.addEventListener('dragover', evento => {
        evento.preventDefault();
        elemento.classList.add('drag-over');
      });
      elemento.addEventListener('dragleave', () => elemento.classList.remove('drag-over'));
      elemento.addEventListener('drop', evento => {
        evento.preventDefault();
        elemento.classList.remove('drag-over');
        if (partidaEncerrada) return;
        executarMovimento(evento.dataTransfer.getData('text/plain'), casa);
      });

      // Rótulo da coluna: fica na última fileira visual (i === 7)
      if (i === 7) {
        const rotuloColuna = document.createElement('span');
        rotuloColuna.className = 'rotulo rotulo-coluna';
        rotuloColuna.textContent = colunas[colIdx];
        elemento.appendChild(rotuloColuna);
      }
      // Rótulo da linha: fica na primeira coluna visual (j === 0)
      if (j === 0) {
        const rotuloLinha = document.createElement('span');
        rotuloLinha.className = 'rotulo rotulo-linha';
        rotuloLinha.textContent = String(linha);
        elemento.appendChild(rotuloLinha);
      }

      const pecaQ = pecasQuanticas[casa];
      if (pecaQ && chess.get(casa)) {
        // Realce de rei em xeque clássico ou quântico (sob ameaça de qualquer hipótese oponente)
        const ehReiDaVez = (pecaQ.colapsada === 'k' || pecaQ.possibilidades.includes('k')) && pecaQ.cor === chess.turn();
        if (ehReiDaVez && (chess.in_check() || casaEstaAmeacada(casa, pecaQ.cor))) {
          elemento.classList.add('casa-xeque');
        }

        const podeMover = !partidaEncerrada && (configuracaoPartida?.oponente === 'ia'
          ? (pecaQ.cor === corJogador && pecaQ.cor === chess.turn())
          : (pecaQ.cor === chess.turn()));

        const recipiente = document.createElement('div');
        recipiente.className = 'peca-container';
        recipiente.draggable = podeMover;
        if (pecaQ.emaranhadaComId && !pecaQ.colapsada) recipiente.classList.add('emaranhada');
        recipiente.addEventListener('dragstart', evento => {
          if (!podeMover) {
            evento.preventDefault();
            return;
          }
          casaSelecionada = casa;
          evento.dataTransfer.setData('text/plain', casa);
        });
        recipiente.addEventListener('dragend', () => {
          casaSelecionada = null;
          renderizarTabuleiro();
        });

        let animacaoExtra = '';
        if (casa === ultimaPromocaoCasa) animacaoExtra = 'animar-promocao';
        else if (casa === ultimoColapsoCasa) animacaoExtra = 'animar-colapso';

        if (pecaQ.colapsada) {
          recipiente.appendChild(criarImagem(pecaQ.cor, pecaQ.colapsada, animacaoExtra));
        } else {
          recipiente.appendChild(criarSuperposicao(pecaQ));
        }
        elemento.appendChild(recipiente);
      }
      tabuleiro.appendChild(elemento);
    }
  }
  ultimaPromocaoCasa = null;
  ultimoColapsoCasa = null;
  atualizarStatusEHistorial();
}

function clicarCasa(casa) {
  if (partidaEncerrada) return;
  if (configuracaoPartida?.oponente === 'ia' && chess.turn() !== corJogador) return;
  const peca = chess.get(casa);
  if (casaSelecionada === null) {
    if (peca && peca.color === chess.turn()) {
      casaSelecionada = casa;
      renderizarTabuleiro();
    }
  } else {
    const origem = casaSelecionada;
    casaSelecionada = null;
    if (origem === casa) renderizarTabuleiro();
    else executarMovimento(origem, casa);
  }
}

function distanciaColunas(casaA, casaB) {
  return Math.abs(colunas.indexOf(casaA[0]) - colunas.indexOf(casaB[0]));
}

function executarMovimento(origem, destino, lanceDaIA = false) {
  if (partidaEncerrada) return;
  const pecaQ = pecasQuanticas[origem];
  if (!pecaQ) return renderizarTabuleiro();

  // 1. O Rei NUNCA pode ser capturado (regra de xadrez clássica e quântica absoluta)
  const pecaDestino = pecasQuanticas[destino];
  if (pecaDestino && (pecaDestino.colapsada === 'k' || pecaDestino.possibilidades.includes('k'))) {
    mostrarAviso('Jogada proibida: o Rei não pode ser capturado!', 'erro', 4500);
    emitirAlertaStatus('Jogada proibida: Rei não pode ser capturado!', 'erro', 3500);
    return renderizarTabuleiro();
  }

  // 2. O Rei não pode se mover para uma casa sob ameaça quântica (xeque potencial)
  const ehRei = pecaQ.colapsada === 'k' || pecaQ.possibilidades.includes('k');
  if (ehRei) {
    if (casaEstaAmeacada(destino, pecaQ.cor, origem)) {
      mostrarAviso('Jogada proibida: o Rei não pode se mover para uma casa sob ameaça!', 'erro', 4500);
      emitirAlertaStatus('Jogada proibida: casa sob ameaça!', 'erro', 3500);
      return renderizarTabuleiro();
    }
  }

  // 3. Pré-checagem de roque (Regra 5 do parecer)
  if (pecaQ.colapsada === 'k' && distanciaColunas(origem, destino) === 2) {
    const linha = origem[1];
    const ladoRei = colunas.indexOf(destino[0]) > colunas.indexOf(origem[0]);
    const cantoQ = pecasQuanticas[ladoRei ? `h${linha}` : `a${linha}`];
    if (cantoQ && !cantoQ.possibilidades.includes('r')) {
      mostrarAviso('Roque indisponível: a peça do canto já revelou não ser uma torre.', 'erro', 4400);
      emitirAlertaStatus('Roque indisponível: canto não é torre', 'erro', 3500);
      return renderizarTabuleiro();
    }
    // Casas de passagem do roque não podem estar sob ameaça
    const casaPassagem = ladoRei ? `f${linha}` : `d${linha}`;
    if (casaEstaAmeacada(casaPassagem, pecaQ.cor, origem)) {
      mostrarAviso('Roque indisponível: casa de passagem sob ameaça!', 'erro', 4400);
      emitirAlertaStatus('Roque indisponível: casa sob xeque', 'erro', 3500);
      return renderizarTabuleiro();
    }
  }

  // 4. Salva a peça original no chess.js antes de testar
  const pecaOriginalChess = chess.get(origem);

  // Testa cada possibilidade viva; guarda todas as que resultam em lance
  // legal (Regra 5: sorteio com peso uniforme entre elas, eliminando viés determinístico).
  const candidatos = [];
  for (const possibilidade of pecaQ.possibilidades) {
    chess.put({ type: possibilidade, color: pecaQ.cor }, origem);
    if (chess.move({ from: origem, to: destino, promotion: 'q' })) {
      candidatos.push(possibilidade);
      chess.undo();
    }
  }

  // Restaura imediatamente a peça original no chess.js
  if (pecaOriginalChess) {
    chess.put(pecaOriginalChess, origem);
  } else {
    chess.remove(origem);
  }

  if (!candidatos.length) {
    mostrarAviso('Movimento inválido quânticamente.', 'erro', 3800);
    emitirAlertaStatus('Movimento inválido', 'erro', 3000);
    return renderizarTabuleiro();
  }

  // 5. Se não é o Rei movendo, verifica se o lance expõe o próprio Rei a xeque
  if (!ehRei) {
    const casaRei = localizarRei(pecaQ.cor);
    if (casaRei) {
      const pecaDestinoBackup = pecasQuanticas[destino];
      pecasQuanticas[destino] = pecaQ;
      delete pecasQuanticas[origem];
      const reiFicaAmeacado = casaEstaAmeacada(casaRei, pecaQ.cor);
      pecasQuanticas[origem] = pecaQ;
      if (pecaDestinoBackup) pecasQuanticas[destino] = pecaDestinoBackup;
      else delete pecasQuanticas[destino];

      if (reiFicaAmeacado) {
        mostrarAviso('Jogada proibida: seu Rei ficaria sob ameaça!', 'erro', 4500);
        emitirAlertaStatus('Jogada proibida: Rei exposto a xeque!', 'erro', 3500);
        return renderizarTabuleiro();
      }
    }
  }

  const tipoEscolhido = candidatos[Math.floor(Math.random() * candidatos.length)];

  // Snapshot fiel do estado (com a peça em sua casa de origem íntegra)
  salvarEstadoQuantico();
  let mensagem = '';

  // Captura de peça ainda em superposição: a captura também é uma medição
  // (Regra 6) — revela seu tipo real e propaga pelo grupo antes de sair do tabuleiro.
  const pecaCapturada = pecasQuanticas[destino];
  if (pecaCapturada && pecaCapturada.possibilidades.length > 1) {
    const tipoRevelado = pecaCapturada.possibilidades[Math.floor(Math.random() * pecaCapturada.possibilidades.length)];
    const revelacoesCaptura = colapsarNoGrupo(destino, tipoRevelado);
    if (revelacoesCaptura.length) {
      mensagem += `🔮 A captura revelou: ${revelacoesCaptura.map(r => `${r.casa} = ${nomesPecas[r.tipo]}`).join(', ')}.`;
    }
  }
  if (pecaCapturada?.emaranhadaComId) aposentarDoGrupo(destino, pecaCapturada.emaranhadaComId);

  // Colapso da peça que está se movendo, com cascata pelo grupo (efeito tipo GHZ)
  if (pecaQ.possibilidades.length > 1) {
    ultimoColapsoCasa = destino;
    const revelacoes = colapsarNoGrupo(origem, tipoEscolhido);
    const linhaMsg = `🔮 Colapso! A peça em ${destino} revelou-se: ${nomesPecas[tipoEscolhido]}.`;
    const outras = revelacoes.filter(r => r.casa !== origem);
    const cascata = outras.length
      ? '\n⛓️ ' + outras.map(r => `${r.casa} colapsou para: ${nomesPecas[r.tipo]}`).join('; ') + '!'
      : '';
    mensagem += (mensagem ? '\n' : '') + linhaMsg + cascata;
    emitirAlertaStatus(`🔮 Colapso: ${nomesPecas[tipoEscolhido]}!`, 'colapso', 4500);
  }

  chess.put({ type: tipoEscolhido, color: pecaQ.cor }, origem);
  const ehPromocao = pecaQ.colapsada === 'p' && (destino.endsWith('8') || destino.endsWith('1'));
  const resultadoLance = chess.move({ from: origem, to: destino, promotion: 'q' });

  // En passant: o peão capturado não está em "destino", e sim na casa com a
  // coluna do destino e a linha de origem — o chess.js já o removeu do seu
  // próprio tabuleiro, então limpamos aqui o registro quântico correspondente.
  // Sem isso, ele vira uma peça "fantasma" que nunca sai de pecasQuanticas e
  // continua sendo contada como ameaça (casaEstaAmeacada) pelo resto da
  // partida, mesmo já capturada.
  if (resultadoLance && resultadoLance.flags.includes('e')) {
    const casaPeaoCapturado = destino[0] + origem[1];
    delete pecasQuanticas[casaPeaoCapturado];
  }

  pecasQuanticas[destino] = pecasQuanticas[origem];
  delete pecasQuanticas[origem];
  if (pecaQ.emaranhadaComId) aposentarDoGrupo(origem, pecaQ.emaranhadaComId);

  if (ehPromocao) {
    pecasQuanticas[destino].colapsada = 'q';
    pecasQuanticas[destino].possibilidades = ['q'];
    ultimaPromocaoCasa = destino;
    emitirAlertaStatus('✨ Peão promovido a Dama!', 'quantico', 5000);
  }

  // Roque: sincroniza e revela a torre no grupo
  if (resultadoLance && (resultadoLance.flags.includes('k') || resultadoLance.flags.includes('q'))) {
    const linha = pecaQ.cor === 'w' ? '1' : '8';
    const ladoRei = resultadoLance.flags.includes('k');
    const torreOrigem = ladoRei ? `h${linha}` : `a${linha}`;
    const torreDestino = ladoRei ? `f${linha}` : `d${linha}`;
    const torreQ = pecasQuanticas[torreOrigem];
    if (torreQ) {
      if (!torreQ.colapsada) {
        const revelacoesRoque = colapsarNoGrupo(torreOrigem, 'r');
        if (revelacoesRoque.length) {
          const texto = revelacoesRoque.map(r => `${r.casa} = ${nomesPecas[r.tipo]}`).join(', ');
          mensagem += (mensagem ? '\n' : '') + `⛓️ O roque revelou: ${texto}.`;
        }
      }
      pecasQuanticas[torreDestino] = pecasQuanticas[torreOrigem];
      delete pecasQuanticas[torreOrigem];
      if (torreQ.emaranhadaComId) aposentarDoGrupo(torreOrigem, torreQ.emaranhadaComId);
    }
  }

  iniciarRelogioSeNecessario();
  relogioPartida.segundos[pecaQ.cor] += relogioPartida.incremento;
  atualizarRelogios();
  renderizarTabuleiro();
  if (mensagem) mostrarAviso(mensagem, 'quantico', 6600);

  // Registra no log da partida
  registrarEstadoNoLog({
    from: origem,
    to: destino,
    san: resultadoLance ? resultadoLance.san : `${origem}-${destino}`,
    piece: tipoEscolhido,
    captured: pecaCapturada ? (pecaCapturada.colapsada || pecaCapturada.possibilidades.join('/')) : null
  }, mensagem || `Lance: ${resultadoLance ? resultadoLance.san : `${origem}-${destino}`}`);

  if (chess.game_over()) {
    const vencedor = chess.in_checkmate() ? (chess.turn() === 'w' ? 'b' : 'w') : null;
    finalizarPartida(vencedor, chess.in_checkmate() ? 'xeque-mate' : 'empate');
  } else {
    agendarLanceDaIA();
  }
}

function desfazerJogada() {
  if (!historicoDesfazer.length || partidaEncerrada) return;

  function aplicarSnapshot(snapshot) {
    chess.load(snapshot.fen);
    pecasQuanticas = snapshot.pecasQuanticas;
    gruposFlanco = snapshot.gruposFlanco || {};
    if (snapshot.relogio) {
      relogioPartida.segundos.w = snapshot.relogio.w;
      relogioPartida.segundos.b = snapshot.relogio.b;
      atualizarRelogios();
    }
  }

  historicoRefazer.push({
    fen: chess.fen(),
    pecasQuanticas: JSON.parse(JSON.stringify(pecasQuanticas)),
    gruposFlanco: JSON.parse(JSON.stringify(gruposFlanco)),
    relogio: {
      w: relogioPartida.segundos.w,
      b: relogioPartida.segundos.b
    }
  });

  const snapshot = historicoDesfazer.pop();
  aplicarSnapshot(snapshot);
  casaSelecionada = null;

  // Se estiver jogando contra a IA e agora for a vez da IA (ou seja, desfez apenas o lance do humano),
  // desfaz também o lance anterior para voltar ao turno do jogador humano
  if (configuracaoPartida?.oponente === 'ia' && chess.turn() !== corJogador && historicoDesfazer.length > 0) {
    historicoRefazer.push({
      fen: chess.fen(),
      pecasQuanticas: JSON.parse(JSON.stringify(pecasQuanticas)),
      gruposFlanco: JSON.parse(JSON.stringify(gruposFlanco)),
      relogio: {
        w: relogioPartida.segundos.w,
        b: relogioPartida.segundos.b
      }
    });
    const snapshotHumano = historicoDesfazer.pop();
    aplicarSnapshot(snapshotHumano);
  }

  renderizarTabuleiro();
  emitirAlertaStatus('↺ Lance desfeito', 'info', 2500);
}

function refazerJogada() {
  if (!historicoRefazer.length || partidaEncerrada) return;

  function aplicarSnapshot(snapshot) {
    chess.load(snapshot.fen);
    pecasQuanticas = snapshot.pecasQuanticas;
    gruposFlanco = snapshot.gruposFlanco || {};
    if (snapshot.relogio) {
      relogioPartida.segundos.w = snapshot.relogio.w;
      relogioPartida.segundos.b = snapshot.relogio.b;
      atualizarRelogios();
    }
  }

  historicoDesfazer.push({
    fen: chess.fen(),
    pecasQuanticas: JSON.parse(JSON.stringify(pecasQuanticas)),
    gruposFlanco: JSON.parse(JSON.stringify(gruposFlanco)),
    relogio: {
      w: relogioPartida.segundos.w,
      b: relogioPartida.segundos.b
    }
  });

  const snapshot = historicoRefazer.pop();
  aplicarSnapshot(snapshot);
  casaSelecionada = null;

  // Se estiver jogando contra a IA e a vez for da IA, refaz também o lance subsequente dela se disponível
  if (configuracaoPartida?.oponente === 'ia' && chess.turn() !== corJogador && historicoRefazer.length > 0) {
    historicoDesfazer.push({
      fen: chess.fen(),
      pecasQuanticas: JSON.parse(JSON.stringify(pecasQuanticas)),
      gruposFlanco: JSON.parse(JSON.stringify(gruposFlanco)),
      relogio: {
        w: relogioPartida.segundos.w,
        b: relogioPartida.segundos.b
      }
    });
    const snapshotIA = historicoRefazer.pop();
    aplicarSnapshot(snapshotIA);
  }

  renderizarTabuleiro();
  emitirAlertaStatus('↻ Lance refeito', 'info', 2500);
}

function atualizarStatusEHistorial() {
  if (partidaEncerrada) return;

  const textoTurno = document.getElementById('textoTurno');
  const indicadorVez = document.querySelector('.indicador-vez');
  const turno = chess.turn();

  if (textoTurno) {
    if (chess.in_checkmate()) {
      textoTurno.textContent = 'Xeque-Mate!';
    } else if (chess.in_draw()) {
      textoTurno.textContent = 'Empate!';
    } else {
      textoTurno.textContent = turno === 'w' ? 'Vez das Brancas' : 'Vez das Pretas';
    }
  }
  if (indicadorVez) {
    indicadorVez.style.background = turno === 'w' ? '#f4e9d8' : '#33333e';
    indicadorVez.style.borderColor = turno === 'w' ? '#8e8e9c' : '#555562';
  }

  const casaReiTurno = localizarRei(turno);
  const sobAmeacaQuantica = casaReiTurno ? casaEstaAmeacada(casaReiTurno, turno) : false;

  if (chess.in_checkmate()) emitirAlertaStatus('⚠️ XEQUE-MATE!', 'mate', 10000);
  else if (chess.in_check() || sobAmeacaQuantica) emitirAlertaStatus('⚠️ XEQUE!', 'xeque', 4000);

  const historico = document.getElementById('historico');
  historico.innerHTML = '';
  chess.history().forEach((lance, indice) => {
    if (indice % 2 === 0) {
      const linha = document.createElement('div');
      linha.className = 'jogada-linha';
      linha.innerHTML = `<span class="jogada-num">${Math.floor(indice / 2) + 1}.</span><span class="jogada-lance">${lance}</span><span class="jogada-lance">${chess.history()[indice + 1] || ''}</span>`;
      historico.appendChild(linha);
    }
  });
  atualizarDidatica();
  const btnDesfazer = document.getElementById('btnDesfazer');
  const btnRefazer = document.getElementById('btnRefazer');
  if (btnDesfazer) btnDesfazer.disabled = historicoDesfazer.length === 0;
  if (btnRefazer) btnRefazer.disabled = historicoRefazer.length === 0;
}

function formatarTempo(segundos) {
  const total = Math.ceil(Math.max(0, segundos));
  const minutos = Math.floor(total / 60);
  const restantes = total % 60;
  return `${String(minutos).padStart(2, '0')}:${String(restantes).padStart(2, '0')}`;
}

function atualizarRelogios() {
  for (const cor of ['w', 'b']) {
    const id = cor === 'w' ? 'relogioBrancas' : 'relogioPretas';
    document.querySelector(`#${id} strong`).textContent = formatarTempo(relogioPartida.segundos[cor]);
  }
}

function configurarRelogio() {
  const presets = {
    'sem-relogio': [0, 0],
    bullet: [60, 0],
    blitz: [180, 0],
    'blitz-fischer': [180, 2],
    rapida: [600, 5],
    classica: [1800, 10]
  };
  const escolha = configuracaoPartida.relogio;
  const preset = presets[escolha] || [Number(document.getElementById('configMinutos').value) * 60, Number(document.getElementById('configIncremento').value)];
  relogioPartida = {
    ativo: false,
    ultimoInstante: 0,
    intervalId: null,
    segundos: {
      w: preset[0],
      b: preset[0]
    },
    incremento: preset[1]
  };
  document.getElementById('relogios').classList.toggle('oculto', preset[0] === 0);
  atualizarRelogios();
}

function iniciarRelogioSeNecessario() {
  if (relogioPartida.ativo || relogioPartida.segundos.w === 0) return;
  relogioPartida.ativo = true;
  relogioPartida.ultimoInstante = performance.now();
  relogioPartida.intervalId = setInterval(atualizarRelogio, 100);
}

function atualizarRelogio() {
  if (!relogioPartida.ativo || partidaEncerrada) return;
  const agora = performance.now();
  const decorrido = (agora - relogioPartida.ultimoInstante) / 1000;
  relogioPartida.ultimoInstante = agora;
  const cor = chess.turn();
  relogioPartida.segundos[cor] = Math.max(0, relogioPartida.segundos[cor] - decorrido);
  atualizarRelogios();
  if (relogioPartida.segundos[cor] <= 0) {
    finalizarPartida(cor === 'w' ? 'b' : 'w', 'tempo');
  }
}

function finalizarPartida(vencedor, motivo) {
  if (partidaEncerrada) return;
  partidaEncerrada = true;
  relogioPartida.ativo = false;
  if (relogioPartida.intervalId) {
    clearInterval(relogioPartida.intervalId);
    relogioPartida.intervalId = null;
  }
  const nomeVencedor = vencedor === 'w' ? 'Brancas' : (vencedor === 'b' ? 'Pretas' : 'Ninguém');
  let texto = '';
  if (motivo === 'tempo') {
    const derrotado = vencedor === 'w' ? 'Pretas' : 'Brancas';
    texto = `Tempo esgotado! Derrota das ${derrotado}. ${nomeVencedor} vencem!`;
  } else if (motivo === 'xeque-mate') {
    texto = `Xeque-mate! ${nomeVencedor} vencem!`;
  } else if (motivo === 'desistência') {
    texto = `Partida encerrada por desistência. ${nomeVencedor} vencem.`;
  } else {
    texto = `Partida encerrada: ${motivo}.`;
  }
  const textoTurno = document.getElementById('textoTurno');
  if (textoTurno) textoTurno.textContent = texto;
  emitirAlertaStatus(texto, motivo === 'tempo' ? 'tempo' : 'mate', 12000);
  mostrarAviso(texto, motivo === 'tempo' ? 'tempo' : 'sucesso', 10000);

  if (logPartida) {
    logPartida.resultado = {
      vencedor,
      motivo,
      texto,
      finalizadoEm: new Date().toISOString()
    };
  }

  registrarResultado(vencedor, motivo);
  renderizarTabuleiro();
}

function registrarResultado(vencedor, motivo) {
  if (vencedor) placarTorneio[vencedor]++;
  else placarTorneio.empates++;
  const torneio = configuracaoPartida?.formato === 'melhor-de-tres';
  const terminouTorneio = torneio && (placarTorneio.w >= 2 || placarTorneio.b >= 2);
  document.getElementById('placar').textContent = torneio ? `Melhor de três · ${placarTorneio.w} x ${placarTorneio.b}` : '';
  if (terminouTorneio) {
    const campeao = placarTorneio.w > placarTorneio.b ? 'Brancas' : 'Pretas';
    const textoTurno = document.getElementById('textoTurno');
    if (textoTurno) textoTurno.textContent = `${campeao} venceram o torneio`;
    emitirAlertaStatus(`🏆 Campeão: ${campeao}!`, 'mate', 10000);
    mostrarAviso(`🏆 Torneio encerrado: ${campeao} vencem por ${placarTorneio.w} x ${placarTorneio.b}.`, 'sucesso', 8000);
  } else if (torneio) {
    if (motivo !== 'desistência') {
      placarTorneio.partida++;
      mostrarAviso(`Partida ${placarTorneio.partida - 1} encerrada (${motivo}). Iniciando a próxima...`, 'info', 5000);
      iniciarPartida();
    }
  }
}

function escolherLanceFacil() {
  const movimentos = chess.moves({
    verbose: true
  });
  return movimentos.length ? movimentos[Math.floor(Math.random() * movimentos.length)] : null;
}

function escolherLanceComMinimax(profundidade) {
  return new Promise(resolve => {
    const codigo = ` importScripts('https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js'); const valores = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 }; function avaliar(jogo) { return jogo.board().flat().reduce((total, peca) => total + (peca ? (peca.color === 'b' ? valores[peca.type] : -valores[peca.type]) : 0), 0); } function buscar(jogo, profundidade, alpha, beta, maximizando) { if (!profundidade || jogo.game_over()) return avaliar(jogo); let melhor = maximizando ? -Infinity : Infinity; for (const movimento of jogo.moves({ verbose: true })) { jogo.move(movimento); const valor = buscar(jogo, profundidade - 1, alpha, beta, !maximizando); jogo.undo(); melhor = maximizando ? Math.max(melhor, valor) : Math.min(melhor, valor); if (maximizando) alpha = Math.max(alpha, valor); else beta = Math.min(beta, valor); if (beta <= alpha) break; } return melhor; } self.onmessage = evento => { const jogo = new Chess(evento.data.fen); let melhorLance = null; let melhorValor = -Infinity; for (const movimento of jogo.moves({ verbose: true })) { jogo.move(movimento); const valor = buscar(jogo, evento.data.profundidade - 1, -Infinity, Infinity, false); jogo.undo(); if (valor > melhorValor) { melhorValor = valor; melhorLance = movimento; } } self.postMessage(melhorLance); };`;
    const worker = new Worker(URL.createObjectURL(new Blob([codigo], {
      type: 'text/javascript'
    })));
    worker.onmessage = evento => {
      worker.terminate();
      resolve(evento.data);
    };
    worker.postMessage({
      fen: chess.fen(),
      profundidade
    });
  });
}
async function fazerLanceDaIA() {
  if (!configuracaoPartida || configuracaoPartida.oponente !== 'ia' || chess.turn() === corJogador) return;
  const movimento = configuracaoPartida.modo === 'classico' && configuracaoPartida.nivel !== 'facil'
    ? await escolherLanceComMinimax(configuracaoPartida.nivel === 'dificil' ? 3 : 2)
    : escolherLanceFacil();
  if (movimento) executarMovimento(movimento.from, movimento.to, true);
}

function agendarLanceDaIA() {
  if (configuracaoPartida?.oponente === 'ia' && chess.turn() !== corJogador) {
    setTimeout(fazerLanceDaIA, 350);
  }
}

function iniciarPartida() {
  configuracaoPartida = {
    modo: document.getElementById('configModo').value,
    oponente: document.getElementById('configOponente').value,
    nivel: document.getElementById('configNivel').value,
    relogio: document.getElementById('configRelogio').value,
    formato: document.getElementById('configFormato').value,
    inicio: document.getElementById('configInicio').value
  };

  // Determina a cor com que o jogador humano vai jogar:
  corJogador = 'w';
  if (configuracaoPartida.inicio === 'pretas') {
    corJogador = 'b';
  } else if (configuracaoPartida.inicio === 'sorteio') {
    corJogador = Math.random() >= 0.5 ? 'b' : 'w';
  } else {
    corJogador = 'w';
  }

  // No xadrez, as Brancas SEMPRE iniciam o jogo! (chess.turn() === 'w')
  chess.reset();

  historicoDesfazer = [];
  historicoRefazer = [];
  ultimaPromocaoCasa = null;
  ultimoColapsoCasa = null;
  if (timerAlertaStatus) clearTimeout(timerAlertaStatus);
  const statusAlerta = document.getElementById('statusAlerta');
  if (statusAlerta) {
    statusAlerta.textContent = '';
    statusAlerta.className = 'status-alerta';
  }
  casaSelecionada = null;
  partidaEncerrada = false;
  configurarRelogio();
  inicializarPecasQuanticas();
  inicializarLogPartida();
  renderizarTabuleiro();
  document.getElementById('telaInicial').classList.add('oculto');
  document.getElementById('telaBoasVindas').classList.add('oculto');
  document.getElementById('areaJogo').classList.remove('oculto');
  document.getElementById('placar').textContent = configuracaoPartida.formato === 'melhor-de-tres' ? `Melhor de três · ${placarTorneio.w} x ${placarTorneio.b}` : '';

  // Se o jogador estiver jogando com as Pretas contra a IA,
  // a IA joga de Brancas e deve realizar o lance inicial!
  agendarLanceDaIA();
}

document.getElementById('configRelogio').addEventListener('change', evento => {
  const personalizado = evento.target.value === 'personalizada';
  document.getElementById('tempoPersonalizado').classList.toggle('oculto', !personalizado);
  document.getElementById('incrementoPersonalizado').classList.toggle('oculto', !personalizado);
});

document.getElementById('btnComecar').addEventListener('click', () => {
  placarTorneio = {
    w: 0,
    b: 0,
    empates: 0,
    partida: 1
  };
  iniciarPartida();
});

document.getElementById('btnVoltarConfiguracao').addEventListener('click', () => {
  if (!partidaEncerrada) {
    const querDesistir = confirm('Você quer desistir da partida? (A desistência será computada como derrota)');
    if (!querDesistir) return;

    // Computa a derrota imediatamente para o jogador humano
    const vencedor = corJogador === 'w' ? 'b' : 'w';
    finalizarPartida(vencedor, 'desistência');

    // Se estiver em torneio melhor de 3 e o torneio ainda não tiver terminado
    const torneio = configuracaoPartida?.formato === 'melhor-de-tres';
    const terminouTorneio = torneio && (placarTorneio.w >= 2 || placarTorneio.b >= 2);
    if (torneio && !terminouTorneio) {
      const continuar = confirm(`Derrota registrada por desistência!\nPlacar atual do torneio: ${placarTorneio.w} x ${placarTorneio.b}.\n\nDeseja disputar a próxima partida do torneio?\n(Clique em Cancelar para sair e voltar à página de configuração)`);
      if (continuar) {
        placarTorneio.partida++;
        iniciarPartida();
        return;
      }
    }
  }

  relogioPartida.ativo = false;
  if (relogioPartida.intervalId) clearInterval(relogioPartida.intervalId);
  document.getElementById('areaJogo').classList.add('oculto');
  document.getElementById('telaInicial').classList.remove('oculto');
});

/* =========================================================
 * Página de boas-vindas (artigo sobre mecânica quântica)
 * ========================================================= */
const CHAVE_OCULTAR_BOAS_VINDAS = 'xadrezQuantico_ocultarBoasVindas';

function lerPreferenciaBoasVindas() {
  try {
    return localStorage.getItem(CHAVE_OCULTAR_BOAS_VINDAS) === 'true';
  } catch (e) {
    return false;
  }
}

function salvarPreferenciaBoasVindas(ocultar) {
  try {
    localStorage.setItem(CHAVE_OCULTAR_BOAS_VINDAS, String(ocultar));
  } catch (e) {}
}

function mostrarBoasVindas() {
  document.getElementById('telaInicial').classList.add('oculto');
  document.getElementById('areaJogo').classList.add('oculto');
  document.getElementById('telaBoasVindas').classList.remove('oculto');
}

function esconderBoasVindas() {
  document.getElementById('telaBoasVindas').classList.add('oculto');
  document.getElementById('telaInicial').classList.remove('oculto');
}

if (!lerPreferenciaBoasVindas()) {
  mostrarBoasVindas();
}

document.getElementById('btnComecarLeitura').addEventListener('click', () => {
  salvarPreferenciaBoasVindas(document.getElementById('checkboxNaoMostrar').checked);
  esconderBoasVindas();
});

document.getElementById('btnReabrirArtigo').addEventListener('click', mostrarBoasVindas);

/* =========================================================
 * Sistema de Log e Download da Matriz de Configuração Momentânea
 * ========================================================= */
function inicializarLogPartida() {
  logPartida = {
    versao: '2.0.0-fisica-coerente',
    modelo: 'Parecer Técnico de Coerência Física (Permutações / GHZ / Exclusão de Pauli)',
    iniciadoEm: new Date().toISOString(),
    configuracao: { ...configuracaoPartida },
    corJogadorHumano: corJogador,
    historicoLances: []
  };
  registrarEstadoNoLog(null, 'Posição inicial do tabuleiro');
}

function registrarEstadoNoLog(lanceObj = null, descricao = '') {
  if (!logPartida) return;
  const snapshotMatriz = {};
  for (const [casa, info] of Object.entries(pecasQuanticas)) {
    if (!info) continue;
    snapshotMatriz[casa] = {
      cor: info.cor,
      colapsada: info.colapsada,
      possibilidades: [...info.possibilidades],
      emaranhadaComId: info.emaranhadaComId
    };
  }

  const entrada = {
    lanceIndex: logPartida.historicoLances.length,
    timestamp: new Date().toISOString(),
    turno: chess.turn(),
    lance: lanceObj ? (lanceObj.san || `${lanceObj.from}-${lanceObj.to}`) : null,
    detalhes: lanceObj,
    descricao: descricao || (lanceObj ? `Lance executado: ${lanceObj.san || `${lanceObj.from}-${lanceObj.to}`}` : 'Início da partida'),
    fen: chess.fen(),
    relogio: {
      w: relogioPartida.segundos.w,
      b: relogioPartida.segundos.b
    },
    matrizQuanticaMomentanea: snapshotMatriz,
    gruposFlanco: JSON.parse(JSON.stringify(gruposFlanco))
  };

  logPartida.historicoLances.push(entrada);
}

function baixarLogPartida() {
  if (!logPartida) {
    mostrarAviso('Nenhum log disponível para download no momento.', 'info', 3500);
    return;
  }
  const dadosStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logPartida, null, 2));
  const linkDownload = document.createElement('a');
  const dataFormatada = new Date().toISOString().replace(/[:.]/g, '-');
  linkDownload.setAttribute('href', dadosStr);
  linkDownload.setAttribute('download', `xadrez_schrodinger_log_${dataFormatada}.json`);
  document.body.appendChild(linkDownload);
  linkDownload.click();
  linkDownload.remove();
  mostrarAviso('📥 Log da partida baixado com sucesso!', 'sucesso', 4500);
  emitirAlertaStatus('📥 Log baixado!', 'info', 3000);
}

const btnBaixarLog = document.getElementById('btnBaixarLog');
if (btnBaixarLog) {
  btnBaixarLog.addEventListener('click', baixarLogPartida);
}
