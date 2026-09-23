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
