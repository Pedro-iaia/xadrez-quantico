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
    p: 'assets/pieces/w_p.svg',
    n: 'assets/pieces/w_n.svg',
    b: 'assets/pieces/w_b.svg',
    r: 'assets/pieces/w_r.svg',
    q: 'assets/pieces/w_q.svg',
    k: 'assets/pieces/w_k.svg'
  },
  b: {
    p: 'assets/pieces/b_p.svg',
    n: 'assets/pieces/b_n.svg',
    b: 'assets/pieces/b_b.svg',
    r: 'assets/pieces/b_r.svg',
    q: 'assets/pieces/b_q.svg',
    k: 'assets/pieces/b_k.svg'
  }
};
let pecasQuanticas = {};
let gruposFlanco = {};
let casaSelecionada = null;
let corJogador = 'w';
let historicoDesfazer = [];
let historicoRefazer = [];
let historicoPartidaLances = [];
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
let redeQuantica = null;
let lanceRemotoEmAndamento = false;
let workerMinimax = null;
let bloqueioTela = null;

// Arrastar e soltar (HTML5 drag) não funciona em telas de toque e ainda dispara o
// menu de "pressionar e segurar" no Android/iOS. Só habilitamos com mouse/trackpad.
const ARRASTAR_HABILITADO = (() => {
  try {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  } catch (e) {
    return true;
  }
})();

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
  const numeroLance = historicoPartidaLances.length;
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
  const historicoUCI = historicoPartidaLances.map(m => (m.from && m.to ? `${m.from}${m.to}` : '')).filter(Boolean);
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
 * Xadrez de Schrödinger — núcleo quântico
 *
 * Rei, Dama e Peões são sempre clássicos (Regra 1 do parecer técnico).
 * Cada flanco (Torre/Cavalo/Bispo de um lado) é um único sistema quântico
 * cujo espaço de permutações depende da variante escolhida:
 *   - "simplificada": identidade + as 3 trocas de um par (4 permutações
 *     por flanco, 10 hipóteses conjuntas válidas de 16).
 *   - "ghz": o grupo simétrico S3 completo (6 permutações por flanco,
 *     incluindo os dois ciclos de 3), 20 hipóteses conjuntas válidas de 36
 *     — a formulação física integral do parecer.
 * Em ambas, os dois flancos de um mesmo jogador são conjuntamente
 * restritos: os bispos de flancos opostos nunca podem colapsar para a
 * mesma cor de casa (o análogo, neste jogo, do Princípio de Exclusão de
 * Pauli). Ver PARECER_TECNICO_COERENCIA_FISICA.md.
 * ========================================================= */

function corDaCasa(casa) {
  const coluna = colunas.indexOf(casa[0]) + 1; // a=1, ..., h=8
  const linha = Number(casa[1]);
  return (coluna + linha) % 2 === 0 ? 'escura' : 'clara';
}

// As permutações possíveis de um flanco de 3 casas. Na variante
// "simplificada", apenas a identidade clássica + as 3 trocas de um par (4
// no total). Na variante "ghz", o grupo simétrico S3 completo — inclui
// também os dois ciclos de 3 — totalizando as 6 permutações possíveis,
// conforme a formulação integral do PARECER_TECNICO_COERENCIA_FISICA.md.
function gerarPermutacoesFlanco(casaEsq, casaMeio, casaDir, tipoEsq, tipoMeio, tipoDir, variante = 'simplificada') {
  const base = [
    { [casaEsq]: tipoEsq, [casaMeio]: tipoMeio, [casaDir]: tipoDir },   // identidade
    { [casaEsq]: tipoMeio, [casaMeio]: tipoEsq, [casaDir]: tipoDir },   // troca esq↔meio
    { [casaEsq]: tipoDir, [casaMeio]: tipoMeio, [casaDir]: tipoEsq },   // troca esq↔dir
    { [casaEsq]: tipoEsq, [casaMeio]: tipoDir, [casaDir]: tipoMeio }    // troca meio↔dir
  ];
  if (variante !== 'ghz') return base;
  return [
    ...base,
    { [casaEsq]: tipoMeio, [casaMeio]: tipoDir, [casaDir]: tipoEsq },   // ciclo (esq→meio→dir→esq)
    { [casaEsq]: tipoDir, [casaMeio]: tipoEsq, [casaDir]: tipoMeio }    // ciclo inverso
  ];
}

