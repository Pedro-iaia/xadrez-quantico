# 🗺️ Plano de Expansão — Xadrez de Schrödinger Quântico

Este documento existe para orientar colaboradores que queiram investir tempo em duas frentes prioritárias do projeto:

1. **O motor de Adversário Inteligente** (evolução do brainstorming inicial da equipe).
2. **Um módulo didático de formação de mestres enxadristas** — o caminho para transformar o painel de "Dica de Estudo" em uma trilha real de lições e desafios.

Não é uma especificação fechada, é um mapa de prioridades e ideias com nível de detalhe suficiente para que qualquer pessoa possa pegar um pedaço e abrir um PR.

---

## Parte 1 — Motor de Adversário Inteligente

### 1.0 Onde já estamos

Hoje o `script.js` já tem duas camadas:

- **Fácil**: lance legal aleatório (`escolherLanceFacil`).
- **Médio/Difícil (só no Modo Clássico)**: minimax com poda alfa-beta rodando em *Web Worker*, avaliação puramente material.

Ou seja: a "opção 1" do brainstorming já existe como esqueleto, mas **só entende xadrez clássico** — no Modo Quântico ela trata as peças pelo tipo que `chess.js` enxerga no momento, sem saber que aquilo é uma superposição. Esse é o ponto de partida de tudo o que vem a seguir.

> ⚠️ **Lacuna que ficou mais evidente após a implementação da variante GHZ.** Com duas variantes quânticas agora disponíveis — Simplificada (10 hipóteses conjuntas por jogador) e GHZ (20 hipóteses) — essa mesma IA joga de forma idêntica nas duas, porque não enxerga hipótese nenhuma: opera apenas sobre a posição clássica momentânea do `chess.js`. Isso significa que o espaço de incerteza dobrou (de 10 para 20 hipóteses por jogador) sem que o adversário automatizado ganhasse qualquer capacidade adicional de lidar com ele. Esta é, no estado atual do projeto, a lacuna de maior prioridade prática: qualquer um dos itens 1.2 ou 1.3 abaixo passaria a ter um efeito **mensuravelmente maior** na variante GHZ do que na Simplificada, justamente por haver mais incerteza para explorar — o que também torna a GHZ um ambiente de teste melhor para demonstrar, empiricamente, o valor de um motor probabilisticamente consciente (ver a atualização correspondente em `GUIA_DE_ESTUDOS_IA.md`).

### 1.1 Comentários sobre as 4 opções propostas

| # | Opção | Comentário |
|---|-------|------------|
| 1 | Minimax + poda alfa-beta | Correto como primeira versão — e já parcialmente implementado. O passo que falta não é trocar de algoritmo, é **enriquecer a função de avaliação** (ver 1.4) e **estender para o modo quântico** (ver 1.2/1.3), já que hoje ele só "vê" a posição clássica revelada. |
| 2 | Monte Carlo Tree Search | Faz sentido para lidar com incerteza, mas *playouts* aleatórios convergem devagar (como o próprio brainstorming já observa) e o espaço de estados aqui é maior que o do xadrez clássico (cada grupo emaranhado multiplica os desfechos possíveis). Recomendo tratar o MCTS puro como uma etapa **posterior**, não a primeira tentativa de motor quântico — ver 1.3 para uma alternativa mais barata que resolve o mesmo problema. |
| 3 | Stockfish via WebAssembly | Concordo com o diagnóstico: força bruta clássica, cego para emaranhamento. Em vez de tentar "ensinar" o Stockfish a jogar quântico, o caminho mais realista é usá-lo como **oráculo de avaliação** dentro de uma camada quântica que nós mesmos controlamos — ver 1.5. |
| 4 | Fairy-Stockfish | Concordo que exigiria implementar a variante do zero na engine (posição, geração de lances, avaliação). É viável, mas é trabalho de engenharia C++/UCI pesado para um ganho incerto frente às alternativas abaixo. Sugiro tratar como "moonshot" (ver 1.7), não como próximo passo. |

### 1.2 Proposta nova: Expectiminimax (a extensão natural do minimax para incerteza)

Antes de pular para simulação (MCTS), existe um meio-termo clássico bem conhecido em teoria dos jogos: tratar cada colapso futuro como um **nó de chance**, não como um lance normal.

