/**
 * Quantum Network Engine - Ação Fantasmagórica à Distância
 * Sincronização em tempo real de partidas de Xadrez Quântico.
 * 
 * Suporta:
 * - WebRTC P2P (via PeerJS: conexão direta gratuita entre navegadores e celulares diferentes)
 * - BroadcastChannel API + LocalStorage (emaranhamento local instantâneo entre abas)
 * - Firebase Realtime Database (opcional, para persistência em nuvem)
 * - Códigos curtos amigáveis para mobile (somente letras, sem hífens)
 * - Pareamento de observadores com sorteio de cores no entrelaçamento
 * - Modo Observador Passivo (Telespectador)
 * - Compensação dinâmica de latência por lance
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
      this.tempoEnvioLance = 0;
      this.latenciaEstimadaMs = 50;
      this.ultimoTimestampEstado = 0;
      this.partidaEncerradaNotificada = false;
      this.salaDados = null;

      // Callbacks fornecidos pelo script.js
      this.callbacks = {
        onConectado: () => { },
        onParEmaranhado: (dados) => { },
        onEstadoRecebido: (estado) => { },
        onDesconexaoObservador: (dados) => { },
        onFimPartida: (dados) => { },
        onErro: (erro) => { }
      };

      this._inicializarBackend();
    }

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

    async gerarParEmaranhado(configPartida) {
      this.salaId = this._gerarCodigoSala();
      this.papel = 'host';
      this.espectador = false;

      const salaInicial = {
        codigo: this.salaId,
        criadoEm: Date.now(),
        config: configPartida,
        status: 'aguardando',
        jogadores: {
          host: { id: this.clientId, ativo: true, onlineEm: Date.now() }
        },
        sorteioCores: null,
        estadoAtual: null
      };

      this.salaDados = salaInicial;

      // Mantém sempre BroadcastChannel e LocalStorage ativos (para abas no mesmo navegador)
      this._iniciarBroadcastChannel();
      try {
        localStorage.setItem(`xq_sala_${this.salaId}`, JSON.stringify(salaInicial));
      } catch (e) { }

      if (this.backend === 'firebase') {
        this.dbRef = this.database.ref(`salas/${this.salaId}`);
        await this.dbRef.set(salaInicial);
        this._ouvirFirebase();
      } else if (typeof Peer !== 'undefined') {
        this._iniciarHostPeerJS(salaInicial);
      }

      this.conectado = true;
      return {
        salaId: this.salaId,
        linkJogador: this.obterLinkConvite(false),
        linkEspectador: this.obterLinkConvite(true)
      };
    }

    _iniciarHostPeerJS(salaInicial) {
      try {
        const peerId = `xqpeer_${this.salaId}`;
        this.peer = new Peer(peerId, { debug: 1 });

        this.peer.on('open', (id) => {
          console.info(`⚛️ [QuantumNet] Host P2P registrado na rede com chave: ${this.salaId}`);
        });

        this.peer.on('connection', (conn) => {
          console.info('⚛️ [QuantumNet] Conexão P2P recebida de outro observador!');
          this.conexoesP2P.push(conn);

          conn.on('open', () => {
            // Se ainda não houve sorteio de cores, realiza agora
            if (!this.salaDados.sorteioCores) {
              this.salaDados.sorteioCores = this._realizarSorteioCores();
              this.salaDados.status = 'jogando';
            }
            conn.send({
              tipo: 'SALA_INIT',
              sala: this.salaDados
            });
            this._processarMudancaSala(this.salaDados);
          });

          conn.on('data', (dados) => {
            this._tratarMensagemP2P(dados);
          });
        });

        this.peer.on('error', (err) => {
          console.warn('⚠️ [QuantumNet] Aviso P2P Host:', err);
        });
      } catch (e) {
        console.warn('⚠️ [QuantumNet] Não foi possível iniciar Host PeerJS:', e);
      }
    }

    async conectarPar(codigoSala, comoEspectador = false) {
      this.salaId = this._normalizarCodigo(codigoSala);
      this.espectador = comoEspectador;
      this.papel = comoEspectador ? 'espectador' : 'guest';

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
      const raw = localStorage.getItem(`xq_sala_${this.salaId}`);
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
            localStorage.setItem(`xq_sala_${this.salaId}`, JSON.stringify(sala));
            this.canalBroadcast?.postMessage({ tipo: 'GUEST_CONECTOU', sala });
          }
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
      return {
        salaId: this.salaId,
        papel: this.papel,
        espectador: this.espectador
      };
    }

    _conectarGuestPeerJS() {
      return new Promise((resolve, reject) => {
        let finalizado = false;
        const timeout = setTimeout(() => {
          if (!finalizado) {
            finalizado = true;
            if (this.conectado) {
              resolve();
            } else {
              reject(new Error('Tempo esgotado ao buscar assinatura quântica. Verifique o código informado e certifique-se de que o primeiro jogador gerou o par.'));
            }
          }
        }, 7000);

        try {
          this.peer = new Peer({ debug: 1 });

          this.peer.on('open', () => {
            const hostPeerId = `xqpeer_${this.salaId}`;
            console.info(`⚛️ [QuantumNet] Tentando conexão P2P com host: ${hostPeerId}`);
            this.connP2P = this.peer.connect(hostPeerId, { reliable: true });

            this.connP2P.on('open', () => {
              console.info('⚛️ [QuantumNet] Canal P2P aberto com sucesso com o Host!');
              this.connP2P.send({
                tipo: 'GUEST_CONECTOU',
                guestId: this.clientId,
                espectador: this.espectador
              });
              if (!finalizado) {
                finalizado = true;
                clearTimeout(timeout);
                resolve();
              }
            });

            this.connP2P.on('data', (dados) => {
              this._tratarMensagemP2P(dados);
              if (!finalizado) {
                finalizado = true;
                clearTimeout(timeout);
                resolve();
              }
            });

            this.connP2P.on('error', (err) => {
              console.warn('⚠️ [QuantumNet] Erro de conexão P2P:', err);
            });
          });

          this.peer.on('error', (err) => {
            console.warn('⚠️ [QuantumNet] Erro no PeerJS guest:', err);
            if (!finalizado && !this.conectado) {
              finalizado = true;
              clearTimeout(timeout);
              reject(new Error('Assinatura quântica não encontrada na rede. Verifique a chave informada.'));
            }
          });
        } catch (err) {
          if (!finalizado) {
            finalizado = true;
            clearTimeout(timeout);
            if (this.conectado) resolve();
            else reject(err);
          }
        }
      });
    }

    _tratarMensagemP2P(msg) {
      if (!msg) return;
      if (msg.tipo === 'SALA_INIT' || msg.tipo === 'SALA_UPDATE') {
        this.salaDados = msg.sala;
        this._processarMudancaSala(msg.sala);
      } else if (msg.tipo === 'GUEST_CONECTOU') {
        if (this.papel === 'host' && this.salaDados) {
          if (!this.salaDados.sorteioCores) {
            this.salaDados.sorteioCores = this._realizarSorteioCores();
          }
          this.salaDados.status = 'jogando';
          this.salaDados.jogadores.guest = { id: msg.guestId, ativo: true, onlineEm: Date.now() };
          this._enviarParaTodosP2P({ tipo: 'SALA_UPDATE', sala: this.salaDados });
          this._processarMudancaSala(this.salaDados);
        }
      } else if (msg.tipo === 'ESTADO_ATUALIZADO') {
        if (msg.sala) this._processarMudancaSala(msg.sala);
      } else if (msg.tipo === 'FIM_PARTIDA') {
        this.callbacks.onFimPartida(msg.resultado);
      }
    }

    _enviarParaTodosP2P(msg) {
      if (this.conexoesP2P && this.conexoesP2P.length) {
        this.conexoesP2P.forEach(conn => {
          try {
            if (conn.open) conn.send(msg);
          } catch (e) { }
        });
      }
      if (this.connP2P && this.connP2P.open) {
        try {
          this.connP2P.send(msg);
        } catch (e) { }
      }
    }

    _realizarSorteioCores() {
      const hostBrancas = Math.random() >= 0.5;
      return {
        host: hostBrancas ? 'w' : 'b',
        guest: hostBrancas ? 'b' : 'w'
      };
    }

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
      this.canalBroadcast = new BroadcastChannel(`quantum_net_${this.salaId}`);
      this.canalBroadcast.onmessage = (evento) => {
        const msg = evento.data;
        if (!msg) return;

        if (msg.tipo === 'GUEST_CONECTOU' || msg.tipo === 'ESTADO_ATUALIZADO') {
          this._processarMudancaSala(msg.sala);
        } else if (msg.tipo === 'FIM_PARTIDA') {
          this.callbacks.onFimPartida(msg.resultado);
        } else if (msg.tipo === 'PING') {
          this.canalBroadcast.postMessage({ tipo: 'PONG', timestamp: msg.timestamp });
        } else if (msg.tipo === 'PONG') {
          this.latenciaEstimadaMs = Math.max(10, Math.round((Date.now() - msg.timestamp) / 2));
        }
      };
    }

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

      if (sala.estadoAtual && sala.estadoAtual.timestamp > this.ultimoTimestampEstado) {
        this.ultimoTimestampEstado = sala.estadoAtual.timestamp;
        this.callbacks.onEstadoRecebido(sala.estadoAtual);
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
        timestamp: agora,
        bonusLatenciaCompensado: bonusLatencia
      };

      this.ultimoTimestampEstado = agora;

      const raw = localStorage.getItem(`xq_sala_${this.salaId}`);
      const sala = raw ? JSON.parse(raw) : (this.salaDados || { codigo: this.salaId });
      sala.estadoAtual = dadosEstado;
      this.salaDados = sala;

      try {
        localStorage.setItem(`xq_sala_${this.salaId}`, JSON.stringify(sala));
      } catch (e) { }

      if (this.canalBroadcast) {
        this.canalBroadcast.postMessage({ tipo: 'ESTADO_ATUALIZADO', sala });
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

      if (this.canalBroadcast) {
        this.canalBroadcast.postMessage({ tipo: 'FIM_PARTIDA', resultado: payload });
      }

      this._enviarParaTodosP2P({ tipo: 'FIM_PARTIDA', resultado: payload });

      if (this.backend === 'firebase' && this.dbRef) {
        this.dbRef.child('resultado').set(payload);
      }
    }

    obterLinkConvite(comoEspectador = false) {
      const url = new URL(window.location.href);
      url.searchParams.set('par', this.salaId);
      if (comoEspectador) {
        url.searchParams.set('espectador', '1');
      } else {
        url.searchParams.delete('espectador');
      }
      return url.toString();
    }

    desconectar() {
      if (this.dbRef && this.backend === 'firebase') {
        this.dbRef.off();
      }
      if (this.canalBroadcast) {
        this.canalBroadcast.close();
        this.canalBroadcast = null;
      }
      if (this.peer) {
        try {
          this.peer.destroy();
        } catch (e) { }
        this.peer = null;
      }
      this.conexoesP2P = [];
      this.connP2P = null;
      this.conectado = false;
      this.parEmaranhado = false;
    }
  }

  global.QuantumNet = QuantumNet;

})(window);
