# ♟️ Xadrez de Schrödinger

Um tabuleiro de xadrez onde as peças de Torre, Cavalo e Bispo da primeira e da última fileira começam **em superposição** — até serem movidas ou capturadas, não se sabe ao certo qual é qual — e só **colapsam** para um tipo definido no momento em que essa incerteza é "medida" por uma jogada. Os dois Bispos de cada jogador nunca colapsam para a mesma cor de casa: um análogo, dentro do jogo, do Princípio de Exclusão de Pauli.

O projeto nasceu com fins **didáticos**: ensinar noções de superposição, colapso e emaranhamento quântico através de uma metáfora lúdica e familiar (o xadrez), ao mesmo tempo em que oferece um ambiente de estudo de xadrez clássico, com reconhecimento de aberturas e dicas orientadas à fase da partida.

Esta é a variante oficial e estruturada com base no [`PARECER_TECNICO_COERENCIA_FISICA.md`](./PARECER_TECNICO_COERENCIA_FISICA.md), arquivado formalmente na seção de documentação técnica (`docs/`).

É um projeto **100% front-end**, sem build step, escrito em HTML, CSS e JavaScript puro (vanilla), pensado para ser fácil de ler, modificar e usar em sala de aula.

---

## 🔬 Nota de Versionamento Oficial: Coerência Física e Literatura

> **Versão Oficial 2.1 (Fisicamente Coerente e Totalmente Auto-Hospedada)**  
> Esta versão do **Xadrez de Schrödinger** está estruturada com base nas diretrizes do parecer técnico de física quântica, situando-se formalmente no gênero de jogos conceituais com colapso projetivo discreto (*toy models* didáticos com amostragem clássica):
> 
> 1. **Regras de Superseleção e Conservação de Inventário**: Superposições não são geradas como variáveis binárias independentes por casa, mas sim como permutações do conjunto `{Torre, Cavalo, Bispo}` para cada flanco (tripla superposição inicial `{r, n, b}`). Isso garante matematicamente a conservação estrita dos setores superseletivos de tipos de peças.
> 2. **Princípio de Exclusão de Pauli para Bispos**: Restrição do espaço de Hilbert inicial a hipóteses conjuntas globais onde os dois bispos nunca ocupam a mesma cor de casa (10 hipóteses na variante Simplificada; 20 hipóteses no grupo simétrico `S₃` completo da variante GHZ).
> 3. **Emaranhamento com Estados Tipo GHZ e Redução a Pares de Bell**: A medição por lance ou captura em uma peça sob tripla superposição projeta o estado em cascata pelo grupo, reduzindo as peças remanescentes do flanco a superposições residuais de 2 estados emaranhados.
> 4. **Amostragem Ponderada de Born**: Eliminação de determinismo heurístico na escolha de peças em lances válidos, aplicando amostragem probabilística uniforme sobre os autovetores legais.
> 5. **Preservação Canônica do Rei e Ameaça Quântica**: O Rei é inviolável (não pode ser capturado) e é estritamente impedido de mover-se para qualquer casa interceptada por autovetores de ataque de peças em superposição, emitindo alertas de jogada proibida.
> 6. **Log Estruturado e Download da Matriz Momentânea**: Rastreamento auditável de cada lance com FEN clássico, tempos de relógio e a matriz completa das configurações quânticas para inspeção acadêmica e científica.
> 7. **Segurança e Privacidade Absoluta (Offline-First)**: Código 100% autônomo, com regras do `chess.js` e ícones SVG auto-hospedados localmente, sem envio de telemetria e sem cookies de rastreamento de terceiros.

### 📚 Relação com a Literatura e Jogos Correlatos

O projeto insere-se em um campo fértil de iniciativas que usam o xadrez como metáfora pedagógica para conceitos quânticos:

- **[Niel's Chess](https://arxiv.org/abs/2405.00677)**: variante didática voltada para salas de aula do ensino fundamental, jogável em tabuleiro físico. Enquanto no *Niel's Chess* as peças começam clássicas e entram em superposição através de um lance especial de emaranhamento, no *Xadrez de Schrödinger* as peças de cada flanco já iniciam em superposição nativa tripartite (`S₃`).
- **[Google Quantum Chess](https://quantumai.google/cirq/experiments/unitary/quantum_chess)** (Cirq / Unitary Fund / Caltech): formulação matematicamente estrita baseada em operadores unitários contínuos, capaz de rodar em simuladores de circuitos quânticos e hardware real, voltada para computação quântica avançada.
- **[Quantum Tic-Tac-Toe / Minesweeper / Checkers](https://arxiv.org/pdf/2506.05962)**: gênero de *toy models* combinatórios no qual este projeto se posiciona — empregando aleatoriedade e contagem discreta para tornar o colapso e o entrelaçamento intuitivos e jogáveis no navegador sem exigir álgebra linear avançada do usuário.

---

## ✨ Funcionalidades

- **Duas variantes quânticas selecionáveis**: Rei, Dama e Peões são sempre clássicos em ambas; as Torres, Cavalos e Bispos de cada flanco formam um único sistema quântico com tripla superposição inicial $\{r, n, b\}$ — com os dois Bispos sempre em cores de casa complementares, em qualquer uma das duas.
  - **Simplificada** (padrão): 4 permutações por flanco → 10 hipóteses conjuntas válidas por jogador.
  - **GHZ** (modelo físico completo): todas as 6 permutações do grupo simétrico S3 por flanco → 20 hipóteses conjuntas válidas por jogador — a formulação integral descrita no parecer técnico, com um espaço de incerteza inicial maior e cascatas de colapso mais ricas.
- **Modo Clássico**: xadrez tradicional, útil para comparar com o modo quântico ou para quem está aprendendo as regras do jogo.
- **Emaranhamento com efeito cascata**: revelar uma peça de um flanco pode, de uma só vez, determinar o tipo de outras peças do mesmo flanco — e até do flanco oposto, pela restrição de cor entre os Bispos.
- **Capturas como medição**: capturar uma peça adversária ainda em superposição também revela o tipo dela (e propaga a revelação), não apenas movê-la.
- **Proteção do Rei contra Xeque Quântico**: detecção de raio de ameaça por qualquer possibilidade quântica adversária, impedindo que o Rei entre em casas ameaçadas e proibindo terminantemente a captura do Rei.
- **Roque fisicamente consistente**: só é possível enquanto a peça do canto ainda pode ser uma Torre e as casas de passagem não estiverem sob ameaça quântica.
- **Histórico e Navegação Fiel**: botões para desfazer (↺) e refazer (↻) lances com restauração precisa do estado quântico e preservação de todas as peças (inclusive após roques e en passant).
- **Relógio de Partida e Fim de Jogo**: cronômetros com cravamento em 00:00 e encerramento com bloqueio imediato do tabuleiro contra lances pós-jogo.
- **Log da Partida e Matriz Momentânea (Download JSON)**: botão dedicado para exportar o histórico completo com a matriz de probabilidades e estados quânticos a cada lance.
- **Adversário automatizado (IA)**: com três níveis; nos níveis médio/difícil no modo clássico, usa busca *minimax* com poda alfa-beta rodando em *Web Worker* (não trava a interface). ⚠️ Nota de honestidade técnica: essa IA opera sobre o `chess.js` clássico e **não é probabilisticamente consciente** do espaço de hipóteses quântico — ou seja, ela joga igualmente bem (ou mal) na variante Simplificada e na GHZ, sem tirar proveito da incerteza. Adaptar o motor para isso (PIMC/determinização ou expectiminimax, conforme o item 1.3 do `PLANO_DE_EXPANSAO.md`) é um próximo passo natural, ainda não implementado.
- **Ação Fantasmagórica à Distância (Modo Online)**: partidas em tempo real entre dois computadores distintos sem backend customizado.
  - **Emaranhamento por Chave Curta / Link**: geração de códigos (`xq-XXXX`) e links diretos para convite de adversário com sorteio dinâmico de cores na conexão.
  - **Modo Observador Passivo (Telespectador)**: permite que terceiros assistam à partida em tempo real via link dedicado sem interferir na função de onda do tabuleiro.
  - **Sincronização Quântica e Compensação de Latência**: medição executada exclusivamente pelo observador da vez e propagada com bônus de latência dinâmico.
  - **Fallback local integrado**: suporta Firebase Realtime Database para nuvem e `BroadcastChannel` para testes locais imediatos entre abas.
- **Modo dois jogadores** (mesmo dispositivo).
- **Formato "Melhor de três"** com placar de torneio e cômputo correto de desistências.
- **Painel de estudo** com reconhecimento de aberturas clássicas e dicas contextuais.
- **Avisos discretos e alertas piscantes** centrais para xeque, colapsos e movimentos proibidos.
- **Totalmente responsivo**: tabuleiro fluido (`aspect-ratio`) seguindo a convenção oficial FIDE.
- **Página de boas-vindas** com artigo introdutório sobre mecânica quântica (superposição, colapso, emaranhamento) para quem chega sem nenhuma base no assunto, com opção de não mostrar novamente.

---

## 🗂️ Estrutura dos arquivos

```text
xadrez-quantico/
├── .github/          # Templates de issues e pull request
├── assets/pieces/    # Ícones SVG das peças de Cburnett (auto-hospedados localmente)
├── docs/             # Documentação técnica, parecer físico canônico e guias
├── vendor/           # Bibliotecas locais (chess.min.js 0.10.3)
├── index.html        # Estrutura (HTML) — telas de boas-vindas, configuração, pareamento e jogo
├── style.css         # Aparência (CSS) — tema escuro, tabuleiro, painel, avisos e pareamento
├── script.js         # Lógica (JS) — regras quânticas, IA, relógio, dicas de estudo
├── quantum-net.js    # Rede (JS) — sincronização em tempo real (Firebase / BroadcastChannel)
└── LICENSE           # Licença MIT
```

Todas as dependências são **auto-hospedadas** diretamente no repositório, sem requisições a CDNs externas ou cookies de terceiros:

- [`chess.js` 0.10.3](https://github.com/jhlywa/chess.js) em `vendor/chess.min.js` — validação de regras e notação SAN do xadrez clássico subjacente (licença BSD-2-Clause).
- Ícones de peças em SVG de **Cburnett** em `assets/pieces/` — multi-licenciados (BSD / GFDL / GPL / CC BY-SA 3.0); atribuição mantida ao autor. Veja [`docs/DEPENDENCIAS.md`](docs/DEPENDENCIAS.md) para detalhes.

## ▶️ Como executar

Basta abrir o `index.html` diretamente no navegador, ou servir a pasta com qualquer servidor estático (recomendado para evitar restrições de `file://` em alguns navegadores):

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .
```

Depois acesse `http://localhost:8000`.

## 🧠 Como funciona o núcleo quântico (para quem for contribuir)

- `chess.js` continua sendo a única fonte de verdade sobre **regras de movimento e validação** — ele nunca sabe que existe superposição.
- O estado exibível de cada casa vive no objeto `pecasQuanticas`, indexado por casa (`"b1"`, `"e8"` etc.), com o formato:
  ```js
  {
    possibilidades: ['n', 'b'],   // tipos ainda possíveis, derivados do grupo
    cor: 'w',
    colapsada: null,              // tipo definitivo após o colapso, ou null
    emaranhadaComId: 'w'          // a que grupo de flanco pertence, ou null
  }
  ```
- A fonte de verdade **por trás** disso é `gruposFlanco` (uma entrada por cor): cada grupo guarda uma lista de **hipóteses** ainda vivas — atribuições completas de Torre/Cavalo/Bispo para as 6 casas dos dois flancos daquele jogador (`{a1:'r', b1:'n', c1:'b', f1:'b', g1:'n', h1:'r'}`, por exemplo). `gerarGrupoFlancos(cor, variante)` monta essa lista a partir de `gerarPermutacoesFlanco(...)`, que aceita `'simplificada'` (4 permutações por flanco → 10 hipóteses válidas de 16) ou `'ghz'` (as 6 permutações do grupo simétrico S3 → 20 hipóteses válidas de 36), sempre restritas a nunca ter os dois Bispos na mesma cor de casa — ver `PARECER_TECNICO_COERENCIA_FISICA.md`. `pecasQuanticas[casa].possibilidades` é sempre **derivado** dessa lista (os tipos distintos que a casa assume entre as hipóteses restantes), nunca guardado de forma independente — e o mesmo `colapsarNoGrupo` funciona identicamente para as duas variantes, sem nenhuma lógica especial por tamanho de espaço amostral.
- Ao tentar mover uma peça quântica, `executarMovimento` testa cada possibilidade contra o `chess.js` (colocando temporariamente a peça daquele tipo no tabuleiro) e sorteia, **com peso igual**, entre as que resultam em lance legal — nunca escolhe deterministicamente a primeira da lista. Esse sorteio é a medição que causa o colapso.
- `colapsarNoGrupo(casa, tipo)` é o único lugar que filtra as hipóteses vivas e recalcula todas as casas do grupo — é aqui que a cascata de revelação acontece (revelar uma casa pode, de uma vez, determinar outras, inclusive no flanco oposto). Ela é chamada tanto para o **movimento** quanto para a **captura** de uma peça ainda em superposição.
- O livro de aberturas (`aberturasClassicas`) identifica a abertura por **casas de origem/destino** (não pelo tipo da peça), justamente para continuar funcionando mesmo quando o modo quântico altera qual peça ocupa cada casa.

## 📚 Documentação do projeto

| Documento | Conteúdo |
|---|---|
| [`PARECER_TECNICO_COERENCIA_FISICA.md`](./docs/PARECER_TECNICO_COERENCIA_FISICA.md) | Fundamentação física do modelo quântico: por que as regras são o que são, com a matemática por trás. |
| [`PLANO_DE_EXPANSAO.md`](./docs/PLANO_DE_EXPANSAO.md) | O quê construir: roadmap do motor de IA e do módulo didático. |
| [`PROTOCOLO_DE_COLABORACAO.md`](./docs/PROTOCOLO_DE_COLABORACAO.md) | Como colaborar: relato de bugs, estresse-teste, fluxo de PR, sugestões de usuários. |
| [`DEPENDENCIAS.md`](./docs/DEPENDENCIAS.md) | O que vem de fora: `chess.js`, ícones de peças, futuras engines — licenças e como contribuir de volta para elas. |
| [`GUIA_DE_ESTUDOS_IA.md`](./docs/GUIA_DE_ESTUDOS_IA.md) | Trilha de estudo para quem quer aprender IA de jogos construindo dentro deste projeto. |
| [`COLABORACAO_NA_PRATICA_ROQUE.md`](./docs/COLABORACAO_NA_PRATICA_ROQUE.md) | Exemplo real, passo a passo, de todo o ciclo: relatar → corrigir → commitar → PR. |
| [`SOBRE_O_DESENVOLVIMENTO_ASSISTIDO_POR_IA.md`](./docs/SOBRE_O_DESENVOLVIMENTO_ASSISTIDO_POR_IA.md) | Transparência e epistemologia: a tríade de colaboração (Humano–Claude–Antigravity), a Zona de Desenvolvimento Proximal (Vygotsky) e a negação do *vibe coding*. |

## 🤝 Como contribuir

Contribuições são muito bem-vindas — de professores de xadrez, educadores de física/computação quântica, desenvolvedores e entusiastas em geral. Antes de abrir uma issue ou Pull Request, veja o [`docs/PROTOCOLO_DE_COLABORACAO.md`](docs/PROTOCOLO_DE_COLABORACAO.md) e o [`docs/PLANO_DE_EXPANSAO.md`](docs/PLANO_DE_EXPANSAO.md).

## 📜 Licença

Este projeto é distribuído sob a licença **MIT** — veja o arquivo [`LICENSE`](./LICENSE).

---

*Um projeto para aprender xadrez e mecânica quântica se divertindo — e para servir de ponto de partida para quem quiser construir algo parecido.*
