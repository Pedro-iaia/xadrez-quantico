# ♟️ Xadrez de Schrödinger

Um tabuleiro de xadrez onde as peças de Torre, Cavalo e Bispo da primeira e da última fileira começam **em superposição** — até serem movidas ou capturadas, não se sabe ao certo qual é qual — e só **colapsam** para um tipo definido no momento em que essa incerteza é "medida" por uma jogada. Os dois Bispos de cada jogador nunca colapsam para a mesma cor de casa: um análogo, dentro do jogo, do Princípio de Exclusão de Pauli.

O projeto nasceu com fins **didáticos**: ensinar noções de superposição, colapso e emaranhamento quântico através de uma metáfora lúdica e familiar (o xadrez), ao mesmo tempo em que oferece um ambiente de estudo de xadrez clássico, com reconhecimento de aberturas e dicas orientadas à fase da partida.

Esta é a variante oficial e estruturada com base no [`PARECER_TECNICO_COERENCIA_FISICA.md`](./PARECER_TECNICO_COERENCIA_FISICA.md), arquivado formalmente na seção de documentação técnica (`docs/`).

É um projeto **100% front-end**, sem build step, escrito em HTML, CSS e JavaScript puro (vanilla), pensado para ser fácil de ler, modificar e usar em sala de aula.

---

## 🔬 Nota de Versionamento Oficial: Coerência Física e Ineditismo

> **Versão Oficial 2.0 (Fisicamente Coerente)**  
> Esta versão do **Xadrez de Schrödinger** está integralmente estruturada com base nas diretrizes do parecer técnico de física quântica e passa a constituir a formulação oficial (e possivelmente inédita na literatura e em jogos de tabuleiro) do jogo com **coerência física estrita**:
> 
> 1. **Regras de Superseleção e Conservação de Inventário**: Superposições não são geradas como variáveis binárias independentes por casa, mas sim como permutações do conjunto $\{\text{Torre}, \text{Cavalo}, \text{Bispo}\}$ para cada flanco (tripla superposição inicial $\{r, n, b\}$). Isso garante matematicamente a conservação estrita dos setores superseletivos de tipos de peças.
> 2. **Princípio de Exclusão de Pauli para Bispos**: Restrição do espaço de Hilbert inicial a exatamente 10 hipóteses conjuntas globais por jogador (eliminando autoestados que gerariam dois bispos na mesma cor de casa).
> 3. **Emaranhamento com Estados Tipo GHZ e Redução a Pares de Bell**: A medição por lance ou captura em uma peça sob tripla superposição projeta o estado em cascata pelo grupo, reduzindo as peças remanescentes do flanco a superposições residuais de 2 estados emaranhados.
> 4. **Amostragem Ponderada de Born**: Eliminação de determinismo heurístico na escolha de peças em lances válidos, aplicando amostragem probabilística uniforme sobre os autovetores legais.
> 5. **Preservação Canônica do Rei e Ameaça Quântica**: O Rei é inviolável (não pode ser capturado) e é estritamente impedido de mover-se para qualquer casa interceptada por autovetores de ataque de peças em superposição, emitindo alertas de jogada proibida.
> 6. **Log Estruturado e Download da Matriz Momentânea**: Rastreamento auditável de cada lance com FEN clássico, tempos de relógio e a matriz completa das configurações quânticas para inspeção acadêmica e científica.

---

## ✨ Funcionalidades

