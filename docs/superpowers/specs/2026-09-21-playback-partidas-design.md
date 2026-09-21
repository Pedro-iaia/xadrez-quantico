# Especificação Técnica: Sistema de Playback de Partidas & Acervo Didático
*Data: 2026-09-21 · Projeto: Xadrez Quântico (Xadrez de Schrödinger)*

---

## 1. Contexto e Objetivos

O **Xadrez de Schrödinger** simula conceitos de mecânica quântica (superposição, colapso de função de onda e emaranhamento com restrições do Princípio de Pauli) em um ambiente web 100% *client-side*.

Atualmente, o sistema já gera snapshots completos a cada lance através de `logPartida.historicoLances`, gravando FEN clássico, matriz momentânea de superposição das peças quânticas (`snapshotMatriz`), grupos de hipóteses de flanco (`gruposFlanco`), tempos de relógio e narrativas dos lances executados.

Este documento especifica a implementação de um **Sistema de Playback Linear**, permitindo que:
1. **Jogadores e Espectadores** possam rever partidas recém-concluídas lance a lance com fidelidade aos estados quânticos históricos.
2. **Educadores e Estudantes** possam simular partidas (no modo humano vs humano no mesmo teclado) e reproduzi-las passo a passo em aulas, vídeos ou apresentações didáticas.
3. **Usuários em Geral** possam carregar arquivos de partidas em formato `.json` ou explorar um **Acervo Oficial Didático** hospedado diretamente no repositório GitHub.

---

## 2. Princípios Invioláveis de Física e Engenharia

1. **Imutabilidade Absoluta do Log**: O histórico de lances gravado ou carregado é tratado como uma série temporal imutável de medições físicas. Nenhuma ação de navegação no playback pode alterar os dados históricos.
2. **Isolamento de Estado**: Durante o playback (`modoPlayback = true`), o motor do jogo e a interface operam em modo estritamente somente-leitura. Cliques no tabuleiro, seleções de casas e contadores de tempo ativos são desarmados.
3. **Fidelidade Quântica**: A cada lance do playback, o tabuleiro renderiza com precisão os estados de superposição, peças colapsadas, halos visuais e a narrativa científica correspondente ao momento exato em que o lance ocorreu.
4. **Zero Dependências Pesadas**: A implementação é feita em Vanilla JS (ES6+), HTML5 e Vanilla CSS, mantendo total autonomia *client-side*.
5. **Responsividade Estrita (UI/UX)**: Layout adaptado e validado em desktop e telas estreitas (360px a 420px), sem qualquer transbordo horizontal (*zero horizontal overflow*).

---

## 3. Arquitetura de Dados e Imutabilidade

### 3.1 Função de Congelamento Profundo (`deepFreeze`)
Para garantir a imutabilidade em tempo de execução:
```javascript
function deepFreeze(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Object.isFrozen(obj[key])) {
      deepFreeze(obj[key]);
    }
  }
  return obj;
}
```

### 3.2 Estrutura do Estado de Playback (`dadosPlayback`)
```javascript
let modoPlayback = false;

const dadosPlayback = {
  log: null,                  // Objeto completo do log, profundamente congelado
  cursor: 0,                  // Índice do lance atual (0 a N)
  totalLances: 0,             // Total de posições disponíveis
  temporizadorAutoplay: null, // Referência do setInterval para reprodução automática
  velocidadeMs: 1500,         // Intervalo de autoplay (padrão: 1500ms)
  origem: null                // 'fimDeJogo' | 'arquivo' | 'acervo' | 'recente'
};
```

### 3.3 Validação de Schema do Arquivo de Log
Arquivos importados via upload ou acervo passam por validação estrita antes do carregamento:
- `versao`: string.
- `historicoLances`: Array não vazio.
- Cada entrada deve conter:
  - `lanceIndex`: número inteiro.
  - `fen`: string FEN válida.
  - `matrizQuanticaMomentanea`: objeto contendo mapeamento de casas quânticas.
  - `gruposFlanco`: objeto estruturado com flancos e hipóteses.
  - `relogio`: objeto `{ w: number, b: number }`.
  - `descricao`: string explicativa do lance.

---

## 4. Interface com o Usuário (UI/UX)

### 4.1 Pontos de Acesso ao Playback

