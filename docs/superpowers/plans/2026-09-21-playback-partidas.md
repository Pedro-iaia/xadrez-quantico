# Sistema de Playback de Partidas & Acervo Didático — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o sistema de Playback linear de partidas no Xadrez de Schrödinger, permitindo navegação lance a lance, autoplay, reprodução de estados quânticos históricos imutáveis, importação de logs JSON e acesso ao acervo didático oficial de partidas modelo.

**Architecture:** O motor de playback reutiliza a renderização de alta fidelidade de `#areaJogo`, operando em modo isolado somente-leitura (`modoPlayback = true`). Todos os dados históricos são submetidos a congelamento recursivo (`deepFreeze`). A navegação sincroniza `chess.js` (camada clássica) e `pecasQuanticas`/`gruposFlanco` (camada quântica), enquanto uma barra de controles dedicada (`#barraPlayback`) permite avançar, retroceder, pular para qualquer lance e ativar autoplay.

**Tech Stack:** Vanilla JavaScript ES6+, HTML5, Vanilla CSS, chess.js 0.10.3, Node.js assert (para a suíte de testes).

## Global Constraints
- Nenhuma dependência externa adicionada (Vanilla JS puro).
- Preservação estrita das regras de física quântica (Tier 1: GHZ, superposição, colapso e Princípio de Exclusão de Pauli).
- Proibição estrita de commits automáticos no Git (conforme `AGENTS.md`).
- Responsividade obrigatória em telas móveis estreitas (360px a 420px) com tolerância zero a overflow horizontal.
- Cache-busting atualizado para `?v=20260921` em `index.html`.

---

### Task 1: Imutabilidade (`deepFreeze`) e Validação de Schema (`validarSchemaLog`)

**Files:**
- Create: `test/playback.test.js`
- Modify: `test/harness.js:50-65`
- Modify: `script.js:1870-1940`

**Interfaces:**
- Produces:
  - `deepFreeze(obj)`: congela recursivamente qualquer objeto e seus ramos, retornando-o imutável.
  - `validarSchemaLog(log)`: valida se um objeto JSON possui `versao`, `historicoLances` (array) e estrutura mínima exigida (`fen`, `matrizQuanticaMomentanea`, `gruposFlanco`, `relogio`), retornando `{ valido: boolean, erro?: string }`.

- [ ] **Step 1: Escrever os testes que falham para `deepFreeze` e `validarSchemaLog`**

No arquivo `test/playback.test.js`:
```javascript
const assert = require('assert');
const { carregar } = require('./harness');
const alvo = process.argv[2];

let ok = 0, falhas = 0;
function teste(nome, fn) {
  try { fn(); ok++; console.log('  ✔', nome); }
  catch (e) { falhas++; console.log('  ✘', nome, '\n     ', e.message.split('\n')[0]); }
}

const api = carregar(alvo);

console.log('Imutabilidade e Congelamento Profundo (deepFreeze)');
teste('deepFreeze congela objetos aninhados recursivamente', () => {
  const obj = { a: 1, b: { c: 2, d: [3, 4] } };
  const congelado = api.deepFreeze(obj);
  assert.strictEqual(congelado, obj);
  assert.ok(Object.isFrozen(congelado));
  assert.ok(Object.isFrozen(congelado.b));
  assert.ok(Object.isFrozen(congelado.b.d));
  assert.throws(() => { congelado.b.c = 99; }, TypeError);
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
```

- [ ] **Step 2: Executar o teste para verificar que falha**

Run: `node test/playback.test.js ../script.js`
Expected: FAIL com "api.deepFreeze is not a function"

- [ ] **Step 3: Implementar `deepFreeze`, `validarSchemaLog` e atualizar `test/harness.js`**

Em `test/harness.js`: expor `deepFreeze`, `validarSchemaLog` em `globalThis.__api`.
Em `script.js`:
```javascript
function deepFreeze(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  for (const chave of Object.keys(obj)) {
    const prop = obj[chave];
    if (typeof prop === 'object' && prop !== null && !Object.isFrozen(prop)) {
      deepFreeze(prop);
    }
  }
  return obj;
}

function validarSchemaLog(dados) {
  if (!dados || typeof dados !== 'object') {
    return { valido: false, erro: 'Arquivo de log inválido ou corrompido.' };
  }
  if (!Array.isArray(dados.historicoLances) || dados.historicoLances.length === 0) {
    return { valido: false, erro: 'Log sem histórico de lances registrado.' };
  }
  const primeiro = dados.historicoLances[0];
  if (!primeiro || typeof primeiro.fen !== 'string' || typeof primeiro.matrizQuanticaMomentanea !== 'object') {
    return { valido: false, erro: 'Formato de quadro quântico inválido.' };
  }
  return { valido: true };
}
```

