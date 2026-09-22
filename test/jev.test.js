const assert = require('assert');
const path = require('path');
const JevEngine = require('../jev-engine.js');
const { Chess } = require('./harness.js');

let ok = 0, falhas = 0;
function teste(nome, fn) {
  try {
    fn();
    ok++;
    console.log('  ✔', nome);
  } catch (e) {
    falhas++;
    console.log('  ✘', nome, '\n     ', e.message.split('\n')[0]);
  }
}

console.log('1. Estabilidade Numérica e Softmax (opponentPolicy)');

teste('Softmax soma 1.0 com tolerância estreita', () => {
  const scores = [1.5, -0.2, 0.8, -1.0, 3.2];
  const probs = JevEngine.opponentPolicy(scores, 1.0);
  const soma = probs.reduce((a, b) => a + b, 0);
  assert.strictEqual(probs.length, scores.length);
  assert.ok(Math.abs(soma - 1.0) < 1e-6, `Soma esperada 1.0, obtido: ${soma}`);
});

teste('Softmax não gera NaN ou estouro numérico com scores extremos (+20000 / -20000)', () => {
  const scores = [20000, -20000, 0, 500];
  const probs = JevEngine.opponentPolicy(scores, 1.0);
  assert.strictEqual(probs.length, 4);
  for (const p of probs) {
    assert.ok(!isNaN(p), 'Probabilidade não deve ser NaN');
    assert.ok(isFinite(p), 'Probabilidade deve ser finita');
    assert.ok(p >= 0 && p <= 1, `Probabilidade fora do intervalo [0, 1]: ${p}`);
  }
  assert.ok(probs[0] > 0.99, 'Maior score deve concentrar probabilidade');
  assert.ok(probs[1] < 1e-5, 'Pior score deve ter probabilidade desprezível');
});

teste('Softmax com tau -> 0 converge para escolha ótima (quase determinística)', () => {
  const scores = [1.0, 5.0, 2.0];
  const probs = JevEngine.opponentPolicy(scores, 0.01);
  assert.ok(probs[1] > 0.999, `Esperado > 0.999 para score 5.0, obtido: ${probs[1]}`);
});

console.log('\n2. Função de Utilidade Sigmoide (winProbability)');

teste('Avaliação 0 centipawns resulta em exatamente 50% de probabilidade de vitória', () => {
  const p = JevEngine.winProbability(0);
  assert.strictEqual(p, 0.5);
});

teste('Avaliação positiva gera probabilidade > 50% e avaliação negativa < 50%', () => {
  const pVantagem = JevEngine.winProbability(400); // ~1 peão/peça em termos sigmoides
  const pDesvantagem = JevEngine.winProbability(-400);
  assert.ok(pVantagem > 0.5, 'Vantagem deve ter utilidade > 0.5');
  assert.ok(pDesvantagem < 0.5, 'Desvantagem deve ter utilidade < 0.5');
  assert.ok(Math.abs((pVantagem + pDesvantagem) - 1.0) < 1e-6, 'Simetria da sigmoide preservada');
});

console.log('\n3. Tomada de Decisão JEV Clássica');

teste('JEV clássico encontra mate em 1 lance imediato', () => {
  // Posição clássica de Mate do Pastor: Brancas jogam Dxf7#
  // FEN: r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4
  // Dama em f3 ataca f7 indefeso (com bispo em c4 dando suporte)
  const fen = 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4';
  const resultado = JevEngine.computeQuantumJevMove(Chess, fen, {}, { tau: 0.8, topK: 5 });
  assert.ok(resultado.move, 'Deve sugerir um lance');
  assert.strictEqual(resultado.move.from, 'f3');
  assert.strictEqual(resultado.move.to, 'f7');
  assert.ok(resultado.jev > 0.95, `Expectativa de vitória em mate deve ser próxima de 100%: ${resultado.jev}`);
});

teste('JEV clássico captura dama indefesa em vez de lance passivo', () => {
  // Dama preta desprotegida em e4, torre branca em e1
  const fen = 'rnb1kbnr/pppp1ppp/8/8/4q3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1';
  // Brancas em xeque pela dama preta em e4, podem bloquear ou mover rei, mas vamos colocar dama atacada sem dar xeque:
  const fen2 = 'rnb1k1nr/pppp1ppp/8/8/4q3/4R3/PPPP1PPP/RNBQKBN1 w Qkq - 0 1';
  const resultado = JevEngine.computeQuantumJevMove(Chess, fen2, {}, { tau: 1.0, topK: 5 });
  assert.ok(resultado.move, 'Deve sugerir um lance');
  assert.strictEqual(resultado.move.from, 'e3');
  assert.strictEqual(resultado.move.to, 'e4', 'Torre branca deve capturar a Dama em e4');
});

console.log('\n4. Tomada de Decisão JEV Quântica (Amostragem PIMC com Born)');

teste('JEV quântico integra hipóteses de flancos e sugere lance válido', () => {
  const { carregar } = require('./harness.js');
  const api = carregar(path.join(__dirname, '..', 'script.js'), { configVariante: 'ghz' });
  api.iniciarPartida();

  const fen = api.chess.fen();
  const dadosQuanticos = {
    gruposFlanco: api.gruposFlanco,
    variante: 'ghz'
  };

  const resultado = JevEngine.computeQuantumJevMove(Chess, fen, dadosQuanticos, {
    tau: 1.2,
    topK: 6,
    maxHipoteses: 6
  });

  assert.ok(resultado.move, 'Deve selecionar um lance no modo quântico');
  assert.ok(resultado.hipotesesConsideradas > 1, 'Deve ter considerado múltiplas hipóteses da variante GHZ');
  assert.ok(resultado.jev >= 0 && resultado.jev <= 1, 'JEV deve ser uma probabilidade válida');
});

console.log(`\nResultado dos testes JEV: ${ok} ok, ${falhas} falha(s)`);
process.exit(falhas ? 1 : 0);