- Cada peça em superposição com duas possibilidades vira um nó de chance com probabilidade (ex.: 50/50, ou ponderada pela frequência histórica de escolha) sobre qual tipo ela realmente é.
- Peças **emaranhadas** não são dois nós de chance independentes — são **um único nó de chance com duas saídas correlacionadas** (se uma sai Cavalo, a outra sai Bispo automaticamente). Isso é o ajuste conceitual mais importante: o expectiminimax "de livro" assume chance nodes independentes, então a implementação aqui precisa de nós de chance **emparelhados**.
- O motor escolhe o lance que maximiza o valor esperado considerando essas probabilidades, em vez de otimizar contra um único cenário fixo.

Isso é mais barato computacionalmente que MCTS (não precisa de milhares de simulações) e mais fiel às regras do jogo que o minimax clássico raso. Recomendo como **próximo passo depois de melhorar a função de avaliação**, especificamente para o Modo Quântico.

### 1.3 Proposta nova: PIMC — amostragem de "resoluções clássicas" (determinização)

Esta é, na minha avaliação, a proposta com **melhor custo-benefício** para o motor quântico, e resolve o mesmo problema que motivou a sugestão de MCTS — só que de forma mais direta:

1. A cada turno da IA, gere **N amostras** de "como o tabuleiro seria se todas as peças em superposição colapsassem agora", respeitando as regras de emaranhamento (par colapsa de forma complementar).
2. Para cada amostra, rode uma busca **minimax + alfa-beta comum** (a que já existe!) sobre essa posição totalmente clássica.
3. Agregue os resultados das N amostras (média de avaliação por lance candidato, ou "voto" pelo lance mais frequentemente melhor) e jogue o lance vencedor.

Essa técnica tem nome na literatura de jogos de informação imperfeita — **Perfect Information Monte Carlo (PIMC) / determinização** — e é usada em motores de bridge, Scrabble e variantes de xadrez com informação oculta (ex.: Kriegspiel). Ela reaproveita 100% do código de minimax que já existe (é só chamado várias vezes sobre posições amostradas), então é o caminho de menor esforço de engenharia para dar ao adversário automatizado uma noção real de "jogar bem apesar da incerteza".

> 💡 **Por que priorizar isso sobre o MCTS "puro" do brainstorming**: MCTS com *playouts* aleatórios até o fim da partida precisa de muitas simulações para ser confiável. PIMC usa o minimax que já temos como "avaliador rápido e forte" dentro de cada amostra, então converge com muito menos amostras.

### 1.4 Função de avaliação — checklist para qualquer uma das abordagens acima

Independente do algoritmo de busca escolhido, a qualidade do adversário depende da função de avaliação. Itens sugeridos, do mais simples ao mais avançado:

- [x] Valor material (já existe).
- [ ] **Mobilidade**: número de lances legais disponíveis por lado.
- [ ] **Segurança do rei**: estrutura de peões ao redor do rei, linhas abertas próximas, se já rocou.
- [ ] **Controle do centro** e tabelas piece-square (com uma ressalva: no modo quântico, a tabela precisa ser aplicada *depois* do colapso amostrado/esperado, já que não faz sentido avaliar "posição de cavalo" para uma peça que ainda pode ser bispo).
- [ ] **Valor de ambiguidade quântica**: uma peça ainda não colapsada tem valor estratégico extra por manter o adversário incerto — pequeno bônus por preservar superposições próprias por mais tempo, e pequena penalidade por forçar o colapso de peças próprias sem necessidade.
- [ ] **Estrutura de peões / peões passados** (mais relevante para avaliação de finais).

### 1.5 Stockfish como "oráculo", não como jogador direto

Integração concreta sugerida: usar o Stockfish (via WASM, dentro de um Web Worker) **como substituto do avaliador interno** dentro do laço de amostragem do item 1.3 — ou seja, para cada posição clássica amostrada, em vez de rodar nosso minimax caseiro, pedir ao Stockfish uma avaliação rápida (profundidade baixa/tempo limitado). Isso combina a força bruta e a qualidade posicional real do Stockfish com a camada de incerteza quântica que só nós sabemos modelar. É um trabalho de integração (protocolo UCI dentro do Worker), não de "ensinar quântica" ao motor.

### 1.6 MCTS com rollouts guiados (revisão da proposta original)

