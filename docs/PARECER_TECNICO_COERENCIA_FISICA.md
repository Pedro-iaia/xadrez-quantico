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

## 2. Fundamentação Física: Regras de Superseleção e o Princípio de Exclusão

A propriedade central que o modelo deve preservar é que o inventário de peças de cada jogador — exatamente 2 torres, 2 cavalos, 2 bispos, 1 dama, 1 rei e 8 peões — nunca seja alterado por qualquer processo de superposição ou colapso. O conceito físico correto para essa exigência não é uma "lei de conservação" no sentido de uma trajetória clássica, mas sim uma **regra de superseleção**: a existência de setores do espaço de estados que nenhuma superposição física admissível pode misturar. O exemplo canônico na literatura é a carga elétrica — não existe, na natureza, um estado que seja superposição entre "um elétron" e "dois elétrons e uma ausência de carga"; a soma de cargas é um número de superseleção. A noção foi introduzida formalmente por Wick, Wightman e Wigner (1952) e permanece o tratamento de referência do tema.

A restrição adicional de que os dois bispos de um mesmo jogador nunca ocupem casas da mesma cor tem um paralelo ainda mais preciso: o **Princípio de Exclusão de Pauli** (Pauli, 1925). A cor da casa em que um bispo permanece pelo resto da partida funciona, no modelo, como um número quântico interno que o distingue do seu par — de modo análogo a como dois férmions idênticos não podem ocupar o mesmo estado quântico simultâneo. Cavalos e torres, por não carregarem essa propriedade distintiva, comportam-se como objetos livremente intercambiáveis — a analogia formal, desenvolvida com as devidas ressalvas na Seção 11, é com a estatística bosônica.

Essa distinção conceitual — superseleção para a conservação de inventário, exclusão para a restrição de cor — é o que permite construir, na Seção 5, uma solução estruturalmente simples em vez de um conjunto de regras ad hoc.

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

O estado inicial de cada flanco é descrito num espaço de 3! = 6 estados-base, um por permutação σ ∈ S₃ de {R, N, B} sobre as três casas do flanco:

```
|ψ_flanco⟩ = (1/√6) · Σ_σ |σ⟩
```

A escolha de amplitude uniforme sobre as 6 permutações corresponde à distribuição de máxima entropia sobre o espaço amostral — a escolha menos arbitrária, por não introduzir parâmetros adicionais não motivados pela simetria do problema.

**Regra 2:** cada flanco é um único sistema quântico de 6 estados-base (as permutações de R/N/B), e não três casas tratadas independentemente.

### 5.2 A restrição entre flancos

A Regra 2 resolve a conservação de inventário dentro de um flanco, mas não impede que os dois flancos, tratados de forma independente, produzam dois bispos da mesma cor de casa. A magnitude do problema, se nada for feito, é substancial:

- O bispo do flanco da dama ocupa uma casa escura com probabilidade 2/3 e uma casa clara com probabilidade 1/3.
- O bispo do flanco do rei ocupa uma casa clara com probabilidade 2/3 e uma casa escura com probabilidade 1/3.
- Sob independência, P(mesma cor) = (2/3 × 1/3) + (1/3 × 2/3) = 4/9 ≈ 44%.

Uma configuração fisicamente inconsistente ocorreria, portanto, em quase metade das preparações — não é um caso de borda, é o comportamento predominante do modelo sem essa restrição.

**Regra 3:** os dois flancos de um mesmo jogador formam um único estado emaranhado, restrito ao subespaço em que os bispos ocupam cores de casa distintas (a aplicação, neste sistema, do Princípio de Exclusão de Pauli descrito na Seção 2).

**Contagem exata:** das 6 × 6 = 36 combinações possíveis entre os dois flancos, exatamente 20 respeitam a restrição de cores distintas. O estado inicial correto é a superposição uniforme sobre essas 20 configurações válidas, com amplitude 1/√20 (probabilidade 1/20 = 5% cada).

### 5.3 Uma consequência não trivial da restrição conjunta

Sem a restrição entre flancos, a probabilidade de a casa de canto a1 efetivamente conter uma Torre seria 1/3, por simetria simples entre as 3 permutações do flanco. **Com a restrição de cor corretamente imposta, essa probabilidade passa a 3/10** — o vínculo global desloca a estatística marginal de uma única casa, exatamente como, em um sistema genuinamente emaranhado, a medição de uma parte do sistema pode alterar as probabilidades marginais atribuídas ingenuamente a outra parte, caso o emaranhamento não seja levado em conta. (Cálculo: dos 20 estados globais válidos, exatamente 6 têm Torre em a1: 6/20 = 3/10.) Por simetria, o mesmo vale para o canto h1. Uma consequência prática dessa conta é que a probabilidade a priori de qualquer lado dispor de uma Torre genuína no canto para viabilizar o roque é, sob o modelo correto, ligeiramente inferior à intuição ingênua.

---

## 6. Dinâmica do Colapso: Estrutura GHZ