1. **Na Tela Inicial (`#telaInicial`)**:
   - Card **"📼 Rever Partidas & Acervo Didático"**:
     - Botão `📂 Carregar Partida (.json)` (aciona `<input type="file" accept=".json">`).
     - Menu de seleção `📚 Partidas do Acervo Oficial`: lista as lições do repositório (ex.: *Colapso GHZ em Cascata*, *Princípio de Pauli nos Bispos*).
     - Menu / Lista `🕒 Partidas Recentes`: resgata do `localStorage` as últimas partidas salvas localmente.

2. **Ao Término de uma Partida (`#areaJogo`)**:
   - Notificação e botão no painel lateral:
     `📼 Rever Partida Lance a Lance (Playback)`.

### 4.2 Elementos Visuais do Modo Playback na `#areaJogo`

1. **Badge Superior de Playback (`#badgePlayback`)**:
   - Exibido no topo do tabuleiro com estilização ciano/dourado:
     `📼 MODO DIDÁTICO / PLAYBACK · Lance X de N`

2. **Barra de Controles de Reprodução (`#barraPlayback`)**:
   - Posicionada logo abaixo do tabuleiro:
     - `|◀` (Início / Lance 0): salta para a posição inicial antes do primeiro movimento.
     - `◀` (Lance Anterior): recua 1 lance.
     - `▶ / ⏸` (Reproduzir / Pausar): inicia ou pausa a passagem automática de lances.
     - `▶` (Próximo Lance): avança 1 lance.
     - `▶|` (Último Lance): salta para o desfecho da partida.
     - **Linha do Tempo / Scrubber**: `<input type="range" id="sliderPlayback">` permitindo arrastar ou clicar em qualquer ponto.
     - **Seletor de Velocidade**: `[ 0.5x (3s) | 1x (1.5s) | 2x (0.8s) ]`.

3. **Lista de Lances Interativa (`#historico`)**:
   - A lista de lances da partida é preenchida integralmente.
   - O lance em exibição no playback ganha a classe CSS `.lance-ativo` (borda luminosa ciano e fundo sutil).
   - **Clique Direto**: Clicar em qualquer lance da lista posiciona imediatamente o playback naquele quadro.
   - A lista rola suavemente para manter o lance ativo sempre visível.

4. **Painel de Ocorrências Didáticas e Quânticas (`#didatica`)**:
   - Exibe a narrativa daquele lance registrado no log:
     - Notação e tipo de peça movida.
     - Detalhes do colapso (peça observada e medição).
     - Estado de emaranhamento dos flancos.
     - Relógio registrado no momento do lance.

5. **Ações do Modo Playback**:
   - `🚪 Sair do Playback`: Encerra o playback e retorna à tela inicial ou limpa o estado.
   - `📥 Baixar Log da Partida`: Permite exportar o arquivo JSON da partida atualmente em reprodução.

---

## 5. Acervo no Repositório GitHub & Armazenamento Local

### 5.1 Acervo no Repositório Oficial (`acervo/`)
Diretório estático servido pelo GitHub Pages:
- `acervo/manifesto.json`:
  ```json
  [
    {
      "id": "ghz-cascata-dama",
      "titulo": "Colapso em Cascata no Modelo GHZ",
      "descricao": "Demonstração de colapso conjunto de Torre, Cavalo e Bispo no flanco da dama.",
      "variante": "ghz",
      "arquivo": "acervo/01_colapso_ghz_flanco_dama.json"
    },
    {
      "id": "pauli-bispos",
      "titulo": "Princípio de Exclusão de Pauli em Bispos",
      "descricao": "Colapso cruzado que impede que dois bispos do mesmo lado ocupem casas de mesma cor.",
      "variante": "ghz",
      "arquivo": "acervo/02_principio_exclusao_pauli_bispos.json"
    }
  ]
  ```
- Os arquivos `.json` das partidas modelo ficam no mesmo diretório e são consumidos via `fetch()`.

### 5.2 Armazenamento Local Temporário (`localStorage`)
- Chave: `xq_partidas_recentes`.
- Guarda até 10 partidas recentes com timestamp e sumário, permitindo que professores que acabaram de simular uma aula possam abrir o playback imediatamente sem precisar baixar o arquivo.

---

## 6. Fluxo de Execução e Algoritmos

