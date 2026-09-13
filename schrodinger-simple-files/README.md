# ♟️ Xadrez de Schrödinger

Um tabuleiro de xadrez onde as peças de Torre, Cavalo e Bispo da primeira e da última fileira começam **em superposição** — até serem movidas ou capturadas, não se sabe ao certo qual é qual — e só **colapsam** para um tipo definido no momento em que essa incerteza é "medida" por uma jogada. Os dois Bispos de cada jogador nunca colapsam para a mesma cor de casa: um análogo, dentro do jogo, do Princípio de Exclusão de Pauli.

O projeto nasceu com fins **didáticos**: ensinar noções de superposição, colapso e emaranhamento quântico através de uma metáfora lúdica e familiar (o xadrez), ao mesmo tempo em que oferece um ambiente de estudo de xadrez clássico, com reconhecimento de aberturas e dicas orientadas à fase da partida.

Esta é a variante **simplificada** do modelo quântico do jogo — fundamentada em [`PARECER_TECNICO_COERENCIA_FISICA.md`](./PARECER_TECNICO_COERENCIA_FISICA.md). Uma variante mais completa e matematicamente mais rica, **"Xadrez de Schrödinger GHZ"**, está planejada como um modo à parte.

É um projeto **100% front-end**, sem build step, escrito em HTML, CSS e JavaScript puro (vanilla), pensado para ser fácil de ler, modificar e usar em sala de aula.

---

## ✨ Funcionalidades

- **Modo Quântico**: Rei, Dama e Peões são sempre clássicos; as Torres, Cavalos e Bispos de cada flanco (lado da Dama e lado do Rei) formam, juntos, um único sistema quântico de 10 configurações possíveis — nunca duas peças do mesmo tipo, e os dois Bispos sempre em cores de casa diferentes.
- **Modo Clássico**: xadrez tradicional, útil para comparar com o modo quântico ou para quem está aprendendo as regras do jogo.
- **Emaranhamento com efeito cascata**: revelar uma peça de um flanco pode, de uma só vez, determinar o tipo de outras peças do mesmo flanco — e até do flanco oposto, por causa da restrição de cor entre os Bispos.
- **Capturas como medição**: capturar uma peça adversária ainda em superposição também revela o tipo dela (e propaga a revelação), não apenas movê-la.
- **Roque fisicamente consistente**: só é possível enquanto a peça do canto ainda pode ser uma Torre; se ela já revelou ser Cavalo ou Bispo, o roque para aquele lado fica indisponível.
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
- **Página de boas-vindas** com um artigo introdutório sobre mecânica quântica (superposição, colapso, emaranhamento) para quem chega sem nenhuma base no assunto, com opção de não mostrar novamente.

---

## 🗂️ Estrutura dos arquivos

```
xadrez-quantico/
├── index.html   # Estrutura (HTML) — telas de configuração e de jogo
├── style.css    # Aparência (CSS) — tema escuro, tabuleiro, painel, avisos
└── script.js    # Lógica (JS) — regras quânticas, IA, relógio, dicas de estudo
```

Não há dependências instaladas via `npm`; o projeto usa duas bibliotecas externas carregadas por CDN/URL direta:

- [`chess.js` 0.10.3](https://github.com/jhlywa/chess.js) — validação de regras e notação SAN do xadrez clássico subjacente (licença BSD-2-Clause).
- Ícones de peças em SVG de **Cburnett**, via [Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:SVG_chess_pieces) — multi-licenciados (BSD / GFDL / GPL / CC BY-SA 3.0); atribuição mantida ao autor. Veja [`DEPENDENCIAS.md`](./DEPENDENCIAS.md) para detalhes de licenciamento de todas as dependências.

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
| [`PARECER_TECNICO_COERENCIA_FISICA.md`](./PARECER_TECNICO_COERENCIA_FISICA.md) | Fundamentação física do modelo quântico: por que as regras são o que são, com a matemática por trás. |
| [`PLANO_DE_EXPANSAO.md`](./PLANO_DE_EXPANSAO.md) | O quê construir: roadmap do motor de IA e do módulo didático. |
| [`PROTOCOLO_DE_COLABORACAO.md`](./PROTOCOLO_DE_COLABORACAO.md) | Como colaborar: relato de bugs, estresse-teste, fluxo de PR, sugestões de usuários. |
| [`DEPENDENCIAS.md`](./DEPENDENCIAS.md) | O que vem de fora: `chess.js`, ícones de peças, futuras engines — licenças e como contribuir de volta para elas. |
| [`GUIA_DE_ESTUDOS_IA.md`](./GUIA_DE_ESTUDOS_IA.md) | Trilha de estudo para quem quer aprender IA de jogos construindo dentro deste projeto. |
| [`COLABORACAO_NA_PRATICA_ROQUE.md`](./COLABORACAO_NA_PRATICA_ROQUE.md) | Exemplo real, passo a passo, de todo o ciclo: relatar → corrigir → commitar → PR. |

## 🤝 Como contribuir

Contribuições são muito bem-vindas — de professores de xadrez, educadores de física/computação quântica, desenvolvedores e entusiastas em geral. Antes de abrir uma issue ou Pull Request, veja o [`PROTOCOLO_DE_COLABORACAO.md`](./PROTOCOLO_DE_COLABORACAO.md) (como relatar bugs, testar mudanças e enviar sugestões) e o [`PLANO_DE_EXPANSAO.md`](./PLANO_DE_EXPANSAO.md) (prioridades e ideias concretas).

Algumas ideias rápidas de próximos passos:

- Ampliar o livro de aberturas e as dicas de estudo (meio-jogo, finais específicos).
- Suporte a inversão do tabuleiro (jogar de pretas) e a notação PGN exportável.
- Melhorar a IA (ex.: avaliação posicional além de material, poda mais eficiente).
- Acessibilidade: navegação por teclado, leitor de tela, alto contraste.
- Internacionalização (i18n) da interface.
- Testes automatizados da lógica de colapso/emaranhamento.

Ao abrir um PR, descreva brevemente a motivação e, se possível, inclua capturas de tela para mudanças visuais.

## 📜 Licença

Este projeto é distribuído sob a licença **MIT** — veja o arquivo [`LICENSE`](./LICENSE). Em resumo: qualquer pessoa pode usar, copiar, modificar e redistribuir o código, inclusive para fins comerciais, desde que mantenha o aviso de copyright e a licença original.

---

*Um projeto para aprender xadrez e mecânica quântica se divertindo — e para servir de ponto de partida para quem quiser construir algo parecido.*
