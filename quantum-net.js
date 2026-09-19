/**
 * Quantum Network Engine - Ação Fantasmagórica à Distância
 * Sincronização em tempo real de partidas de Xadrez Quântico.
 *
 * Suporta:
 * - WebRTC P2P (via PeerJS: conexão direta gratuita entre navegadores e celulares diferentes)
 * - BroadcastChannel API + LocalStorage (emaranhamento local instantâneo entre abas)
 * - Firebase Realtime Database (opcional; para usar, preencha FIREBASE_CONFIG e
 *   reinclua os SDKs do Firebase no index.html)
 * - Códigos curtos amigáveis para mobile (somente letras, sem hífens)
 * - Pareamento de observadores com sorteio de cores no entrelaçamento
 * - Modo Observador Passivo (Telespectador), com retransmissão de TODOS os lances
 * - Latência medida de verdade (PING/PONG) e compensação por lance
 *
 * Robustez para celulares (v2.2):
 * - Ordenação dos estados por número de sequência (não por relógio do aparelho,
 *   que costuma diferir em segundos entre dois celulares).
 * - localStorage / BroadcastChannel opcionais: webviews e modo privado que os
 *   bloqueiam não impedem mais o pareamento nem o envio de lances.
 * - Reconexão automática do convidado quando o navegador é suspenso em segundo
 *   plano (ex.: ao alternar para o WhatsApp) ou a rede troca (Wi-Fi ⇄ 4G/5G).
 * - Um terceiro "jogador" que tenta entrar vira telespectador, sem cor.
 */

