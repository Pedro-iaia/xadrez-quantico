const assert = require('assert');
const { carregar } = require('./harness');
const alvo = process.argv[2];

let ok = 0, falhas = 0;
function teste(nome, fn) {
  try { fn(); ok++; console.log('  ✔', nome); }
  catch (e) { falhas++; console.log('  ✘', nome, '\n     ', e.message.split('\n')[0]); }
}

// Reproduz sorteios de forma determinística.
function comSemente(api, valores, fn) {
  const original = Math.random; let i = 0;
  Math.random = () => valores[i++ % valores.length];
  try { return fn(); } finally { Math.random = original; }
}

console.log('Espaço de hipóteses');
teste('Simplificada = 10 hipóteses por jogador', () => {
  const api = carregar(alvo);
  assert.strictEqual(api.gerarGrupoFlancos('w', 'simplificada').hipoteses.length, 10);
});
teste('GHZ = 20 hipóteses por jogador', () => {
  const api = carregar(alvo);
  assert.strictEqual(api.gerarGrupoFlancos('w', 'ghz').hipoteses.length, 20);
});
teste('Bispos nunca na mesma cor em nenhuma hipótese (ambas variantes)', () => {
  const api = carregar(alvo);
  const cor = c => ((c.charCodeAt(0) - 96) + Number(c[1])) % 2;
  for (const v of ['simplificada', 'ghz']) for (const jog of ['w', 'b']) {
    const g = api.gerarGrupoFlancos(jog, v);
    for (const h of g.hipoteses) {
      const bs = Object.keys(h).filter(c => h[c] === 'b');
      assert.strictEqual(bs.length, 2);
      assert.notStrictEqual(cor(bs[0]), cor(bs[1]));
    }
  }
});

console.log('Consistência chess.js × camada quântica');
teste('Após colapso em cascata, o chess.js reflete as peças reveladas', () => {
  // Simplificada: a1 só pode ser Cavalo se mover a1→b3, o que revela o flanco inteiro (n,r,b).
  const a = carregar(alvo, { configVariante: 'simplificada' });
  a.iniciarPartida();
  a.executarMovimento('a1', 'b3');
  const pq = a.pecasQuanticas;
  assert.strictEqual(pq['b3'].colapsada, 'n', 'a peça movida deveria ser Cavalo');
  assert.strictEqual(pq['b1'].colapsada, 'r', 'b1 deveria ter colapsado para Torre');
  assert.strictEqual(pq['c1'].colapsada, 'b', 'c1 deveria ter colapsado para Bispo');
  for (const casa of ['b1', 'c1']) {
    const noChess = a.chess.get(casa);
    assert.ok(noChess, `${casa} sumiu do chess.js`);
    assert.strictEqual(noChess.type, pq[casa].colapsada,
      `${casa}: quântico=${pq[casa].colapsada} mas chess.js=${noChess.type}`);
  }
});

console.log('Seleção por toque (mobile)');
teste('Tocar noutra peça própria troca a seleção, sem erro de movimento', () => {
  const api = carregar(alvo, { configVariante: 'ghz' });
  api.iniciarPartida();
  api.clicarCasa('e2');
  assert.strictEqual(api.casaSelecionada, 'e2');
  api.clicarCasa('d2');
  assert.strictEqual(api.casaSelecionada, 'd2', 'seleção deveria migrar para d2');
  assert.strictEqual(api.chess.history().length, 0, 'nenhum lance deveria ter sido jogado');
});
teste('Toque em casa vazia não legal mantém partida íntegra', () => {
  const api = carregar(alvo);
  api.iniciarPartida();
  api.clicarCasa('e2'); api.clicarCasa('e5');
  assert.strictEqual(api.chess.turn(), 'w');
});

console.log(`\n${ok} ok, ${falhas} falha(s)`);
process.exit(falhas ? 1 : 0);