Se, mesmo assim, o MCTS "puro" do brainstorming for implementado, sugiro não usar *playouts* totalmente aleatórios até o fim da partida (lento e ruidoso) — usar *playouts* guiados por uma heurística simples (ex.: preferir capturas e lances que não perdem material) durante a simulação. Também é possível combinar isso com a determinização do item 1.3: cada nó do MCTS trabalha sobre uma amostra "resolvida" do estado quântico, em vez de tentar representar a superposição dentro da própria árvore.

### 1.7 Visão de longo prazo (moonshots, não bloqueantes)

- **Aprendizado por reforço / auto-jogo**: treinar uma rede leve (política + valor, ao estilo AlphaZero) via `tensorflow.js`, alimentada com os estados amostrados de 1.3. Pesquisa em aberto, não é entrega de curto prazo — bom projeto de TCC/mestrado para quem quiser se aprofundar.
- **Fairy-Stockfish com variante customizada**: definir "xadrez quântico com emaranhamento" como variante nativa da engine (arquivo de configuração + possíveis patches em C++). Trabalho de engenharia pesado, indicado para colaboradores já familiarizados com a base de código do Fairy-Stockfish.

### 1.8 Ordem de prioridade sugerida

1. Melhorar a função de avaliação do minimax existente (item 1.4) — ganho rápido, sem mudar arquitetura.
2. Implementar PIMC/determinização (item 1.3) reaproveitando o minimax atual — dá ao Modo Quântico um adversário de verdade pela primeira vez, e deve ser validado nas **duas variantes** (Simplificada e GHZ), não só na atual. A GHZ, com o dobro de hipóteses por jogador, é o ambiente onde o ganho de um motor probabilístico deve ser mais fácil de medir — ver item 1.9.
3. (Opcional) Expectiminimax (item 1.2) como alternativa mais "exata" ao PIMC quando há poucos grupos emaranhados ativos — bom projeto de comparação/benchmark entre as duas abordagens.
4. (Opcional) Trocar o avaliador interno do PIMC pelo Stockfish via WASM (item 1.5).
5. (Moonshot) MCTS guiado, RL por auto-jogo, variante customizada no Fairy-Stockfish (itens 1.6/1.7).

### 1.9 Benchmark sugerido: Simplificada vs. GHZ como experimento controlado

Antes de declarar qualquer motor novo "melhor", vale rodar o mesmo experimento nas duas variantes e comparar o *tamanho do ganho*, não só o ganho em si: jogar N partidas do motor probabilístico contra o minimax clássico na variante Simplificada, repetir na GHZ, e comparar as taxas de vitória. A expectativa, se a hipótese central deste plano estiver correta, é que a vantagem do motor probabilístico seja **maior na GHZ** — mais hipóteses vivas por mais tempo é exatamente a condição em que ignorar a incerteza (como o minimax atual faz) deveria custar mais caro. Se essa diferença não aparecer na prática, é um sinal de que a implementação do PIMC/expectiminimax tem algum problema, não apenas um resultado nulo a ser descartado.

---

## Parte 2 — Módulo Didático de Formação de Mestres Enxadristas

O painel de "Dica de Estudo" hoje é reativo (comenta a partida em andamento). A proposta aqui é criar, ao lado dele, uma **trilha estruturada de lições e desafios** — um currículo de verdade, com progressão, e aberto para que professores de xadrez contribuam conteúdo sem precisar programar.

### 2.1 Filosofia pedagógica

- **Progressão em trilha, não lista solta**: coleções organizadas por nível, cada uma desbloqueando a próxima.
- **Dois eixos paralelos**: fundamentos clássicos de xadrez (universais, já bem documentados na literatura) e **táticas exclusivas do xadrez quântico** (conteúdo original que este projeto pode pioneirar — não existe "livro de táticas quânticas" pronto por aí).
- **Aprender fazendo**: cada conceito vem acompanhado de um desafio jogável no próprio tabuleiro, não só de texto.

### 2.2 Estrutura de coleções sugerida