// Gera o grupo quântico de um jogador: as hipóteses conjuntas em que os
// bispos dos dois flancos caem em cores diferentes (Regra 4 do parecer).
// Variante "simplificada": 4 permutações por flanco → 10 hipóteses válidas
// (de 16). Variante "ghz": 6 permutações por flanco (S3 completo) → 20
// hipóteses válidas (de 36) — o modelo físico integral.
function gerarGrupoFlancos(cor, variante = 'simplificada') {
  const linha = cor === 'w' ? '1' : '8';
  const casasDama = [`a${linha}`, `b${linha}`, `c${linha}`];
  const casasRei = [`f${linha}`, `g${linha}`, `h${linha}`];
  const permsDama = gerarPermutacoesFlanco(...casasDama, 'r', 'n', 'b', variante);
  const permsRei = gerarPermutacoesFlanco(...casasRei, 'b', 'n', 'r', variante);

  const corDoBispo = (perm, casas) => corDaCasa(casas.find(c => perm[c] === 'b'));

  const hipoteses = [];
  for (const permDama of permsDama) {
    for (const permRei of permsRei) {
      if (corDoBispo(permDama, casasDama) !== corDoBispo(permRei, casasRei)) {
        hipoteses.push({ ...permDama, ...permRei });
      }
    }
  }
  return { cor, casas: [...casasDama, ...casasRei], hipoteses, variante };
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

// Amostragem honesta de Born: pondera a probabilidade de cada tipo candidato pelo
// número de hipóteses globais ainda vivas no grupo que contêm aquele tipo na casa indicada.
function sortearTipoPorPesosHipoteses(casa, tiposCandidatos, grupo) {
  if (!tiposCandidatos || !tiposCandidatos.length) return null;
  if (tiposCandidatos.length === 1) return tiposCandidatos[0];
  if (!grupo || !grupo.hipoteses || !grupo.hipoteses.length) {
    return tiposCandidatos[Math.floor(Math.random() * tiposCandidatos.length)];
  }

  const pesos = {};
  let totalPesos = 0;
  for (const tipo of tiposCandidatos) {
    const contagem = grupo.hipoteses.filter(h => h[casa] === tipo).length;
    pesos[tipo] = contagem;
    totalPesos += contagem;
  }

  if (totalPesos <= 0) {
    return tiposCandidatos[Math.floor(Math.random() * tiposCandidatos.length)];
  }

  let sorteio = Math.random() * totalPesos;
  for (const tipo of tiposCandidatos) {
    sorteio -= pesos[tipo];
    if (sorteio <= 0) return tipo;
  }
  return tiposCandidatos[tiposCandidatos.length - 1];
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
    // Flancos: sistema quântico conjunto (Regras 2-4). A variante
    // ("simplificada" ou "ghz") define quantas permutações cada flanco
    // permite — ver gerarGrupoFlancos.
    const grupo = gerarGrupoFlancos(cor, configuracaoPartida?.variante || 'simplificada');
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
    historicoLances: [...historicoPartidaLances],
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

        const podeMover = !partidaEncerrada && (
          configuracaoPartida?.oponente === 'online'
            ? (redeQuantica && !redeQuantica.espectador && pecaQ.cor === corJogador && pecaQ.cor === chess.turn())
            : (configuracaoPartida?.oponente === 'ia'
                ? (pecaQ.cor === corJogador && pecaQ.cor === chess.turn())
                : (pecaQ.cor === chess.turn()))
        );

        const recipiente = document.createElement('div');
        recipiente.className = 'peca-container';
        recipiente.draggable = podeMover && ARRASTAR_HABILITADO;
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
  if (configuracaoPartida?.oponente === 'online') {
    if (!redeQuantica || redeQuantica.espectador || chess.turn() !== corJogador) return;
  } else if (configuracaoPartida?.oponente === 'ia' && chess.turn() !== corJogador) {
    return;
  }
  const peca = chess.get(casa);
  if (casaSelecionada === null) {
    if (peca && peca.color === chess.turn()) {
      casaSelecionada = casa;
      renderizarTabuleiro();
    }
  } else {
    const origem = casaSelecionada;
    if (origem === casa) {
      casaSelecionada = null;
      renderizarTabuleiro();
      return;
    }
    // Tocar em outra peça da própria cor troca a seleção (em vez de tentar "capturar" a própria peça).
    if (peca && peca.color === chess.turn()) {
      casaSelecionada = casa;
      renderizarTabuleiro();
      return;
    }
    casaSelecionada = null;
    executarMovimento(origem, casa);
  }
}

// O chess.js só conhece UM tipo por casa. Quando uma medição revela o tipo de outras peças do
// flanco (cascata), o chess.js precisa refletir isso; senão ele valida xeques, cravadas e
// xeque-mate com peças "nominais" que já se sabe que não existem.
function sincronizarChessComRevelacoes(revelacoes, casasIgnoradas = []) {
  for (const revelacao of revelacoes) {
    if (casasIgnoradas.includes(revelacao.casa)) continue;
    const pecaQ = pecasQuanticas[revelacao.casa];
    const noChess = chess.get(revelacao.casa);
    if (pecaQ && noChess && noChess.color === pecaQ.cor && noChess.type !== revelacao.tipo) {
      chess.put({ type: revelacao.tipo, color: pecaQ.cor }, revelacao.casa);
    }
  }
}

function distanciaColunas(casaA, casaB) {
  return Math.abs(colunas.indexOf(casaA[0]) - colunas.indexOf(casaB[0]));
}

function executarMovimento(origem, destino, lanceDaIA = false) {
  if (partidaEncerrada) return;
  // Valida o formato das casas antes de usá-las como chave de pecasQuanticas.
  // origem/destino podem vir de uma string arbitrária arrastada (drag-and-drop,
  // via dataTransfer) ou de um lance sugerido pelo Web Worker do minimax —
  // nenhuma das duas fontes é garantidamente uma casa real do tabuleiro.
  if (!/^[a-h][1-8]$/.test(origem) || !/^[a-h][1-8]$/.test(destino)) {
    return renderizarTabuleiro();
  }
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

  const grupoOrigem = gruposFlanco[pecaQ.cor];
  const tipoEscolhido = sortearTipoPorPesosHipoteses(origem, candidatos, grupoOrigem);

  // Snapshot fiel do estado (com a peça em sua casa de origem íntegra)
  salvarEstadoQuantico();
  let mensagem = '';

  // Captura de peça ainda em superposição: a captura também é uma medição
  // (Regra 4) — revela seu tipo real via Regra de Born e propaga pelo grupo antes de sair do tabuleiro.
  const pecaCapturada = pecasQuanticas[destino];
  if (pecaCapturada && pecaCapturada.possibilidades.length > 1) {
    const grupoCapturada = gruposFlanco[pecaCapturada.cor];
    const tipoRevelado = sortearTipoPorPesosHipoteses(destino, pecaCapturada.possibilidades, grupoCapturada);
    const revelacoesCaptura = colapsarNoGrupo(destino, tipoRevelado);
    sincronizarChessComRevelacoes(revelacoesCaptura, [destino]);
    if (revelacoesCaptura.length) {
      mensagem += `🔮 A captura revelou: ${revelacoesCaptura.map(r => `${r.casa} = ${nomesPecas[r.tipo]}`).join(', ')}.`;
    }
  }
  if (pecaCapturada?.emaranhadaComId) aposentarDoGrupo(destino, pecaCapturada.emaranhadaComId);

  // Colapso da peça que está se movendo, com cascata pelo grupo (efeito tipo GHZ)
  if (pecaQ.possibilidades.length > 1) {
    ultimoColapsoCasa = destino;
    const revelacoes = colapsarNoGrupo(origem, tipoEscolhido);
    sincronizarChessComRevelacoes(revelacoes, [origem]);
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
        sincronizarChessComRevelacoes(revelacoesRoque, [torreOrigem]);
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

  // Registra no histórico persistente do jogo (imune a resets por chess.load)
  const lanceSAN = resultadoLance ? resultadoLance.san : `${origem}-${destino}`;
  historicoPartidaLances.push({
    san: lanceSAN,
    cor: pecaQ.cor,
    from: origem,
    to: destino
  });

  // Registra no log da partida
  registrarEstadoNoLog({
    from: origem,
    to: destino,
    san: lanceSAN,
    piece: tipoEscolhido,
    captured: pecaCapturada ? (pecaCapturada.colapsada || pecaCapturada.possibilidades.join('/')) : null
  }, mensagem || `Lance: ${lanceSAN}`);

  // Sincroniza o novo estado quântico com o observador parceiro (se online)
  if (configuracaoPartida?.oponente === 'online' && redeQuantica && !lanceDaIA && !lanceRemotoEmAndamento) {
    redeQuantica.enviarEstado({
      fen: chess.fen(),
      pecasQuanticas: JSON.parse(JSON.stringify(pecasQuanticas)),
      gruposFlanco: JSON.parse(JSON.stringify(gruposFlanco)),
      relogio: {
        w: relogioPartida.segundos.w,
        b: relogioPartida.segundos.b
      },
      vez: chess.turn(),
      ultimoLance: { origem, destino, san: lanceSAN },
      historicoLances: [...historicoPartidaLances]
    }, mensagem || `Lance: ${lanceSAN}`);
  }

  if (chess.game_over()) {
    const vencedor = chess.in_checkmate() ? (chess.turn() === 'w' ? 'b' : 'w') : null;
    finalizarPartida(vencedor, chess.in_checkmate() ? 'xeque-mate' : 'empate');
  } else {
    agendarLanceDaIA();
  }
}

function desfazerJogada() {
  if (!historicoDesfazer.length || partidaEncerrada) return;
  if (configuracaoPartida?.oponente === 'online') {
    mostrarAviso('Não é possível desfazer uma medição já observada remotamente.', 'info', 3000);
    return;
  }

  function aplicarSnapshot(snapshot) {
    chess.load(snapshot.fen);
    pecasQuanticas = snapshot.pecasQuanticas;
    gruposFlanco = snapshot.gruposFlanco || {};
    if (snapshot.historicoLances) {
      historicoPartidaLances = [...snapshot.historicoLances];
    }
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
    historicoLances: [...historicoPartidaLances],
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
  if (configuracaoPartida?.oponente === 'online') {
    mostrarAviso('Operação não permitida no modo online.', 'info', 3000);
    return;
  }

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
  historicoPartidaLances.forEach((lanceObj, indice) => {
    if (indice % 2 === 0) {
      const linha = document.createElement('div');
      linha.className = 'jogada-linha';

      const spanNum = document.createElement('span');
      spanNum.className = 'jogada-num';
      spanNum.textContent = `${Math.floor(indice / 2) + 1}.`;

      const spanBrancas = document.createElement('span');
      spanBrancas.className = 'jogada-lance';
      spanBrancas.textContent = lanceObj.san || lanceObj;

      const proximo = historicoPartidaLances[indice + 1];
      const spanPretas = document.createElement('span');
      spanPretas.className = 'jogada-lance';
      spanPretas.textContent = proximo ? (proximo.san || proximo) : '';

      linha.appendChild(spanNum);
      linha.appendChild(spanBrancas);
      linha.appendChild(spanPretas);
      historico.appendChild(linha);
    }
  });
  historico.scrollTop = historico.scrollHeight;
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
    const el = document.getElementById(id);
    if (!el) continue;
    const forte = el.querySelector('strong');
    if (forte) forte.textContent = formatarTempo(relogioPartida.segundos[cor]);
    el.classList.toggle('relogio-ativo', relogioPartida.ativo && !partidaEncerrada && chess.turn() === cor);
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
    const ehOnline = configuracaoPartida?.oponente === 'online';
    const ehMeuTurno = !ehOnline || !redeQuantica || redeQuantica.espectador || cor === corJogador;
    if (ehMeuTurno) {
      finalizarPartida(cor === 'w' ? 'b' : 'w', 'tempo');
    }
  }
}

function finalizarPartida(vencedor, motivo, veioDaRede = false) {
  if (partidaEncerrada) return;
  partidaEncerrada = true;
  relogioPartida.ativo = false;
  if (relogioPartida.intervalId) {
    clearInterval(relogioPartida.intervalId);
    relogioPartida.intervalId = null;
  }
  if (motivo === 'tempo') {
    const derrotado = vencedor === 'w' ? 'b' : 'w';
    relogioPartida.segundos[derrotado] = 0;
    atualizarRelogios();
  }
  if (configuracaoPartida?.oponente === 'online' && redeQuantica && !veioDaRede && !redeQuantica.espectador) {
    redeQuantica.enviarFimPartida(vencedor, motivo);
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

// O worker é criado uma única vez e reaproveitado: criar um por lance (com importScripts
// do chess.js a cada vez) pesa em celulares e vazava uma Blob URL por jogada.
function obterWorkerMinimax() {
  if (workerMinimax) return workerMinimax;
  const chessScriptUrl = new URL('vendor/chess.min.js', location.href).href;
  const codigo = ` importScripts('${chessScriptUrl}'); const valores = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 }; function avaliar(jogo) { return jogo.board().flat().reduce((total, peca) => total + (peca ? (peca.color === 'b' ? valores[peca.type] : -valores[peca.type]) : 0), 0); } function buscar(jogo, profundidade, alpha, beta, maximizando) { if (!profundidade || jogo.game_over()) return avaliar(jogo); let melhor = maximizando ? -Infinity : Infinity; for (const movimento of jogo.moves({ verbose: true })) { jogo.move(movimento); const valor = buscar(jogo, profundidade - 1, alpha, beta, !maximizando); jogo.undo(); melhor = maximizando ? Math.max(melhor, valor) : Math.min(melhor, valor); if (maximizando) alpha = Math.max(alpha, valor); else beta = Math.min(beta, valor); if (beta <= alpha) break; } return melhor; } self.onmessage = evento => { const jogo = new Chess(evento.data.fen); let melhorLance = null; let melhorValor = -Infinity; for (const movimento of jogo.moves({ verbose: true })) { jogo.move(movimento); const valor = buscar(jogo, evento.data.profundidade - 1, -Infinity, Infinity, false); jogo.undo(); if (valor > melhorValor) { melhorValor = valor; melhorLance = movimento; } } self.postMessage(melhorLance); };`;
  workerMinimax = new Worker(URL.createObjectURL(new Blob([codigo], {
    type: 'text/javascript'
  })));
  return workerMinimax;
}

function escolherLanceComMinimax(profundidade) {
  return new Promise(resolve => {
    let worker;
    try {
      worker = obterWorkerMinimax();
    } catch (e) {
      resolve(null);
      return;
    }
    worker.onmessage = evento => resolve(evento.data);
    worker.onerror = () => {
      try { worker.terminate(); } catch (e) { }
      workerMinimax = null;
      resolve(null);
    };
    worker.postMessage({
      fen: chess.fen(),
      profundidade
    });
  });
}

async function fazerLanceDaIA() {
  if (!configuracaoPartida || configuracaoPartida.oponente !== 'ia' || chess.turn() === corJogador) return;
  const fenAoPensar = chess.fen();
  let movimento = configuracaoPartida.modo === 'classico' && configuracaoPartida.nivel !== 'facil'
    ? await escolherLanceComMinimax(configuracaoPartida.nivel === 'dificil' ? 3 : 2)
    : escolherLanceFacil();
  // Se a partida mudou enquanto a IA "pensava" (voltou à configuração, nova partida, desfazer),
  // descarta o lance: ele pertenceria a uma posição que já não existe.
  if (partidaEncerrada || chess.fen() !== fenAoPensar) return;
  if (!movimento) movimento = escolherLanceFacil();
  if (movimento) executarMovimento(movimento.from, movimento.to, true);
}

function agendarLanceDaIA() {
  if (configuracaoPartida?.oponente === 'ia' && chess.turn() !== corJogador) {
    setTimeout(fazerLanceDaIA, 350);
  }
}

/* =========================================================
 * Controlador de Telas (Navegação Exclusiva)
 * ========================================================= */
function navegarParaTela(idTela) {
  const telas = ['telaBoasVindas', 'telaInicial', 'telaPareamento', 'areaJogo'];
  telas.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === idTela) {
      el.classList.remove('oculto');
    } else {
      el.classList.add('oculto');
    }
  });
}

function iniciarPartida() {
  configuracaoPartida = {
    modo: document.getElementById('configModo').value,
    variante: document.getElementById('configVariante')?.value || 'simplificada',
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
  historicoPartidaLances = [];
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
  document.getElementById('areaJogo').classList.remove('jogo-online');
  navegarParaTela('areaJogo');
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

document.getElementById('configModo').addEventListener('change', evento => {
  const modoQuantico = evento.target.value === 'quantico';
  const campoVariante = document.getElementById('campoVariante');
  if (campoVariante) campoVariante.classList.toggle('oculto', !modoQuantico);
  const notaNivelIA = document.getElementById('notaNivelIA');
  if (notaNivelIA) notaNivelIA.classList.toggle('oculto', !modoQuantico);
});

document.getElementById('configOponente').addEventListener('change', evento => {
  const ehOnline = evento.target.value === 'online';
  const ehIa = evento.target.value === 'ia';
  const campoNivelIA = document.getElementById('campoNivelIA');
  if (campoNivelIA) campoNivelIA.classList.toggle('oculto', !ehIa);
  const campoInicio = document.getElementById('campoInicio');
  if (campoInicio) campoInicio.classList.toggle('oculto', ehOnline);
});

document.getElementById('btnComecar').addEventListener('click', () => {
  placarTorneio = {
    w: 0,
    b: 0,
    empates: 0,
    partida: 1
  };
  const oponente = document.getElementById('configOponente').value;
  if (oponente === 'online') {
    abrirTelaPareamento();
  } else {
    iniciarPartida();
  }
});

document.getElementById('btnVoltarConfiguracao').addEventListener('click', () => {
  if (!partidaEncerrada) {
    const querDesistir = confirm('Você quer desistir da partida? (A desistência será computada como derrota)');
    if (!querDesistir) return;

    // Computa a derrota imediatamente para o jogador humano
    const vencedor = corJogador === 'w' ? 'b' : 'w';
    finalizarPartida(vencedor, 'desistência');

    if (configuracaoPartida?.oponente === 'online' && redeQuantica) {
      redeQuantica.enviarFimPartida(vencedor, 'desistência');
    }

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

  if (redeQuantica) {
    redeQuantica.desconectar();
    redeQuantica = null;
  }

  const badgeOnline = document.getElementById('badgeStatusOnline');
  if (badgeOnline) badgeOnline.classList.add('oculto');
  const btnComp = document.getElementById('btnCompartilharTelespectador');
  if (btnComp) btnComp.classList.add('oculto');

  relogioPartida.ativo = false;
  if (relogioPartida.intervalId) clearInterval(relogioPartida.intervalId);
  liberarTela();
  navegarParaTela('telaInicial');
});

/* =========================================================
 * Funções de Sincronização Quântica Online (Ação Fantasmagórica)
 * ========================================================= */
function abrirTelaPareamento() {
  const msgAlerta = document.getElementById('msgAlertaConexao');
  if (msgAlerta) {
    msgAlerta.textContent = '';
    msgAlerta.className = 'status-inline-alerta oculto';
  }
  navegarParaTela('telaPareamento');
}

function fecharTelaPareamento() {
  if (redeQuantica) {
    redeQuantica.desconectar();
    redeQuantica = null;
  }
  document.getElementById('blocoConviteGerado')?.classList.add('oculto');
  const msgAlerta = document.getElementById('msgAlertaConexao');
  if (msgAlerta) {
    msgAlerta.textContent = '';
    msgAlerta.className = 'status-inline-alerta oculto';
  }
  navegarParaTela('telaInicial');
}

function iniciarPartidaOnline(dadosSessao) {
  configuracaoPartida = {
    modo: document.getElementById('configModo').value,
    variante: document.getElementById('configVariante')?.value || 'simplificada',
    oponente: 'online',
    nivel: 'facil',
    relogio: document.getElementById('configRelogio').value,
    formato: 'partida',
    inicio: dadosSessao.cor === 'w' ? 'brancas' : 'pretas'
  };

  if (dadosSessao.config) {
    configuracaoPartida.modo = dadosSessao.config.modo || configuracaoPartida.modo;
    configuracaoPartida.variante = dadosSessao.config.variante || configuracaoPartida.variante;
    configuracaoPartida.relogio = dadosSessao.config.relogio || configuracaoPartida.relogio;
  }

  corJogador = dadosSessao.cor || 'w';

  chess.reset();
  historicoDesfazer = [];
  historicoRefazer = [];
  historicoPartidaLances = [];
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

  const badge = document.getElementById('badgeStatusOnline');
  if (badge) {
    badge.classList.remove('oculto');
    if (dadosSessao.espectador) {
      badge.className = 'badge-online espectador';
      badge.innerHTML = `
        <div class="badge-linha badge-linha-chave">Chave: <strong>${dadosSessao.salaId}</strong></div>
        <div class="badge-linha badge-linha-papel">👁️ Modo Observador Passivo (Telespectador)</div>
      `;
      emitirAlertaStatus('👁️ Modo Telespectador: observando em tempo real', 'info', 6000);
      mostrarAviso('Você está conectado como Observador Passivo (Telespectador). Acompanhe os colapsos da partida sem interferir no tabuleiro.', 'info', 7000);
    } else {
      badge.className = 'badge-online';
      const corTexto = corJogador === 'w' ? 'Brancas' : 'Pretas';
      badge.innerHTML = `
        <div class="badge-linha badge-linha-chave">⚛️ Par Emaranhado: <strong>${dadosSessao.salaId}</strong></div>
        <div class="badge-linha badge-linha-papel">Você joga de <strong>${corTexto}</strong></div>
      `;
      emitirAlertaStatus(`⚛️ Par Emaranhado! Você é ${corTexto}!`, 'quantico', 6000);
      mostrarAviso(`Par Quântico estabelecido! Você joga de ${corTexto}.`, 'sucesso', 6000);
    }
  }

  const btnComp = document.getElementById('btnCompartilharTelespectador');
  if (btnComp) btnComp.classList.remove('oculto');

  // Desabilita botões desfazer/refazer para preservar a linha do tempo física compartilhada
  const btnDesfazer = document.getElementById('btnDesfazer');
  const btnRefazer = document.getElementById('btnRefazer');
  if (btnDesfazer) btnDesfazer.disabled = true;
  if (btnRefazer) btnRefazer.disabled = true;

  document.getElementById('areaJogo').classList.add('jogo-online');
  manterTelaAcesa();
  navegarParaTela('areaJogo');
  document.getElementById('placar').textContent = '';
}

function aplicarEstadoRemoto(estadoRemoto) {
  if (!estadoRemoto || !estadoRemoto.fen) return;
  lanceRemotoEmAndamento = true;

  chess.load(estadoRemoto.fen);
  pecasQuanticas = estadoRemoto.pecasQuanticas;
  gruposFlanco = estadoRemoto.gruposFlanco || {};

  if (estadoRemoto.historicoLances && Array.isArray(estadoRemoto.historicoLances)) {
    historicoPartidaLances = [...estadoRemoto.historicoLances];
  } else if (estadoRemoto.ultimoLance) {
    const ultimo = estadoRemoto.ultimoLance;
    const jaExiste = historicoPartidaLances.some(l => l.from === ultimo.origem && l.to === ultimo.destino && l.san === ultimo.san);
    if (!jaExiste) {
      historicoPartidaLances.push({
        san: ultimo.san,
        from: ultimo.origem,
        to: ultimo.destino
      });
    }
  }

  if (estadoRemoto.relogio) {
    relogioPartida.segundos.w = estadoRemoto.relogio.w;
    relogioPartida.segundos.b = estadoRemoto.relogio.b;

    // Compensação dinâmica de atraso de rede
    const bonus = estadoRemoto.bonusLatenciaCompensado || 0;
    const corAdversario = corJogador === 'w' ? 'b' : 'w';
    if (bonus > 0 && relogioPartida.segundos[corAdversario] !== undefined) {
      relogioPartida.segundos[corAdversario] += bonus;
    }
    atualizarRelogios();
  }

  iniciarRelogioSeNecessario();
  casaSelecionada = null;
  renderizarTabuleiro();

  if (estadoRemoto.mensagem) {
    mostrarAviso(estadoRemoto.mensagem, 'quantico', 6000);
    emitirAlertaStatus('⚛️ Ação fantasmagórica recebida!', 'quantico', 3500);
  }

  if (chess.game_over()) {
    const vencedor = chess.in_checkmate() ? (chess.turn() === 'w' ? 'b' : 'w') : null;
    finalizarPartida(vencedor, chess.in_checkmate() ? 'xeque-mate' : 'empate', true);
  }

  lanceRemotoEmAndamento = false;
}

function criarCallbacksRede() {
  return {
    onParEmaranhado: (dados) => iniciarPartidaOnline(dados),
    onEstadoRecebido: (estado) => aplicarEstadoRemoto(estado),
    onFimPartida: (resultado) => finalizarPartida(resultado.vencedor, resultado.motivo, true),
    onErro: (erro) => mostrarAviso(erro?.message || 'Falha na rede quântica.', 'erro', 7000),
    onConexaoPerdida: () => {
      emitirAlertaStatus('📡 Conexão com o par perdida — reconectando…', 'tempo', 8000);
      mostrarAviso('Conexão com o par perdida. Tentando restabelecer o emaranhamento…', 'info', 6000);
    },
    onConexaoRestabelecida: () => {
      emitirAlertaStatus('⚛️ Emaranhamento restabelecido!', 'quantico', 4000);
      mostrarAviso('Conexão restabelecida. A partida continua de onde parou.', 'sucesso', 4500);
    }
  };
}

// Atalho direto no menu de configurações
document.getElementById('btnAtalhoOnline')?.addEventListener('click', () => {
  abrirTelaPareamento();
});

// Configuração dos botões de pareamento
document.getElementById('btnGerarPar')?.addEventListener('click', async () => {
  try {
    redeQuantica = new QuantumNet();
    redeQuantica.configurarCallbacks(criarCallbacksRede());

    const configPartida = {
      modo: document.getElementById('configModo').value,
      variante: document.getElementById('configVariante')?.value || 'ghz',
      relogio: document.getElementById('configRelogio').value
    };

    const resultado = await redeQuantica.gerarParEmaranhado(configPartida);
    document.getElementById('codigoParGerado').textContent = resultado.salaId;
    document.getElementById('blocoConviteGerado').classList.remove('oculto');
    mostrarAviso(`Chave ${resultado.salaId} gerada! Compartilhe o código ou o link completo.`, 'sucesso', 5500);
  } catch (err) {
    mostrarAviso(`Falha ao gerar par quântico: ${err.message}`, 'erro', 5000);
  }
});

document.getElementById('btnCopiarCodigoCurto')?.addEventListener('click', async () => {
  const codigo = document.getElementById('codigoParGerado')?.textContent?.trim();
  if (!codigo || codigo === 'xq????' || codigo === 'xq-????') return;
  try {
    await navigator.clipboard.writeText(codigo);
    mostrarAviso(`🔑 Chave curta "${codigo}" copiada para a área de transferência!`, 'sucesso', 4000);
  } catch (e) {
    prompt('Copie a chave curta:', codigo);
  }
});

document.getElementById('btnCopiarLinkJogador')?.addEventListener('click', async () => {
  if (!redeQuantica) return;
  const link = redeQuantica.obterLinkConvite(false);
  try {
    await navigator.clipboard.writeText(link);
    mostrarAviso('📋 Link completo do jogador copiado para a área de transferência!', 'sucesso', 4000);
  } catch (e) {
    prompt('Copie o link de convite do jogador:', link);
  }
});

document.getElementById('btnCopiarLinkEspectador')?.addEventListener('click', async () => {
  if (!redeQuantica) return;
  const link = redeQuantica.obterLinkConvite(true);
  try {
    await navigator.clipboard.writeText(link);
    mostrarAviso('👁️ Link de telespectador copiado para a área de transferência!', 'sucesso', 4000);
  } catch (e) {
    prompt('Copie o link de telespectador (observador passivo):', link);
  }
});

document.getElementById('btnCompartilharTelespectador')?.addEventListener('click', async () => {
  if (!redeQuantica) return;
  const link = redeQuantica.obterLinkConvite(true);
  try {
    await navigator.clipboard.writeText(link);
    mostrarAviso('👁️ Link de telespectador copiado!', 'sucesso', 3500);
  } catch (e) {
    prompt('Copie o link de telespectador:', link);
  }
});

function extrairCodigoSala(entrada) {
  if (!entrada) return '';
  let limpo = entrada.trim().toLowerCase();
  if (limpo.includes('par=') || limpo.includes('?')) {
    try {
      const url = new URL(limpo.startsWith('http') ? limpo : `https://dummy.com/${limpo.startsWith('?') ? limpo : '?' + limpo}`);
      const par = url.searchParams.get('par');
      if (par) limpo = par.trim().toLowerCase();
    } catch (e) { }
  }
  return limpo.replace(/[^a-z0-9]/g, '');
}

document.getElementById('btnConectarPar')?.addEventListener('click', async () => {
  const inputEl = document.getElementById('inputChavePar');
  const rawInput = inputEl ? inputEl.value.trim() : '';
  const btn = document.getElementById('btnConectarPar');
  const msgAlerta = document.getElementById('msgAlertaConexao');

  if (msgAlerta) {
    msgAlerta.textContent = '';
    msgAlerta.className = 'status-inline-alerta oculto';
  }

  if (!rawInput) {
    const msg = 'Por favor, informe a chave quântica (ex: xqkfmt) ou o link de convite.';
    if (msgAlerta) {
      msgAlerta.textContent = `⚠️ ${msg}`;
      msgAlerta.className = 'status-inline-alerta';
    }
    mostrarAviso(msg, 'erro', 4000);
    inputEl?.focus();
    return;
  }

  const codigo = extrairCodigoSala(rawInput);
  if (!codigo) {
    const msg = 'Formato de chave quântica não reconhecido.';
    if (msgAlerta) {
      msgAlerta.textContent = `⚠️ ${msg}`;
      msgAlerta.className = 'status-inline-alerta';
    }
    mostrarAviso(msg, 'erro', 4000);
    return;
  }

  const comoEspectador = document.getElementById('checkEntrarComoEspectador')?.checked || false;
  const textoOriginalBtn = btn ? btn.textContent : 'Conectar';
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Conectando...';
  }

  try {
    redeQuantica = new QuantumNet();
    redeQuantica.configurarCallbacks(criarCallbacksRede());

    emitirAlertaStatus('⚛️ Estabelecendo entrelaçamento com o par...', 'quantico', 5000);
    mostrarAviso('⚛️ Buscando par quântico na rede...', 'info', 4000);
    await redeQuantica.conectarPar(codigo, comoEspectador);
    if (redeQuantica && !redeQuantica.parEmaranhado) {
      mostrarAviso('Conectado à sala. Aguardando o início da partida…', 'info', 6000);
    }
  } catch (err) {
    const erroTexto = err.message || 'Erro ao conectar ao par quântico';
    if (msgAlerta) {
      msgAlerta.textContent = `⚠️ ${erroTexto}`;
      msgAlerta.className = 'status-inline-alerta';
    }
    mostrarAviso(`Erro ao conectar ao par quântico: ${erroTexto}`, 'erro', 6000);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = textoOriginalBtn;
    }
  }
});

document.getElementById('btnVoltarTelaInicial')?.addEventListener('click', fecharTelaPareamento);

// Detecção automática de convite via parâmetro na URL
function verificarParametrosConviteUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const chavePar = params.get('par');
    if (chavePar) {
      const comoEspectador = params.get('espectador') === '1' || params.get('espectador') === 'true';
      const selectOponente = document.getElementById('configOponente');
      if (selectOponente) selectOponente.value = 'online';
      const inputChave = document.getElementById('inputChavePar');
      if (inputChave) inputChave.value = chavePar;
      const checkEspectador = document.getElementById('checkEntrarComoEspectador');
      if (checkEspectador) checkEspectador.checked = comoEspectador;
      abrirTelaPareamento();
      mostrarAviso(`Convite quântico detectado para a chave: ${chavePar}`, 'quantico', 5000);
    }
  } catch (e) {
    console.error('Erro ao verificar parâmetros de convite:', e);
  }
}

