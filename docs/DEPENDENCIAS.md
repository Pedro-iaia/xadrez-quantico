# 📦 Dependências Externas

Este projeto é intencionalmente **vanilla**: sem `npm install`, sem *bundler*, sem *build step*. Todas as dependências são carregadas diretamente por URL. Isso é ótimo para fins didáticos (qualquer pessoa abre o `index.html` e entende o projeto inteiro), mas significa que quem for contribuir precisa entender exatamente o que vem de fora — e este documento existe para isso.

Além de explicar cada dependência, a proposta aqui é mostrar que **usar uma biblioteca de código aberto é uma via de mão dupla**: nada impede que colaboradores deste projeto também contribuam de volta para essas bibliotecas.

---

## 1. `chess.js` (versão 0.10.3, via cdnjs)

**O que faz**: é a única fonte de verdade sobre as regras do xadrez clássico — geração e validação de lances, detecção de xeque/xeque-mate/empate, notação FEN e SAN/PGN. Toda a camada quântica do projeto (`pecasQuanticas`) é construída **por cima** dele; o `chess.js` nunca "sabe" que existe superposição.

- **Repositório**: [github.com/jhlywa/chess.js](https://github.com/jhlywa/chess.js)
- **Licença**: BSD-2-Clause (permissiva, compatível com o MIT deste projeto).
- **Por que uma versão tão antiga (0.10.3)?** É a última versão da API "clássica" (funções como `game_over()`, `in_checkmate()`, `moves({ verbose: true })`). O projeto foi escrito em torno dessa API.

### ⚠️ Nota importante para quem for atualizar essa dependência

O `chess.js` foi **reescrito em TypeScript** e mudou de API nas versões mais recentes (instaladas via `npm install chess.js`, não mais via aquele arquivo `.min.js` solto):

| API antiga (0.10.3, usada aqui) | API moderna |
|---|---|
| `chess.game_over()` | `chess.isGameOver()` |
| `chess.in_checkmate()` | `chess.isCheckmate()` |
| `chess.in_draw()` | `chess.isDraw()` |
| `new Chess()` (variável global) | `import { Chess } from 'chess.js'` (módulo) |

Migrar para a versão moderna é uma boa **issue técnica de porte médio** para quem quiser contribuir: exigiria trocar todas as chamadas acima em `script.js` e decidir se o projeto continua sem *bundler* (usando a build ESM do chess.js direto por `<script type="module">`) ou passa a ter um passo de build simples. Vale abrir uma *issue* de discussão antes de um PR grande assim.

### Como contribuir para o chess.js em si

O projeto aceita issues e Pull Requests normalmente pelo GitHub:

1. Leia o `README.md` do repositório e, se houver, o guia de contribuição.
2. Rode a suíte de testes localmente antes de propor mudanças (`npm test`).
3. Bugs de regras de xadrez (casos raros de en passant, promoção, empate por repetição) são contribuições especialmente valiosas — e você já está testando essas regras indiretamente todos os dias ao testar o modo Clássico deste projeto.
4. Comece pequeno: corrigir um erro de digitação na documentação ou melhorar um teste é uma ótima forma de aprender o fluxo de contribuição de um projeto que você ainda não conhece por dentro.

---

## 2. Ícones das peças (Wikimedia Commons)

**O que é**: o conjunto de peças de xadrez em SVG desenhado por **Cburnett** (usuário do Wikimedia Commons), o mesmo conjunto usado por incontáveis sites e livros de xadrez ao redor do mundo.

- **Autor**: [Cburnett](https://commons.wikimedia.org/wiki/User:Cburnett)
- **Licença**: as imagens são **multi-licenciadas** — o autor permite escolher entre BSD (3 cláusulas), GFDL, GPL **ou** Creative Commons BY-SA 3.0. Ao reutilizar, a opção mais simples de citar é: *"Peças de xadrez por Cburnett, CC BY-SA 3.0"*, com link para a licença. (Correção em relação a uma versão anterior deste README, que descrevia as imagens de forma imprecisa como "domínio público" — não é o caso; são multi-licenciadas, e a atribuição ao autor deve ser mantida.)

### Como contribuir para o Wikimedia Commons

Esta é talvez a contribuição "de retorno" mais acessível de todo este documento, e existe uma oportunidade criativa específica para este projeto:

1. Crie uma conta gratuita em [commons.wikimedia.org](https://commons.wikimedia.org).
2. Qualquer SVG novo de peças de xadrez (ex.: **um conjunto temático "quântico"**, com um estilo visual translúcido/holográfico condizente com a proposta deste projeto) pode ser enviado como contribuição original, licenciado por você mesmo(a) sob CC BY-SA — e depois reutilizado aqui.
3. Siga as convenções de nomenclatura da categoria [SVG chess pieces](https://commons.wikimedia.org/wiki/Category:SVG_chess_pieces) para que seu conjunto seja descoberto e reutilizado por outros projetos, não só o nosso.

Ou seja: um colaborador com talento para ilustração poderia desenhar um conjunto de peças com "aparência de superposição" nativa (sem precisar da nossa sobreposição via CSS) — e doar esse trabalho de volta para a comunidade Wikimedia, não só para este repositório.

---

## 3. Futuras dependências de motor de IA (ver `PLANO_DE_EXPANSAO.md`, parte 1)

Ainda não estão integradas, mas fazem parte do roadmap — vale já entender a licença de cada uma antes de propor a integração:

### Stockfish / `stockfish.wasm`

- **Repositórios**: [official-stockfish/Stockfish](https://github.com/official-stockfish/Stockfish) (motor original, C++) e [lichess-org/stockfish.wasm](https://github.com/lichess-org/stockfish.wasm) (port para WebAssembly, usado pelo lichess.org).
- **Licença**: **GPL-3.0** — copyleft forte, diferente da licença MIT deste projeto.
- **⚠️ Atenção legal**: combinar código GPL-3.0 com código MIT num mesmo produto tem implicações que vão além do que este documento pode resolver. Na prática, sites como o lichess.org usam o Stockfish compilado para WebAssembly como um **processo separado**, comunicando por *message passing* (o mesmo padrão que este projeto já usa para o *Web Worker* do minimax) — o que é geralmente aceito como não-propagação da GPL ao restante da aplicação, mas **isto não é aconselhamento jurídico**. Se/quando o projeto for integrar o Stockfish de fato, vale revisar essa questão com alguém familiarizado com licenciamento de software livre antes de publicar.
- **Como contribuir para o Stockfish em si**: o projeto tem uma cultura de contribuição muito madura, centrada em testes estatísticos de força via [Fishtest](https://tests.stockfishchess.org/tests) — qualquer pessoa pode doar poder computacional rodando o *Fishtest Worker* para ajudar a validar mudanças propostas por outros, mesmo sem escrever C++. Para quem programa em C++, o [Chess Programming Wiki](https://www.chessprogramming.org/) é a referência para entender as técnicas usadas internamente antes de propor mudanças.

### Fairy-Stockfish

- **Repositório**: [fairy-stockfish/Fairy-Stockfish](https://github.com/fairy-stockfish/Fairy-Stockfish)
- **Licença**: GPL-3.0 (é um fork do Stockfish, herda a mesma licença) — mesma observação acima se aplica.
- Suporta variantes de xadrez via arquivo de configuração; uma variante "xadrez quântico com emaranhamento" customizada exigiria contribuir diretamente para esse projeto (não só consumi-lo), já que as regras deste jogo não existem em nenhuma variante pronta.

---

## 4. Boas práticas gerais para se tornar colaborador(a) de bibliotecas de terceiros

Se esta é sua primeira vez contribuindo para um projeto que você não criou:

1. **Leia antes de escrever**: o `README.md`, o `CONTRIBUTING.md` (se existir) e alguns *issues*/PRs recentes já fechados, para entender o padrão esperado.
2. **Comece pequeno**: uma correção de documentação, um teste faltante, ou um bug bem isolado são ótimas primeiras contribuições — constroem confiança (sua e da comunidade) antes de mudanças maiores.
3. **Abra uma issue antes de um PR grande**: evita trabalho perdido se a mantenedora/mantenedor já tiver uma direção diferente em mente.
4. **Seja paciente com a revisão**: manutenção de projeto open source é trabalho voluntário na maioria dos casos; um PR pode levar dias ou semanas para ser revisado.
5. **Assuma boa-fé**: comentários de revisão são sobre o código, não sobre você.

O mesmo vale, é claro, para quem for revisar contribuições **deste** projeto vindas de outras pessoas — ver [`PROTOCOLO_DE_COLABORACAO.md`](./PROTOCOLO_DE_COLABORACAO.md).