- [ ] **Step 4: Executar o teste para verificar que passa**

Run: `node test/playback.test.js ../script.js`
Expected: Todos os testes de Task 1 passando (4 ok, 0 falhas).

- [ ] **Step 5: Verificação intermediária**
Validar conformidade e registrar progresso.

---

### Task 2: Motor de Playback (Estado, Navegação Lance a Lance e Bloqueio de Interatividade)

**Files:**
- Modify: `test/harness.js`
- Modify: `test/playback.test.js`
- Modify: `script.js`

**Interfaces:**
- Consumes: `deepFreeze`, `validarSchemaLog`
- Produces:
  - `iniciarPlayback(objetoLog, origem)`: inicializa o modo de reprodução com log imutável.
  - `exibirLancePlayback(indice)`: posiciona o tabuleiro e o estado quântico no lance indicado.
  - `navegarPlayback(delta)`: avança ou retrocede `delta` posições com proteção de limites.
  - `sairPlayback()`: encerra o modo playback e restaura o estado de visualização padrão.
  - `modoPlayback`: boolean indicando se o playback está ativo.
  - `dadosPlayback`: objeto com cursor, log congelado e total de lances.

- [ ] **Step 1: Escrever os testes que falham para o ciclo de vida do motor de Playback**

Em `test/playback.test.js`:
```javascript
console.log('Motor de Playback e Navegação');
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
```

- [ ] **Step 2: Executar o teste para verificar que falha**

Run: `node test/playback.test.js ../script.js`
Expected: FAIL com "api.iniciarPlayback is not a function"

- [ ] **Step 3: Implementar o motor de Playback e guarda em `aoClicarCasa` no `script.js`**

Em `test/harness.js`: expor `iniciarPlayback`, `exibirLancePlayback`, `navegarPlayback`, `sairPlayback`, `modoPlayback`, `dadosPlayback`.
Em `script.js`:
- Definir `let modoPlayback = false;` e `let dadosPlayback = { ... };`.
- No início de `aoClicarCasa(casa)`:
  ```javascript
  if (modoPlayback) return;
  ```
- Implementar `iniciarPlayback(logOriginal, origem)`:
  - Validar log com `validarSchemaLog`.
  - Pausar relógio ativo `relogioPartida.ativo = false`.
  - `dadosPlayback.log = deepFreeze(JSON.parse(JSON.stringify(logOriginal)));`
  - `dadosPlayback.totalLances = dadosPlayback.log.historicoLances.length;`
  - `dadosPlayback.cursor = 0;`
  - `dadosPlayback.origem = origem;`
  - `modoPlayback = true;`
  - Alternar classes de UI e chamar `exibirLancePlayback(0)`.
- Implementar `exibirLancePlayback(indice)`:
  - Truncar limites entre `0` e `dadosPlayback.totalLances - 1`.
  - Atualizar `dadosPlayback.cursor = indice;`.
  - Resgatar quadro do log imutável.
  - Carregar `chess.load(quadro.fen);`.
  - Copiar `pecasQuanticas = JSON.parse(JSON.stringify(quadro.matrizQuanticaMomentanea));`.
  - Copiar `gruposFlanco = JSON.parse(JSON.stringify(quadro.gruposFlanco));`.
  - Chamar `renderizarTabuleiro();`.
  - Atualizar relógios, textos didáticos e destaques.
- Implementar `navegarPlayback(delta)`:
  - Chamar `exibirLancePlayback(dadosPlayback.cursor + delta);`.
- Implementar `sairPlayback()`:
  - Parar autoplay se ativo.
  - `modoPlayback = false;`
  - Restaurar interface.

- [ ] **Step 4: Executar o teste para verificar que passa**

Run: `node test/playback.test.js ../script.js`
Expected: PASS em todos os testes da Task 2.

