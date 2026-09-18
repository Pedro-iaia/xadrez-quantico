# Parecer Técnico sobre a Analogia de Objetos Quânticos com Peças de Xadrez

**Assunto:** fundamentação física e matemática do modelo de superposição, emaranhamento e colapso empregado no Xadrez de Schrödinger; revisão de consistência à luz de regras de superseleção, do postulado de projeção e da noção de condição de contorno em mecânica quântica.

---

## Resumo

Este parecer estabelece as bases físicas e matemáticas de uma analogia entre objetos quânticos e peças de xadrez, propondo um modelo combinatório-probabilístico que (i) preserva rigorosamente o inventário de peças de cada jogador, (ii) reproduz a estrutura de um estado emaranhado do tipo GHZ para os três objetos móveis de cada flanco, e (iii) trata Rei, Dama e Peões como **condições de contorno clássicas** que tornam o restante do problema bem-posto. O documento também propõe uma analogia ilustrativa entre os tipos de peça e as partículas elementares do Modelo Padrão, sujeita a ressalvas explícitas quanto aos limites dessa correspondência, e conclui com a revisão bibliográfica que fundamenta cada afirmação.

---

## 1. Escopo e Limitações do Modelo

O modelo aqui descrito emprega da mecânica quântica três ingredientes específicos — superposição, emaranhamento e colapso via medição — sem reproduzir a evolução temporal contínua governada pela equação de Schrödinger dependente do tempo. Não há, no sistema, um operador Hamiltoniano conduzindo a evolução unitária das amplitudes entre um lance e outro: o estado de cada peça permanece estático até o instante de uma medição (um lance ou uma captura), que atua como uma projeção instantânea, não como uma evolução dinâmica contínua.

Trata-se de uma delimitação de escopo deliberada, e não de uma imprecisão a ser corrigida: o objeto de estudo é um sistema de **medição projetiva discreta** sobre um espaço de estados de dimensão finita, análogo, em estrutura formal, a um registrador de qubits sujeito a medições projetivas na base computacional — não a um sistema com Hamiltoniano contínuo. As propriedades que o modelo compromete-se a honrar com rigor completo são: (i) a conservação do inventário clássico de peças como regra de superseleção; (ii) a estrutura combinatória de estados emaranhados de três corpos (GHZ); e (iii) o postulado de projeção de Born, com probabilidades explicitamente calculadas e amostragem genuinamente aleatória. As seções seguintes desenvolvem cada um desses três pontos.

---

## 2. Fundamentação Física: Regras de Superseleção e Invariantes Estruturais

A propriedade central que o modelo deve preservar é que o inventário de peças de cada jogador — exatamente 2 torres, 2 cavalos, 2 bispos, 1 dama, 1 rei e 8 peões — nunca seja alterado por qualquer processo de superposição ou colapso. O conceito físico correto para essa exigência não é uma "lei de conservação" no sentido de uma trajetória clássica, mas sim uma **regra de superseleção**: a existência de setores do espaço de estados que nenhuma superposição física admissível pode misturar. O exemplo canônico na literatura é a carga elétrica — não existe, na natureza, um estado que seja superposição entre "um elétron" e "dois elétrons e uma ausência de carga"; a soma de cargas é um número de superseleção. A noção foi introduzida formalmente por Wick, Wightman e Wigner (1952) e permanece o tratamento de referência do tema.

A restrição adicional de que os dois bispos de um mesmo jogador nunca ocupem casas da mesma cor constitui um **invariante estrutural de superseleção geométrica** do xadrez. Embora a física rigorosa da exclusão de Pauli aplique-se a férmions idênticos indistinguíveis sob antissimetrização de troca na função de onda contínua, a analogia didática com Pauli (Pauli, 1925) é empregada no projeto em sentido ilustrativo: dois objetos de mesma classe (Bispos) não podem coexistir no mesmo estado funcional (mesma cor de casa). Cavalos e torres, por não carregarem essa restrição geométrica de cor, comportam-se como objetos livremente intercambiáveis no inventário do flanco.

Essa distinção conceitual — superseleção para a conservação de inventário e restrição topológica-geométrica para a cor dos bispos — é o que permite construir, na Seção 5, uma solução estruturalmente simples em vez de um conjunto de regras ad hoc.

---

## 3. Diagnóstico do Modelo de Superposição Independente

Um modelo que trata cada casa do tabuleiro como uma superposição binária independente das demais apresenta três inconsistências:

1. **Inconsistência de cor de bispo entre flancos.** Quando os flancos da dama e do rei colapsam de forma independente, é possível — e, como demonstrado na Seção 5.3, longe de improvável — obter dois bispos da mesma cor de casa, uma configuração que jamais ocorre na posição inicial de uma partida clássica.
2. **Ausência de emaranhamento entre os três tipos adjacentes de um flanco** (Torre, Cavalo, Bispo). Um modelo de pares independentes não reproduz o efeito de cascata em que o colapso de uma peça restringe a distribuição de probabilidade das outras duas.
3. **Colapso não-probabilístico.** Caso a rotina de decisão avalie os tipos possíveis em ordem fixa e interrompa a busca no primeiro que resulta em lance legal, o resultado passa a ser determinístico sempre que mais de um tipo permitiria o mesmo lance — o que viola o postulado de Born (Born, 1926) tão diretamente quanto os dois problemas anteriores, apenas em outro ponto do sistema.

O modelo apresentado a seguir resolve as três inconsistências simultaneamente, por compartilharem a mesma causa estrutural: a ausência de uma restrição conjunta sobre o espaço de configurações.

---

## 4. Condições de Contorno Clássicas: Fundamentos de Física Matemática

Um problema em mecânica quântica — tipicamente formulado como uma equação diferencial (a equação de Schrödinger) ou, em espaços de dimensão finita, como um problema espectral sobre um operador auto-adjunto — só admite solução única quando **condições de contorno** são especificadas. Na formulação rigorosa da mecânica quântica em espaços de Hilbert, isso corresponde a escolher o **domínio de auto-adjunção** do operador Hamiltoniano: o mesmo operador formal pode admitir diferentes extensões auto-adjuntas, cada uma correspondendo a uma física distinta, e a escolha da extensão é equivalente à escolha das condições de contorno (Reed & Simon, 1975). Sem essa escolha, o problema é matematicamente mal-posto no sentido de Hadamard — a existência de solução, sua unicidade, ou a dependência contínua dos dados podem falhar.

Propõe-se aqui uma analogia estrutural — não uma redução formal, dado que o sistema em questão é finito e combinatório, não um operador diferencial em espaço de dimensão infinita — entre essa exigência e o papel desempenhado por Rei, Dama e Peões no modelo:

- A cor de cada casa do tabuleiro é um fato clássico, definido antes de qualquer regra do jogo. Uma regra como "a Dama inicia na casa da sua própria cor" só é uma proposição com valor de verdade bem definido se a identidade da peça e a cor da casa forem ambas, nesse momento, variáveis clássicas — do contrário, a própria formulação da regra é indeterminada.
- Rei, Dama e Peões cumprem, portanto, o papel de **dados de contorno**: fixam a referência clássica (a orientação do tabuleiro, a condição de xeque, a condição de término da partida) em relação à qual a incerteza do setor quântico (o conjunto Torre/Cavalo/Bispo de cada flanco) passa a ser um problema bem-posto — um espaço amostral finito e enumerável, e não uma superposição irrestrita sobre a totalidade das 32 peças.
- Do ponto de vista físico, essa escolha também pode ser lida através da noção de **decoerência**: graus de liberdade fortemente acoplados a um referencial externo (aqui, o próprio referencial do jogo — a regra de xeque, a condição terminal) comportam-se efetivamente como clássicos, ao passo que graus de liberdade quase-degenerados e fracamente acoplados a esse referencial (Cavalo e Bispo, ambos avaliados em ≈3 pontos em qualquer tabela de avaliação clássica, sem parceiro comparável para Dama ou Rei) são os candidatos naturais à descrição quântica (Zurek, 2003).

**Regra 1:** Rei, Dama e Peões são variáveis clássicas por construção — condições de contorno fixadas antes de qualquer preparação de estado — em qualquer modo quântico do jogo. Nenhuma superposição é definida sobre essas peças.

---

## 5. O Modelo Proposto

### 5.1 Cada flanco como uma permutação, não três sorteios independentes

A conservação estrita do inventário de um flanco (exatamente 1 Torre, 1 Cavalo, 1 Bispo) é garantida de forma estrutural, e não por verificação a posteriori, ao modelar a superposição como uma distribuição sobre **permutações** do conjunto {R, N, B}, em vez de três sorteios binários independentes por casa. Uma permutação, por definição, reatribui rótulos sem jamais duplicar ou omitir um elemento.

O espaço de configurações de cada flanco é formado por 3! = 6 permutações σ ∈ S₃ de {R, N, B} sobre as três casas do flanco. Quando os flancos são acoplados pela restrição global de cores dos bispos (Seção 5.2), o sistema conjunto passa a ser descrito pela superposição uniforme sobre as configurações válidas:

```
|Ψ_global⟩ = (1/√20) · Σ_{k=1}^{20} |config_k⟩
```

A distribuição uniforme sobre o conjunto de 20 estados válidos reflete o princípio da máxima entropia na ausência de informação prévia — a escolha menos arbitrária, preservando todas as simetrias permitidas pelas regras.

**Regra 2:** cada flanco é tratado como um sistema de permutações de {R, N, B}, e não como casas sorteadas de forma independente.

### 5.2 A restrição entre flancos

A Regra 2 resolve a conservação de inventário dentro de um flanco, mas não impede que os dois flancos, tratados de forma independente, produzam dois bispos da mesma cor de casa. A magnitude do problema, sob independência estrita, seria substancial:

- O bispo do flanco da dama ocupa uma casa escura com probabilidade 2/3 e uma casa clara com probabilidade 1/3.
- O bispo do flanco do rei ocupa uma casa clara com probabilidade 2/3 e uma casa escura com probabilidade 1/3.
- Sob independência pura: P(mesma cor) = (2/3 × 1/3) + (1/3 × 2/3) = 4/9 ≈ 44,4%.

Uma configuração fisicamente inconsistente com o xadrez clássico ocorreria, portanto, em quase metade das preparações.

**Regra 3:** os dois flancos de um mesmo jogador formam um único sistema emaranhado correlacionado, restrito ao subespaço em que os bispos ocupam cores de casa distintas.

**Contagem exata:** das 6 × 6 = 36 combinações possíveis entre os dois flancos, exatamente 20 respeitam a restrição de cores distintas. O estado inicial completo é a superposição uniforme sobre essas 20 configurações válidas, com amplitude 1/√20 (probabilidade 1/20 = 5% cada).

### 5.3 Uma consequência não trivial da restrição conjunta: No-Signaling e Condicionamento Bayesiano

Sem a restrição entre flancos, a probabilidade a priori de a casa de canto a1 conter uma Torre seria 1/3 (2 permutações em 6). **Com a restrição global de bispos conjuntamente imposta, essa probabilidade a priori passa a ser de exatamente 3/10 = 30%** (das 20 configurações válidas no espaço global, exatamente 6 contêm Torre em a1: 6/20 = 3/10; por simetria, o mesmo se aplica a h1, a8 e h8).

Fisicamente, essa alteração da probabilidade marginal a priori não decorre de qualquer transmissão superluminal de sinal (o que violaria o **Teorema de No-Signaling** da mecânica quântica e da relatividade), mas sim do recorte do espaço de Hilbert admissível. A revelação de uma peça durante o jogo opera uma **atualização bayesiana de probabilidades (Regra de Born)** sobre as hipóteses que permanecem compatíveis com a observação realizada. Em termos didáticos e práticos para o enxadrista, isso significa que a probabilidade a priori de uma casa de canto conter uma Torre para rocar é honestamente de 30%, e não de 33,3%.

---

## 6. Dinâmica do Colapso: Analogia com Estados GHZ e Pares de Bell

A cascata de colapso de três peças correlacionadas oferece uma **analogia combinatória direta com a estrutura de um estado GHZ** (Greenberger, Horne & Zeilinger, 1989) sobre uma base de estados discretos de permutação:

1. **Na primeira medição do flanco** (por lance ou por captura — Seção 7), o resultado é amostrado segundo a **Regra de Born**, pesando a probabilidade de cada tipo candidato pelo número de hipóteses globais ainda vivas que contêm aquele tipo naquela casa.
2. **As duas casas restantes do flanco passam a uma superposição residual de 2 estados** entre os tipos remanescentes — permanecem indeterminadas entre si, mas fortemente correlacionadas (analogia estrutural com um par de Bell bipartido).
3. **Na segunda medição**, a terceira casa colapsa deterministicamente para o único tipo restante, completando a revelação do inventário do flanco.

| Etapa | Casa medida | Estado das outras duas |
|---|---|---|
| Antes de qualquer lance | — | Superposição conjunta (20 estados válidos) |
| Após a 1ª medição | Colapsada (tipo sorteado via Regra de Born) | Superposição residual correlacionada (análogo a par de Bell) |
| Após a 2ª medição | (já colapsada) | Colapso determinístico (resta 1 único tipo) |

---

## 7. Capturas como Medição

A captura de uma peça ainda em superposição deve ser tratada com a mesma dinâmica de colapso do lance ordinário, por dois motivos:

- Qualquer função de avaliação de material — humana ou de um motor de busca — só pode atribuir valor a uma peça capturada se a identidade dessa peça estiver definida, o que exige colapso.
- Fisicamente, uma captura é uma interação irreversível que registra, no restante do sistema, informação macroscópica sobre qual peça estava naquela casa.