| Coleção | Nível | Foco |
|---|---|---|
| 1. Fundamentos Clássicos | Iniciante | Regras, valor das peças, mate em 1–2 lances, garfos/cravadas/espetos básicos (Modo Clássico) |
| 2. Primeiros Passos no Emaranhamento | Iniciante–Intermediário | Reconhecer superposição e emaranhamento, prever consequências simples de um colapso |
| 3. Táticas Quânticas | Intermediário–Avançado | Motivos táticos exclusivos do jogo (ver 2.3) |
| 4. Finais e Consolidação | Avançado | Técnica de finais clássica + finais com peças ainda emaranhadas |
| 5. Mestre Quântico | Avançado/Curadoria | Desafios selecionados, possivelmente adaptações de posições históricas famosas com uma peça emaranhada adicionada |

### 2.3 Taxonomia inicial de motivos táticos quânticos (conteúdo original)

Um ponto de partida para quem for escrever os primeiros desafios da Coleção 3:

- **Colapso Forçado**: criar uma posição em que a peça em superposição do adversário só tem um lance legal possível, revelando-a contra a vontade dele.
- **Sacrifício Emaranhado**: entregar material para forçar o colapso favorável do par emaranhado em outro ponto do tabuleiro.
- **Fixação de Ambiguidade**: manter a própria peça sem colapsar de propósito, preservando flexibilidade e negando informação ao adversário pelo máximo de tempo possível.
- **Blefe Quântico**: jogar como se uma peça ambígua fosse do tipo mais ameaçador, explorando a aversão a risco do oponente diante da incerteza.
- **Descoberta em Cadeia**: sequência de capturas que força uma cascata de colapsos em múltiplos pares emaranhados.

Cada motivo vira uma "família" de desafios dentro da Coleção 3.

### 2.4 Formato de conteúdo (para contribuição sem precisar programar)

Sugestão de esquema de dados para lições/desafios, em JSON, para ficarem em uma pasta `licoes/` versionada junto do código:

```json
{
  "id": "colapso-forcado-001",
  "colecao": "taticas-quanticas",
  "nivel": "intermediario",
  "titulo": "Colapso forçado no flanco do rei",
  "motivo": "colapso-forcado",
  "textoIntroducao": "As Brancas podem forçar a peça em g8 a se revelar. Encontre o lance.",
  "fenBase": "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 4",
  "estadoQuantico": {
    "g8": { "possibilidades": ["n", "b"], "cor": "b", "colapsada": null, "emaranhadaComId": 2 },
    "f8": { "possibilidades": ["n", "b"], "cor": "b", "colapsada": null, "emaranhadaComId": 2 }
  },
  "solucao": ["e4e5"],
  "dicas": [
    "Que lance ataca duas casas ao mesmo tempo?",
    "Pense no peão central."
  ],
  "explicacaoFinal": "Ao avançar o peão, a única peça capaz de recapturar em g8 revela seu tipo real."
}
```

Esse esquema reaproveita literalmente a mesma estrutura de `pecasQuanticas` que já existe no motor do jogo — ou seja, quem for construir o "modo desafio" no app não precisa inventar um novo formato de estado, só um carregador que injeta esse JSON em `chess.load(fenBase)` + `pecasQuanticas = estadoQuantico`.

### 2.5 Modo Desafio no aplicativo (proposta de integração técnica)

- Um novo valor de `configuracaoPartida.modo` (ex.: `"desafio"`), paralelo a `quantico`/`classico`, que:
  1. Carrega um arquivo de `licoes/*.json` em vez de gerar a posição inicial padrão.
  2. Restringe/valida os lances do jogador contra o campo `solucao` (aceitando variações equivalentes de notação, não string exata).
  3. Reaproveita `mostrarAviso` para dar feedback (acerto, dica, erro) em vez de `alert`.
  4. Ao final, exibe `explicacaoFinal` e libera o próximo desafio da coleção.
- Progresso do usuário salvo localmente (ex.: `localStorage`, já que esse é o app real publicado, sem essa restrição das artifacts do Claude) — desafios concluídos, coleção atual, sequência de acertos.
- Sistema de "patentes" temático, reaproveitando as próprias peças como metáfora de progressão: Peão → Cavaleiro → Bispo → Torre → Dama → **Mestre Quântico**.

### 2.6 Pipeline de contribuição para educadores (sem exigir código)