- [ ] **Step 5: Verificação intermediária**
Validar integridade do motor.

---

### Task 3: Autoplay e Armazenamento Local Temporário (`localStorage`)

**Files:**
- Modify: `test/playback.test.js`
- Modify: `script.js`

**Interfaces:**
- Produces:
  - `alternarAutoplay()`: inicia/pausa autoplay e para automaticamente no último lance.
  - `ajustarVelocidadePlayback(ms)`: ajusta o intervalo em milissegundos.
  - `salvarPartidaRecenteLocal(log)`: guarda até 10 partidas no `localStorage` sob `xq_partidas_recentes`.
  - `obterPartidasRecentesLocais()`: recupera a lista de partidas recentes salvas.

- [ ] **Step 1: Escrever testes para Autoplay e Partidas Recentes Locais**

Em `test/playback.test.js`:
```javascript
console.log('Autoplay e Armazenamento Local');
teste('salvarPartidaRecenteLocal armazena e recupera partidas', () => {
  const logSimples = {
    versao: '2.1.0',
    iniciadoEm: new Date().toISOString(),
    historicoLances: [
      { lanceIndex: 0, fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', matrizQuanticaMomentanea: {}, gruposFlanco: {}, relogio: { w: 600, b: 600 }, descricao: 'Início' }
    ]
  };
  api.salvarPartidaRecenteLocal(logSimples);
  const recentes = api.obterPartidasRecentesLocais();
  assert.ok(Array.isArray(recentes));
  assert.ok(recentes.length >= 1);
});
```

- [ ] **Step 2: Executar o teste para verificar que falha**

Run: `node test/playback.test.js ../script.js`
Expected: FAIL com funções inexistentes.

- [ ] **Step 3: Implementar Autoplay e Gerenciamento de Partidas Locais em `script.js`**

Implementar:
- `alternarAutoplay()`
- `ajustarVelocidadePlayback(velocidadeMs)`
- `salvarPartidaRecenteLocal(log)`: limita a 10 entradas e captura exceções de quota do `localStorage`.
- `obterPartidasRecentesLocais()`: retorna array parsed de `xq_partidas_recentes`.
- Em `inicializarLogPartida()` e ao finalizar partida (vitória/empate), acionar `salvarPartidaRecenteLocal(logPartida)`.

- [ ] **Step 4: Executar o teste para verificar que passa**

Run: `node test/playback.test.js ../script.js`
Expected: PASS em todos os testes da Task 3.

- [ ] **Step 5: Verificação intermediária**
Validar que a persistência local opera com segurança.

---

### Task 4: Acervo Oficial no Repositório GitHub (Manifesto e Partidas Modelo)

**Files:**
- Create: `acervo/manifesto.json`
- Create: `acervo/01_colapso_ghz_flanco_dama.json`
- Create: `acervo/02_principio_exclusao_pauli_bispos.json`
- Modify: `test/playback.test.js`

**Interfaces:**
- Consumes: `validarSchemaLog`
- Produces: arquivos estáticos com histórico quântico fisicamente coerente para uso educacional imediato.

- [ ] **Step 1: Escrever teste de validação do acervo oficial em `test/playback.test.js`**

```javascript
const fs = require('fs');
const path = require('path');

console.log('Acervo Oficial no Repositório GitHub');
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
```

- [ ] **Step 2: Executar o teste para verificar que falha**

Run: `node test/playback.test.js ../script.js`
Expected: FAIL com "manifesto.json não encontrado"

- [ ] **Step 3: Criar `acervo/manifesto.json` e os arquivos modelo `.json`**

Criar pasta `acervo/`:
- `acervo/manifesto.json`: catálogo das partidas.
- `acervo/01_colapso_ghz_flanco_dama.json`: partida demonstrando cascata GHZ no flanco da dama.
- `acervo/02_principio_exclusao_pauli_bispos.json`: partida demonstrando restrição de Pauli em bispos.

- [ ] **Step 4: Executar o teste para verificar que passa**

Run: `node test/playback.test.js ../script.js`
Expected: PASS em todos os testes do acervo oficial.

- [ ] **Step 5: Verificação intermediária**
Validar que os arquivos JSON do acervo estão íntegros.

---

