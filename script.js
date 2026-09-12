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
let casaSelecionada = null;
let historicoEstadosQuanticos = [];
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

/* =========================================================
 * Avisos discretos (substituem os alert() nativos)
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
 * Livro de aberturas clássicas (por casas de origem/destino,
 * robusto ao modo quântico, já que independe do tipo de peça)
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

// Traduz um par de casas (ex.: "e2","e4") em texto amigável para o autodidata.
function descreverLance(origem, destino) {
  return `${origem}-${destino}`;
}

// Encontra a abertura correspondente ao histórico jogado. Só aponta um nome
// quando a linha é inequívoca: ou o histórico fecha exatamente aquele livro
// de aberturas, ou é a única linha mais curta compatível com o que já foi
// jogado (evitando "adivinhar" a abertura antes da resposta do adversário).
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

// Dicas gerais por fase da partida, usadas quando a linha sai do livro de aberturas.
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

function inicializarPecasQuanticas() {
  pecasQuanticas = {};
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
  const grupos = [
    [
      ['b1', 'c1'],
      ['n', 'b']
    ],
    [
      ['f1', 'g1'],
      ['n', 'b']
    ],
    [
      ['a1', 'd1'],
      ['r', 'q']
    ],
    [
      ['h1'],
      ['r', 'q']
    ],
    [
      ['e1'],
      ['k']
    ],
    [
      ['b8', 'c8'],
      ['n', 'b']
    ],
    [
      ['f8', 'g8'],
      ['n', 'b']
    ],
    [
      ['a8', 'd8'],
      ['r', 'q']
    ],
    [
      ['h8'],
      ['r', 'q']
    ],
    [
      ['e8'],
      ['k']
    ]
  ];
  let grupoId = 1;
  for (const [casas, possibilidades] of grupos) {
    for (const casa of casas) {
      const cor = Number(casa[1]) <= 2 ? 'w' : 'b';
      pecasQuanticas[casa] = {
        possibilidades: [...possibilidades],
        cor,
        colapsada: possibilidades.length === 1 ? possibilidades[0] : null,
        emaranhadaComId: casas.length > 1 ? grupoId : null
      };
    }
    if (casas.length > 1) grupoId++;
  }
  for (let coluna of colunas) {
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
}

function salvarEstadoQuantico() {
  historicoEstadosQuanticos.push(JSON.parse(JSON.stringify(pecasQuanticas)));
}

function criarImagem(cor, tipo) {
  const imagem = document.createElement('img');
  imagem.src = svgPecas[cor][tipo];
  imagem.className = 'peca-img';
  imagem.alt = nomesPecas[tipo];
  return imagem;
}

function renderizarTabuleiro() {
  const tabuleiro = document.getElementById('tabuleiro');
  tabuleiro.innerHTML = '';
  for (let linha = 8; linha >= 1; linha--) {
    for (let coluna = 0; coluna < 8; coluna++) {
      const casa = `${colunas[coluna]}${linha}`;
      const elemento = document.createElement('div');
      elemento.className = `casa ${(linha + coluna) % 2 !== 0 ? 'clara' : 'escura'}`;
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
        executarMovimento(evento.dataTransfer.getData('text/plain'), casa);
      });
      if (linha === 1) {
        const rotuloColuna = document.createElement('span');
        rotuloColuna.className = 'rotulo rotulo-coluna';
        rotuloColuna.textContent = colunas[coluna];
        elemento.appendChild(rotuloColuna);
      }
      if (coluna === 0) {
        const rotuloLinha = document.createElement('span');
        rotuloLinha.className = 'rotulo rotulo-linha';
        rotuloLinha.textContent = String(linha);
        elemento.appendChild(rotuloLinha);
      }
      const pecaQ = pecasQuanticas[casa];
      if (pecaQ && chess.get(casa)) {
        const recipiente = document.createElement('div');
        recipiente.className = 'peca-container';
        recipiente.draggable = pecaQ.cor === chess.turn();
        if (pecaQ.emaranhadaComId && !pecaQ.colapsada) recipiente.classList.add('emaranhada');
        recipiente.addEventListener('dragstart', evento => {
          casaSelecionada = casa;
          evento.dataTransfer.setData('text/plain', casa);
        });
        recipiente.addEventListener('dragend', () => {
          casaSelecionada = null;
          renderizarTabuleiro();
        });
        if (pecaQ.colapsada) recipiente.appendChild(criarImagem(pecaQ.cor, pecaQ.colapsada));
        else {
          const superposicao = document.createElement('div');
          superposicao.className = 'quantica-split';
          pecaQ.possibilidades.forEach(tipo => superposicao.appendChild(criarImagem(pecaQ.cor, tipo)));
          recipiente.appendChild(superposicao);
        }
        elemento.appendChild(recipiente);
      }
      tabuleiro.appendChild(elemento);
    }
  }
  atualizarStatusEHistorial();
}

function clicarCasa(casa) {
  if (configuracaoPartida?.oponente === 'ia' && chess.turn() === 'b') return;
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

function executarMovimento(origem, destino) {
  const pecaQ = pecasQuanticas[origem];
  if (!pecaQ) return renderizarTabuleiro();
  let tipoEscolhido = null;
  for (const possibilidade of pecaQ.possibilidades) {
    chess.put({
      type: possibilidade,
      color: pecaQ.cor
    }, origem);
    if (chess.move({
        from: origem,
        to: destino,
        promotion: 'q'
      })) {
      tipoEscolhido = possibilidade;
      chess.undo();
      break;
    }
    chess.remove(origem);
  }
  if (!tipoEscolhido) {
    chess.put({
      type: pecaQ.colapsada || pecaQ.possibilidades[0],
      color: pecaQ.cor
    }, origem);
    mostrarAviso('Movimento inválido quânticamente.', 'erro', 3800);
    return renderizarTabuleiro();
  }
  salvarEstadoQuantico();
  let mensagem = '';
  if (!pecaQ.colapsada && pecaQ.possibilidades.length > 1) {
    pecaQ.colapsada = tipoEscolhido;
    pecaQ.possibilidades = [tipoEscolhido];
    mensagem = `🔮 Colapso! A peça em ${destino} revelou-se: ${nomesPecas[tipoEscolhido]}.`;
    if (pecaQ.emaranhadaComId) {
      for (const casa of Object.keys(pecasQuanticas)) {
        const par = pecasQuanticas[casa];
        if (casa !== origem && par.emaranhadaComId === pecaQ.emaranhadaComId && !par.colapsada) {
          const oposta = par.possibilidades.find(tipo => tipo !== tipoEscolhido);
          if (oposta) {
            par.colapsada = oposta;
            par.possibilidades = [oposta];
            mensagem += `\n⛓️ O par em ${casa} colapsou para: ${nomesPecas[oposta]}!`;
          }
        }
      }
    }
  }
  chess.put({
    type: tipoEscolhido,
    color: pecaQ.cor
  }, origem);
  const resultadoLance = chess.move({
    from: origem,
    to: destino,
    promotion: 'q'
  });
  pecasQuanticas[destino] = pecaQ;
  delete pecasQuanticas[origem];

  // Roque: o chess.js move a torre internamente também (sem passar por
  // executarMovimento), então precisamos sincronizar manualmente o registro
  // quântico dela — senão ela "desaparece" (fica só no chess.js, não no
  // nosso dicionário de peças). Também tratamos o roque como um lance que
  // revela a torre: classicamente só uma torre de verdade pode rocar.
  if (resultadoLance && (resultadoLance.flags.includes('k') || resultadoLance.flags.includes('q'))) {
    const linha = pecaQ.cor === 'w' ? '1' : '8';
    const ladoRei = resultadoLance.flags.includes('k');
    const torreOrigem = ladoRei ? `h${linha}` : `a${linha}`;
    const torreDestino = ladoRei ? `f${linha}` : `d${linha}`;
    const torreQ = pecasQuanticas[torreOrigem];
    if (torreQ) {
      if (!torreQ.colapsada) {
        torreQ.colapsada = 'r';
        torreQ.possibilidades = ['r'];
        if (torreQ.emaranhadaComId) {
          for (const casa of Object.keys(pecasQuanticas)) {
            const par = pecasQuanticas[casa];
            if (casa !== torreOrigem && par.emaranhadaComId === torreQ.emaranhadaComId && !par.colapsada) {
              const oposta = par.possibilidades.find(tipo => tipo !== 'r');
              if (oposta) {
                par.colapsada = oposta;
                par.possibilidades = [oposta];
                mostrarAviso(`⛓️ O roque revelou a torre em ${torreDestino}; o par em ${casa} colapsou para: ${nomesPecas[oposta]}!`, 'quantico', 6200);
              }
            }
          }
        }
      }
      pecasQuanticas[torreDestino] = torreQ;
      delete pecasQuanticas[torreOrigem];
    }
  }
  iniciarRelogioSeNecessario();
  relogioPartida.segundos[pecaQ.cor] += relogioPartida.incremento;
  atualizarRelogios();
  renderizarTabuleiro();
  if (mensagem) mostrarAviso(mensagem, 'quantico', 6200);
  if (chess.game_over()) {
    const vencedor = chess.in_checkmate() ? (chess.turn() === 'w' ? 'b' : 'w') : null;
    registrarResultado(vencedor, chess.in_checkmate() ? 'xeque-mate' : 'empate');
  } else agendarLanceDaIA();
}

function desfazerJogada() {
  if (!historicoEstadosQuanticos.length) return;
  chess.undo();
  pecasQuanticas = historicoEstadosQuanticos.pop();
  renderizarTabuleiro();
}

function atualizarStatusEHistorial() {
  const status = document.getElementById('status');
  status.innerText = chess.in_checkmate() ? 'Fim de Jogo: Xeque-Mate!' : chess.in_draw() ? 'Fim de Jogo: Empate!' : `Turno das ${chess.turn() === 'w' ? 'Brancas' : 'Pretas'}`;
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
  document.getElementById('btnDesfazer').disabled = historicoEstadosQuanticos.length === 0;
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
  if (!relogioPartida.ativo) return;
  const agora = performance.now();
  const decorrido = (agora - relogioPartida.ultimoInstante) / 1000;
  relogioPartida.ultimoInstante = agora;
  const cor = chess.turn();
  relogioPartida.segundos[cor] -= decorrido;
  atualizarRelogios();
  if (relogioPartida.segundos[cor] <= 0) finalizarPartida(cor === 'w' ? 'b' : 'w', 'tempo');
}

function finalizarPartida(vencedor, motivo) {
  if (partidaEncerrada) return;
  if (!relogioPartida.ativo && motivo === 'tempo') return;
  relogioPartida.ativo = false;
  if (relogioPartida.intervalId) clearInterval(relogioPartida.intervalId);
  const texto = motivo === 'tempo' ? `Tempo esgotado. ${vencedor === 'w' ? 'Brancas' : 'Pretas'} vencem.` : `Partida encerrada: ${motivo}.`;
  document.getElementById('status').textContent = texto;
  registrarResultado(vencedor, motivo);
}

function registrarResultado(vencedor, motivo) {
  if (partidaEncerrada && motivo !== 'tempo') return;
  partidaEncerrada = true;
  relogioPartida.ativo = false;
  if (relogioPartida.intervalId) clearInterval(relogioPartida.intervalId);
  if (vencedor) placarTorneio[vencedor]++;
  else placarTorneio.empates++;
  const torneio = configuracaoPartida?.formato === 'melhor-de-tres';
  const terminouTorneio = torneio && (placarTorneio.w >= 2 || placarTorneio.b >= 2);
  document.getElementById('placar').textContent = torneio ? `Melhor de três · ${placarTorneio.w} x ${placarTorneio.b}` : '';
  if (terminouTorneio) {
    const campeao = placarTorneio.w > placarTorneio.b ? 'Brancas' : 'Pretas';
    document.getElementById('status').textContent = `${campeao} venceram o torneio.`;
    mostrarAviso(`🏆 Torneio encerrado: ${campeao} vencem por ${placarTorneio.w} x ${placarTorneio.b}.`, 'sucesso', 8000);
  } else if (torneio) {
    placarTorneio.partida++;
    mostrarAviso(`Partida ${placarTorneio.partida - 1} encerrada (${motivo}). Iniciando a próxima...`, 'info', 5000);
    iniciarPartida();
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
  if (!configuracaoPartida || configuracaoPartida.oponente !== 'ia' || chess.turn() !== 'b') return;
  const movimento = configuracaoPartida.modo === 'classico' && configuracaoPartida.nivel !== 'facil' ? await escolherLanceComMinimax(configuracaoPartida.nivel === 'dificil' ? 3 : 2) : escolherLanceFacil();
  if (movimento) executarMovimento(movimento.from, movimento.to, true);
}

function agendarLanceDaIA() {
  if (configuracaoPartida?.oponente === 'ia' && chess.turn() === 'b') setTimeout(fazerLanceDaIA, 250);
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
  chess.reset();
  const turnoInicial = configuracaoPartida.inicio === 'pretas' || (configuracaoPartida.inicio === 'sorteio' && Math.random() >= 0.5) ? 'b' : 'w';
  if (turnoInicial === 'b') chess.load('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1');
  historicoEstadosQuanticos = [];
  casaSelecionada = null;
  partidaEncerrada = false;
  configurarRelogio();
  inicializarPecasQuanticas();
  renderizarTabuleiro();
  document.getElementById('telaInicial').classList.add('oculto');
  document.getElementById('areaJogo').classList.remove('oculto');
  document.getElementById('placar').textContent = configuracaoPartida.formato === 'melhor-de-tres' ? `Melhor de três · ${placarTorneio.w} x ${placarTorneio.b}` : '';
  agendarLanceDaIA();
}
document.getElementById('configRelogio').addEventListener('change', evento => {
  const personalizado = evento.target.value === 'personalizada';
  document.getElementById('tempoPersonalizado').classList.toggle('oculto', !personalizado);
  document.getElementById('incrementoPersonalizado').classList.toggle('oculto', !personalizado);
});
document.getElementById('btnComecar').addEventListener('click', iniciarPartida);
document.getElementById('btnVoltarConfiguracao').addEventListener('click', () => {
  relogioPartida.ativo = false;
  if (relogioPartida.intervalId) clearInterval(relogioPartida.intervalId);
  document.getElementById('areaJogo').classList.add('oculto');
  document.getElementById('telaInicial').classList.remove('oculto');
});
