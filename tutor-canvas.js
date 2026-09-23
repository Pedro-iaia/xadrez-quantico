/**
 * tutor-canvas.js — Camada de Renderização e Anotação Vetorial (Canvas Overlay)
 * Projeto: Xadrez de Schrödinger · Analisador e Tutor
 *
 * Responsável por:
 * 1. Desenhar setas vetoriais direcionais (lance esperado, variantes, ameaças, erros).
 * 2. Permitir ao usuário/treinador desenhar anotações com botão direito do mouse.
 * 3. Suporte a modificadores de cor (Normal: Cyan/Azul, Shift: Verde, Alt: Amarelo, Ctrl/Cmd: Vermelho).
 * 4. Limpeza com clique esquerdo ou comandos da interface.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TutorCanvas = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  let canvasEl = null;
  let ctx = null;
  let containerEl = null;
  let setasSalvas = [];
  let setaTemporaria = null;
  let desenhandoSeta = false;
  let casaInicioSeta = null;
  let corOrientacao = 'w'; // 'w' (brancas embaixo) ou 'b' (pretas embaixo)

  const CORES = {
    padrao: 'rgba(52, 152, 219, 0.85)',   // Azul / Cyan
    acerto: 'rgba(46, 204, 113, 0.85)',   // Verde (Shift)
    variante: 'rgba(241, 196, 15, 0.85)', // Amarelo (Alt)
    ameaca: 'rgba(231, 76, 60, 0.85)',    // Vermelho (Ctrl)
    esperado: 'rgba(46, 204, 113, 0.9)',  // Verde forte
    erro: 'rgba(231, 76, 60, 0.9)'        // Vermelho forte
  };

  /**
   * Inicializa o canvas de overlay sobre o elemento do tabuleiro
   */
  function inicializar(tabuleiroId = 'tabuleiro', canvasId = 'tutorOverlayCanvas') {
    containerEl = document.getElementById(tabuleiroId);
    canvasEl = document.getElementById(canvasId);

    if (!containerEl) {
      console.warn(`[TutorCanvas] Container #${tabuleiroId} não encontrado.`);
      return false;
    }

    if (!canvasEl) {
      canvasEl = document.createElement('canvas');
      canvasEl.id = canvasId;
      canvasEl.className = 'tutor-canvas-overlay';
      containerEl.style.position = 'relative';
      containerEl.appendChild(canvasEl);
    }

    ctx = canvasEl.getContext('2d');
    redimensionar();

    // Eventos de redimensionamento
    window.addEventListener('resize', redimensionar);

    // Eventos de mouse no container para desenho de setas com o botão direito
    containerEl.addEventListener('contextmenu', (e) => {
      e.preventDefault(); // Impede o menu de contexto padrão
    });

    containerEl.addEventListener('mousedown', aoPressionarMouse);
    window.addEventListener('mousemove', aoMoverMouse);
    window.addEventListener('mouseup', aoSoltarMouse);

    return true;
  }

  /**
   * Sincroniza dimensões do canvas com o tabuleiro
   */
  function redimensionar() {
    if (!canvasEl || !containerEl) return;
    const rect = containerEl.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvasEl.width = Math.round(rect.width * dpr);
    canvasEl.height = Math.round(rect.height * dpr);
    canvasEl.style.width = `${rect.width}px`;
    canvasEl.style.height = `${rect.height}px`;

    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
    redesenhar();
  }

  function definirOrientacao(cor) {
    corOrientacao = cor === 'b' ? 'b' : 'w';
    redesenhar();
  }

  /**
   * Obtém a coordenada em pixels do centro de uma casa (ex: 'e4')
   */
  function obterCentroCasa(nomeCasa) {
    if (!containerEl || typeof nomeCasa !== 'string' || nomeCasa.length < 2) {
      return { x: 0, y: 0 };
    }
    const rect = containerEl.getBoundingClientRect();
    const colunas = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const coluna = nomeCasa[0].toLowerCase();
    const fileira = parseInt(nomeCasa[1], 10);

    let idxCol = colunas.indexOf(coluna);
    let idxLin = 8 - fileira;

    if (corOrientacao === 'b') {
      idxCol = 7 - idxCol;
      idxLin = 7 - idxLin;
    }

    const larguraCasa = rect.width / 8;
    const alturaCasa = rect.height / 8;

    return {
      x: idxCol * larguraCasa + larguraCasa / 2,
      y: idxLin * alturaCasa + alturaCasa / 2,
      larguraCasa,
      alturaCasa
    };
  }

  /**
   * Identifica a casa correspondente às coordenadas de clique do mouse
   */
  function obterCasaPorCoordenadas(clientX, clientY) {
    if (!containerEl) return null;
    const rect = containerEl.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (x < 0 || x > rect.width || y < 0 || y > rect.height) return null;

    const colunas = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    let idxCol = Math.floor(x / (rect.width / 8));
    let idxLin = Math.floor(y / (rect.height / 8));

    if (idxCol < 0 || idxCol > 7 || idxLin < 0 || idxLin > 7) return null;

    if (corOrientacao === 'b') {
      idxCol = 7 - idxCol;
      idxLin = 7 - idxLin;
    }

    const fileira = 8 - idxLin;
    return `${colunas[idxCol]}${fileira}`;
  }

  /**
   * Desenha uma seta vetorial estilizada de fromCasa até toCasa
   */
  function desenharSeta(fromCasa, toCasa, cor = CORES.padrao, largura = 6) {
    if (!ctx) return;
    const p1 = obterCentroCasa(fromCasa);
    const p2 = obterCentroCasa(toCasa);

    if (p1.x === p2.x && p1.y === p2.y) return;

    ctx.save();
    ctx.strokeStyle = cor;
    ctx.fillStyle = cor;
    ctx.lineWidth = largura;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angulo = Math.atan2(dy, dx);
    const distancia = Math.hypot(dx, dy);

    // Ajusta ponta da seta para não ultrapassar o centro da casa de destino
    const tamanhoCabeca = Math.max(14, p2.larguraCasa * 0.35);
    const recuo = Math.min(distancia * 0.25, tamanhoCabeca * 0.85);

    const pontaX = p2.x - Math.cos(angulo) * (recuo * 0.4);
    const pontaY = p2.y - Math.sin(angulo) * (recuo * 0.4);

    const baseCabecaX = pontaX - Math.cos(angulo) * tamanhoCabeca;
    const baseCabecaY = pontaY - Math.sin(angulo) * tamanhoCabeca;

    // Linha principal da seta
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(baseCabecaX, baseCabecaY);
    ctx.stroke();

    // Cabeça da seta (triângulo equilátero estilizado)
    const abertura = Math.PI / 6; // 30 graus
    ctx.beginPath();
    ctx.moveTo(pontaX, pontaY);
    ctx.lineTo(
      pontaX - tamanhoCabeca * Math.cos(angulo - abertura),
      pontaY - tamanhoCabeca * Math.sin(angulo - abertura)
    );
    ctx.lineTo(
      pontaX - tamanhoCabeca * Math.cos(angulo + abertura),
      pontaY - tamanhoCabeca * Math.sin(angulo + abertura)
    );
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /**
   * Limpa o canvas e redesenha todas as setas salvas
   */
  function redesenhar() {
    if (!ctx || !canvasEl) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvasEl.width / dpr, canvasEl.height / dpr);

    // Desenha setas consolidadas
    setasSalvas.forEach(s => desenharSeta(s.from, s.to, s.cor, s.largura || 6));

    // Desenha seta temporária durante arraste com botão direito
    if (setaTemporaria) {
      desenharSeta(setaTemporaria.from, setaTemporaria.to, setaTemporaria.cor, 5);
    }
  }

  function adicionarSeta(from, to, cor = CORES.padrao, largura = 6) {
    // Alterna se já existir uma seta idêntica
    const idx = setasSalvas.findIndex(s => s.from === from && s.to === to);
    if (idx !== -1) {
      setasSalvas.splice(idx, 1);
    } else {
      setasSalvas.push({ from, to, cor, largura });
    }
    redesenhar();
  }

  function definirSetaExclusiva(from, to, cor = CORES.esperado, largura = 7) {
    setasSalvas = [{ from, to, cor, largura }];
    redesenhar();
  }

  function limparSetas() {
    setasSalvas = [];
    setaTemporaria = null;
    redesenhar();
  }

  /* =========================================================
   * Manipulação de Mouse (Anotação com Botão Direito)
   * ========================================================= */
  function aoPressionarMouse(e) {
    if (e.button === 0) {
      // Clique esquerdo limpa as setas manuais desenhadas pelo usuário se não houver clique em peça
      // Não limpa imediatamente se for clique em peças do tabuleiro
    } else if (e.button === 2) {
      // Botão direito inicia desenho de seta
      const casa = obterCasaPorCoordenadas(e.clientX, e.clientY);
      if (casa) {
        desenhandoSeta = true;
        casaInicioSeta = casa;
      }
    }
  }

  function aoMoverMouse(e) {
    if (!desenhandoSeta || !casaInicioSeta) return;
    const casaAtual = obterCasaPorCoordenadas(e.clientX, e.clientY);
    if (casaAtual && casaAtual !== casaInicioSeta) {
      let cor = CORES.padrao;
      if (e.shiftKey) cor = CORES.acerto;
      else if (e.altKey) cor = CORES.variante;
      else if (e.ctrlKey || e.metaKey) cor = CORES.ameaca;

      setaTemporaria = { from: casaInicioSeta, to: casaAtual, cor };
      redesenhar();
    }
  }

  function aoSoltarMouse(e) {
    if (e.button === 2 && desenhandoSeta) {
      desenhandoSeta = false;
      const casaFim = obterCasaPorCoordenadas(e.clientX, e.clientY);
      if (casaInicioSeta && casaFim && casaInicioSeta !== casaFim) {
        let cor = CORES.padrao;
        if (e.shiftKey) cor = CORES.acerto;
        else if (e.altKey) cor = CORES.variante;
        else if (e.ctrlKey || e.metaKey) cor = CORES.ameaca;

        adicionarSeta(casaInicioSeta, casaFim, cor);
      }
      casaInicioSeta = null;
      setaTemporaria = null;
      redesenhar();
    }
  }

  return {
    inicializar,
    redimensionar,
    definirOrientacao,
    desenharSeta,
    adicionarSeta,
    definirSetaExclusiva,
    limparSetas,
    obterCentroCasa,
    CORES
  };
}));
