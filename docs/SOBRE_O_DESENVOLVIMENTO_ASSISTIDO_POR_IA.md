# Como Este Projeto Foi Construído: Colaboração Humano–IA e a Zona de Desenvolvimento Proximal

**Assunto:** transparência sobre o processo de desenvolvimento do Xadrez de Schrödinger, a divisão de papéis entre o autor humano e as ferramentas de inteligência artificial envolvidas, e a fundamentação desse processo na teoria sociocultural do desenvolvimento cognitivo de Lev Vygotsky.

---

## 1. Nota de transparência

Este projeto — um jogo de xadrez com um modelo de superposição, emaranhamento e colapso fisicamente fundamentado (ver [`PARECER_TECNICO_COERENCIA_FISICA.md`](./PARECER_TECNICO_COERENCIA_FISICA.md)), com um motor de regras completo, suíte de testes automatizados, e um conjunto de documentação técnica e pedagógica de várias dezenas de páginas — foi concebido e dirigido por um autor com formação em Matemática, sem formação formal em Física nem em Engenharia de Software profissional na escala aqui empregada, com apoio substancial de ferramentas de inteligência artificial em praticamente todas as etapas.

É importante que isso seja dito com todas as letras, por duas razões que não se excluem:

1. **Honestidade sobre a autoria.** Seria impreciso — e pedagogicamente contraproducente — apresentar este projeto como obra exclusivamente humana no sentido tradicional do termo. Boa parte da fundamentação física, da arquitetura do código e da própria redação da documentação técnica foi produzida em diálogo direto com sistemas de IA, sob direção, curadoria e validação constantes do autor.
2. **Um convite, não uma ressalva.** O propósito de tornar isso explícito não é diminuir o resultado, mas o oposto: demonstrar, de forma concreta e verificável, que a combinação entre julgamento humano genuíno (neste caso, formação matemática, interesse pedagógico e critério de qualidade) e o conhecimento acumulado em grandes modelos de linguagem torna acessível a construção de sistemas que o autor, sozinho, não teria como produzir nesse nível de completude e correção — e que o mesmo caminho está aberto a qualquer leitor com interesse e critério semelhantes, com resultados potencialmente ainda melhores.

## 2. Divisão de papéis no desenvolvimento

O desenvolvimento envolveu três agentes com funções distintas e complementares:

**O autor humano** definiu o propósito pedagógico do projeto, tomou toda decisão de escopo e de prioridade, formulou as perguntas que motivaram cada revisão de regras (inclusive a que deu origem ao parecer técnico de coerência física), avaliou e testou o resultado em primeira mão, e manteve a palavra final sobre o que entrava ou não no projeto. Nenhuma etapa deste processo dispensou julgamento humano — a IA propôs, o autor decidiu.

**Claude (Anthropic)** atuou como consultor científico e arquiteto de software: avaliação da consistência física e matemática das regras propostas, desenvolvimento do modelo combinatório-probabilístico que fundamenta o modo quântico do jogo, projeto da arquitetura de estado do software (a representação do tabuleiro como hipóteses vivas sobre permutações, e não como variáveis independentes por casa), implementação e revisão do código correspondente, elaboração das suítes de teste automatizadas usadas para validar cada mudança, e redação da documentação técnica e pedagógica do projeto — sempre em resposta a instruções, perguntas e critérios de aceitação estabelecidos pelo autor.

**Google Antigravity**, uma plataforma de desenvolvimento agêntica que opera diretamente sobre o ambiente local de código, cuidou da camada de execução: aplicação das alterações de código no repositório, validação funcional no navegador em ambiente local (`localhost`), e apoio ao fluxo de controle de versão — incluindo commits e o auxílio na gestão de colaborações externas (revisão de *pull requests*, por exemplo). Nesse sentido, funcionou como o "engenheiro de campo" do projeto: o agente que efetivamente manuseia o repositório e o executa, complementando o trabalho de concepção e arquitetura realizado em diálogo com Claude.

Essa divisão — direção humana, consultoria científica/arquitetura de software por um modelo de linguagem, execução agêntica por outro — é o objeto da análise pedagógica que se segue.

### 2.1 A camada agêntica: o papel e as peculiaridades da IDE Antigravity

A inclusão de uma plataforma agêntica integrada como o Google Antigravity na dinâmica deste projeto introduz distinções qualitativas fundamentais em relação ao uso de assistentes de código convencionais (como autocompletes em linha ou janelas de chat desvinculadas do ambiente):

1. **Separação estrita entre Plano e Execução (Planning Mode e Checkpoints Cognitivos)**:
   Diferente de assistentes que editam arquivos no calor do momento ou emitem fragmentos de código desconexos, a arquitetura do Antigravity opera sob um paradigma deliberativo: diante de demandas complexas, o agente obrigatoriamente pausa modificações de código, investiga o repositório em modo somente-leitura e elabora um plano de implementação formal (`implementation_plan.md`). Esse artefato mapeia os impactos arquiteturais, dependências, riscos de regressão e métodos de teste, submetendo tudo à chancela prévia e explícita do autor humano. Esse mecanismo impede o desvio de escopo, elimina suposições silenciosas e assegura que a soberania decisória permaneça integralmente com o desenvolvedor.