### Task 5: Interface com Usuário (HTML e CSS — Barra de Playback, Scrubber e Seção do Acervo)

**Files:**
- Modify: `index.html`
- Modify: `style.css`
- Modify: `script.js`

**Interfaces:**
- Produces:
  - Elementos `#barraPlayback`, `#sliderPlayback`, `#btnPlayPause`, `#btnInicioPlayback`, `#btnFimPlayback`, `#btnVoltarLance`, `#btnAvancarLance`, `#selectVelocidadePlayback`, `#btnSairPlayback`.
  - Seção `#cardAcervoPlayback` na `#telaInicial` com upload de JSON, carregamento do manifesto do acervo e lista de partidas locais recentes.
  - Estilização de alto padrão com destaque `.lance-ativo` em `#historico` e visualização responsiva em viewports móveis (360px a 420px).

- [ ] **Step 1: Adicionar a estrutura HTML em `index.html`**

1. Na `#telaInicial`:
   Adicionar card para rever partidas:
   - Input de arquivo escondido: `<input type="file" id="inputArquivoLog" accept=".json" class="oculto">`
   - Botão "📂 Carregar Partida Salva (.json)"
   - Dropdown "📚 Partidas Modelo do Acervo"
   - Dropdown "🕒 Partidas Recentes Salvas"
2. Na `#areaJogo`:
   - Adicionar `#badgePlayback` estilizado.
   - Adicionar `#barraPlayback` logo abaixo do `#tabuleiroArea` contendo controles, slider e seletor de velocidade.
   - Adicionar `#btnSairPlayback` e botão `#btnReverPartidaFimJogo`.
   - Atualizar cache-busting nos scripts/css para `?v=20260921`.

- [ ] **Step 2: Adicionar as regras de estilo em `style.css`**

- Estilizar `#barraPlayback` com glassmorphism, flexbox responsivo, botões com tamanho mínimo de toque de 44px.
- Estilizar o slider `#sliderPlayback` com trilha dourada/ciano customizada.
- Estilizar a classe `.lance-ativo` para que o lance em foco no `#historico` tenha realce dourado/ciano e fundo sutil.
- Garantir que telas de 360px a 420px não sofram nenhum overflow horizontal.

- [ ] **Step 3: Ligar os eventos da interface em `script.js`**

- Conectar cliques dos botões de reprodução (`|◀`, `◀`, `▶/⏸`, `▶`, `▶|`).
- Conectar evento `input` e `change` de `#sliderPlayback` com `exibirLancePlayback`.
- Conectar seletor de velocidade com `ajustarVelocidadePlayback`.
- Conectar upload de arquivo (`inputArquivoLog.addEventListener('change', ...)`).
- Conectar carregamento das opções do manifesto do acervo via `fetch('acervo/manifesto.json')`.
- Conectar seleção de partidas recentes locais.
- No `#historico`, adicionar listener de clique em cada lance para pular diretamente para aquele momento durante o playback.

- [ ] **Step 4: Executar verificação e testes existentes**

Run: `node test/nucleo.test.js ../script.js && node test/playback.test.js ../script.js`
Expected: Todos os testes passando sem erros.

- [ ] **Step 5: Verificação de layout e responsividade**

Run: `python test/mobile_check.py` ou inspeção via script de validação de largura para garantir `scrollWidth <= innerWidth` em 360px, 390px e 412px.

---

### Task 6: Integração de Testes no `package.json` e Validação de Ponta a Ponta

**Files:**
- Modify: `test/package.json`

- [ ] **Step 1: Atualizar script de teste no `test/package.json`**

Em `test/package.json`:
```json
"scripts": {
  "test": "node nucleo.test.js ../script.js && node rede.test.js ../quantum-net.js && node playback.test.js ../script.js"
}
```

- [ ] **Step 2: Executar a suíte de testes completa via npm test**

Run: `npm test` no diretório `test`
Expected: Todos os testes de núcleo, rede e playback passando com 100% de sucesso.

- [ ] **Step 3: Validação de ponta a ponta manual e por inspeção de código**

Conferir:
- Carregamento de partida modelo do acervo.
- Autoplay e pausa.
- Imutabilidade (nenhuma alteração após retroceder e avançar).
- Interatividade bloqueada no tabuleiro durante o playback.
- Saída do playback retornando com segurança para a tela inicial.
