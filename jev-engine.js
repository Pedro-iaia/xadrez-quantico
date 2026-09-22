/**
 * jev-engine.js - Motor de Decisão Quântico e Estocástico JEV (Joint Expected Value)
 * Compatível com execução em Web Worker (navegador) e Node.js (testes e ferramentas).
 */

(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) {
    module.exports = fabrica();
  } else {
    raiz.JevEngine = fabrica();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  const VALORES_PECAS = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
  };

  // Tabelas de Posição Piece-Square simplificadas para bônus posicional (incentiva desenvolvimento e centro)
  const BONUS_CENTRO = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 5, 10, 15, 15, 10, 5, 0],
    [0, 5, 15, 25, 25, 15, 5, 0],
    [0, 5, 15, 25, 25, 15, 5, 0],
    [0, 5, 10, 15, 15, 10, 5, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ];

  /**
   * Avaliação estática posicional e material do ponto de vista das Brancas (em centipawns).
   * @param {object} chess - Instância do tabuleiro chess.js
   * @returns {number} Pontuação em centipawns (>0 Brancas melhores, <0 Pretas melhores)
   */
  function staticEval(chess) {
    if (typeof chess.isGameOver === 'function' ? chess.isGameOver() : (chess.game_over && chess.game_over())) {
      const emXequeMate = typeof chess.isCheckmate === 'function' ? chess.isCheckmate() : (chess.in_checkmate && chess.in_checkmate());
      if (emXequeMate) {
        return chess.turn() === 'w' ? -20000 : 20000;
      }
      return 0; // Empate, afogamento ou repetição
    }

    let pontuacao = 0;
    const board = chess.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const peca = board[r][c];
        if (peca) {
          const valMaterial = VALORES_PECAS[peca.type] || 0;
          const valPos = (peca.type === 'p' || peca.type === 'n' || peca.type === 'b')
            ? BONUS_CENTRO[r][c]
            : 0;
          const totalPeca = valMaterial + valPos;
          pontuacao += peca.color === 'w' ? totalPeca : -totalPeca;
        }
      }
    }

    // Mobilidade sutil (diferença no número de lances legais disponíveis)
    const lancesLegais = chess.moves().length;
    const bonusMobilidade = chess.turn() === 'w' ? lancesLegais * 4 : -lancesLegais * 4;
    pontuacao += bonusMobilidade;

    return pontuacao;
  }

  /**
   * Converte avaliação em centipawns para probabilidade de vitória [0, 1] via Sigmoide.
   * Impede a distorção linear de grandes vantagens materiais e reflete expectativa real de desfecho.
   * @param {number} evalCp - Avaliação em centipawns
   * @returns {number} Utilidade em [0, 1]
   */
  function winProbability(evalCp) {
    // Sigmoide logística padrão de xadrez: 1 / (1 + 10^(-eval / 400))
    return 1 / (1 + Math.pow(10, -evalCp / 400));
  }

  /**
   * Calcula a distribuição de probabilidades das respostas via Softmax com estabilidade numérica e temperatura tau.
   * tau -> 0: adversário converge para precisão quase determinística (Minimax ótimo).
   * tau > 1: adversário com dispersão estocástica (erros humanos / apuros de tempo).
   * @param {number[]} scores - Pontuações na perspectiva do tomador de decisão
   * @param {number} tau - Temperatura estocástica
   * @returns {number[]} Distribuição de probabilidades somando 1.0
   */
  function opponentPolicy(scores, tau = 1.0) {
    if (!scores || scores.length === 0) return [];
    if (scores.length === 1) return [1.0];

    const safeTau = Math.max(tau, 0.005);
    const scaled = scores.map(v => v / safeTau);
    const maxVal = Math.max(...scaled); // Estabilidade contra overflow exponencial

    const exps = scaled.map(v => Math.exp(v - maxVal));
    const sumExps = exps.reduce((acc, curr) => acc + curr, 0);

    if (sumExps <= 0 || !isFinite(sumExps)) {
      const uniforme = 1.0 / scores.length;
      return scores.map(() => uniforme);
    }

    return exps.map(e => e / sumExps);
  }

  /**
   * Aplica uma hipótese quântica sobre o tabuleiro chess.js clonado.
   * @param {object} chess - Instância do chess.js
   * @param {object} hipotese - Mapeamento casa -> tipo (ex: { a1: 'r', b1: 'n', c1: 'b', ... })
   */
  function aplicarHipoteseNoChess(chess, hipotese) {
    if (!hipotese) return;
    for (const [casa, tipo] of Object.entries(hipotese)) {
      const pecaAtual = chess.get(casa);
      if (pecaAtual && pecaAtual.type !== tipo) {
        chess.put({ type: tipo, color: pecaAtual.color }, casa);
      }
    }
  }

  /**
   * Avalia um lance em uma posição clássica usando Joint Expected Value (JEV) sobre as respostas do oponente.
   * @param {object} chess - Instância clonada ou posicionada do chess.js
   * @param {object} opcoes - { tau, topK }
   * @returns {{ bestMove: object|null, bestJev: number }}
   */
  function avaliarJevPosicaoClassica(chess, opcoes = {}) {
    const tau = opcoes.tau !== undefined ? opcoes.tau : 1.2;
    const topK = opcoes.topK || 6;
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) return { bestMove: null, bestJev: 0.5 };

    const isWhite = chess.turn() === 'w';
    let bestMove = null;
    let bestJev = isWhite ? -Infinity : Infinity;

    for (const move of moves) {
      chess.move(move);

      // Se o lance encerra a partida imediatamente
      const gameOver = typeof chess.isGameOver === 'function' ? chess.isGameOver() : (chess.game_over && chess.game_over());
      if (gameOver) {
        const leafEval = staticEval(chess);
        const expectedUtility = winProbability(leafEval);
        chess.undo();

        if (isWhite && expectedUtility > bestJev) {
          bestJev = expectedUtility;
          bestMove = move;
        } else if (!isWhite && expectedUtility < bestJev) {
          bestJev = expectedUtility;
          bestMove = move;
        }
        continue;
      }

      // Respostas do oponente
      const oppMoves = chess.moves({ verbose: true });
      if (oppMoves.length === 0) {
        chess.undo();
        continue;
      }

      // Pré-avaliação rápida das respostas do oponente para podar Top-K
      const avaliacoesPreliminares = [];
      for (const oppMove of oppMoves) {
        chess.move(oppMove);
        const leafEval = staticEval(chess);
        const pWinWhite = winProbability(leafEval);
        // Da perspectiva do oponente (se Brancas moveram, oponente é Pretas -> quer minimizar leafEval)
        const oppPerspectiveScore = isWhite ? -leafEval : leafEval;
        avaliacoesPreliminares.push({
          move: oppMove,
          pWinWhite,
          oppPerspectiveScore
        });
        chess.undo();
      }

      // Ordena pelas melhores respostas do oponente e seleciona Top-K
      avaliacoesPreliminares.sort((a, b) => b.oppPerspectiveScore - a.oppPerspectiveScore);
      const topRespostas = avaliacoesPreliminares.slice(0, topK);

      const scoresForSoftmax = topRespostas.map(r => r.oppPerspectiveScore / 100);
      const utilities = topRespostas.map(r => r.pWinWhite);
      const probs = opponentPolicy(scoresForSoftmax, tau);

      // JEV = Σ ( P(r_j | a_i) * U(s_j) )
      const expectedUtility = probs.reduce((soma, p, idx) => soma + p * utilities[idx], 0);

      chess.undo();

      if (isWhite) {
        if (expectedUtility > bestJev) {
          bestJev = expectedUtility;
          bestMove = move;
        }
      } else {
        if (expectedUtility < bestJev) {
          bestJev = expectedUtility;
          bestMove = move;
        }
      }
    }

    return { bestMove, bestJev };
  }

  /**
   * Avalia o melhor lance utilizando o Joint Expected Value (JEV) completo,
   * integrando a distribuição de probabilidades das hipóteses quânticas sobreviventes (Regra de Born)
   * e a distribuição de respostas estocásticas do oponente (Softmax).
   * 
   * @param {object} ChessClass - Construtor da classe Chess do chess.js
   * @param {string} fen - FEN clássico da posição
   * @param {object} dadosQuanticos - { pecasQuanticas, gruposFlanco, variante }
   * @param {object} opcoes - { tau, topK, maxHipoteses }
   * @returns {{ move: object|null, jev: number, hipotesesConsideradas: number }}
   */
  function computeQuantumJevMove(ChessClass, fen, dadosQuanticos = {}, opcoes = {}) {
    const tau = opcoes.tau !== undefined ? opcoes.tau : 1.2;
    const topK = opcoes.topK || 6;
    const maxHipoteses = opcoes.maxHipoteses || 8;

    const chessBase = new ChessClass(fen);
    const moves = chessBase.moves({ verbose: true });
    if (moves.length === 0) return { move: null, jev: 0.5, hipotesesConsideradas: 0 };

    const isWhite = chessBase.turn() === 'w';
    const corAtual = isWhite ? 'w' : 'b';

    // Recupera hipóteses vivas do grupo quântico da cor atual ou do par
    let hipotesesVivas = [];
    if (dadosQuanticos.gruposFlanco) {
      const grupoProprio = dadosQuanticos.gruposFlanco[corAtual];
      if (grupoProprio && grupoProprio.hipoteses && grupoProprio.hipoteses.length > 0) {
        hipotesesVivas = grupoProprio.hipoteses;
      }
    }

    // Se não há superposição quântica ativa, executa JEV clássico direto
    if (hipotesesVivas.length === 0) {
      const res = avaliarJevPosicaoClassica(chessBase, { tau, topK });
      return {
        move: res.bestMove,
        jev: res.bestJev,
        hipotesesConsideradas: 1
      };
    }

    // Amostragem honesta de hipóteses (Regra de Born com amostragem uniforme sobre estados válidos restantes)
    let hipotesesAmostradas = hipotesesVivas;
    if (hipotesesVivas.length > maxHipoteses) {
      // Embaralhamento determinístico-estocástico para selecionar subconjunto representativo
      hipotesesAmostradas = [...hipotesesVivas]
        .sort(() => 0.5 - Math.random())
        .slice(0, maxHipoteses);
    }

    const pesoHip = 1.0 / hipotesesAmostradas.length;

    // Avalia o JEV acumulado de cada lance candidato a_i através de todas as hipóteses
    // JEV(a_i) = Σ_{h} P(h) * JEV(a_i | h)
    const pontuacaoAcumuladaLances = new Map(); // chave: `${move.from}-${move.to}-${move.promotion||''}` -> { move, jevAcumulado }

    for (const hipotese of hipotesesAmostradas) {
      const simChess = new ChessClass(fen);
      aplicarHipoteseNoChess(simChess, hipotese);

      const lancesNaHipotese = simChess.moves({ verbose: true });
      for (const move of lancesNaHipotese) {
        const chave = `${move.from}-${move.to}-${move.promotion || ''}`;

        simChess.move(move);
        let expectedUtility;

        const gameOver = typeof simChess.isGameOver === 'function' ? simChess.isGameOver() : (simChess.game_over && simChess.game_over());
        if (gameOver) {
          const leafEval = staticEval(simChess);
          expectedUtility = winProbability(leafEval);
        } else {
          const oppMoves = simChess.moves({ verbose: true });
          if (oppMoves.length === 0) {
            const leafEval = staticEval(simChess);
            expectedUtility = winProbability(leafEval);
          } else {
            const oppEvals = [];
            for (const oppMove of oppMoves) {
              simChess.move(oppMove);
              const leafEval = staticEval(simChess);
              const pWinWhite = winProbability(leafEval);
              const oppPerspectiveScore = isWhite ? -leafEval : leafEval;
              oppEvals.push({ move: oppMove, pWinWhite, oppPerspectiveScore });
              simChess.undo();
            }

            oppEvals.sort((a, b) => b.oppPerspectiveScore - a.oppPerspectiveScore);
            const topRespostas = oppEvals.slice(0, topK);

            const scoresForSoftmax = topRespostas.map(r => r.oppPerspectiveScore / 100);
            const utilities = topRespostas.map(r => r.pWinWhite);
            const probs = opponentPolicy(scoresForSoftmax, tau);

            expectedUtility = probs.reduce((soma, p, idx) => soma + p * utilities[idx], 0);
          }
        }
        simChess.undo();

        if (!pontuacaoAcumuladaLances.has(chave)) {
          pontuacaoAcumuladaLances.set(chave, {
            move,
            jevAcumulado: 0,
            ocorrencias: 0
          });
        }

        const registro = pontuacaoAcumuladaLances.get(chave);
        registro.jevAcumulado += pesoHip * expectedUtility;
        registro.ocorrencias += 1;
      }
    }

    // Seleciona o lance com maior JEV para Brancas, ou menor JEV para Pretas
    let melhorLance = null;
    let melhorJev = isWhite ? -Infinity : Infinity;

    for (const [, dados] of pontuacaoAcumuladaLances.entries()) {
      // Ajusta o peso caso o lance não fosse legal em 100% das hipóteses (penalidade suave de incerteza)
      const taxaValidade = dados.ocorrencias / hipotesesAmostradas.length;
      const jevPonderado = dados.jevAcumulado * taxaValidade + (1 - taxaValidade) * 0.5;

      if (isWhite) {
        if (jevPonderado > melhorJev) {
          melhorJev = jevPonderado;
          melhorLance = dados.move;
        }
      } else {
        if (jevPonderado < melhorJev) {
          melhorJev = jevPonderado;
          melhorLance = dados.move;
        }
      }
    }

    // Fallback de segurança se nenhuma chave foi registrada
    if (!melhorLance && moves.length > 0) {
      melhorLance = moves[0];
      melhorJev = 0.5;
    }

    return {
      move: melhorLance,
      jev: melhorJev,
      hipotesesConsideradas: hipotesesAmostradas.length
    };
  }

  return {
    VALORES_PECAS,
    staticEval,
    winProbability,
    opponentPolicy,
    aplicarHipoteseNoChess,
    avaliarJevPosicaoClassica,
    computeQuantumJevMove
  };
});
