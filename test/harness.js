// Carrega script.js num contexto vm com DOM/Worker simulados.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
let Chess;
try {
  const mod = require('chess.js');
  Chess = mod.Chess || mod;
} catch (e) {
  const mod = require(path.join(__dirname, '..', 'vendor', 'chess.min.js'));
  Chess = mod.Chess || mod;
}

function elementoFalso() {
  const el = {
    value: '', textContent: '', innerHTML: '', className: '', dataset: {}, style: {},
    checked: false, disabled: false, children: [],
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {}, appendChild() {}, remove() {}, setAttribute() {},
    querySelector() { return elementoFalso(); }, focus() {}, click() {},
    get isConnected() { return true; }
  };
  return el;
}

function carregar(arquivo = path.join(__dirname, '..', 'script.js'), config = {}) {
  const valores = { configModo: 'quantico', configVariante: 'ghz', configOponente: 'humano',
    configNivel: 'facil', configRelogio: 'sem-relogio', configFormato: 'partida', configInicio: 'brancas',
    configMinutos: '10', configIncremento: '5', ...config };
  const elementos = {};
  const documento = {
    getElementById(id) {
      if (!elementos[id]) { elementos[id] = elementoFalso(); if (id in valores) elementos[id].value = valores[id]; }
      return elementos[id];
    },
    querySelector() { return elementoFalso(); },
    querySelectorAll() { return []; },
    createElement() { return elementoFalso(); },
    addEventListener() {}, body: elementoFalso(), hidden: false
  };
  const storageStore = {};
  const mockLocalStorage = {
    getItem: k => (Object.prototype.hasOwnProperty.call(storageStore, k) ? storageStore[k] : null),
    setItem: (k, v) => { storageStore[k] = String(v); },
    removeItem: k => { delete storageStore[k]; },
    clear: () => { for (const k of Object.keys(storageStore)) delete storageStore[k]; }
  };
  const sandbox = {
    document: documento, Chess, console, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0,
    clearInterval() {}, requestAnimationFrame: f => f(), performance: { now: () => Date.now() },
    localStorage: mockLocalStorage, URLSearchParams, URL,
    location: { href: 'http://localhost/', search: '' }, navigator: {}, confirm: () => true, prompt() {},
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    Math, JSON, Date, Set, Object, Array, Number, String, Promise, Error
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  // `let`/`const` de topo não viram propriedades do sandbox: expomos por uma função de acesso.
  const codigo = fs.readFileSync(arquivo, 'utf8') + `
;globalThis.__api = {
  get chess() { return chess; }, get pecasQuanticas() { return pecasQuanticas; },
  get gruposFlanco() { return gruposFlanco; },
  set configuracaoPartida(v) { configuracaoPartida = v; },
  get configuracaoPartida() { return configuracaoPartida; },
  iniciarPartida, executarMovimento, clicarCasa, gerarGrupoFlancos, colapsarNoGrupo,
  casaEstaAmeacada, renderizarTabuleiro,
  deepFreeze, validarSchemaLog,
  iniciarPlayback, exibirLancePlayback, navegarPlayback, sairPlayback,
  salvarPartidaRecenteLocal, obterPartidasRecentesLocais, ajustarVelocidadePlayback, alternarAutoplay,
  get modoPlayback() { return modoPlayback; },
  get dadosPlayback() { return dadosPlayback; },
  get casaSelecionada() { return casaSelecionada; },
  get partidaEncerrada() { return partidaEncerrada; }
};`;
  vm.runInContext(codigo, sandbox, { filename: arquivo });
  return sandbox.__api;
}
module.exports = { carregar, Chess };