1. Documentar um "modelo" de desafio (o JSON do item 2.4) com comentários explicando cada campo, em `licoes/MODELO.md`.
2. Um arquivo `licoes/indice.json` listando todas as coleções e seus arquivos — assim várias pessoas podem contribuir coleções independentes sem conflito de merge.
3. **Ferramenta de apoio (ideia de projeto por si só)**: uma página HTML simples ("construtor de desafios") em que a pessoa monta a posição clicando no próprio tabuleiro do jogo, marca quais casas são quânticas/emaranhadas, define a solução jogando ela mesma, e a página exporta o JSON pronto — elimina a barreira de escrever FEN e estado quântico à mão.
4. Checklist de revisão de PR para conteúdo pedagógico: a solução precisa ser validada programaticamente contra `chess.js` (não só "parecer certa" no olho), e o validador do modo desafio deve aceitar reordenações/lances equivalentes quando fizer sentido, não só a sequência exata gravada por quem criou o desafio.

### 2.7 Conexão com o painel de estudo já existente

Quando o livro de aberturas (`aberturasClassicas`) já implementado identificar uma abertura, oferecer um link "Praticar esse tema" apontando para um desafio relacionado na coleção correspondente, se existir — conectando o que já temos hoje com o novo módulo, em vez de tratá-los como dois sistemas paralelos e desconectados.

---

## Parte 3 — Formalização de Estado, Log e Perspectivas Futuras

### 3.1 Instantâneos do tabuleiro como matrizes de estado — e uma nota de cautela sobre a analogia com o Princípio da Incerteza

Uma ideia recorrente em discussões sobre este projeto é tratar cada instantâneo do tabuleiro — a configuração completa após cada lance — como uma **matriz de estado**, e a sequência de instantâneos ao longo de uma partida como a trajetória de um **sistema dinâmico discreto**. Vale registrar essa possibilidade formalmente, junto com uma ressalva necessária sobre até onde a analogia com o Princípio da Incerteza de Heisenberg se sustenta — porque a resposta correta aqui é "só parcialmente", e vale a pena entender por quê antes de qualquer implementação.

**O que é diretamente aproveitável.** Cada instantâneo do flanco pode ser representado como um vetor de estado num espaço de dimensão finita, cuja base é o conjunto de hipóteses ainda vivas (10 ou 20, a depender da variante — ver `PARECER_TECNICO_COERENCIA_FISICA.md`). A sequência desses vetores, um por lance, forma uma **cadeia de Markov absorvente**: cada medição (lance ou captura) aplica uma operação de projeção e renormalização sobre o vetor de probabilidades, e o número de hipóteses vivas é não-crescente ao longo do tempo até a absorção total (todas as casas do flanco colapsadas). Essa é uma estrutura matemática precisa, bem estabelecida, e diretamente implementável — não é necessário invocar mecânica quântica para justificá-la, ela já é correta como um sistema dinâmico estocástico discreto clássico.

Se o objetivo é quantificar "quanta incerteza resta no tabuleiro" a cada lance — o que parece ser a motivação por trás da analogia com um princípio de incerteza —, a grandeza matematicamente correta para essa finalidade é a **entropia de Shannon** da distribuição de probabilidade sobre as hipóteses vivas de cada grupo de flanco, ou, numa formulação mais próxima do formalismo quântico completo, a **entropia de von Neumann** de uma matriz densidade construída a partir dessas mesmas hipóteses. Essa entropia decresce monotonicamente (ou permanece constante) a cada medição, nunca aumenta — uma propriedade que reflete corretamente a ideia de "informação sendo extraída do sistema", sem depender de nenhuma analogia adicional.

**Onde a analogia com Heisenberg não se aplica diretamente — e por que isso importa.** O Princípio da Incerteza de Heisenberg é um resultado matemático específico sobre pares de observáveis representados por operadores que não comutam (posição e momento sendo o exemplo canônico): não é uma afirmação genérica sobre "existir incerteza", mas sobre a impossibilidade de conhecer simultaneamente, com precisão arbitrária, duas grandezas conjugadas — e essa impossibilidade só surge quando os operadores associados às duas medições não comutam. No modelo atual, cada "medição" de uma peça é uma projeção sobre uma única base fixa (o tipo da peça: Torre, Cavalo ou Bispo) — não existem, no sistema atual, duas bases de medição incompatíveis competindo entre si. Não há, portanto, uma relação de incerteza de Heisenberg genuína a implementar hoje — apenas incerteza epistêmica clássica (não sabemos qual hipótese é a verdadeira) combinada com colapso probabilístico ao estilo do postulado de projeção, o que já é fisicamente interessante por si só, sem precisar do rótulo "Heisenberg" para justificá-lo.

