/**
 * Quantum Network Engine - Ação Fantasmagórica à Distância
 * Sincronização em tempo real de partidas de Xadrez Quântico.
 * 
 * Suporta:
 * - Firebase Realtime Database (modo online em nuvem)
 * - BroadcastChannel API (fallback automático para testes locais entre abas)
 * - Pareamento de observadores com sorteio de cores no entrelaçamento
 * - Modo Observador Passivo (Telespectador)
 * - Compensação dinâmica de latência por lance
 */

(function (global) {
  'use strict';

  // Configuração padrão do Firebase.
  // Substitua pelos dados do seu console Firebase (Projeto -> Configurações -> Web App)
  // Caso não preenchido, o jogo entrará automaticamente em modo 'Simulação Quântica Local'
  // permitindo testes imediatos entre duas abas ou janelas no mesmo computador.
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
      this.backend = 'broadcast'; // 'firebase' ou 'broadcast'
      this.canalBroadcast = null;
      this.dbRef = null;
      this.tempoEnvioLance = 0;
      this.latenciaEstimadaMs = 60;
      this.ultimoTimestampEstado = 0;

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
      const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
      let codigo = 'xq-';
      for (let i = 0; i < 4; i++) {
        codigo += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return codigo;
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
          console.warn('⚠️ [QuantumNet] Falha ao inicializar Firebase. Alternando para BroadcastChannel:', err);
        }
      }

      this.backend = 'broadcast';
      console.info('⚛️ [QuantumNet] Usando canal de emaranhamento local (BroadcastChannel).');
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

      if (this.backend === 'firebase') {
        this.dbRef = this.database.ref(`salas/${this.salaId}`);
        await this.dbRef.set(salaInicial);
        this._ouvirFirebase();
      } else {
        this._iniciarBroadcastChannel();
        localStorage.setItem(`xq_sala_${this.salaId}`, JSON.stringify(salaInicial));
      }

      this.conectado = true;
      return {
        salaId: this.salaId,
        linkJogador: this.obterLinkConvite(false),
        linkEspectador: this.obterLinkConvite(true)
      };
    }

    async conectarPar(codigoSala, comoEspectador = false) {
      this.salaId = codigoSala.toLowerCase().trim();
      this.espectador = comoEspectador;
      this.papel = comoEspectador ? 'espectador' : 'guest';

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
      } else {
        this._iniciarBroadcastChannel();
        const raw = localStorage.getItem(`xq_sala_${this.salaId}`);
        if (!raw) {
          throw new Error('Assinatura quântica local não encontrada.');
        }
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
          this.canalBroadcast.postMessage({ tipo: 'GUEST_CONECTOU', sala });
        }

        this._processarMudancaSala(sala);
      }

      this.conectado = true;
      return {
        salaId: this.salaId,
        papel: this.papel,
        espectador: this.espectador
      };
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
        mensagem: mensagemLance,
        autorId: this.clientId,
        timestamp: agora,
        bonusLatenciaCompensado: bonusLatencia
      };

      this.ultimoTimestampEstado = agora;

      if (this.backend === 'firebase' && this.dbRef) {
        this.dbRef.child('estadoAtual').set(dadosEstado);
      } else if (this.canalBroadcast) {
        const raw = localStorage.getItem(`xq_sala_${this.salaId}`);
        const sala = raw ? JSON.parse(raw) : { codigo: this.salaId };
        sala.estadoAtual = dadosEstado;
        localStorage.setItem(`xq_sala_${this.salaId}`, JSON.stringify(sala));
        this.canalBroadcast.postMessage({ tipo: 'ESTADO_ATUALIZADO', sala });
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

      if (this.backend === 'firebase' && this.dbRef) {
        this.dbRef.child('resultado').set(payload);
      } else if (this.canalBroadcast) {
        this.canalBroadcast.postMessage({ tipo: 'FIM_PARTIDA', resultado: payload });
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
      this.conectado = false;
      this.parEmaranhado = false;
    }
  }

  global.QuantumNet = QuantumNet;

})(window);