### 6.1 `iniciarPlayback(logOriginal, origem)`
1. Pausa o relógio ativo da partida (`pararRelogio()`).
2. Clona e congela profundamente o log:
   `dadosPlayback.log = deepFreeze(structuredClone(logOriginal))`.
3. Configura `dadosPlayback.totalLances = dadosPlayback.log.historicoLances.length`.
4. Define `dadosPlayback.cursor = 0`.
5. Ativa `modoPlayback = true`.
6. Ajusta a visibilidade dos elementos no DOM (oculta controles de partida ativa e exibe barra de playback).
7. Chama `exibirLancePlayback(0)`.

### 6.2 `exibirLancePlayback(indice)`
1. Normaliza `indice` no intervalo `[0, dadosPlayback.totalLances - 1]`.
2. Atualiza `dadosPlayback.cursor = indice`.
3. Resgata a entrada: `const quadro = dadosPlayback.log.historicoLances[indice]`.
4. Carrega a posição clássica no validador: `chess.load(quadro.fen)`.
5. Clona a matriz quântica e hipóteses de flanco para as variáveis de renderização:
   - `pecasQuanticas = structuredClone(quadro.matrizQuanticaMomentanea)`.
   - `gruposFlanco = structuredClone(quadro.gruposFlanco)`.
6. Invoca `renderizarTabuleiro()`.
7. Realça as casas `quadro.detalhes.from` e `quadro.detalhes.to` caso haja movimento.
8. Atualiza os relógios no topo com `quadro.relogio.w` e `quadro.relogio.b`.
9. Atualiza o slider (`sliderPlayback.value = indice`) e badge ("Lance X de N").
10. Atualiza o painel `#didatica` com `quadro.descricao`.
11. Atualiza destaque `.lance-ativo` em `#historico`.
12. Atualiza os botões de navegação (desabilita botões de recuo se `indice === 0`; desabilita avanço se `indice === totalLances - 1`).

### 6.3 `alternarAutoplay()`
1. Se `dadosPlayback.temporizadorAutoplay` existe:
   - Limpa o intervalo com `clearInterval` e seta `null`.
   - Atualiza o botão para o ícone de reprodução (`▶`).
2. Se não existe:
   - Se `dadosPlayback.cursor === dadosPlayback.totalLances - 1`, redefine `cursor = 0` para reiniciar.
   - Atualiza o botão para pausa (`⏸`).
   - Dispara `setInterval` a cada `dadosPlayback.velocidadeMs`:
     - Se `dadosPlayback.cursor < dadosPlayback.totalLances - 1`, avança 1 lance (`exibirLancePlayback(cursor + 1)`).
     - Se atingir o último lance, pausa o autoplay e restaura o botão.

### 6.4 `sairPlayback()`
1. Interrompe autoplay se ativo.
2. Limpa `dadosPlayback`.
3. Define `modoPlayback = false`.
4. Restaura os elementos visuais da interface (oculta barra de playback, restaura tela inicial ou área de jogo padrão).

---

## 7. Estratégia de Testes Automatizados (TDD)

Arquivo de teste a ser implementado: [`test/playback.test.js`](file:///c:/Users/pedro/OneDrive/Área de Trabalho/Projeto_Xadrez-Quantico/test/playback.test.js), integrado ao `npm test` em [`test/package.json`](file:///c:/Users/pedro/OneDrive/Área de Trabalho/Projeto_Xadrez-Quantico/test/package.json).

Cenários de teste obrigatórios:
1. **Validação de Imutabilidade**:
   - Verificar se mutações diretas em `log.historicoLances[0].fen` ou `matrizQuanticaMomentanea` falham ou não alteram os dados.
2. **Navegação Linear e Extremos**:
   - Navegar do início ao fim e do fim ao início conferindo se FEN e matrizes correspondem exatamente a cada lance.
   - Garantir que índices fora de limite (`< 0` ou `>= totalLances`) são travados com segurança.
3. **Bloqueio de Interatividade no Tabuleiro**:
   - Testar chamada a `aoClicarCasa` com `modoPlayback = true` e confirmar que nada é selecionado ou movido.
4. **Validação de Schema JSON**:
   - Testar validação com log válido (aceito).
   - Testar com JSON inválido/malformado (rejeição graciosa sem falha do aplicativo).
5. **Autoplay e Parada no Desfecho**:
   - Testar se o autoplay avança os lances sequencialmente e encerra corretamente no último lance da partida.