(function (global) {
  'use strict';

  // Configuração opcional do Firebase (se preenchido, usa Firebase como backend primário).
  const FIREBASE_CONFIG = {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  };

  const PEER_TIMEOUT_MS = 8000;
  const MAX_TENTATIVAS_CODIGO = 5;
  const MAX_TENTATIVAS_RECONEXAO = 6;
  const INTERVALO_PING_MS = 5000;
  const LIMITE_SEM_SINAL_MS = 20000;
  const VALIDADE_SALA_LOCAL_MS = 24 * 60 * 60 * 1000;

  class QuantumNet {
    constructor() {
      this.salaId = null;
      this.clientId = this._gerarId('obs');
      this.papel = 'host'; // 'host' | 'guest' | 'espectador'
      this.cor = null; // 'w' | 'b' | null (espectador)
      this.conectado = false;
      this.parEmaranhado = false;
      this.espectador = false;
      this.backend = 'broadcast'; // 'firebase' | 'peerjs' | 'broadcast'
      this.canalBroadcast = null;
      this.dbRef = null;
      this.peer = null;
      this.conexoesP2P = [];
      this.connP2P = null;
      this.latenciaEstimadaMs = 50;
      this.ultimaSeq = 0;
      this.ultimoTimestampEstado = 0;
      this.partidaEncerradaNotificada = false;
      this.salaDados = null;

      this._encerrado = false;
      this._reconectando = false;
      this._ultimoSinal = 0;
      this._timerPing = null;
      this._timerSinalizacao = null;

      // Callbacks fornecidos pelo script.js
      this.callbacks = {
        onConectado: () => { },
        onParEmaranhado: (dados) => { },
        onEstadoRecebido: (estado) => { },
        onDesconexaoObservador: (dados) => { },
        onFimPartida: (dados) => { },
        onConexaoPerdida: (quem) => { },
        onConexaoRestabelecida: () => { },
        onErro: (erro) => { }
      };

      this._inicializarBackend();
      this._limparSalasLocaisAntigas();
    }

    /* ---------------------------------------------------------
     * Utilidades
     * --------------------------------------------------------- */
    _gerarId(prefixo = 'obs') {
      return `${prefixo}_${Math.random().toString(36).substring(2, 9)}`;
    }

    _gerarCodigoSala() {
      // 6 letras minúsculas fáceis de digitar em teclado mobile (sem hífens ou números)
      const letras = 'abcdefghjkmnpqrstuvwxyz';
      let codigo = 'xq';
      for (let i = 0; i < 4; i++) {
        codigo += letras.charAt(Math.floor(Math.random() * letras.length));
      }
      return codigo;
    }

    _normalizarCodigo(codigo) {
      if (!codigo) return '';
      let limpo = String(codigo).trim().toLowerCase();
      if (limpo.includes('par=') || limpo.includes('?')) {
        try {
          const url = new URL(limpo.startsWith('http') ? limpo : `https://dummy.com/${limpo.startsWith('?') ? limpo : '?' + limpo}`);
          const par = url.searchParams.get('par');
          if (par) limpo = par.trim().toLowerCase();
        } catch (e) { }
      }
      return limpo.replace(/[^a-z0-9]/g, '');
    }

    // Acesso seguro ao localStorage (pode lançar exceção em modo privado / webviews).
    _lsGet(chave) {
      try { return global.localStorage.getItem(chave); } catch (e) { return null; }
    }

    _lsSet(chave, valor) {
      try { global.localStorage.setItem(chave, valor); return true; } catch (e) { return false; }
    }

    _lsRemove(chave) {
      try { global.localStorage.removeItem(chave); } catch (e) { }
    }

    _limparSalasLocaisAntigas() {
      try {
        const ls = global.localStorage;
        const agora = Date.now();
        const remover = [];
        for (let i = 0; i < ls.length; i++) {
          const chave = ls.key(i);
          if (!chave || !chave.startsWith('xq_sala_')) continue;
          try {
            const sala = JSON.parse(ls.getItem(chave));
            if (!sala || !sala.criadoEm || agora - sala.criadoEm > VALIDADE_SALA_LOCAL_MS) remover.push(chave);
          } catch (e) { remover.push(chave); }
        }
        remover.forEach(c => ls.removeItem(c));
      } catch (e) { }
    }

    _inicializarBackend() {
      const temFirebase = Boolean(
        FIREBASE_CONFIG.databaseURL &&
        FIREBASE_CONFIG.databaseURL.trim().length > 0 &&
        FIREBASE_CONFIG.apiKey &&
        FIREBASE_CONFIG.apiKey.trim().length > 0
      );

      if (temFirebase && typeof firebase !== 'undefined') {
        try {
          if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
          }
          this.backend = 'firebase';
          this.database = firebase.database();
          console.info('⚛️ [QuantumNet] Conectado ao Firebase Realtime Database');
          return;
        } catch (err) {
          console.warn('⚠️ [QuantumNet] Falha ao inicializar Firebase:', err);
        }
      }

      if (typeof Peer !== 'undefined') {
        this.backend = 'peerjs';
        console.info('⚛️ [QuantumNet] WebRTC P2P (PeerJS) disponível para conexão entre navegadores.');
      } else {
        this.backend = 'broadcast';
        console.info('⚛️ [QuantumNet] Usando canal de emaranhamento local (BroadcastChannel).');
      }
    }

    configurarCallbacks(callbacks) {
      this.callbacks = { ...this.callbacks, ...callbacks };
    }

    _novaSala(codigo, configPartida) {
      return {
        codigo,
        criadoEm: Date.now(),
        config: configPartida,
        status: 'aguardando',
        jogadores: {
          host: { id: this.clientId, ativo: true, onlineEm: Date.now() }
        },
        sorteioCores: null,
        estadoAtual: null
      };
    }

    /* ---------------------------------------------------------
     * HOST: gerar par emaranhado
     * --------------------------------------------------------- */
    async gerarParEmaranhado(configPartida) {
      this.papel = 'host';
      this.espectador = false;
      this._encerrado = false;

      // Com PeerJS, o código só é exibido depois de reservado com sucesso na rede
      // (evita colisão de códigos e "códigos fantasma" quando a rede P2P está fora do ar).
      let tentativas = 0;
      for (; ;) {
        this.salaId = this._gerarCodigoSala();
        this.salaDados = this._novaSala(this.salaId, configPartida);
        if (this.backend !== 'peerjs' || typeof Peer === 'undefined') break;
        try {
          await this._registrarHostPeerJS();
          break;
        } catch (err) {
          this._destruirPeer();
          if (err && err.type === 'unavailable-id' && ++tentativas < MAX_TENTATIVAS_CODIGO) continue;
          this.callbacks.onErro(new Error('Rede P2P indisponível no momento. Verifique sua conexão; o convite só funcionará entre abas do mesmo navegador.'));
          break;
        }
      }

      // Mantém BroadcastChannel e LocalStorage (abas do mesmo navegador) quando disponíveis
      this._iniciarBroadcastChannel();
      this._lsSet(`xq_sala_${this.salaId}`, JSON.stringify(this.salaDados));

      if (this.backend === 'firebase') {
        this.dbRef = this.database.ref(`salas/${this.salaId}`);
        await this.dbRef.set(this.salaDados);
        this._ouvirFirebase();
      }

      this.conectado = true;
      this._iniciarPingPeriodico();
      return {
        salaId: this.salaId,
        linkJogador: this.obterLinkConvite(false),
        linkEspectador: this.obterLinkConvite(true)
      };
    }

    _registrarHostPeerJS() {
      return new Promise((resolve, reject) => {
        let resolvido = false;
        const timer = setTimeout(() => {
          if (!resolvido) { resolvido = true; reject({ type: 'timeout' }); }
        }, PEER_TIMEOUT_MS);

        try {
          this.peer = new Peer(`xqpeer_${this.salaId}`, { debug: 1 });
        } catch (e) {
          clearTimeout(timer);
          reject(e);
          return;
        }

        this.peer.on('open', () => {
          console.info(`⚛️ [QuantumNet] Host P2P registrado na rede com chave: ${this.salaId}`);
          if (!resolvido) { resolvido = true; clearTimeout(timer); resolve(); }
        });
        this.peer.on('connection', (conn) => this._aoReceberConexaoHost(conn));
        this.peer.on('disconnected', () => this._reconectarSinalizacao());
        this.peer.on('error', (err) => {
          console.warn('⚠️ [QuantumNet] Aviso P2P Host:', err);
          if (!resolvido) { resolvido = true; clearTimeout(timer); reject(err); }
        });
      });
    }

    _aoReceberConexaoHost(conn) {
      console.info('⚛️ [QuantumNet] Conexão P2P recebida de outro observador!');
      this.conexoesP2P.push(conn);
      // A identificação (jogador ou telespectador) chega na mensagem GUEST_CONECTOU.
      conn.on('data', (dados) => this._tratarMensagemP2P(dados, conn));
      conn.on('close', () => this._aoFecharConexaoHost(conn));
      conn.on('error', (err) => console.warn('⚠️ [QuantumNet] Erro em conexão P2P:', err));
    }

    _aoFecharConexaoHost(conn) {
      if (this._encerrado) return;
      this.conexoesP2P = this.conexoesP2P.filter(c => c !== conn);
      const guest = this.salaDados?.jogadores?.guest;
      if (guest && conn._xqId && guest.id === conn._xqId) {
        guest.ativo = false;
        this.callbacks.onConexaoPerdida('guest');
      }
    }

    // Host: identifica quem chegou, decide papel e responde com o estado da sala.
    _aoGuestConectar(msg, conn) {
      const sala = this.salaDados;
      if (!sala) return;
      conn._xqId = msg.guestId;
      let forcarEspectador = false;

      if (!msg.espectador) {
        const guest = sala.jogadores.guest;
        if (guest && guest.ativo && guest.id !== msg.guestId) {
          forcarEspectador = true; // vaga de jogador já ocupada
        } else {
          if (!sala.sorteioCores) sala.sorteioCores = this._realizarSorteioCores();
          sala.status = 'jogando';
          sala.jogadores.guest = { id: msg.guestId, ativo: true, onlineEm: Date.now() };
        }
      }

      try { conn.send({ tipo: 'SALA_INIT', sala, forcarEspectador }); } catch (e) { }

      if (!msg.espectador && !forcarEspectador) {
        this._enviarParaTodosP2P({ tipo: 'SALA_UPDATE', sala }, conn); // avisa telespectadores já presentes
        this._processarMudancaSala(sala);
      }
    }

    /* ---------------------------------------------------------
     * GUEST / ESPECTADOR: conectar a um par existente
     * --------------------------------------------------------- */
    async conectarPar(codigoSala, comoEspectador = false) {
      this.salaId = this._normalizarCodigo(codigoSala);
      this.espectador = comoEspectador;
      this.papel = comoEspectador ? 'espectador' : 'guest';
      this._encerrado = false;

      this._iniciarBroadcastChannel();

      if (this.backend === 'firebase') {
        this.dbRef = this.database.ref(`salas/${this.salaId}`);
        const snapshot = await this.dbRef.once('value');
        const sala = snapshot.val();

        if (!sala) {
          throw new Error('Assinatura quântica não encontrada para este código.');
        }

        if (!this.espectador && sala.jogadores?.guest && sala.jogadores.guest.id !== this.clientId) {
          this.espectador = true;
          this.papel = 'espectador';
        }

        if (!this.espectador) {
          const sorteio = sala.sorteioCores || this._realizarSorteioCores();
          await this.dbRef.update({
            'status': 'jogando',
            'jogadores/guest': { id: this.clientId, ativo: true, onlineEm: Date.now() },
            'sorteioCores': sorteio
          });
        } else {
          await this.dbRef.child(`espectadores/${this.clientId}`).set({
            conectadoEm: Date.now()
          });
        }

        this._ouvirFirebase();
        this.conectado = true;
        return { salaId: this.salaId, papel: this.papel, espectador: this.espectador };
      }

      // 1. Tenta encontrar imediatamente no armazenamento local (mesmo navegador)
      const raw = this._lsGet(`xq_sala_${this.salaId}`);
      if (raw) {
        try {
          const sala = JSON.parse(raw);
          if (!this.espectador && sala.jogadores?.guest && sala.jogadores.guest.id !== this.clientId) {
            this.espectador = true;
            this.papel = 'espectador';
          }
          if (!this.espectador) {
            sala.status = 'jogando';
            sala.jogadores.guest = { id: this.clientId, ativo: true, onlineEm: Date.now() };
            sala.sorteioCores = sala.sorteioCores || this._realizarSorteioCores();
            this._lsSet(`xq_sala_${this.salaId}`, JSON.stringify(sala));
            this.canalBroadcast?.postMessage({ tipo: 'GUEST_CONECTOU', sala });
          }
          this.salaDados = sala;
          this._processarMudancaSala(sala);
          this.conectado = true;
        } catch (e) { }
      }

      // 2. Conecta também via WebRTC P2P (funciona entre navegadores e aparelhos diferentes)
      if (typeof Peer !== 'undefined') {
        await this._conectarGuestPeerJS();
      } else if (!this.conectado) {
        throw new Error('Assinatura quântica não encontrada. Verifique se o código está correto e se a partida foi gerada.');
      }

      this.conectado = true;
      this._iniciarPingPeriodico();
      return {
        salaId: this.salaId,
        papel: this.papel,
        espectador: this.espectador
      };
    }

    _conectarGuestPeerJS() {
      return new Promise((resolve, reject) => {
        let finalizado = false;
        const concluir = (erro) => {
          if (finalizado) return;
          finalizado = true;
          clearTimeout(timeout);
          if (erro && !this.conectado) reject(erro);
          else resolve();
        };
        const timeout = setTimeout(() => concluir(
          new Error('Tempo esgotado ao buscar assinatura quântica. Verifique o código informado e certifique-se de que o primeiro jogador gerou o par.')
        ), 7000);

        try {
          this.peer = new Peer({ debug: 1 });

          this.peer.on('open', () => {
            const hostPeerId = `xqpeer_${this.salaId}`;
            console.info(`⚛️ [QuantumNet] Tentando conexão P2P com host: ${hostPeerId}`);
            this._abrirCanalComHost(hostPeerId, () => concluir());
          });
          this.peer.on('disconnected', () => this._reconectarSinalizacao());
          this.peer.on('error', (err) => {
            console.warn('⚠️ [QuantumNet] Erro no PeerJS guest:', err);
            if (!finalizado && !this.conectado) {
              concluir(new Error('Assinatura quântica não encontrada na rede. Verifique a chave informada.'));
            }
          });
        } catch (err) {
          concluir(err);
        }
      });
    }

    // Abre (ou reabre) o canal de dados com o host e se identifica.
    _abrirCanalComHost(hostPeerId, aoAbrir) {
      const conn = this.peer.connect(hostPeerId, { reliable: true });
      this.connP2P = conn;

      conn.on('open', () => {
        console.info('⚛️ [QuantumNet] Canal P2P aberto com sucesso com o Host!');
        this._ultimoSinal = Date.now();
        conn.send({ tipo: 'GUEST_CONECTOU', guestId: this.clientId, espectador: this.espectador });
        if (aoAbrir) aoAbrir();
      });
      conn.on('data', (dados) => {
        this._ultimoSinal = Date.now();
        this._tratarMensagemP2P(dados, conn);
      });
      conn.on('close', () => { if (this.connP2P === conn) this._aoPerderHost(); });
      conn.on('error', (err) => console.warn('⚠️ [QuantumNet] Erro de conexão P2P:', err));
      return conn;
    }

    /* ---------------------------------------------------------
     * Mensagens P2P
     * --------------------------------------------------------- */
    _tratarMensagemP2P(msg, conn) {
      if (!msg) return;
      const ehHost = this.papel === 'host';

      switch (msg.tipo) {
        case 'SALA_INIT':
        case 'SALA_UPDATE':
          if (msg.forcarEspectador && this.papel !== 'espectador') {
            this.espectador = true;
            this.papel = 'espectador';
          }
          this.salaDados = msg.sala;
          this._processarMudancaSala(msg.sala);
          break;

        case 'GUEST_CONECTOU':
          if (ehHost) this._aoGuestConectar(msg, conn);
          break;

        case 'ESTADO_ATUALIZADO':
          if (!msg.sala) break;
          this._processarMudancaSala(msg.sala);
          if (ehHost) {
            // Retransmite para os demais (ex.: telespectadores) a cópia autoritativa da sala
            this._enviarParaTodosP2P({ tipo: 'ESTADO_ATUALIZADO', sala: this.salaDados }, conn);
          }
          break;

        case 'FIM_PARTIDA':
          if (ehHost && this.salaDados) this.salaDados.resultado = msg.resultado;
          if (!this.partidaEncerradaNotificada) {
            this.partidaEncerradaNotificada = true;
            this.callbacks.onFimPartida(msg.resultado);
          }
          if (ehHost) this._enviarParaTodosP2P(msg, conn);
          break;

        case 'PING':
          try { conn.send({ tipo: 'PONG', t: msg.t }); } catch (e) { }
          break;

        case 'PONG':
          if (typeof msg.t === 'number') {
            const rtt = Date.now() - msg.t;
            if (rtt >= 0 && rtt < 30000) {
              // Média móvel: suaviza picos de rede
              this.latenciaEstimadaMs = Math.max(5, Math.round(this.latenciaEstimadaMs * 0.6 + (rtt / 2) * 0.4));
            }
          }
          break;
      }
    }

    _enviarParaTodosP2P(msg, exceto = null) {
      if (this.conexoesP2P && this.conexoesP2P.length) {
        this.conexoesP2P.forEach(conn => {
          if (conn === exceto) return;
          try {
            if (conn.open) conn.send(msg);
          } catch (e) { }
        });
      }
      if (this.connP2P && this.connP2P !== exceto && this.connP2P.open) {
        try {
          this.connP2P.send(msg);
        } catch (e) { }
      }
    }

    /* ---------------------------------------------------------
     * Robustez: ping, reconexão e retorno do segundo plano
     * --------------------------------------------------------- */
    _iniciarPingPeriodico() {
      if (this._timerPing) return;
      this._timerPing = setInterval(() => {
        if (this._encerrado) return;
        this._enviarParaTodosP2P({ tipo: 'PING', t: Date.now() });
        // Convidado: se o host ficou mudo por tempo demais, o canal provavelmente morreu em silêncio
        if (this.papel !== 'host' && this.connP2P && this.connP2P.open && this._ultimoSinal &&
          Date.now() - this._ultimoSinal > LIMITE_SEM_SINAL_MS) {
          try { this.connP2P.close(); } catch (e) { }
          this._aoPerderHost();
        }
      }, INTERVALO_PING_MS);
    }

    _reconectarSinalizacao(tentativa = 1) {
      if (this._encerrado || !this.peer || this.peer.destroyed || tentativa > 5) return;
      if (this._timerSinalizacao) return;
      this._timerSinalizacao = setTimeout(() => {
        this._timerSinalizacao = null;
        if (this._encerrado || !this.peer || this.peer.destroyed) return;
        if (this.peer.disconnected) {
          try { this.peer.reconnect(); } catch (e) { }
          this._reconectarSinalizacao(tentativa + 1);
        }
      }, Math.min(1000 * tentativa, 5000));
    }

    _aoPerderHost() {
      if (this._encerrado || this.papel === 'host') return;
      this.callbacks.onConexaoPerdida('host');
      this._tentarReconectarGuest(1);
    }

    _tentarReconectarGuest(n) {
      if (this._encerrado || this.papel === 'host') return;
      if (n === 1 && this._reconectando) return;
      this._reconectando = true;

      if (n > MAX_TENTATIVAS_RECONEXAO) {
        this._reconectando = false;
        this.callbacks.onErro(new Error('Não foi possível restabelecer a conexão com o par. Reabra o convite para entrar novamente.'));
        return;
      }

      setTimeout(() => {
        if (this._encerrado) return;
        this._destruirPeer();
        let resolvido = false;
        const falhar = () => {
          if (resolvido) return;
          resolvido = true;
          this._tentarReconectarGuest(n + 1);
        };
        const limite = setTimeout(falhar, PEER_TIMEOUT_MS);
        try {
          this.peer = new Peer({ debug: 1 });
          this.peer.on('error', () => { clearTimeout(limite); falhar(); });
          this.peer.on('disconnected', () => this._reconectarSinalizacao());
          this.peer.on('open', () => {
            this._abrirCanalComHost(`xqpeer_${this.salaId}`, () => {
              if (resolvido) return;
              resolvido = true;
              clearTimeout(limite);
              this._reconectando = false;
              this.callbacks.onConexaoRestabelecida();
            });
          });
        } catch (e) {
          clearTimeout(limite);
          falhar();
        }
      }, Math.min(1000 * Math.pow(2, n - 1), 8000));
    }

    // Deve ser chamado quando a aba volta ao primeiro plano (visibilitychange).
    aoVoltarAoPrimeiroPlano() {
      if (!this.conectado || this._encerrado) return;
      if (this.peer && this.peer.disconnected && !this.peer.destroyed) {
        try { this.peer.reconnect(); } catch (e) { }
      }
      if (this.papel !== 'host' && this.backend === 'peerjs' && (!this.connP2P || !this.connP2P.open)) {
        this._tentarReconectarGuest(1);
      }
    }

    _destruirPeer() {
      if (this.peer) {
        try { this.peer.destroy(); } catch (e) { }
        this.peer = null;
      }
      this.connP2P = null;
    }

    _realizarSorteioCores() {
      const hostBrancas = Math.random() >= 0.5;
      return {
        host: hostBrancas ? 'w' : 'b',
        guest: hostBrancas ? 'b' : 'w'
      };
    }

    /* ---------------------------------------------------------
     * Firebase / BroadcastChannel (opcionais)
     * --------------------------------------------------------- */
    _ouvirFirebase() {
      if (!this.dbRef) return;
      this.dbRef.on('value', (snapshot) => {
        const dados = snapshot.val();
        if (!dados) return;
        this._processarMudancaSala(dados);
      });
    }

    _iniciarBroadcastChannel() {
      if (this.canalBroadcast) return;
      // Ausente em iOS < 15.4 e em alguns webviews: o modo P2P continua funcionando sem ele.
      if (typeof global.BroadcastChannel === 'undefined') return;
      try {
        this.canalBroadcast = new global.BroadcastChannel(`quantum_net_${this.salaId}`);
      } catch (e) {
        this.canalBroadcast = null;
        return;
      }
      this.canalBroadcast.onmessage = (evento) => {
        const msg = evento.data;
        if (!msg) return;

        if (msg.tipo === 'GUEST_CONECTOU' || msg.tipo === 'ESTADO_ATUALIZADO') {
          this._processarMudancaSala(msg.sala);
        } else if (msg.tipo === 'FIM_PARTIDA') {
          this.callbacks.onFimPartida(msg.resultado);
        }
      };
    }

    /* ---------------------------------------------------------
     * Estado da sala
     * --------------------------------------------------------- */
    _processarMudancaSala(sala) {
      if (!sala) return;

      if (sala.sorteioCores && !this.parEmaranhado) {
        this.parEmaranhado = true;
        if (this.espectador) {
          this.cor = null;
        } else {
          this.cor = this.papel === 'host' ? sala.sorteioCores.host : sala.sorteioCores.guest;
        }

        this.callbacks.onParEmaranhado({
          salaId: this.salaId,
          papel: this.papel,
          cor: this.cor,
          espectador: this.espectador,
          config: sala.config
        });
      }

      const estado = sala.estadoAtual;
      if (estado) {
        // Ordena por número de sequência (nº de lances). O relógio do aparelho (Date.now)
        // só é usado como reserva para estados de versões antigas, sem `seq`.
        const temSeq = typeof estado.seq === 'number';
        const maisNovo = temSeq ? estado.seq > this.ultimaSeq : estado.timestamp > this.ultimoTimestampEstado;
        if (maisNovo && estado.autorId !== this.clientId) {
          if (temSeq) this.ultimaSeq = estado.seq;
          this.ultimoTimestampEstado = estado.timestamp || 0;
          if (this.salaDados && this.salaDados !== sala) this.salaDados.estadoAtual = estado;
          this.callbacks.onEstadoRecebido(estado);
        }
      }

      if (sala.resultado && !this.partidaEncerradaNotificada) {
        this.partidaEncerradaNotificada = true;
        this.callbacks.onFimPartida(sala.resultado);
      }
    }

    enviarEstado(snapshotEstado, mensagemLance = '') {
      if (!this.conectado || this.espectador) return;

      const agora = Date.now();
      const bonusLatencia = Math.min(Math.round(this.latenciaEstimadaMs / 1000 * 10) / 10, 2.0);
      const seq = (snapshotEstado.historicoLances || []).length;

      const dadosEstado = {
        fen: snapshotEstado.fen,
        pecasQuanticas: snapshotEstado.pecasQuanticas,
        gruposFlanco: snapshotEstado.gruposFlanco,
        relogio: snapshotEstado.relogio,
        vez: snapshotEstado.vez,
        ultimoLance: snapshotEstado.ultimoLance,
        historicoLances: snapshotEstado.historicoLances || [],
        mensagem: mensagemLance,
        autorId: this.clientId,
        seq,
        timestamp: agora,
        bonusLatenciaCompensado: bonusLatencia
      };

      this.ultimaSeq = Math.max(this.ultimaSeq, seq);
      this.ultimoTimestampEstado = agora;

      // A cópia em memória é a fonte de verdade; o localStorage é só um espelho para outras abas.
      const sala = this.salaDados || { codigo: this.salaId };
      sala.estadoAtual = dadosEstado;
      this.salaDados = sala;

      this._lsSet(`xq_sala_${this.salaId}`, JSON.stringify(sala));

      if (this.canalBroadcast) {
        try { this.canalBroadcast.postMessage({ tipo: 'ESTADO_ATUALIZADO', sala }); } catch (e) { }
      }

      this._enviarParaTodosP2P({ tipo: 'ESTADO_ATUALIZADO', sala });

      if (this.backend === 'firebase' && this.dbRef) {
        this.dbRef.child('estadoAtual').set(dadosEstado);
      }
    }

    enviarFimPartida(vencedor, motivo) {
      if (!this.conectado || this.espectador) return;
      const payload = {
        encerrada: true,
        vencedor,
        motivo,
        porId: this.clientId,
        timestamp: Date.now()
      };

      this.partidaEncerradaNotificada = true;
      if (this.salaDados) this.salaDados.resultado = payload;

      if (this.canalBroadcast) {
        try { this.canalBroadcast.postMessage({ tipo: 'FIM_PARTIDA', resultado: payload }); } catch (e) { }
      }

      this._enviarParaTodosP2P({ tipo: 'FIM_PARTIDA', resultado: payload });

      if (this.backend === 'firebase' && this.dbRef) {
        this.dbRef.child('resultado').set(payload);
      }
    }

    obterLinkConvite(comoEspectador = false) {
      const url = new URL(global.location.href);
      url.searchParams.set('par', this.salaId);
      if (comoEspectador) {
        url.searchParams.set('espectador', '1');
      } else {
        url.searchParams.delete('espectador');
      }
      return url.toString();
    }

    desconectar() {
      this._encerrado = true;
      if (this._timerPing) { clearInterval(this._timerPing); this._timerPing = null; }
      if (this._timerSinalizacao) { clearTimeout(this._timerSinalizacao); this._timerSinalizacao = null; }
      if (this.dbRef && this.backend === 'firebase') {
        this.dbRef.off();
      }
      if (this.canalBroadcast) {
        try { this.canalBroadcast.close(); } catch (e) { }
        this.canalBroadcast = null;
      }
      if (this.papel === 'host' && this.salaId) this._lsRemove(`xq_sala_${this.salaId}`);
      this._destruirPeer();
      this.conexoesP2P = [];
      this.conectado = false;
      this.parEmaranhado = false;
    }
  }

  global.QuantumNet = QuantumNet;

})(window);
