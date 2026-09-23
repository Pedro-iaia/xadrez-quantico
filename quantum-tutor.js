/**
 * quantum-tutor.js — Módulo do Tutor Interativo, Criador de Desafios e Analisador de Trilhas
 * Projeto: Xadrez de Schrödinger · Analisador e Tutor
 *
 * Responsável por:
 * 1. Gerenciar trilhas didáticas ativas (carregadas via acervo, upload .tutor, .pgn ou .json).
 * 2. Validar lances do aluno com feedback amigável, dicas e setas visuais.
 * 3. Painel do Treinador: gravação interativa de roteiros pedagógicos com exportação para arquivo .tutor.
 * 4. Conversão universal entre PGN clássico, Log de Partidas do jogo e Formato .tutor.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['tutor-canvas'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.QuantumTutor = factory(root.TutorCanvas);
  }
}(typeof self !== 'undefined' ? self : this, function (TutorCanvas) {
  'use strict';

  // Estados do Tutor (Aluno)
  let trilhaAtiva = null;
  let indicePasso = 0;
  let modoTutorAtivo = false;
  let nivelDicaAtual = 0;

  // Estados do Treinador (Gravação)
  let modoGravacao = false;
  let passosGravados = [];
  let ultimoLanceGravadoUCI = null;
  let ultimoLanceGravadoObj = null;

  // Catálogo de trilhas em memória
  const catalogoTrilhas = {};

  /**
   * Inicializa o Tutor e registra listeners nos elementos da interface
   */
  function inicializar() {
    if (typeof TutorCanvas !== 'undefined' && TutorCanvas.inicializar) {
      TutorCanvas.inicializar('tabuleiro', 'tutorOverlayCanvas');
    }

    vincularEventosUI();
    carregarTrilhasPadrao();
  }

  /**
   * Conecta os botões e formulários do painel do tutor e treinador
   */
  function vincularEventosUI() {
    // Dica no Modo Tutor
    const btnDica = document.getElementById('btnTutorDica');
    if (btnDica) {
      btnDica.addEventListener('click', solicitarDica);
    }

    // Reiniciar Desafio Atual
    const btnReiniciar = document.getElementById('btnTutorReiniciar');
    if (btnReiniciar) {
      btnReiniciar.addEventListener('click', () => {
        if (trilhaAtiva) iniciarTrilha(trilhaAtiva);
      });
    }

    // Sair do Modo Tutor
    const btnSair = document.getElementById('btnTutorSair');
    if (btnSair) {
      btnSair.addEventListener('click', encerrarModoTutor);
    }

    // Alternar Gravação no Painel do Treinador
    const btnGravar = document.getElementById('btnTreinadorGravar');
    if (btnGravar) {
      btnGravar.addEventListener('click', alternarModoGravacao);
    }

    // Salvar Instrução do Passo Gravado
    const btnSalvarPasso = document.getElementById('btnTreinadorSalvarPasso');
    if (btnSalvarPasso) {
      btnSalvarPasso.addEventListener('click', salvarPassoTreinador);
    }

    // Exportar Arquivo .tutor
    const btnExportar = document.getElementById('btnTreinadorExportar');
    if (btnExportar) {
      btnExportar.addEventListener('click', exportarArquivoTutor);
    }

    // Input de Arquivo .tutor ou .pgn
    const inputImportar = document.getElementById('inputImportarTutor');
    const btnImportar = document.getElementById('btnCarregarTutorArquivo');
    if (btnImportar && inputImportar) {
      btnImportar.addEventListener('click', () => inputImportar.click());
      inputImportar.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) carregarArquivoGenerico(file);
        e.target.value = '';
      });
    }

    // Dropdown de trilhas da tela inicial e do painel
    const selectTrilhas = document.getElementById('selectTrilhasTutor');
    if (selectTrilhas) {
      selectTrilhas.addEventListener('change', (e) => {
        const id = e.target.value;
        if (id && catalogoTrilhas[id]) {
          iniciarTrilha(catalogoTrilhas[id]);
        }
      });
    }
  }

  /**
   * Carrega trilhas padrão de aberturas básicas
   */
  async function carregarTrilhasPadrao() {
    try {
      const resp = await fetch('data/licoes/aberturas_basicas.json');
      if (resp.ok) {
        const dados = await resp.json();
        if (Array.isArray(dados.trilhas)) {
          dados.trilhas.forEach(t => registrarTrilha(t));
          atualizarDropdownTrilhas();
        }
      }
    } catch (e) {
      console.info('[QuantumTutor] Acervo inicial carregado via fallback local.');
    }
  }

  function registrarTrilha(trilha) {
    if (!trilha || !trilha.id || !Array.isArray(trilha.passos)) return false;
    catalogoTrilhas[trilha.id] = trilha;
    return true;
  }

  function atualizarDropdownTrilhas() {
    const selects = [
      document.getElementById('selectTrilhasTutor'),
      document.getElementById('selectTrilhasLateral')
    ].filter(Boolean);

    selects.forEach(sel => {
      sel.innerHTML = '';
      const optDefault = document.createElement('option');
      optDefault.value = '';
      optDefault.textContent = 'Escolha uma trilha ou desafio...';
      optDefault.disabled = true;
      optDefault.selected = true;
      sel.appendChild(optDefault);

      Object.values(catalogoTrilhas).forEach(trilha => {
        const opt = document.createElement('option');
        opt.value = trilha.id;
        opt.textContent = `[${trilha.dificuldade || 'Básico'}] ${trilha.titulo}`;
        sel.appendChild(opt);
      });
    });
  }

  /* =========================================================
   * Execução e Validação no Modo Tutor (Aluno)
   * ========================================================= */
  function iniciarTrilha(trilha) {
    if (!trilha || !Array.isArray(trilha.passos) || trilha.passos.length === 0) {
      if (typeof mostrarAviso === 'function') mostrarAviso('Trilha didática inválida ou vazia.', 'erro');
      return false;
    }

    trilhaAtiva = trilha;
    indicePasso = 0;
    modoTutorAtivo = true;
    nivelDicaAtual = 0;

    // Ajusta visualização da área de jogo
    const telaInicial = document.getElementById('telaInicial');
    if (telaInicial) telaInicial.classList.add('oculto');
    const areaJogo = document.getElementById('areaJogo');
    if (areaJogo) areaJogo.classList.remove('oculto');

    // Exibe o painel do tutor na coluna lateral
    const painelTutor = document.getElementById('painelModoTutor');
    if (painelTutor) painelTutor.classList.remove('oculto');

    // Reseta o tabuleiro clássico ou com FEN customizado
    if (typeof chess !== 'undefined') {
      if (trilha.fenBase) {
        chess.load(trilha.fenBase);
      } else {
        chess.reset();
      }
    }

    if (typeof pecasQuanticas !== 'undefined') pecasQuanticas = {};
    if (typeof gruposFlanco !== 'undefined') gruposFlanco = {};
    if (typeof casaSelecionada !== 'undefined') casaSelecionada = null;

    if (typeof renderizarTabuleiro === 'function') {
      renderizarTabuleiro();
    }

    if (TutorCanvas && TutorCanvas.limparSetas) {
      TutorCanvas.limparSetas();
    }

    atualizarUITutor();
    return true;
  }

  function atualizarUITutor() {
    if (!trilhaAtiva) return;
    const totalPassos = trilhaAtiva.passos.length;
    const progressoPct = Math.round((indicePasso / totalPassos) * 100);

    const tituloEl = document.getElementById('tutorTrilhaTitulo');
    if (tituloEl) tituloEl.textContent = trilhaAtiva.titulo;

    const progressoBarra = document.getElementById('tutorProgressoBarra');
    if (progressoBarra) progressoBarra.value = progressoPct;

    const progressoTexto = document.getElementById('tutorProgressoTexto');
    if (progressoTexto) progressoTexto.textContent = `${progressoPct}% (${indicePasso}/${totalPassos})`;

    const mensagemBox = document.getElementById('tutorMensagemTexto');

    if (indicePasso >= totalPassos) {
      if (mensagemBox) {
        mensagemBox.innerHTML = `🎉 <strong>Parabéns!</strong> Você concluiu com sucesso o desafio <em>"${trilhaAtiva.titulo}"</em>.`;
      }
      if (TutorCanvas && TutorCanvas.limparSetas) TutorCanvas.limparSetas();
      if (typeof mostrarAviso === 'function') mostrarAviso('🎉 Trilha pedagógica concluída!', 'sucesso', 5000);
      return;
    }

    const passoAtual = trilhaAtiva.passos[indicePasso];
    if (mensagemBox) {
      mensagemBox.textContent = passoAtual.mensagem || 'Faça o lance correto para a posição.';
    }

    // Desenha seta didática se definida no passo
    if (TutorCanvas) {
      TutorCanvas.limparSetas();
      if (passoAtual.seta && passoAtual.seta.from && passoAtual.seta.to) {
        TutorCanvas.adicionarSeta(passoAtual.seta.from, passoAtual.seta.to, passoAtual.seta.cor || TutorCanvas.CORES.padrao);
      }
    }
  }

  /**
   * Gancho chamado após a execução de qualquer lance no tabuleiro
   */
  function aoExecutarMovimento(origem, destino, lanceObj) {
    const moveUCI = `${origem}${destino}`;

    // Se estiver gravando pelo Modo Treinador
    if (modoGravacao) {
      ultimoLanceGravadoUCI = moveUCI;
      ultimoLanceGravadoObj = lanceObj;
      const elLance = document.getElementById('treinadorUltimoLance');
      if (elLance) elLance.textContent = (lanceObj?.san || moveUCI).toUpperCase();
      const painelCampos = document.getElementById('treinadorInputsPasso');
      if (painelCampos) painelCampos.classList.remove('oculto');
      return;
    }

    // Se estiver no Modo Tutor Ativo (aluno executando trilha)
    if (modoTutorAtivo && trilhaAtiva && indicePasso < trilhaAtiva.passos.length) {
      validarLanceAluno(origem, destino, lanceObj);
    }
  }

  function validarLanceAluno(origem, destino, lanceObj) {
    const passo = trilhaAtiva.passos[indicePasso];
    const moveUCI = `${origem}${destino}`;
    const san = lanceObj ? lanceObj.san : '';

    const corresponde = (moveUCI === passo.lanceEsperado) ||
      (passo.san && (san === passo.san || san === passo.san.replace('+', '')));

    if (corresponde) {
      indicePasso++;
      nivelDicaAtual = 0;
      if (TutorCanvas) {
        TutorCanvas.limparSetas();
        TutorCanvas.desenharSeta(origem, destino, TutorCanvas.CORES.acerto, 8);
      }
      if (typeof mostrarAviso === 'function') {
        mostrarAviso('🌟 Lance excelente e preciso!', 'sucesso', 2500);
      }

      // Executa contra-resposta automática do Bot após pequeno intervalo
      if (passo.respostaBot && typeof chess !== 'undefined') {
        setTimeout(() => {
          const resp = passo.respostaBot;
          const de = resp.slice(0, 2);
          const para = resp.slice(2, 4);
          const m = chess.move({ from: de, to: para, promotion: 'q' });
          if (m && typeof renderizarTabuleiro === 'function') {
            renderizarTabuleiro();
          }
          atualizarUITutor();
        }, 600);
      } else {
        atualizarUITutor();
      }
    } else {
      // Lance incorreto: desfaz o lance e orienta o aluno
      setTimeout(() => {
        if (typeof chess !== 'undefined') {
          chess.undo();
        }
        if (typeof renderizarTabuleiro === 'function') {
          renderizarTabuleiro();
        }
        if (TutorCanvas) {
          TutorCanvas.limparSetas();
          TutorCanvas.desenharSeta(origem, destino, TutorCanvas.CORES.erro, 7);
        }
        const mensagemBox = document.getElementById('tutorMensagemTexto');
        if (mensagemBox) {
          mensagemBox.innerHTML = `❌ <strong>Lance incorreto (${san || moveUCI}).</strong> Tente novamente ou peça uma dica.`;
        }
        if (typeof mostrarAviso === 'function') {
          mostrarAviso(`Tente outra opção! O lance ${san || moveUCI} desvia do objetivo da lição.`, 'aviso', 3000);
        }
      }, 350);
    }
  }

  function solicitarDica() {
    if (!modoTutorAtivo || !trilhaAtiva || indicePasso >= trilhaAtiva.passos.length) return;
    const passo = trilhaAtiva.passos[indicePasso];
    const mensagemBox = document.getElementById('tutorMensagemTexto');
    if (!mensagemBox) return;

    nivelDicaAtual++;
    if (nivelDicaAtual === 1) {
      mensagemBox.innerHTML += `<br><br>💡 <strong>Dica:</strong> ${passo.dica || 'Observe as fraquezas nas casas centrais.'}`;
    } else {
      const orig = passo.lanceEsperado.slice(0, 2);
      mensagemBox.innerHTML += `<br>🎯 <strong>Dica avançada:</strong> Mova a peça localizada na casa <strong>${orig.toUpperCase()}</strong>.`;
      if (TutorCanvas) {
        TutorCanvas.adicionarSeta(orig, passo.lanceEsperado.slice(2, 4), TutorCanvas.CORES.variante, 5);
      }
    }
  }

  function encerrarModoTutor() {
    modoTutorAtivo = false;
    trilhaAtiva = null;
    indicePasso = 0;
    if (TutorCanvas) TutorCanvas.limparSetas();

    const painelTutor = document.getElementById('painelModoTutor');
    if (painelTutor) painelTutor.classList.add('oculto');

    const painelTreinador = document.getElementById('painelTreinador');
    if (painelTreinador) painelTreinador.classList.add('oculto');

    const telaInicial = document.getElementById('telaInicial');
    if (telaInicial) telaInicial.classList.remove('oculto');

    const areaJogo = document.getElementById('areaJogo');
    if (areaJogo) areaJogo.classList.add('oculto');
  }

  /* =========================================================
   * Painel do Treinador (Criador de Desafios & Exportador .tutor)
   * ========================================================= */
  function alternarModoGravacao() {
    modoGravacao = !modoGravacao;
    const btnGravar = document.getElementById('btnTreinadorGravar');
    const painelCampos = document.getElementById('treinadorInputsPasso');

    if (modoGravacao) {
      passosGravados = [];
      ultimoLanceGravadoUCI = null;
      ultimoLanceGravadoObj = null;

      if (btnGravar) {
        btnGravar.textContent = '⏹ Parar Gravação';
        btnGravar.style.backgroundColor = '#c0392b';
      }

      if (typeof chess !== 'undefined') chess.reset();
      if (typeof pecasQuanticas !== 'undefined') pecasQuanticas = {};
      if (typeof gruposFlanco !== 'undefined') gruposFlanco = {};
      if (typeof renderizarTabuleiro === 'function') renderizarTabuleiro();
      if (TutorCanvas) TutorCanvas.limparSetas();

      if (typeof mostrarAviso === 'function') {
        mostrarAviso('🔴 Gravação iniciada. Jogue o lance no tabuleiro e preencha as orientações.', 'info', 4000);
      }
    } else {
      if (btnGravar) {
        btnGravar.textContent = '🔴 Iniciar Gravação';
        btnGravar.style.backgroundColor = '';
      }
      if (painelCampos) painelCampos.classList.add('oculto');
    }
  }

  function salvarPassoTreinador() {
    if (!ultimoLanceGravadoUCI) {
      if (typeof mostrarAviso === 'function') mostrarAviso('Faça um lance no tabuleiro primeiro.', 'aviso');
      return;
    }

    const msg = document.getElementById('treinadorInputMensagem')?.value || 'Encontre o melhor lance.';
    const dica = document.getElementById('treinadorInputDica')?.value || 'Pense nas peças ativas.';

    passosGravados.push({
      lanceEsperado: ultimoLanceGravadoUCI,
      san: ultimoLanceGravadoObj?.san || '',
      mensagem: msg,
      dica: dica,
      seta: {
        from: ultimoLanceGravadoUCI.slice(0, 2),
        to: ultimoLanceGravadoUCI.slice(2, 4),
        cor: TutorCanvas ? TutorCanvas.CORES.padrao : 'rgba(52, 152, 219, 0.85)'
      },
      respostaBot: null
    });

    // Se o lance anterior era das Brancas e agora jogou as Pretas, vincula como contra-resposta
    if (passosGravados.length > 1 && typeof chess !== 'undefined' && chess.turn() === 'w') {
      passosGravados[passosGravados.length - 2].respostaBot = ultimoLanceGravadoUCI;
      passosGravados.pop(); // Remove o passo redundante da resposta automática
    }

    const listaEl = document.getElementById('treinadorPassosLista');
    if (listaEl) {
      listaEl.innerHTML = passosGravados.map((p, idx) =>
        `<div>Passo ${idx + 1}: <strong>${(p.san || p.lanceEsperado).toUpperCase()}</strong> - <em>${p.mensagem.slice(0, 30)}...</em></div>`
      ).join('');
    }

    const inputMsg = document.getElementById('treinadorInputMensagem');
    if (inputMsg) inputMsg.value = '';
    const inputDica = document.getElementById('treinadorInputDica');
    if (inputDica) inputDica.value = '';

    if (typeof mostrarAviso === 'function') {
      mostrarAviso(`✅ Lance ${ultimoLanceGravadoUCI.toUpperCase()} salvo no roteiro pedagógico!`, 'sucesso', 3000);
    }
    ultimoLanceGravadoUCI = null;
  }

  function exportarArquivoTutor() {
    if (passosGravados.length === 0) {
      if (typeof mostrarAviso === 'function') mostrarAviso('Grave pelo menos um lance antes de exportar.', 'aviso');
      return;
    }

    const titulo = document.getElementById('treinadorInputTitulo')?.value || 'Desafio Customizado';
    const payload = {
      versao: '1.0.0',
      id: `custom_${Date.now()}`,
      titulo: titulo,
      modo: 'classico',
      criadoEm: new Date().toISOString(),
      fenBase: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      passos: passosGravados
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${titulo.toLowerCase().replace(/\s+/g, '_')}.tutor`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (typeof mostrarAviso === 'function') {
      mostrarAviso('💾 Arquivo .tutor exportado com sucesso!', 'sucesso', 4000);
    }
  }

  /* =========================================================
   * Conversores e Importadores Universais (PGN, .tutor, Log JSON)
   * ========================================================= */
  function carregarArquivoGenerico(file) {
    const nome = file.name.toLowerCase();
    const reader = new FileReader();

    reader.onload = function (evt) {
      const conteudo = evt.target.result;
      try {
        if (nome.endsWith('.pgn')) {
          const trilha = converterPGNParaTrilha(conteudo, file.name.replace(/\.pgn$/i, ''));
          if (trilha) {
            registrarTrilha(trilha);
            atualizarDropdownTrilhas();
            iniciarTrilha(trilha);
            if (typeof mostrarAviso === 'function') mostrarAviso(`📖 Partida PGN carregada com sucesso!`, 'sucesso');
          }
        } else {
          // Arquivo JSON (.tutor ou log de playback)
          const dados = JSON.parse(conteudo);
          if (dados.historicoLances && Array.isArray(dados.historicoLances)) {
            // É um arquivo de Log de Partidas do jogo!
            const trilha = converterLogParaTrilha(dados);
            if (trilha) {
              registrarTrilha(trilha);
              atualizarDropdownTrilhas();
              iniciarTrilha(trilha);
              if (typeof mostrarAviso === 'function') mostrarAviso(`📼 Log de partida transformado em tutorial interativo!`, 'sucesso');
            }
          } else if (dados.passos && Array.isArray(dados.passos)) {
            // É um arquivo .tutor nativo
            registrarTrilha(dados);
            atualizarDropdownTrilhas();
            iniciarTrilha(dados);
            if (typeof mostrarAviso === 'function') mostrarAviso(`🎓 Desafio "${dados.titulo}" carregado com sucesso!`, 'sucesso');
          } else {
            throw new Error('Formato JSON não reconhecido.');
          }
        }
      } catch (err) {
        console.error('[QuantumTutor] Erro ao importar arquivo:', err);
        if (typeof mostrarAviso === 'function') mostrarAviso('Erro ao ler arquivo. Formato inválido.', 'erro');
      }
    };

    reader.readAsText(file);
  }

  /**
   * Converte texto PGN padrão em trilha de desafio interativo
   */
  function converterPGNParaTrilha(pgnTexto, titulo = 'Estudo PGN') {
    if (typeof Chess === 'undefined') return null;
    const c = new Chess();
    if (!c.load_pgn(pgnTexto)) {
      throw new Error('PGN inválido.');
    }

    const historico = c.history({ verbose: true });
    if (historico.length === 0) return null;

    const passos = [];
    for (let i = 0; i < historico.length; i += 2) {
      const lanceJogador = historico[i];
      const lanceBot = (i + 1 < historico.length) ? historico[i + 1] : null;

      const uciJogador = `${lanceJogador.from}${lanceJogador.to}`;
      const uciBot = lanceBot ? `${lanceBot.from}${lanceBot.to}` : null;

      passos.push({
        lanceEsperado: uciJogador,
        san: lanceJogador.san,
        mensagem: `Lance ${Math.floor(i / 2) + 1}: Reproduza a continuação teórica ${lanceJogador.san}.`,
        dica: `Mova a peça de ${lanceJogador.from.toUpperCase()} para ${lanceJogador.to.toUpperCase()}.`,
        seta: {
          from: lanceJogador.from,
          to: lanceJogador.to,
          cor: TutorCanvas ? TutorCanvas.CORES.padrao : 'rgba(52, 152, 219, 0.85)'
        },
        respostaBot: uciBot
      });
    }

    return {
      id: `pgn_${Date.now()}`,
      titulo: titulo || 'Partida PGN Importada',
      modo: 'classico',
      fenBase: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      passos: passos
    };
  }

  /**
   * Converte um log de partida histórico do jogo em trilha didática
   */
  function converterLogParaTrilha(logObj) {
    if (!logObj || !Array.isArray(logObj.historicoLances) || logObj.historicoLances.length <= 1) {
      return null;
    }

    const passos = [];
    const lances = logObj.historicoLances.slice(1); // Ignora quadro inicial 0

    for (let i = 0; i < lances.length; i += 2) {
      const l1 = lances[i];
      const l2 = (i + 1 < lances.length) ? lances[i + 1] : null;

      const detalhes1 = l1.detalhes;
      const uci1 = detalhes1 && detalhes1.from && detalhes1.to ? `${detalhes1.from}${detalhes1.to}` : (l1.lance || '');
      const detalhes2 = l2 ? l2.detalhes : null;
      const uci2 = detalhes2 && detalhes2.from && detalhes2.to ? `${detalhes2.from}${detalhes2.to}` : (l2 ? l2.lance : null);

      if (!uci1) continue;

      passos.push({
        lanceEsperado: uci1,
        san: detalhes1?.san || l1.lance,
        mensagem: l1.descricao || `Lance ${Math.floor(i / 2) + 1}: ${detalhes1?.san || uci1}`,
        dica: `Reproduza a decisão tomada nesta fase da partida.`,
        seta: detalhes1 ? { from: detalhes1.from, to: detalhes1.to, cor: TutorCanvas ? TutorCanvas.CORES.padrao : 'rgba(52, 152, 219, 0.85)' } : null,
        respostaBot: uci2
      });
    }

    return {
      id: logObj.idPartida || `log_${Date.now()}`,
      titulo: `Estudo da Partida (${new Date(logObj.iniciadoEm || Date.now()).toLocaleDateString('pt-BR')})`,
      modo: logObj.variante || 'classico',
      fenBase: logObj.historicoLances[0].fen,
      passos: passos
    };
  }

  return {
    inicializar,
    iniciarTrilha,
    encerrarModoTutor,
    aoExecutarMovimento,
    solicitarDica,
    alternarModoGravacao,
    salvarPassoTreinador,
    exportarArquivoTutor,
    converterPGNParaTrilha,
    converterLogParaTrilha,
    registrarTrilha,
    carregarArquivoGenerico
  };
}));
