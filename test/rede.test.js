// Simula dois/três "aparelhos" (contextos vm separados) ligados por um PeerJS falso em memória.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const alvo = path.resolve(process.argv[2] || path.join(__dirname, '..', 'quantum-net.js'));
const codigoFonte = fs.readFileSync(alvo, 'utf8');
const esperar = ms => new Promise(r => setTimeout(r, ms));
async function ate(cond, ms = 2500) {
  const fim = Date.now() + ms;
  while (Date.now() < fim) { if (cond()) return true; await esperar(20); }
  return false;
}

/* ---------- PeerJS falso ---------- */
function criarRede() {
  const registro = new Map();
  class Emissor {
    constructor() { this._l = {}; }
    on(e, f) { (this._l[e] = this._l[e] || []).push(f); return this; }
    emit(e, ...a) { (this._l[e] || []).forEach(f => f(...a)); }
  }
  class Conn extends Emissor {
    constructor(peer, metadata) { super(); this.peer = peer; this.open = false; this.par = null; this.metadata = metadata; }
    send(d) {
      if (!this.open) throw new Error('conexão fechada');
      const copia = JSON.parse(JSON.stringify(d));
      setTimeout(() => this.par && this.par.open && this.par.emit('data', copia), 1);
    }
    close() {
      if (!this.open) return;
      this.open = false; this.emit('close');
      if (this.par && this.par.open) { this.par.open = false; this.par.emit('close'); }
    }
  }
  class Peer extends Emissor {
    constructor(id) {
      super();
      this.destroyed = false; this.disconnected = false; this.conns = [];
      this.id = id || 'anon_' + Math.random().toString(36).slice(2, 8);
      setTimeout(() => {
        if (registro.has(this.id)) return this.emit('error', { type: 'unavailable-id' });
        registro.set(this.id, this); this.emit('open', this.id);
      }, 1);
    }
    connect(id, opts = {}) {
      const c = new Conn(this, opts.metadata); this.conns.push(c);
      setTimeout(() => {
        const alvoPeer = registro.get(id);
        if (!alvoPeer || alvoPeer.destroyed) return this.emit('error', { type: 'peer-unavailable' });
        const c2 = new Conn(alvoPeer, c.metadata); c.par = c2; c2.par = c; alvoPeer.conns.push(c2);
        alvoPeer.emit('connection', c2);
        setTimeout(() => { c.open = true; c2.open = true; c.emit('open'); c2.emit('open'); }, 1);
      }, 1);
      return c;
    }
    reconnect() { this.disconnected = false; }
    destroy() {
      this.destroyed = true; registro.delete(this.id);
      this.conns.forEach(c => c.close());
    }
  }
  return Peer;
}

/* ---------- "Aparelho" ---------- */
function criarAparelho(Peer, { desvioRelogioMs = 0, storage = 'ok' } = {}) {
  const mem = {};
  const localStorage = storage === 'bloqueado'
    ? { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('SecurityError'); }, removeItem() { throw new Error('SecurityError'); }, key() { return null; }, get length() { return 0; } }
    : { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; }, key: i => Object.keys(mem)[i] || null, get length() { return Object.keys(mem).length; } };
  const RealDate = Date;
  class DateDesviada extends RealDate {
    constructor(...a) { if (a.length) super(...a); else super(RealDate.now() + desvioRelogioMs); }
    static now() { return RealDate.now() + desvioRelogioMs; }
  }
  const sandbox = {
    Peer, localStorage, Date: DateDesviada, console: { info() {}, warn() {}, log() {}, error() {} },
    setTimeout, clearTimeout, setInterval, clearInterval, Math, JSON, URL, URLSearchParams, Promise, Error, Object, Array, Set,
    navigator: {}, BroadcastChannel: process.env.BC ? class { postMessage() {} close() {} } : undefined
  };
  sandbox.window = sandbox; sandbox.window.location = { href: 'https://exemplo.test/index.html' };
  vm.createContext(sandbox);
  vm.runInContext(codigoFonte, sandbox, { filename: alvo });
  const net = new sandbox.QuantumNet();
  const eventos = { pares: [], estados: [], fins: [], perdas: 0, restabelecida: 0, erros: [] };
  net.configurarCallbacks({
    onParEmaranhado: d => eventos.pares.push(d),
    onEstadoRecebido: e => eventos.estados.push(e),
    onFimPartida: r => eventos.fins.push(r),
    onConexaoPerdida: () => { eventos.perdas++; },
    onConexaoRestabelecida: () => { eventos.restabelecida++; },
    onErro: e => eventos.erros.push(e)
  });
  return { net, eventos };
}
const snap = n => ({
  fen: 'fen' + n, pecasQuanticas: {}, gruposFlanco: {}, relogio: { w: 600, b: 600 }, vez: 'w',
  ultimoLance: { origem: 'a2', destino: 'a3', san: 'a3' }, historicoLances: Array.from({ length: n }, (_, i) => ({ san: 'm' + i }))
});

let ok = 0, falhas = 0;
async function teste(nome, fn) {
  try { await fn(); ok++; console.log('  ✔', nome); }
  catch (e) { falhas++; console.log('  ✘', nome, '\n     ', String(e.message).split('\n')[0]); }
}