verificarParametrosConviteUrl();

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
  } catch (e) { }
}

function mostrarBoasVindas() {
  navegarParaTela('telaBoasVindas');
}

function esconderBoasVindas() {
  navegarParaTela('telaInicial');
}

function sincronizarCamposConfiguracaoInicial() {
  const oponente = document.getElementById('configOponente')?.value;
  const ehOnline = oponente === 'online';
  const ehIa = oponente === 'ia';
  const campoNivelIA = document.getElementById('campoNivelIA');
  if (campoNivelIA) campoNivelIA.classList.toggle('oculto', !ehIa);
  const campoInicio = document.getElementById('campoInicio');
  if (campoInicio) campoInicio.classList.toggle('oculto', ehOnline);

  const modo = document.getElementById('configModo')?.value;
  const modoQuantico = modo === 'quantico';
  const campoVariante = document.getElementById('campoVariante');
  if (campoVariante) campoVariante.classList.toggle('oculto', !modoQuantico);
  const notaNivelIA = document.getElementById('notaNivelIA');
  if (notaNivelIA) notaNivelIA.classList.toggle('oculto', !modoQuantico);
}

sincronizarCamposConfiguracaoInicial();

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
    versao: '2.1.0-fisica-coerente',
    modelo: configuracaoPartida?.variante === 'ghz'
      ? 'Parecer Técnico de Coerência Física — Variante GHZ (S3 completo, 20 hipóteses)'
      : 'Parecer Técnico de Coerência Física — Variante Simplificada (10 hipóteses)',
    variante: configuracaoPartida?.modo === 'quantico' ? (configuracaoPartida?.variante || 'simplificada') : null,
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
  // Blob URL em vez de data: URI — logs longos estouram o limite de data: URIs em vários celulares.
  const blob = new Blob([JSON.stringify(logPartida, null, 2)], { type: 'application/json' });
  const urlBlob = URL.createObjectURL(blob);
  const linkDownload = document.createElement('a');
  const dataFormatada = new Date().toISOString().replace(/[:.]/g, '-');
  linkDownload.setAttribute('href', urlBlob);
  linkDownload.setAttribute('download', `xadrez_schrodinger_log_${dataFormatada}.json`);
  document.body.appendChild(linkDownload);
  linkDownload.click();
  linkDownload.remove();
  setTimeout(() => URL.revokeObjectURL(urlBlob), 4000);
  mostrarAviso('📥 Log da partida baixado com sucesso!', 'sucesso', 4500);
  emitirAlertaStatus('📥 Log baixado!', 'info', 3000);
}

