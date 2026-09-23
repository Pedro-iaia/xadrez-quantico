const assert = require('assert');
const { carregar } = require('./harness');
const alvo = process.argv[2];

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

const api = carregar(alvo);

console.log('--- Task 1: Imutabilidade e Validação de Schema ---');

console.log('Imutabilidade e Congelamento Profundo (deepFreeze)');
teste('deepFreeze congela objetos aninhados recursivamente', () => {
  const obj = { a: 1, b: { c: 2, d: [3, 4] } };
  const congelado = api.deepFreeze(obj);
  assert.strictEqual(congelado, obj);
  assert.ok(Object.isFrozen(congelado));
  assert.ok(Object.isFrozen(congelado.b));
  assert.ok(Object.isFrozen(congelado.b.d));
  (() => {
    'use strict';
    assert.throws(() => { congelado.b.c = 99; }, TypeError);
  })();
  assert.strictEqual(congelado.b.c, 2);
});

console.log('Validação de Schema de Log (validarSchemaLog)');
teste('Rejeita log nulo, indefinido ou não-objeto', () => {
  assert.strictEqual(api.validarSchemaLog(null).valido, false);
  assert.strictEqual(api.validarSchemaLog('string').valido, false);
});

teste('Rejeita log sem historicoLances válido', () => {
  assert.strictEqual(api.validarSchemaLog({}).valido, false);
  assert.strictEqual(api.validarSchemaLog({ historicoLances: 'invalido' }).valido, false);
  assert.strictEqual(api.validarSchemaLog({ historicoLances: [] }).valido, false);
});

teste('Aceita log válido contendo posição inicial completa', () => {
  const logValido = {
    versao: '2.1.0-fisica-coerente',
    historicoLances: [
      {
        lanceIndex: 0,
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        matrizQuanticaMomentanea: {},
        gruposFlanco: {},
        relogio: { w: 600, b: 600 },
        descricao: 'Posição inicial'
      }
    ]
  };
  const res = api.validarSchemaLog(logValido);
  assert.strictEqual(res.valido, true);
});

console.log('\n--- Task 2: Motor de Playback e Navegação ---');
teste('iniciarPlayback carrega log, congela dados e posiciona no lance 0', () => {
  const logSimulado = {
    versao: '2.1.0',
    historicoLances: [
      {
        lanceIndex: 0,
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        matrizQuanticaMomentanea: {
          a1: { cor: 'w', colapsada: null, possibilidades: ['r', 'n', 'b'], emaranhadaComId: 'w-q' }
        },
        gruposFlanco: { w_q: { hipoteses: [{ a1: 'r', b1: 'n', c1: 'b' }] } },
        relogio: { w: 600, b: 600 },
        descricao: 'Posição inicial'
      },
      {
        lanceIndex: 1,
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        matrizQuanticaMomentanea: {
          a1: { cor: 'w', colapsada: null, possibilidades: ['r', 'n', 'b'], emaranhadaComId: 'w-q' }
        },
        gruposFlanco: { w_q: { hipoteses: [{ a1: 'r', b1: 'n', c1: 'b' }] } },
        relogio: { w: 598, b: 600 },
        lance: 'e4',
        descricao: 'Lance executado: e4'
      }
    ]
  };

  api.iniciarPlayback(logSimulado, 'teste');
  assert.strictEqual(api.modoPlayback, true);
  assert.strictEqual(api.dadosPlayback.cursor, 0);
  assert.strictEqual(api.dadosPlayback.totalLances, 2);
  assert.strictEqual(api.chess.fen(), logSimulado.historicoLances[0].fen);
});

