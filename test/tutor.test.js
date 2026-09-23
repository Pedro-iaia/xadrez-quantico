/**
 * tutor.test.js — Testes Automatizados do Módulo Tutor e Treinador
 * Projeto: Xadrez de Schrödinger · Analisador e Tutor
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Mock do ambiente DOM
global.document = {
  getElementById: (id) => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};
global.window = {
  addEventListener: () => {},
  devicePixelRatio: 1
};

// Carrega Chess.js do vendor
const chessPath = path.resolve(__dirname, '../vendor/chess.min.js');
const chessCode = fs.readFileSync(chessPath, 'utf8');
eval(chessCode);
global.Chess = Chess;

// Carrega TutorCanvas e QuantumTutor
const tutorCanvasModule = require('../tutor-canvas.js');
global.TutorCanvas = tutorCanvasModule;

const quantumTutorModule = require('../quantum-tutor.js');

test('--- Módulo Tutor: Conversões e Importações ---', async (t) => {

  await t.test('converterPGNParaTrilha gera passos sequenciais válidos com resposta de bot', () => {
    const pgnExemplo = `1. e4 e5 2. Nf3 Nc6 3. Bc4`;
    const trilha = quantumTutorModule.converterPGNParaTrilha(pgnExemplo, 'Abertura Italiana PGN');

    assert.ok(trilha, 'Trilha deve ser gerada');
    assert.equal(trilha.titulo, 'Abertura Italiana PGN');
    assert.equal(trilha.passos.length, 3, 'Deve ter 3 passos para as brancas (e4, Nf3, Bc4)');
    
    // Passo 1: Brancas e4, resposta preta e5
    assert.equal(trilha.passos[0].lanceEsperado, 'e2e4');
    assert.equal(trilha.passos[0].respostaBot, 'e7e5');

    // Passo 2: Brancas Nf3, resposta preta Nc6
    assert.equal(trilha.passos[1].lanceEsperado, 'g1f3');
    assert.equal(trilha.passos[1].respostaBot, 'b8c6');

    // Passo 3: Brancas Bc4, sem resposta preta
    assert.equal(trilha.passos[2].lanceEsperado, 'f1c4');
    assert.equal(trilha.passos[2].respostaBot, null);
  });

  await t.test('converterLogParaTrilha aceita formato nativo do log de partidas do jogo', () => {
    const mockLog = {
      idPartida: 'partida_teste_123',
      iniciadoEm: new Date().toISOString(),
      variante: 'classico',
      historicoLances: [
        { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', lance: null },
        { fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', lance: 'e4', detalhes: { from: 'e2', to: 'e4', san: 'e4' } },
        { fen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2', lance: 'c5', detalhes: { from: 'c7', to: 'c5', san: 'c5' } }
      ]
    };

    const trilha = quantumTutorModule.converterLogParaTrilha(mockLog);
    assert.ok(trilha, 'Trilha deve ser gerada a partir do log');
    assert.equal(trilha.passos.length, 1, 'Deve ter 1 passo consolidado com resposta do bot');
    assert.equal(trilha.passos[0].lanceEsperado, 'e2e4');
    assert.equal(trilha.passos[0].respostaBot, 'c7c5');
  });

  await t.test('Catálogo de lições em data/licoes/aberturas_basicas.json é válido', () => {
    const catalogoPath = path.resolve(__dirname, '../data/licoes/aberturas_basicas.json');
    assert.ok(fs.existsSync(catalogoPath), 'Arquivo aberturas_basicas.json deve existir');
    const conteudo = JSON.parse(fs.readFileSync(catalogoPath, 'utf8'));
    assert.ok(Array.isArray(conteudo.trilhas), 'Deve conter array de trilhas');
    assert.ok(conteudo.trilhas.length >= 3, 'Deve conter ao menos 3 trilhas pré-instaladas');

    conteudo.trilhas.forEach(trilha => {
      assert.ok(trilha.id, 'Trilha deve ter id');
      assert.ok(trilha.titulo, 'Trilha deve ter titulo');
      assert.ok(Array.isArray(trilha.passos) && trilha.passos.length > 0, 'Trilha deve ter passos');
      trilha.passos.forEach(p => {
        assert.ok(p.lanceEsperado, 'Passo deve ter lanceEsperado');
        assert.ok(p.mensagem, 'Passo deve ter mensagem');
      });
    });
  });

});

test('--- Módulo Tutor: Sincronização de Peças e Modo Treinador ---', async (t) => {
  // Configura ambiente global para simular o jogo
  global.chess = new Chess();
  global.pecasQuanticas = {};
  global.gruposFlanco = {};
  global.configuracaoPartida = { modo: 'classico', oponente: 'humano' };

  await t.test('sincronizarPecasLocais preenche exatamente as 32 peças da posição inicial', () => {
    global.chess.reset();
    global.pecasQuanticas = {};
    assert.equal(Object.keys(global.pecasQuanticas).length, 0);

    if (quantumTutorModule.sincronizarPecasLocais) {
      quantumTutorModule.sincronizarPecasLocais();
    }

    assert.equal(Object.keys(global.pecasQuanticas).length, 32, 'Deve ter exatamente 32 peças no tabuleiro clássico');
    assert.deepEqual(global.pecasQuanticas['e1'], {
      possibilidades: ['k'],
      cor: 'w',
      colapsada: 'k',
      emaranhadaComId: null
    }, 'Rei branco em e1 deve estar devidamente populado');
    assert.deepEqual(global.pecasQuanticas['d8'], {
      possibilidades: ['q'],
      cor: 'b',
      colapsada: 'q',
      emaranhadaComId: null
    }, 'Dama preta em d8 deve estar devidamente populada');
  });

  await t.test('abrirModoTreinador inicializa o tabuleiro na posição inicial com 32 peças', () => {
    global.chess.load('8/8/8/8/8/8/8/8 w - - 0 1'); // Tabuleiro vazio
    global.pecasQuanticas = {};

    if (quantumTutorModule.abrirModoTreinador) {
      quantumTutorModule.abrirModoTreinador();
    }

    assert.equal(Object.keys(global.pecasQuanticas).length, 32, 'Abrir o treinador deve restaurar todas as 32 peças');
    assert.equal(global.chess.fen(), 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  });

  await t.test('iniciarTrilha sincroniza tabuleiro inicial da lição', () => {
    const trilha = {
      id: 'teste_italiana',
      titulo: 'Italiana',
      passos: [{ lanceEsperado: 'e2e4', mensagem: 'Jogue e4', respostaBot: 'e7e5' }]
    };
    global.pecasQuanticas = {};
    quantumTutorModule.iniciarTrilha(trilha);

    assert.equal(Object.keys(global.pecasQuanticas).length, 32, 'Iniciar trilha deve popular 32 peças');
    assert.ok(global.pecasQuanticas['e2'], 'Peão em e2 deve existir');
  });

  await t.test('lance do aluno seguido de resposta do bot mantém integridade de pecasQuanticas', async () => {
    const trilha = {
      id: 'teste_fluxo',
      titulo: 'Fluxo Italiana',
      passos: [{ lanceEsperado: 'e2e4', san: 'e4', mensagem: 'Jogue e4', respostaBot: 'e7e5' }]
    };
    quantumTutorModule.iniciarTrilha(trilha);

    // Aluno executa e4 no chess.js e notifica tutor
    global.chess.move({ from: 'e2', to: 'e4' });
    quantumTutorModule.sincronizarPecasLocais();
    quantumTutorModule.aoExecutarMovimento('e2', 'e4', { from: 'e2', to: 'e4', san: 'e4' });

    // Aguarda timeout da resposta do bot (600ms + margem)
    await new Promise(r => setTimeout(r, 700));

    // Após resposta do bot e7e5:
    assert.equal(global.chess.turn(), 'w', 'Deve ser vez das brancas após resposta preta');
    assert.ok(global.pecasQuanticas['e4'], 'Peão branco deve estar em e4');
    assert.ok(global.pecasQuanticas['e5'], 'Peão preto do bot deve estar em e5');
    assert.equal(global.pecasQuanticas['e7'], undefined, 'Casa e7 deve estar vazia');
    assert.equal(Object.keys(global.pecasQuanticas).length, 32, 'Total de peças deve se manter em 32');
  });
});