- **Modo Quântico Fisicamente Coerente**: Rei, Dama e Peões são sempre clássicos; as Torres, Cavalos e Bispos de cada flanco formam um único sistema quântico com tripla superposição inicial $\{r, n, b\}$ e 10 configurações possíveis — com os dois Bispos sempre em cores de casa complementares.
- **Modo Clássico**: xadrez tradicional, útil para comparar com o modo quântico ou para quem está aprendendo as regras do jogo.
- **Emaranhamento com efeito cascata**: revelar uma peça de um flanco pode, de uma só vez, determinar o tipo de outras peças do mesmo flanco — e até do flanco oposto, pela restrição de cor entre os Bispos.
- **Capturas como medição**: capturar uma peça adversária ainda em superposição também revela o tipo dela (e propaga a revelação), não apenas movê-la.
- **Proteção do Rei contra Xeque Quântico**: detecção de raio de ameaça por qualquer possibilidade quântica adversária, impedindo que o Rei entre em casas ameaçadas e proibindo terminantemente a captura do Rei.
- **Roque fisicamente consistente**: só é possível enquanto a peça do canto ainda pode ser uma Torre e as casas de passagem não estiverem sob ameaça quântica.
- **Histórico e Navegação Fiel**: botões para desfazer (↺) e refazer (↻) lances com restauração precisa do estado quântico e preservação de todas as peças (inclusive após roques).
- **Relógio de Partida e Fim de Jogo**: cronômetros com cravamento em 00:00 e encerramento com bloqueio imediato do tabuleiro contra lances pós-jogo.
- **Log da Partida e Matriz Momentânea (Download JSON)**: botão dedicado para exportar o histórico completo com a matriz de probabilidades e estados quânticos a cada lance.
- **Adversário automatizado (IA)**: com três níveis; nos níveis médio/difícil no modo clássico, usa busca *minimax* com poda alfa-beta rodando em *Web Worker* (não trava a interface).
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
├── docs/             # Documentação técnica, roadmap e guias de colaboração
├── index.html        # Estrutura (HTML) — telas de boas-vindas, configuração e jogo
├── style.css         # Aparência (CSS) — tema escuro, tabuleiro, painel, avisos
├── script.js         # Lógica (JS) — regras quânticas, IA, relógio, dicas de estudo
└── LICENSE           # Licença MIT
```

Não há dependências instaladas via `npm`; o projeto usa duas bibliotecas externas carregadas por CDN/URL direta:

- [`chess.js` 0.10.3](https://github.com/jhlywa/chess.js) — validação de regras e notação SAN do xadrez clássico subjacente (licença BSD-2-Clause).
- Ícones de peças em SVG de **Cburnett**, via [Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:SVG_chess_pieces) — multi-licenciados (BSD / GFDL / GPL / CC BY-SA 3.0); atribuição mantida ao autor. Veja [`docs/DEPENDENCIAS.md`](docs/DEPENDENCIAS.md) para detalhes de licenciamento de todas as dependências.

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
- A fonte de verdade **por trás** disso é `gruposFlanco` (uma entrada por cor): cada grupo guarda uma lista de **hipóteses** ainda vivas — atribuições completas de Torre/Cavalo/Bispo para as 6 casas dos dois flancos daquele jogador (`{a1:'r', b1:'n', c1:'b', f1:'b', g1:'n', h1:'r'}`, por exemplo). No início da partida há 10 hipóteses vivas por jogador (de 16 combinações possíveis, restritas a nunca ter os dois Bispos na mesma cor de casa — ver `PARECER_TECNICO_COERENCIA_FISICA.md`). `pecasQuanticas[casa].possibilidades` é sempre **derivado** dessa lista (os tipos distintos que a casa assume entre as hipóteses restantes), nunca guardado de forma independente.
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

## 🤝 Como contribuir

Contribuições são muito bem-vindas — de professores de xadrez, educadores de física/computação quântica, desenvolvedores e entusiastas em geral. Antes de abrir uma issue ou Pull Request, veja o [`docs/PROTOCOLO_DE_COLABORACAO.md`](docs/PROTOCOLO_DE_COLABORACAO.md) e o [`docs/PLANO_DE_EXPANSAO.md`](docs/PLANO_DE_EXPANSAO.md).

## 📜 Licença

Este projeto é distribuído sob a licença **MIT** — veja o arquivo [`LICENSE`](./LICENSE).

---

*Um projeto para aprender xadrez e mecânica quântica se divertindo — e para servir de ponto de partida para quem quiser construir algo parecido.*
