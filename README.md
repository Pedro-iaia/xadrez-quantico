# ♟️ Xadrez de Schrödinger Quântico

Um tabuleiro de xadrez onde as peças da primeira e da última fileira começam **em superposição** — cada uma pode ser um de dois tipos possíveis (ex.: Cavalo *ou* Bispo) — e só **colapsam** para um tipo definido no momento em que são movidas. Peças **emaranhadas** colapsam em pares complementares: revelar uma revela automaticamente o destino da outra.

O projeto nasceu com fins **didáticos**: ensinar noções de superposição e emaranhamento quântico através de uma metáfora lúdica e familiar (o xadrez), ao mesmo tempo em que oferece um ambiente de estudo de xadrez clássico, com reconhecimento de aberturas e dicas orientadas à fase da partida.

É um projeto **100% front-end**, sem build step, escrito em HTML, CSS e JavaScript puro (vanilla), pensado para ser fácil de ler, modificar e usar em sala de aula.

---

## ✨ Funcionalidades

- **Modo Quântico**: peças menores (cavalos/bispos) e maiores (torres/damas) da fileira de trás começam em superposição; peças de reis e peões são sempre clássicas.
- **Modo Clássico**: xadrez tradicional, útil para comparar com o modo quântico ou para quem está aprendendo as regras do jogo.
- **Emaranhamento**: pares de peças (ex.: `b1`↔`c1`) colapsam de forma complementar — se uma vira Cavalo, a outra automaticamente vira Bispo.
- **Adversário automatizado (IA)**: com três níveis; nos níveis médio/difícil no modo clássico, usa busca *minimax* com poda alfa-beta rodando em *Web Worker* (não trava a interface).
- **Modo dois jogadores** (mesmo dispositivo).
- **Relógios de partida** com predefinições (bullet, blitz, blitz Fischer, rápida, clássica) e opção personalizada.
- **Formato "Melhor de três"** com placar de torneio.
- **Painel de estudo** com:
  - Reconhecimento de **aberturas clássicas** (Siciliana, Francesa, Caro-Kann, Espanhola, Italiana, Gambito da Dama, Índia do Rei, etc.), identificadas por casas de origem/destino (robusto ao modo quântico) e apontando o próximo lance da teoria.
  - **Dicas contextuais** por fase da partida (abertura, meio-jogo, final) quando a posição sai do livro de aberturas.
  - Aviso específico quando há peças ainda emaranhadas no tabuleiro.
- **Avisos discretos** (toasts) ao lado do tabuleiro para movimentos inválidos, colapsos e resultados — sem bloquear a interface com `alert()`.
- **Totalmente responsivo**: tabuleiro fluido (`aspect-ratio`), painel lateral que se reorganiza abaixo do tabuleiro em telas estreitas, e alvos de toque confortáveis para celular/tablet.
- Rótulos discretos de coordenadas (`a`–`h`, `1`–`8`) no próprio tabuleiro.

---

## 🗂️ Estrutura dos arquivos

```text
xadrez-quantico/
├── .github/          # Templates de issues e pull request
├── docs/             # Documentação técnica, roadmap e guias de colaboração
├── index.html        # Estrutura (HTML) — telas de configuração e de jogo
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
- O estado quântico "por cima" das regras vive no objeto `pecasQuanticas`, indexado por casa (`"b1"`, `"e8"` etc.), com o formato:
  ```js
  {
    possibilidades: ['n', 'b'],   // tipos possíveis enquanto não colapsada
    cor: 'w',
    colapsada: null,              // tipo definitivo após o colapso, ou null
    emaranhadaComId: 1            // id do par emaranhado, ou null
  }
  ```
- Ao tentar mover uma peça quântica, `executarMovimento` testa cada possibilidade contra o `chess.js` (colocando temporariamente a peça daquele tipo no tabuleiro) até achar uma que gere um lance legal. É esse teste que causa o colapso.
- Se a peça pertence a um par emaranhado, o par restante colapsa automaticamente para o tipo **complementar**.
- O livro de aberturas (`aberturasClassicas`) identifica a abertura por **casas de origem/destino** (não pelo tipo da peça), justamente para continuar funcionando mesmo quando o modo quântico altera qual peça ocupa cada casa.

## 📚 Documentação do projeto

| Documento | Conteúdo |
|---|---|
| [`docs/PLANO_DE_EXPANSAO.md`](docs/PLANO_DE_EXPANSAO.md) | O quê construir: roadmap do motor de IA e do módulo didático. |
| [`docs/PROTOCOLO_DE_COLABORACAO.md`](docs/PROTOCOLO_DE_COLABORACAO.md) | Como colaborar: relato de bugs, estresse-teste, fluxo de PR, sugestões de usuários. |
| [`docs/COLABORACAO_NA_PRATICA_ROQUE.md`](docs/COLABORACAO_NA_PRATICA_ROQUE.md) | Estudo de caso real: passo a passo de como o bug do roque foi diagnosticado, corrigido e testado. |
| [`docs/DEPENDENCIAS.md`](docs/DEPENDENCIAS.md) | O que vem de fora: `chess.js`, ícones de peças, futuras engines — licenças e como contribuir de volta para elas. |
| [`docs/GUIA_DE_ESTUDOS_IA.md`](docs/GUIA_DE_ESTUDOS_IA.md) | Trilha de estudo para quem quer aprender IA de jogos construindo dentro deste projeto. |

## 🤝 Como contribuir

Contribuições são muito bem-vindas — de professores de xadrez, educadores de física/computação quântica, desenvolvedores e entusiastas em geral. Antes de abrir uma issue ou Pull Request, veja o [`docs/PROTOCOLO_DE_COLABORACAO.md`](docs/PROTOCOLO_DE_COLABORACAO.md) (como relatar bugs, testar mudanças e enviar sugestões) e o [`docs/PLANO_DE_EXPANSAO.md`](docs/PLANO_DE_EXPANSAO.md) (prioridades e ideias concretas).

Algumas ideias rápidas de próximos passos:

- Ampliar o livro de aberturas e as dicas de estudo (meio-jogo, finais específicos).
- Suporte a inversão do tabuleiro (jogar de pretas) e a notação PGN exportável.
- Melhorar a IA (ex.: avaliação posicional além de material, poda mais eficiente).
- Acessibilidade: navegação por teclado, leitor de tela, alto contraste.
- Internacionalização (i18n) da interface.
- Testes automatizados da lógica de colapso/emaranhamento.

Ao abrir um PR, descreva brevemente a motivação e, se possível, inclua capturas de tela para mudanças visuais.

## 📜 Licença

Este projeto é distribuído sob a licença **MIT** — veja o arquivo [`LICENSE`](LICENSE). Em resumo: qualquer pessoa pode usar, copiar, modificar e redistribuir o código, inclusive para fins comerciais, desde que mantenha o aviso de copyright e a licença original.

---

*Um projeto para aprender xadrez e mecânica quântica se divertindo — e para servir de ponto de partida para quem quiser construir algo parecido.*