A estrutura de colapso em cascata de um flanco de três objetos corresponde, em forma, a um **estado GHZ** (Greenberger, Horne & Zeilinger, 1989) — o estado emaranhado padrão de três partículas na literatura de fundamentos da mecânica quântica. A regra de atualização, aplicação sequencial do postulado de projeção:

1. **Na primeira medição do flanco** (por lance ou por captura — Seção 7), o resultado é sorteado com peso igual entre as possibilidades ainda vivas, nunca por uma ordem de avaliação fixa.
2. **As duas casas restantes do flanco passam a uma superposição residual de 2 estados** entre os tipos remanescentes — permanecem indeterminadas, mas correlacionadas. Esse par residual corresponde, formalmente, a um par de Bell — o estado de duas partículas de um GHZ tripartite após a medição da terceira.
3. **Na segunda medição**, a terceira casa colapsa deterministicamente para o único tipo restante, já que o inventário do flanco está, nesse ponto, quase inteiramente revelado.

| Etapa | Casa medida | Estado das outras duas |
|---|---|---|
| Antes de qualquer lance | — | Superposição uniforme sobre as 6 permutações |
| Após a 1ª medição | Colapsada (1 de 3 tipos, prob. 1/3 cada) | Superposição uniforme sobre as 2 permutações restantes |
| Após a 2ª medição | (já colapsada) | Colapso determinístico (resta 1 único tipo) |

---

## 7. Capturas como Medição

A captura de uma peça ainda em superposição deve ser tratada com a mesma dinâmica de colapso do lance ordinário, por dois motivos:

- Qualquer função de avaliação de material — humana ou de um motor de busca — só pode atribuir valor a uma peça capturada se a identidade dessa peça estiver definida, o que exige colapso.
- Fisicamente, uma captura é uma interação irreversível que registra, no restante do sistema, informação sobre qual peça estava naquela casa — a peça sai do tabuleiro, mas essa saída em si constitui um evento de medição, independentemente do destino físico do resultado.

**Regra 4:** capturar uma peça ainda não colapsada aciona a mesma dinâmica da Seção 6 — sorteio com peso igual entre as possibilidades vivas, propagando a atualização às demais casas do flanco e, quando aplicável, ao bispo do flanco oposto.

---

## 8. Roque sob o Modelo Proposto

A dinâmica de colapso desenvolvida nas Seções 6 e 7 tem uma consequência direta e não-trivial sobre a legalidade do roque:

**Regra 5:** o roque para um lado só é legal enquanto `'r'` permanecer uma possibilidade viva da casa de canto correspondente. A própria tentativa de roque pode constituir o evento de medição que colapsa essa casa para Torre — exatamente como qualquer outro lance testado contra as possibilidades vivas —, mas nunca deve ignorar um colapso anterior para outro tipo, ocorrido por qualquer via (movimento direto da peça ou efeito de cascata do restante do flanco). Se `'r'` não estiver mais entre as possibilidades vivas, o roque para aquele lado permanece indisponível pelo restante da partida.

Essa regra não introduz mecanismo novo: estende o mesmo teste de legalidade-como-medição já empregado para qualquer peça, agora também aplicado à casa de canto antes de se confiar nos direitos de roque mantidos internamente por um motor de regras clássico, que não possui, por definição, conhecimento da camada quântica sobreposta.

---

## 9. Resumo das Regras Propostas

1. Rei, Dama e Peões de cada lado são sempre clássicos, desde a configuração inicial (condição de contorno, Seção 4).
2. Cada flanco (Torre/Cavalo/Bispo de um lado) é um único sistema quântico de 6 estados-base — as permutações de {R, N, B} — com amplitude uniforme 1/√6 sobre os estados permitidos pela Regra 4 abaixo.
3. Os bispos dos dois flancos de um mesmo jogador são conjuntamente restritos a cores de casa distintas; o estado inicial completo é a superposição uniforme sobre as 20 (de 36) combinações globais que respeitam essa restrição.
4. O colapso é sempre uma amostragem aleatória com peso igual entre as possibilidades ainda vivas no momento da medição — nunca uma escolha determinística por ordem de avaliação.
5. Tanto mover quanto capturar uma peça ainda não colapsada constitui medição, disparando a cascata de colapso (Regra 6).
6. Ao colapsar a primeira casa de um flanco, as outras duas passam a um estado emaranhado residual de 2 possibilidades (par de Bell); a segunda medição resolve deterministicamente a terceira casa.
7. O roque permanece legal apenas enquanto `'r'` for uma possibilidade viva da casa de canto correspondente.

---

## 10. Variante de Espaço Amostral Reduzido

Para contextos em que a complexidade do modelo integral (Seção 5) seja excessiva para o público-alvo, um espaço amostral reduzido — porém estruturalmente consistente — pode ser obtido restringindo cada flanco às 4 permutações alcançáveis por, no máximo, uma troca a partir da configuração clássica (a identidade e as 3 trocas simples), em vez das 6 permutações completas de S₃. A Regra 3 (restrição de cor entre flancos) permanece válida sobre esse espaço amostral menor, mas as contagens da Seção 5.3 devem ser recalculadas para o novo espaço em vez de reaproveitadas.

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