**Regra 4:** capturar uma peça ainda não colapsada constitui medição física — amostragem ponderada pelas hipóteses sobreviventes via Regra de Born, propagando imediatamente o colapso e o descarte de estados pelas demais casas do flanco e pelo bispo do flanco oposto.

---

## 8. Roque sob o Modelo Proposto: Medição Operacional Intuitiva

A dinâmica de colapso tem impacto direto sobre a legalidade do roque clássico:

**Regra 5:** o roque para um lado é permitido sempre que `'r'` permanecer como uma possibilidade viva na casa de canto correspondente. A execução do lance de roque atua como uma **medição operacional**: o jogador expressa a intenção de rocar e, caso a Torre ainda esteja contida no leque de hipóteses admissíveis, a casa do canto colapsa para Torre (propagando a atualização em cascata para o restante do flanco). Caso a casa do canto já tenha colapsado previamente para Cavalo ou Bispo (por movimento direto ou colapso complementar), o roque torna-se estritamente proibido pelo restante da partida.

Essa formulação preserva a intuitividade enxadrística para o jogador humano e o respeito estrito ao inventário de peças, sem frustrar a partida com falhas aleatórias inesperadas em um lance clássico básico.

---

## 9. Resumo das Regras Propostas

1. Rei, Dama e Peões de cada lado são sempre clássicos, desde a configuração inicial (condições de contorno, Seção 4).
2. Cada flanco (Torre/Cavalo/Bispo de um lado) é modelado sobre o espaço de permutações de {R, N, B} em S₃.
3. Os bispos dos dois flancos de um mesmo jogador são conjuntamente restritos a cores de casa distintas; o estado inicial completo é a superposição uniforme sobre as 20 combinações globais admissíveis (amplitude 1/√20 cada).
4. O colapso é sempre uma amostragem probabilística fiel à Regra de Born, proporcional ao número de hipóteses globais sobreviventes para cada tipo legal — nunca um determinismo arbitrário nem amostragem plana ingênua.
5. Mover ou capturar uma peça em superposição constitui medição, acionando a cascata de colapso.
6. A medição de uma casa de um flanco projeta as outras duas em um par residual correlacionado; a segunda medição resolve deterministicamente a última peça do flanco.
7. O roque permanece acessível enquanto `'r'` for uma possibilidade viva da casa de canto correspondente, colapsando-a para Torre no momento da execução.

---

## 10. Variante de Espaço Amostral Reduzido

Para contextos em que a complexidade do modelo integral (Seção 5) seja excessiva para o público-alvo, um espaço amostral reduzido — porém estruturalmente consistente — pode ser obtido restringindo cada flanco às 4 permutações alcançáveis por, no máximo, uma troca a partir da configuração clássica (a identidade e as 3 trocas simples), em vez das 6 permutações completas de S₃. A Regra 3 (restrição de cor entre flancos) permanece válida sobre esse espaço amostral menor (resultando em 10 hipóteses conjuntas de 16 possíveis).

---

## 11. Analogia Ilustrativa: Peças de Xadrez e Partículas Elementares do Modelo Padrão

Esta seção propõe uma analogia didática entre a estrutura combinatória descrita acima e alguns conceitos do Modelo Padrão da física de partículas (Griffiths, 2008; Particle Data Group, atualizado periodicamente). A analogia é apresentada com ressalvas explícitas de escopo: **não se trata de uma correspondência formal entre os dois sistemas**, mas de um paralelo estrutural entre padrões de simetria e de exclusão que podem ajudar a fixar a intuição.

| Conceito no jogo | Paralelo estrutural no Modelo Padrão | Natureza da correspondência |
|---|---|---|
| Inventário fixo de peças por lado (2R, 2N, 2B, 1Q, 1K) | Números quânticos conservados que definem setores de superseleção (carga elétrica, número bariônico, número leptônico) | Estrutural: em ambos os casos, a superposição jamais mistura setores de contagem diferente |
| Bispo preso à sua cor de casa por toda a partida | Um número quântico intrínseco fixado desde a "criação" da partícula (por exemplo, a carga elétrica de um elétron) | Estrutural, quanto à noção de propriedade permanente e distintiva |
| Exclusão mútua entre os dois Bispos de mesma cor | Princípio de Exclusão de Pauli para férmions idênticos (por exemplo, elétrons em um mesmo átomo) | Direta quanto ao *padrão combinatório* (não quanto ao mecanismo físico subjacente — ver ressalva abaixo) |
| Intercambiabilidade livre entre Cavalos e Torres | Estatística bosônica (partículas idênticas sem restrição de ocupação, como fótons em um mesmo modo) | Ilustrativa apenas |
| Tipo de peça (R, N ou B) revelado por colapso | Um "sabor" (*flavor*) de quark ou lépton, no sentido de um rótulo discreto que caracteriza o objeto | Ilustrativa apenas |