Essa ressalva não fecha a porta para o futuro: uma extensão genuinamente especulativa e interessante para uma variante ainda mais avançada seria definir uma **segunda base de medição, incompatível com a base de tipo**, para o mesmo objeto quântico — por exemplo, uma "pergunta" sobre a relação de emaranhamento de uma peça com sua parceira de flanco, formulada de um jeito que não comute algebricamente com a pergunta "qual é o seu tipo". Se essa segunda base puder ser definida de forma que os operadores associados não comutem, uma relação de incerteza genuína emergiria naturalmente da álgebra, e não por analogia forçada. Isso permanece, por ora, uma direção de pesquisa aberta e não uma funcionalidade a implementar — mas vale registrá-la aqui para quem quiser explorar esse caminho.

**Recomendação prática:** implementar o rastreamento de entropia de Shannon por grupo de flanco (um número por lance, fácil de calcular a partir das hipóteses vivas já mantidas em `gruposFlanco`) como uma métrica visualizável — por exemplo, um gráfico de "incerteza restante" ao longo da partida no painel de estudo. Isso é matematicamente honesto, computacionalmente trivial de adicionar, e entrega a mesma experiência pedagógica que motivou a ideia original (ver a incerteza "diminuir" visivelmente conforme a partida avança), sem apoiar-se num princípio físico que não se aplica ao sistema como está construído hoje.

### 3.2 Expansão do sistema de log: matrizes 8x8 com formalismo de peça e status

O log atual (`registrarEstadoNoLog`, exportado como JSON) já guarda o FEN clássico e o dicionário `pecasQuanticas` a cada lance. Uma extensão natural — e diretamente conectada à ideia da Seção 3.1 de tratar cada instantâneo como uma matriz de estado — é acrescentar, a cada entrada do log, uma representação explícita em **matriz 8×8**, mais um **vetor de status** separado, em vez de depender apenas do dicionário indexado por casa.

**Proposta de esquema para a matriz 8×8.** Cada célula guarda um valor inteiro codificando peça, cor e situação quântica, por exemplo:

- `0`: casa vazia.
- Inteiros de `±1` a `±6`: peça clássica definida (sinal = cor; magnitude = tipo, na ordem Peão/Cavalo/Bispo/Torre/Dama/Rei) — o mesmo tipo de codificação numérica já comum em motores de xadrez para representação compacta de tabuleiro.
- Um valor especial (por exemplo, `±7`, `±8`, `±9`, mapeando para "ainda pode ser N/B", "ainda pode ser R/N/B" etc., ou, de forma mais explícita, um segundo array paralelo de mesma dimensão contendo o array `possibilidades` de cada casa não-colapsada) para casas em superposição — a escolha entre um código numérico compacto e um array paralelo mais verboso é uma decisão de engenharia a se tomar na implementação, não antecipada aqui.

**Proposta de esquema para o vetor de status**, complementar à matriz, e não embutido nela (mantendo a matriz posicional "limpa", só sobre o que ocupa cada casa):

```js
{
  turno: 'w' | 'b',              // de quem é a vez
  situacao: 'normal' | 'xeque' | 'xeque-mate' | 'afogamento' | 'empate',
  ladoEmXeque: 'w' | 'b' | null,
  fimDePartida: boolean,
  numeroLance: number,
  relogio: { w: number, b: number },  // segundos restantes, se houver
}
```

Esse par (matriz 8×8 + vetor de status) a cada lance é exatamente a trajetória discreta do sistema dinâmico descrito na Seção 3.1 — cada entrada do log passa a ser um par (estado, metadado), o que viabiliza, sem trabalho adicional de modelagem, tanto o cálculo de entropia por lance sugerido ali quanto qualquer uso futuro de aprendizado de máquina sobre o histórico de partidas (item 1.7 da Parte 1), já que o formato de matriz posicional fixa é o formato de entrada padrão para redes neurais convolucionais aplicadas a jogos de tabuleiro.

---

## Como contribuir com este plano

Este é um documento vivo. Se você tiver uma ideia melhor para qualquer item, ou discordar de alguma prioridade, abra uma *issue* explicando o raciocínio — o objetivo é que a comunidade (educadores, desenvolvedores, entusiastas) refine este roteiro junto, não que ele seja seguido à risca como uma imposição.
