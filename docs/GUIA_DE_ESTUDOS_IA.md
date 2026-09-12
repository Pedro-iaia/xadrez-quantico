# 🧭 Guia de Estudos: da Curiosidade ao seu Próprio Motor de IA

Este guia é para quem terminou de ler o [`PLANO_DE_EXPANSAO.md`](./PLANO_DE_EXPANSAO.md), olhou para termos como "minimax", "MCTS" ou "expectiminimax", e pensou: *"gostaria de entender isso de verdade, não só usar"*. Não é preciso ter formação em Ciência da Computação para chegar lá — é preciso, principalmente, um projeto real para praticar. Você já tem um.

## Por que este projeto é um bom lugar para começar

A maior barreira para aprender IA de jogos não é a matemática — é a falta de um ambiente onde cada ideia pode ser testada e vista funcionando (ou falhando) imediatamente. Este repositório já resolve isso por você:

- As regras já estão implementadas (`chess.js` cuida da parte clássica).
- Já existe um adversário funcional, mesmo que simples, para comparar contra o que você construir.
- O jogo tem uma característica rara em material de estudo de IA: **incerteza genuína** (a superposição e o emaranhamento), o que te tira da zona de conforto do minimax de livro-texto muito mais rápido do que xadrez comum.

Ou seja: em vez de estudar teoria e só depois procurar um projeto para aplicá-la, aqui você pode alternar entre os dois o tempo todo.

## Trilha sugerida

### 1. Fundamentos de busca em jogos

Objetivo: entender por que o minimax funciona e por que poda alfa-beta acelera sem mudar o resultado.

- **Livro**: *Artificial Intelligence: A Modern Approach* (Russell & Norvig) — os capítulos sobre busca adversarial são a referência clássica, usada em cursos de IA no mundo todo.
- **Site**: [chessprogramming.org](https://www.chessprogramming.org/) — a enciclopédia da comunidade que constrói motores de xadrez. Cobre minimax, poda alfa-beta, tabelas de transposição, funções de avaliação, e praticamente qualquer termo técnico que você encontrar no `PLANO_DE_EXPANSAO.md`.
- **Prática neste projeto**: comece pelo item 1.4 do plano de expansão (melhorar a função de avaliação do minimax já existente). É a menor mudança possível com resultado visível — você literalmente sente a IA jogar diferente.

### 2. Jogos com incerteza e informação imperfeita

Objetivo: entender por que o xadrez quântico deste projeto não é só "minimax com um passo extra" — é uma categoria diferente de problema.

- **Artigo de referência**: Browne et al., *"A Survey of Monte Carlo Tree Search Methods"* (2012) — o levantamento mais citado sobre MCTS, explica bem por que ele lida naturalmente com incerteza.
- **Conceito-chave para estudar**: *determinização* / *Perfect Information Monte Carlo* — a técnica usada em jogos de cartas e no item 1.3 do plano de expansão. Procure por esses termos junto com "imperfect information games" para achar material.
- **Prática neste projeto**: implemente o PIMC do item 1.3 — é o exercício mais direto para sair da teoria e sentir na prática o que "informação oculta" significa para um algoritmo de busca.

### 3. Aprendizado por reforço e redes neurais em jogos

Objetivo: entender a fronteira atual (o "moonshot" do plano de expansão), mesmo que você não implemente isso ainda.

- **Livro (gratuito online)**: *Reinforcement Learning: An Introduction* (Sutton & Barto) — o livro-texto padrão da área, usado em praticamente todo curso de RL.
- **Artigo**: Silver et al., *"Mastering Chess and Shogi by Self-Play with a General Reinforcement Learning Algorithm"* (AlphaZero, DeepMind) — não é leitura fácil, mas dá para entender a ideia central sem dominar todo o formalismo matemático.
- **Ferramenta prática**: `tensorflow.js` (roda no navegador, mesmo ambiente deste projeto) — dá para experimentar com uma versão bem simplificada antes de tentar reproduzir algo do porte do AlphaZero.

### 4. Vídeo/aprendizado visual (se você aprende melhor vendo código sendo escrito)

- Procure por **"Coding Adventure: Chess AI"** no YouTube — é uma implementação passo a passo de um motor de xadrez clássico, muito didática para visualizar minimax e avaliação de posição sendo construídos do zero.

## Como praticar dentro deste próprio projeto (a parte mais importante)

Ler é necessário, mas a trilha só "cola" se você comparar versões na prática:

1. Escolha um item pequeno do `PLANO_DE_EXPANSAO.md` (comece pela seção 1.4, avaliação de posição).
2. Implemente uma versão simples.
3. **Meça, não assuma**: rode várias partidas do seu motor novo contra o antigo (automatize isso — os dois são só funções JavaScript, dá para rodar centenas de partidas em segundos sem interface gráfica) e compare a taxa de vitórias.
4. Documente o que mudou e por quê, e abra um PR seguindo o [`PROTOCOLO_DE_COLABORACAO.md`](./PROTOCOLO_DE_COLABORACAO.md).

Esse ciclo — hipótese, implementação pequena, medição, comparação — **é** a prática de pesquisa em IA de jogos, só que em escala de fim de semana em vez de escala de tese.

## Onde buscar ajuda e continuar motivado

- **TalkChess.com**: fórum de longa data dedicado especificamente à programação de motores de xadrez — a comunidade mais especializada que existe para esse tema específico.
- **Comunidades gerais de aprendizado de máquina**: fóruns e grupos de discussão sobre IA/ML em geral têm sempre alguém disposto a discutir busca em árvore e RL, mesmo que não seja o foco principal deles.
- **Este próprio repositório**: issues marcadas com labels relacionadas ao motor de IA são, por definição, problemas reais e do tamanho certo para praticar — não são exercícios artificiais de um curso, são código que outras pessoas vão de fato jogar contra.

## Uma última palavra sobre motivação

Programar um motor de xadrez decente é, para a maioria das pessoas, um processo de várias tentativas visivelmente ruins antes de uma que funcione bem — exatamente como aprender a jogar xadrez em si. A vantagem de aprender IA *dentro* de um projeto de xadrez é que essa metáfora não é força de expressão: você vai passar por derrotas do seu próprio motor contra versões antigas dele mesmo, ajustar, e melhorar — o mesmo ciclo de estudo que qualquer enxadrista percorre para evoluir. Trate cada versão pior da sua IA como trataria uma partida perdida: informação, não fracasso.