2. **Ancoragem profunda no Sistema Operacional e no Ciclo de Vida do Repositório (System Grounding)**:
   O agente não reside em uma caixa de texto desconectada; ele possui percepção operacional direta da árvore de arquivos, do terminal do sistema e do grafo do Git. Na evolução deste repositório, essa capacidade manifestou-se de forma crítica quando o projeto recebeu colaborações externas simultâneas (múltiplos *Pull Requests* de revisão e estresse-teste). O Antigravity foi capaz de auditar os branches remotos, executar avanços rápidos (`git pull --ff-only`), conciliar o código sem conflitos e garantir que as modificações locais respeitassem os padrões e o histórico do repositório.

3. **Ciclo Empírico de Verificação Autônoma (*"Evidence before Assertion"*)**:
   Uma peculiaridade técnica e metodológica central da IDE é o rigor empírico: nenhuma tarefa é dada como concluída sem evidência factual e verificável de funcionamento. Em vez de supor que uma alteração é correta em abstrato, o agente instancia suítes de testes em Node.js em diretório temporário, inicializa servidores HTTP locais e delega a subagentes de navegador headless a tarefa de navegar pela interface, interagir com o tabuleiro, simular colapsos quânticos, inspecionar erros no console e capturar gravações em vídeo e capturas de tela. O resultado só é validado após a constatação empírica de ausência de regressões.

4. **Curadoria Ativa de Privacidade e Autonomia Arquitetural**:
   A visão sistêmica sobre os ativos do projeto permitiu ao ambiente diagnosticar proativamente dependências frágeis ou invasivas — como a presença de requisições CDN a serviços terceiros capazes de injetar *cookies* de rastreamento no cliente. Sob a orientação do autor, o agente localizou e baixou todos os ativos vetoriais (SVG) e bibliotecas JavaScript, reestruturando o projeto para um formato 100% autônomo, auto-hospedado (*offline-first*), imune a instabilidades externas de rede e estritamente aderente às melhores práticas de privacidade (LGPD).

## 3. Fundamentação teórica: a Zona de Desenvolvimento Proximal

### 3.1 O conceito original

Lev Vygotsky definiu a **Zona de Desenvolvimento Proximal** (ZDP) como

> "a distância entre o nível de desenvolvimento real, determinado pela capacidade de resolver problemas de forma independente, e o nível de desenvolvimento potencial, determinado pela capacidade de resolver problemas sob orientação de um adulto ou em colaboração com pares mais capazes" (Vygotsky, 1978, p. 86).

O conceito nasceu da psicologia do desenvolvimento infantil e é indissociável de duas ideias que frequentemente se perdem quando o termo circula fora desse contexto original: (i) a mediação ocorre por meio de ferramentas e signos culturais — a linguagem sendo o exemplo paradigmático (Vygotsky, 1934/1962) —, e (ii) o apoio oferecido é, por definição, **transitório**: o objetivo declarado da mediação é que a capacidade mediada seja progressivamente **internalizada**, deixando de depender do mediador. O termo **scaffolding** (andaime), hoje quase sinônimo popular de ZDP, não foi cunhado por Vygotsky — é uma elaboração posterior de Wood, Bruner e Ross (1976) para descrever operacionalmente esse apoio temporário e sua retirada gradual.

### 3.2 Uma extensão da teoria, não uma aplicação literal

Estender a ZDP da relação criança–adulto (ou aprendiz–par mais competente) para a relação entre um profissional adulto e um modelo de linguagem é, explicitamente, uma **analogia estrutural**, não uma aplicação literal da teoria — da mesma forma que este projeto trata a analogia entre peças de xadrez e partículas do Modelo Padrão como ilustrativa, e não como correspondência formal (ver [`PARECER_TECNICO_COERENCIA_FISICA.md`](./PARECER_TECNICO_COERENCIA_FISICA.md), Seção 11). Feita essa ressalva, o paralelo estrutural é produtivo:

| Conceito de Vygotsky (1978) | Papel correspondente neste projeto |
|---|---|
| Nível de desenvolvimento real | O que o autor conseguiria formular e implementar sozinho, com sua formação em Matemática e sem treinamento formal em Física ou engenharia de software de larga escala |
| Nível de desenvolvimento potencial | O sistema efetivamente construído: um modelo fisicamente fundamentado, implementado, testado e documentado |
| Mediação por ferramentas e signos | O diálogo em linguagem natural (as instruções, perguntas e critérios do autor) como instrumento de mediação entre a intenção e a implementação |
| Par mais capaz (elaboração posterior à ZDP original) | Os modelos de linguagem — cada um contribuindo um tipo de conhecimento acumulado (raciocínio científico e arquitetura de software, de um lado; execução e integração, de outro) que o autor não possuía de antemão |