const btnBaixarLog = document.getElementById('btnBaixarLog');
if (btnBaixarLog) {
  btnBaixarLog.addEventListener('click', baixarLogPartida);
}

// Ao reativar a aba em smartphones (após alternar abas), reseta o instante do relógio
// para impedir que o congelamento em segundo plano consuma tempo repentinamente
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  if (relogioPartida.ativo) {
    relogioPartida.ultimoInstante = performance.now();
  }
  // Ao voltar (ex.: depois de compartilhar o convite no WhatsApp), o navegador pode ter
  // derrubado a conexão P2P e liberado o bloqueio de tela: restabelece os dois.
  if (configuracaoPartida?.oponente === 'online' && redeQuantica) {
    redeQuantica.aoVoltarAoPrimeiroPlano();
    if (!partidaEncerrada) manterTelaAcesa();
  }
});

// Mantém a tela acesa durante a partida online: telas que apagam suspendem a aba e derrubam a conexão.
async function manterTelaAcesa() {
  try {
    if (!('wakeLock' in navigator) || bloqueioTela) return;
    bloqueioTela = await navigator.wakeLock.request('screen');
    bloqueioTela.addEventListener('release', () => { bloqueioTela = null; });
  } catch (e) {
    bloqueioTela = null;
  }
}

function liberarTela() {
  try { if (bloqueioTela) bloqueioTela.release(); } catch (e) { }
  bloqueioTela = null;
}

// Compartilhamento nativo (WhatsApp, Telegram, SMS…) quando o aparelho oferece.
const btnCompartilharNativo = document.getElementById('btnCompartilharNativo');
if (btnCompartilharNativo && navigator.share) {
  btnCompartilharNativo.classList.remove('oculto');
  btnCompartilharNativo.addEventListener('click', async () => {
    if (!redeQuantica) return;
    try {
      await navigator.share({
        title: 'Xadrez de Schrödinger',
        text: `Vamos entrelaçar uma partida de Xadrez de Schrödinger! Chave: ${redeQuantica.salaId}`,
        url: redeQuantica.obterLinkConvite(false)
      });
    } catch (e) {
      if (e && e.name !== 'AbortError') mostrarAviso('Não foi possível abrir o compartilhamento.', 'erro', 4000);
    }
  });
}