(async () => {
  console.log('Rede P2P (Peer simulado)');

  await teste('Pareamento: cores complementares e ambos recebem onParEmaranhado', async () => {
    const Peer = criarRede(); const A = criarAparelho(Peer), B = criarAparelho(Peer);
    const { salaId } = await A.net.gerarParEmaranhado({ modo: 'quantico' });
    await B.net.conectarPar(salaId, false);
    assert.ok(await ate(() => A.eventos.pares.length && B.eventos.pares.length), 'pareamento não concluiu');
    assert.notStrictEqual(A.eventos.pares[0].cor, B.eventos.pares[0].cor);
  });

  await teste('Relógios de aparelhos diferentes (host adiantado 60 s): resposta do convidado NÃO é descartada', async () => {
    const Peer = criarRede(); const A = criarAparelho(Peer, { desvioRelogioMs: 60000 }), B = criarAparelho(Peer);
    const { salaId } = await A.net.gerarParEmaranhado({}); await B.net.conectarPar(salaId, false);
    await ate(() => A.eventos.pares.length && B.eventos.pares.length);
    A.net.enviarEstado(snap(1), 'lance 1');
    assert.ok(await ate(() => B.eventos.estados.length === 1), 'convidado não recebeu o lance do host');
    B.net.enviarEstado(snap(2), 'lance 2');
    assert.ok(await ate(() => A.eventos.estados.length === 1), 'host descartou o lance do convidado (relógios diferentes)');
  });

  await teste('Telespectador vê os lances dos DOIS jogadores', async () => {
    const Peer = criarRede(); const A = criarAparelho(Peer), B = criarAparelho(Peer), E = criarAparelho(Peer);
    const { salaId } = await A.net.gerarParEmaranhado({}); await B.net.conectarPar(salaId, false);
    await ate(() => A.eventos.pares.length && B.eventos.pares.length);
    await E.net.conectarPar(salaId, true);
    assert.ok(await ate(() => E.eventos.pares.length), 'espectador não entrou na partida');
    A.net.enviarEstado(snap(1), '1'); await ate(() => B.eventos.estados.length === 1);
    B.net.enviarEstado(snap(2), '2'); await ate(() => A.eventos.estados.length === 1);
    A.net.enviarEstado(snap(3), '3');
    assert.ok(await ate(() => E.eventos.estados.length >= 3, 1500),
      `espectador recebeu ${E.eventos.estados.length}/3 lances`);
  });

  await teste('Espectador que entra no meio da partida recebe o estado mais recente', async () => {
    const Peer = criarRede(); const A = criarAparelho(Peer), B = criarAparelho(Peer), E = criarAparelho(Peer);
    const { salaId } = await A.net.gerarParEmaranhado({}); await B.net.conectarPar(salaId, false);
    await ate(() => A.eventos.pares.length && B.eventos.pares.length);
    A.net.enviarEstado(snap(1), '1'); await ate(() => B.eventos.estados.length === 1);
    B.net.enviarEstado(snap(2), '2'); await ate(() => A.eventos.estados.length === 1);
    await E.net.conectarPar(salaId, true);
    await ate(() => E.eventos.estados.length >= 1, 1500);
    const ultimo = E.eventos.estados[E.eventos.estados.length - 1];
    assert.ok(ultimo && ultimo.historicoLances.length === 2, 'espectador tardio não viu o lance 2');
  });

  await teste('Terceiro "jogador" vira telespectador e não recebe cor', async () => {
    const Peer = criarRede(); const A = criarAparelho(Peer), B = criarAparelho(Peer), C = criarAparelho(Peer);
    const { salaId } = await A.net.gerarParEmaranhado({}); await B.net.conectarPar(salaId, false);
    await ate(() => A.eventos.pares.length && B.eventos.pares.length);
    await C.net.conectarPar(salaId, false);
    await ate(() => C.eventos.pares.length, 1500);
    const p = C.eventos.pares[0];
    assert.ok(p, 'terceiro aparelho não entrou');
    assert.strictEqual(p.espectador, true, 'terceiro aparelho deveria ser espectador');
    assert.ok(!p.cor, 'espectador não pode ter cor');
  });

  await teste('Armazenamento local bloqueado (Safari privado / webview): pareamento e lances funcionam', async () => {
    const Peer = criarRede(); const A = criarAparelho(Peer, { storage: 'bloqueado' }), B = criarAparelho(Peer, { storage: 'bloqueado' });
    const { salaId } = await A.net.gerarParEmaranhado({}); await B.net.conectarPar(salaId, false);
    assert.ok(await ate(() => A.eventos.pares.length && B.eventos.pares.length), 'pareamento falhou');
    A.net.enviarEstado(snap(1), '1');
    assert.ok(await ate(() => B.eventos.estados.length === 1), 'lance não chegou');
  });

  await teste('Queda de conexão do convidado: reconecta sozinho e volta a receber lances', async () => {
    const Peer = criarRede(); const A = criarAparelho(Peer), B = criarAparelho(Peer);
    const { salaId } = await A.net.gerarParEmaranhado({}); await B.net.conectarPar(salaId, false);
    await ate(() => A.eventos.pares.length && B.eventos.pares.length);
    B.net.connP2P.close();               // celular dormiu / trocou de rede
    assert.ok(await ate(() => B.eventos.restabelecida >= 1, 6000), 'não reconectou');
    A.net.enviarEstado(snap(1), '1');
    assert.ok(await ate(() => B.eventos.estados.length === 1, 3000), 'lance não chegou após reconexão');
    assert.strictEqual(B.eventos.pares.length, 1, 'não deve reiniciar a partida na reconexão');
  });

  console.log(`\n${ok} ok, ${falhas} falha(s)`);
  process.exit(falhas ? 1 : 0);
})();