Um exemplo concreto, interno a este próprio projeto, ilustra a diferença entre "receber uma resposta pronta" e efetivamente operar dentro de uma zona de desenvolvimento proximal: a revisão que deu origem ao parecer técnico de coerência física não foi solicitada em abstrato — nasceu de o autor identificar, por conta própria, que o modelo de superposição então em uso permitiria configurações fisicamente inconsistentes (peças duplicadas, bispos na mesma cor de casa), e articular esse questionamento com precisão suficiente para orientar a revisão subsequente. Isso é, precisamente, o padrão que a teoria prevê: o apoio mediado (a IA) não substitui a capacidade de formular o problema — a amplia, e a capacidade de formulação do problema, por sua vez, evolui ao longo do processo.

### 3.3 Uma ressalva necessária: internalização, não substituição permanente

A teoria de Vygotsky não descreve apenas um mecanismo de ampliação de capacidade — descreve um mecanismo de **desenvolvimento**, no qual o apoio externo é retirado à medida que a capacidade é internalizada. Essa é a parte da analogia que exige mais cautela, e que vale registrar explicitamente em vez de omitir: se a assistência de IA nunca for retirada, e a competência subjacente nunca for internalizada pelo autor ou pelo leitor, o processo descrito aqui se assemelha menos a uma zona de desenvolvimento proximal genuína e mais a uma prótese cognitiva permanente — o que não é necessariamente negativo (próteses ampliam capacidade real de forma legítima), mas é uma categoria diferente do fenômeno que Vygotsky descreveu, e a diferença importa para quem pretende usar este processo como modelo de **aprendizado**, e não apenas de **produção**.

Por essa razão, o [`GUIA_DE_ESTUDOS_IA.md`](./GUIA_DE_ESTUDOS_IA.md) deste projeto insiste em medir, comparar e reimplementar pequenas partes por conta própria, em vez de apenas consumir o que a IA produz — é essa prática, e não a mera disponibilidade da ferramenta, que determina se o processo se aproxima mais de uma ZDP genuína ou de uma dependência sem desenvolvimento.

### 3.4 Uma observação terminológica: isto não é *vibe coding*

O termo popular para descrever desenvolvimento assistido por IA em linguagem natural é *vibe coding*, cunhado por Andrej Karpathy em fevereiro de 2025. Karpathy definiu a prática, em sua formulação original, como "entregar-se totalmente às vibrações... e esquecer que o código sequer existe" — aceitando o resultado da IA sem revisão linha a linha. Vale a distinção: o processo aqui descrito é deliberadamente **o oposto disso** em um aspecto essencial — cada regra proposta foi verificada por contagem combinatória explícita, cada implementação foi acompanhada de suíte de testes automatizados, e cada afirmação factual (inclusive as citações bibliográficas deste documento e do parecer técnico) foi checada antes de ser incluída. Se o leitor pretende reproduzir este processo, a recomendação deste projeto é a mesma que aparece em [`PROTOCOLO_DE_COLABORACAO.md`](./PROTOCOLO_DE_COLABORACAO.md) e em [`GUIA_DE_ESTUDOS_IA.md`](./GUIA_DE_ESTUDOS_IA.md): tratar a IA como um colaborador cujo trabalho se verifica, não como um oráculo cujo resultado se aceita.

## 4. Um convite

O ponto central deste registro não é "veja como a IA é capaz" — é: **um matemático sem formação em física conseguiu produzir, dirigir e validar um modelo fisicamente coerente de mecânica quântica aplicada a um jogo de tabuleiro, com uma implementação de software completa e testada, porque trouxe critério de qualidade genuíno e disposição para verificar, questionar e corrigir cada etapa.** O resultado não veio de delegar julgamento — veio de usar ferramentas de IA precisamente para ampliar um julgamento que já existia.

Qualquer leitor com interesse genuíno em um domínio — seja ele físico, matemático, biólogo, historiador ou artista — parte de uma posição equivalente: conhecimento de domínio real, e uma zona de desenvolvimento proximal hoje mais acessível do que em qualquer momento anterior, mediada por modelos de linguagem cada vez mais capazes. A expectativa razoável não é que o leitor reproduza exatamente este projeto — é que produza algo diferente, no seu próprio domínio de interesse, e que o resultado seja tão bom quanto, ou melhor do que, o que está documentado aqui.

## 5. Referências

KARPATHY, A. *Postagem original sobre "vibe coding"*. X (antigo Twitter), 2 fev. 2025.

VYGOTSKY, L. S. *Mind in Society: The Development of Higher Psychological Processes*. (M. Cole, V. John-Steiner, S. Scribner & E. Souberman, Eds.). Cambridge, MA: Harvard University Press, 1978. (Trabalho original de ca. 1930–1934.)

VYGOTSKY, L. S. *Thought and Language*. Cambridge, MA: MIT Press, 1962. (Trabalho original de 1934; ver também a tradução posterior *Thinking and Speech*, em *The Collected Works of L. S. Vygotsky*, v. 1, Nova York: Plenum Press, 1987.)

WOOD, D.; BRUNER, J. S.; ROSS, G. The role of tutoring in problem solving. *Journal of Child Psychology and Psychiatry*, v. 17, n. 2, p. 89–100, 1976.