**Ressalva terminológica importante:** a cor da casa de um bispo (clara/escura) **não deve ser confundida** com a "carga de cor" da cromodinâmica quântica (QCD), a propriedade que rotula os quarks e glúons sob o grupo de simetria SU(3). Trata-se de uma coincidência de nomenclatura entre línguas — "cor" no jogo é uma propriedade geométrica do tabuleiro; "cor" em QCD é uma carga de calibre sem relação alguma com cores visuais ou com posição espacial. Nenhuma correspondência entre os dois usos do termo é proposta ou deve ser inferida.

Da mesma forma, os dois Bispos de um jogador já são objetos distinguíveis por outras vias (o flanco de origem), ao passo que a antissimetria de troca que fundamenta a estatística fermiônica real aplica-se a partículas genuinamente indistinguíveis. A regra de exclusão aqui é, portanto, uma restrição estrutural imposta ao espaço de hipóteses — motivada pela mesma consequência combinatória do Princípio de Exclusão —, e não uma decorrência do mesmo mecanismo de antissimetria de troca que opera em férmions reais.

---

## 12. Notas de Implementação

Direção de implementação, não especificação fechada:

- Substituir um vínculo de par fixo por um identificador de grupo de flanco compartilhado pelas 3 casas, com o estado do grupo (a lista de permutações ainda vivas) armazenado uma única vez, não replicado por casa.
- Adicionar um vínculo de segundo nível entre os dois grupos de flanco de um mesmo jogador, usado para filtrar as permutações vivas de um flanco no momento em que o bispo do flanco oposto colapsa (Regra 3).
- Generalizar a rotina de execução de lance para: (a) sortear com peso igual entre possibilidades vivas, em vez de testar em ordem fixa; (b) ao colapsar, filtrar as permutações vivas do próprio grupo e do grupo emparelhado, não apenas de um único parceiro fixo.
- Acionar o mesmo gancho de colapso no fluxo de captura.
- Verificar explicitamente se `'r'` pertence às possibilidades vivas da casa de canto antes de permitir um roque, em vez de delegar essa checagem inteiramente aos direitos de roque nativos de um motor de regras clássico.

---

## 13. Referências

BORN, M. Zur Quantenmechanik der Stoßvorgänge. *Zeitschrift für Physik*, v. 37, n. 12, p. 863–867, 1926.

GREENBERGER, D. M.; HORNE, M. A.; ZEILINGER, A. Going beyond Bell's theorem. In: KAFATOS, M. (Ed.). *Bell's Theorem, Quantum Theory, and Conceptions of the Universe*. Dordrecht: Kluwer Academic Publishers, 1989. p. 69–72.

GRIFFITHS, D. J. *Introduction to Quantum Mechanics*. 3. ed. Cambridge: Cambridge University Press, 2018.

GRIFFITHS, D. J. *Introduction to Elementary Particles*. 2. ed. Weinheim: Wiley-VCH, 2008.

NIELSEN, M. A.; CHUANG, I. L. *Quantum Computation and Quantum Information*. 10th anniversary ed. Cambridge: Cambridge University Press, 2010.

PARTICLE DATA GROUP. *Review of Particle Physics*. Atualizado periodicamente. Disponível em: https://pdg.lbl.gov.

PAULI, W. Über den Zusammenhang des Abschlusses der Elektronengruppen im Atom mit der Komplexstruktur der Spektren. *Zeitschrift für Physik*, v. 31, n. 1, p. 765–783, 1925.

REED, M.; SIMON, B. *Methods of Modern Mathematical Physics II: Fourier Analysis, Self-Adjointness*. New York: Academic Press, 1975.

VON NEUMANN, J. *Mathematische Grundlagen der Quantenmechanik*. Berlin: Springer, 1932. Tradução inglesa: *Mathematical Foundations of Quantum Mechanics*. Princeton: Princeton University Press, 1955.

WICK, G. C.; WIGHTMAN, A. S.; WIGNER, E. P. The intrinsic parity of elementary particles. *Physical Review*, v. 88, n. 1, p. 101–105, 1952.

ZUREK, W. H. Decoherence, einselection, and the quantum origins of the classical. *Reviews of Modern Physics*, v. 75, n. 3, p. 715–775, 2003.