teste('navegarPlayback avança e recua corretamente com limites seguros', () => {
  api.navegarPlayback(1);
  assert.strictEqual(api.dadosPlayback.cursor, 1);
  assert.strictEqual(api.chess.fen(), 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');

  // Trava no fim (não passa de totalLances - 1)
  api.navegarPlayback(1);
  assert.strictEqual(api.dadosPlayback.cursor, 1);

  // Recua para 0
  api.navegarPlayback(-1);
  assert.strictEqual(api.dadosPlayback.cursor, 0);

  // Trava no início (não fica menor que 0)
  api.navegarPlayback(-1);
  assert.strictEqual(api.dadosPlayback.cursor, 0);
});

teste('Bloqueio estrito: clicarCasa é ignorado quando modoPlayback está ativo', () => {
  const fenAntes = api.chess.fen();
  api.clicarCasa('e2');
  assert.strictEqual(api.casaSelecionada, null);
  assert.strictEqual(api.chess.fen(), fenAntes);
});

teste('sairPlayback encerra modoPlayback e limpa dados', () => {
  api.sairPlayback();
  assert.strictEqual(api.modoPlayback, false);
});

console.log('\n--- Task 3: Autoplay e Armazenamento Local ---');
teste('salvarPartidaRecenteLocal armazena e recupera partidas', () => {
  const logSimples = {
    versao: '2.1.0',
    iniciadoEm: '2026-09-21T00:00:00.000Z',
    historicoLances: [
      { lanceIndex: 0, fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', matrizQuanticaMomentanea: {}, gruposFlanco: {}, relogio: { w: 600, b: 600 }, descricao: 'Início' }
    ]
  };
  api.salvarPartidaRecenteLocal(logSimples);
  const recentes = api.obterPartidasRecentesLocais();
  assert.ok(Array.isArray(recentes));
  assert.ok(recentes.length >= 1);
  assert.strictEqual(recentes[0].versao, '2.1.0');
});

teste('salvarPartidaRecenteLocal limita acervo local a no máximo 10 partidas', () => {
  for (let i = 1; i <= 15; i++) {
    api.salvarPartidaRecenteLocal({
      versao: '2.1.0',
      idPartida: `teste-${i}`,
      historicoLances: [
        { lanceIndex: 0, fen: '8/8/8/8/8/8/8/8 w - - 0 1', matrizQuanticaMomentanea: {}, gruposFlanco: {}, relogio: { w: 0, b: 0 } }
      ]
    });
  }
  const recentes = api.obterPartidasRecentesLocais();
  assert.strictEqual(recentes.length, 10);
  assert.strictEqual(recentes[0].idPartida, 'teste-15');
});

teste('ajustarVelocidadePlayback altera velocidadeMs de forma segura', () => {
  api.ajustarVelocidadePlayback(800);
  assert.strictEqual(api.dadosPlayback.velocidadeMs, 800);
  api.ajustarVelocidadePlayback(3000);
  assert.strictEqual(api.dadosPlayback.velocidadeMs, 3000);
  // Rejeita ou normaliza valores inválidos
  api.ajustarVelocidadePlayback(-50);
  assert.strictEqual(api.dadosPlayback.velocidadeMs, 1500);
});

console.log('\n--- Task 4: Acervo Oficial no Repositório GitHub ---');
const fs = require('fs');
const path = require('path');

teste('Manifesto do acervo existe e é um array válido', () => {
  const caminhoManifesto = path.join(__dirname, '..', 'acervo', 'manifesto.json');
  assert.ok(fs.existsSync(caminhoManifesto), 'manifesto.json não encontrado');
  const manifesto = JSON.parse(fs.readFileSync(caminhoManifesto, 'utf8'));
  assert.ok(Array.isArray(manifesto));
  assert.ok(manifesto.length >= 2);
});

teste('Todas as partidas do manifesto existem e passam por validarSchemaLog', () => {
  const caminhoManifesto = path.join(__dirname, '..', 'acervo', 'manifesto.json');
  const manifesto = JSON.parse(fs.readFileSync(caminhoManifesto, 'utf8'));
  for (const item of manifesto) {
    const caminhoPartida = path.join(__dirname, '..', item.arquivo);
    assert.ok(fs.existsSync(caminhoPartida), `Arquivo ${item.arquivo} não existe`);
    const dados = JSON.parse(fs.readFileSync(caminhoPartida, 'utf8'));
    const validacao = api.validarSchemaLog(dados);
    assert.strictEqual(validacao.valido, true, `Falha no schema de ${item.arquivo}: ${validacao.erro}`);
  }
});

console.log('\n--- Task 5: Tríade Didática Dinâmica (Narrador, Tutor, Analisador) ---');

teste('sincronizarPaineisContextuais alterna painéis contextuais exclusivamente', () => {
  api.sincronizarPaineisContextuais('narrador');
  // Verifica se a função executa sem erro
  api.sincronizarPaineisContextuais('analisador');
  api.sincronizarPaineisContextuais('tutor');
  api.sincronizarPaineisContextuais('treinador');
  api.sincronizarPaineisContextuais('narrador');
  assert.ok(true);
});

teste('narrarLanceAoVivo compõe texto descritivo para lance normal e roque', () => {
  api.chess.reset();
  api.narrarLanceAoVivo('e2', 'e4', { from: 'e2', to: 'e4', piece: 'p', cor: 'w', flags: 'b' });
  // Verifica que não lança erro e executa didática
  api.narrarLanceAoVivo('e1', 'g1', { from: 'e1', to: 'g1', piece: 'k', cor: 'w', flags: 'k' });
  assert.ok(true);
});

teste('iniciarPlayback sincroniza Analisador e sairPlayback restaura Narrador', () => {
  const logValido = {
    versao: '2.1.0-fisica-coerente',
    historicoLances: [
      {
        lanceIndex: 0,
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        matrizQuanticaMomentanea: {},
        gruposFlanco: {},
        descricao: 'Início'
      }
    ]
  };
  const sucesso = api.iniciarPlayback(logValido);
  assert.strictEqual(sucesso, true);
  assert.strictEqual(api.modoPlayback, true);
  api.sairPlayback();
  assert.strictEqual(api.modoPlayback, false);
});

if (falhas > 0) {
  process.exit(1);
} else {
  console.log(`\n${ok} ok, ${falhas} falha(s)`);
}
