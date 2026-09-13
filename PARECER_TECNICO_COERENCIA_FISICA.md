# 📐 Parecer Técnico: Coerência Física das Regras Quânticas

**Para:** equipe de desenvolvimento do Xadrez de Schrödinger Quântico
**Assunto:** revisão do modelo de superposição/emaranhamento à luz de leis de conservação, regras de superseleção e do postulado de projeção da mecânica quântica.

---

## 0. Escopo e uma advertência intelectual honesta, antes de começar

Este parecer trata o jogo como um **modelo de brinquedo (toy model)** que empresta da mecânica quântica três ingredientes específicos — superposição, emaranhamento e colapso via medição — mas **não** modela a evolução temporal contínua governada pela equação de Schrödinger dependente do tempo. Não há, aqui, um Hamiltoniano fazendo as amplitudes de uma peça "evoluírem" espontaneamente entre um lance e outro; o estado de cada peça é estático até o instante de uma medição (um lance ou uma captura). Isso é uma **limitação de escopo deliberada e razoável** para um jogo de tabuleiro — mas precisa ser dita explicitamente, para não fazer uma alegação de rigor maior do que a que o modelo de fato sustenta. O que o modelo *pode* e *deve* honrar com rigor total é: (i) conservação do inventário clássico de peças, (ii) a estrutura combinatória de estados emaranhados, e (iii) o postulado de projeção (colapso via medição, com probabilidades bem definidas). É exatamente isso que este documento resolve.

---

## 1. Correção de enquadramento: superseleção, não "conservação"

Antes de propor as regras, uma correção necessária ao seu enunciado, porque ela muda a forma da solução:

Não existe uma lei física chamada "conservação de peças clássicas". O fenômeno real e bem estabelecido que você está buscando tem nome: **regra de superseleção** — a existência de setores do espaço de estados que nenhum processo físico permitido pode misturar (o exemplo de livro-texto é a carga elétrica: um elétron não pode entrar em superposição com "meio elétron, meia ausência de carga"; a soma da carga total é um número de superseleção, não apenas "conservado" no sentido de uma trajetória clássica). O inventário de peças de um lado (exatamente 2 torres, 2 cavalos, 2 bispos, 1 dama, 1 rei, 8 peões) deve funcionar exatamente assim: **nenhuma superposição pode misturar setores com contagens de tipo diferentes**.

E o motivo de dois bispos não poderem terminar na mesma cor de casa tem um paralelo ainda mais preciso: o **Princípio de Exclusão de Pauli**. Bispos carregam uma propriedade que os torna distinguíveis um do outro (a cor da casa em que vivem para sempre) — como um número quântico interno — e por isso não podem "colapsar" para o mesmo autoestado (a mesma classe de cor), exatamente como dois elétrons não podem ocupar o mesmo estado quântico. Cavalos e torres não têm essa propriedade distintiva; são, na prática, **bosônicos** — livremente intercambiáveis, sem essa restrição.

Essa distinção é o que torna a solução abaixo simples em vez de remendada.

---

## 2. A falha estrutural do modelo atual (diagnóstico)

O modelo atual trata cada casa como uma superposição binária *independente* das demais. Isso tem duas consequências que você identificou corretamente, e uma terceira que a revisão revelou:

1. **Inconsistência de cor de bispo entre flancos.** Como o flanco da dama e o flanco do rei colapsam de forma independente, é possível — e, como mostro abaixo, *longe de raro* — terminar com dois bispos da mesma cor. Isso nunca ocorre na configuração inicial de uma partida clássica.
2. **Ausência de emaranhamento cruzado entre os três tipos adjacentes** (Torre/Cavalo/Bispo). O modelo atual só emaranha pares fixos, então não existe o efeito em cascata que você descreveu ("se o cavalo colapsar, torre e bispo devem entrar em superposição entre si").
3. **(Encontrado durante esta revisão) O "colapso" atual não é probabilístico.** O código testa os tipos possíveis numa ordem fixa e para no primeiro que resulta em lance legal — ou seja, quando mais de um tipo permitiria o mesmo lance, o resultado é **determinístico** (sempre o primeiro da lista), não uma amostragem aleatória ponderada. Isso viola o postulado de Born tão diretamente quanto os dois problemas que você apontou, só que num lugar diferente do sistema.

O restante deste parecer resolve os três ao mesmo tempo, porque, como veremos, eles têm a mesma raiz.

---

## 3. O modelo proposto

### 3.1 Rei e Dama: variáveis clássicas por construção

Sua intuição está correta, e eu ofereço duas justificativas independentes para formalizá-la — uma de teoria da medida do jogo, outra emprestada da física:

- **Justificativa de "condição de contorno".** "Rainha na cor" só é uma regra com sentido se a cor da casa (fato clássico do tabuleiro) e a identidade da peça (fato que a regra está fixando) forem ambas bem definidas *antes* de qualquer jogo começar. Um sistema quântico só pode ser preparado em superposição *depois* que suas condições de contorno de referência estão fixadas — não faz sentido superpor a régua com a qual se mede.
- **Justificativa de não-degenerescência.** Na mecânica quântica, misturas por superposição surgem naturalmente entre estados **quase degenerados em energia** (perturbações pequenas produzem amplitudes de mistura apreciáveis apenas quando o "gap" de energia entre os estados é pequeno). Cavalo e Bispo são quase degenerados em valor posicional (≈3 pontos cada, em qualquer tabela de avaliação) — candidatos naturais a uma mistura. Dama (9) e Rei (valor não-comparável, a peça cujo estado define o fim do próprio jogo) não têm parceiro degenerado algum no jogo: não há outra peça com valor ~9 ou "infinito" para formar um par plausível de superposição.

**Regra 1:** Rei e Dama são sempre clássicos — uma única possibilidade, sem colapso, em qualquer modo quântico. (Peões permanecem clássicos pelo mesmo motivo já implementado: também não têm parceiro degenerado nem simétrico razoável.)

### 3.2 Cada flanco é uma permutação, não três sorteios independentes

Este é o ponto matemático central, e é ele que resolve a conservação de inventário de uma vez por todas:

> **A solução para garantir que o inventário clássico de peças (exatamente 1 Torre, 1 Cavalo, 1 Bispo por flanco) nunca seja violado é modelar a superposição como uma distribuição sobre PERMUTAÇÕES do conjunto {R, N, B}, e não como sorteios independentes por casa.**

Uma permutação, por definição, reatribui rótulos sem nunca duplicar ou perder um item — a conservação do inventário deixa de ser algo que precisa ser verificado depois; ela é **estruturalmente garantida pela própria matemática do objeto usado**.

Formalmente: o estado inicial de cada flanco vive num espaço de 3! = 6 estados-base, um para cada permutação σ ∈ S₃ de {R, N, B} sobre as três casas do flanco:

```
|ψ_flanco⟩ = (1/√6) · Σ_σ |σ⟩
```

Cada uma das 6 permutações tem amplitude igual (1/√6), logo probabilidade igual (1/6) — a escolha de amplitudes iguais é o análogo de preparar um qubit com uma porta de Hadamard: é a distribuição de máxima entropia, a mais simples defensável sem introduzir parâmetros extras arbitrários.

**Regra 2:** Cada flanco (a1–c1, f1–h1, e os equivalentes das pretas) é um único objeto quântico de 6 estados-base (permutações de R/N/B), não três casas independentes.

### 3.3 A restrição entre flancos (o Princípio de Exclusão em ação)

Isso resolve a conservação *dentro* de um flanco, mas não impede que os dois flancos, tratados de forma totalmente independente, produzam dois bispos da mesma cor. Vamos quantificar exatamente o quão grave isso seria se nada fosse feito — porque o tamanho do problema justifica a solução:

- Bispo no flanco da dama: cai em casa escura (a1 ou c1) com probabilidade 2/3, casa clara (b1) com probabilidade 1/3.
- Bispo no flanco do rei: cai em casa clara (f1 ou h1) com probabilidade 2/3, casa escura (g1) com probabilidade 1/3.
- Se os flancos fossem independentes, P(mesma cor) = (2/3 × 1/3) + (1/3 × 2/3) = **4/9 ≈ 44%**.

Quase uma em cada duas partidas teria dois bispos da mesma cor logo na largada — isso não é um caso de borda raro, é uma falha estrutural predominante, exatamente como sua intuição indicou.

**Regra 3:** os dois flancos não são independentes — juntos, formam um único estado emaranhado, restrito ao subespaço onde os bispos caem em cores diferentes (a versão deste jogo do Princípio de Exclusão de Pauli).

**A contagem exata:** das 6 × 6 = 36 combinações possíveis entre os dois flancos, exatamente **20 respeitam a regra de cores diferentes** (16 violam). O estado correto do tabuleiro na abertura é uma superposição uniforme sobre essas 20 configurações válidas, cada uma com amplitude 1/√20 (probabilidade 1/20 = 5% cada) — não mais os 6×6 estados tratados independentemente.

### 3.4 Um resultado que a rigidez matemática revela (e que vale a pena expor aos jogadores)

Aqui está uma consequência não-óbvia que só aparece quando se faz a conta com cuidado — o tipo de coisa que separa um modelo "decorado com física" de um modelo fisicamente honesto:

Sem a restrição entre flancos, a probabilidade da casa de canto a1 abrigar realmente uma Torre é 1/3 (simetria simples entre as 3 permutações). **Com a restrição de cor imposta corretamente, essa probabilidade cai para 3/10 (30%)** — o vínculo global desloca sutilmente até a estatística marginal de uma única casa, exatamente como, num sistema emaranhado real, medir uma partícula pode alterar as probabilidades marginais que se atribuiria ingenuamente a outra parte do sistema sem levar o emaranhamento em conta. (Cálculo: dos 20 estados globais válidos, exatamente 6 têm Torre em a1 → 6/20 = 3/10.) Por simetria, o mesmo vale para o canto h1.

Isso significa que, sob o modelo correto, a chance a priori de qualquer lado sequer ter uma Torre de verdade no canto para permitir o roque no futuro já é ligeiramente menor do que a intuição ingênua sugeriria — um ótimo gancho didático para o artigo de boas-vindas.

---

## 4. Dinâmica do colapso: revelação sequencial (estrutura tipo GHZ)

Sua terceira pergunta — "se um cavalo colapsar, o bispo e a torre devem entrar em superposição?" — está certa, e a resposta formal usa uma estrutura conhecida na física: um **estado GHZ** (Greenberger–Horne–Zeilinger), o estado emaranhado padrão de três partículas.

Regra de atualização (postulado de projeção aplicado sequencialmente):

1. **Quando a primeira casa do flanco é medida** (a peça se move, ou é capturada — ver seção 5), o resultado é sorteado entre as possibilidades ainda vivas, com peso igual entre elas (nunca "a primeira da lista", corrigindo a falha nº 3 do diagnóstico).
2. **As duas casas restantes do flanco colapsam para uma superposição residual de 2 estados** entre os dois tipos remanescentes — elas não ficam totalmente definidas ainda. Esse par residual é, formalmente, um par de Bell (o caso de 2 partículas do estado GHZ após a primeira medição).
3. **Quando uma dessas duas últimas casas é medida**, a outra colapsa **deterministicamente** para o único tipo restante — não há mais escolha probabilística nessa etapa, porque só resta uma possibilidade (o inventário já está quase todo revelado).

Tabela de probabilidades condicionais (dentro de um flanco, ignorando por um momento a restrição de cor entre flancos, que se aplica em paralelo sobre o bispo):

| Etapa | Estado da 1ª casa medida | Estado das outras duas |
|---|---|---|
| Antes de qualquer lance | — | Superposição uniforme sobre as 6 permutações |
| Após a 1ª medição | Colapsada (1 de 3 tipos, prob. 1/3 cada) | Superposição uniforme sobre as 2 permutações restantes dos 2 tipos remanescentes |
| Após a 2ª medição | (já colapsada) | Colapsada deterministicamente (só resta 1 tipo) |

Isso vale tanto para "medição por movimento" quanto por "medição por captura" — ver seção seguinte.

---

## 5. Capturas também são medições (achado adicional desta revisão)

Um ponto que sua pergunta não levantou diretamente, mas que a mesma lógica de rigor expõe: **hoje, capturar uma peça ainda em superposição não a força a colapsar, e não propaga nenhuma atualização às suas parceiras de flanco (ou de emaranhamento).** Isso é inconsistente por dois motivos:

- Se o motor de IA (ou qualquer contagem de material) precisa saber "quanto vale" a peça capturada, essa pergunta só tem resposta se a identidade da peça for definida — o que exige um colapso.
- Fisicamente, capturar uma peça é uma interação irreversível que registra informação sobre "qual peça era aquela" no ambiente (a peça sai do tabuleiro) — isso é, por definição, uma medição, mesmo que o destino físico da peça (removida) não dependa do resultado.

**Regra 4:** capturar uma peça ainda não colapsada dispara a mesma dinâmica da seção 4 — sorteio com peso igual entre as possibilidades vivas, propagando a atualização às demais casas do flanco (e, se aplicável, ao bispo do flanco oposto).

*(Nota de engenharia: verificamos que esse mesmo problema já existe na implementação atual, mesmo sob o modelo simplificado de pares. Vale corrigi-lo já, independentemente da adoção do modelo de flancos completo aqui proposto.)*

---

## 6. Roque sob o novo modelo (resposta direta à sua terceira pergunta)

Sim, isso afeta o roque — e de um jeito que **resolve, com justificativa física, o segundo bug que já havíamos catalogado** em `COLABORACAO_NA_PRATICA_ROQUE.md` (o roque sendo permitido mesmo quando a peça do canto já havia colapsado para Dama por um caminho indireto).

A regra correta, decorrente diretamente do modelo acima, sem precisar de nenhum caso especial adicional:

**Regra 5:** o roque para um lado só é legal se a casa de canto correspondente já colapsou, com certeza, para Torre (`colapsada === 'r'`) — **ou** se a tentativa de roque em si for tratada como o evento de medição (exatamente como qualquer outro lance): testa-se se `'r'` ainda está entre as possibilidades vivas daquela casa; se estiver, e for a única possibilidade que torna o roque legal, o roque **é** o evento que colapsa a peça para Torre, disparando a cascata da seção 4 para as outras duas casas do flanco. Se `'r'` **não** está mais entre as possibilidades vivas daquela casa (porque ela já colapsou para Cavalo ou Bispo em um evento anterior), o roque para aquele lado fica permanentemente indisponível pelo resto da partida.

Isso é, note-se, exatamente o mesmo mecanismo de "teste de legalidade como medição" que o motor já usa para qualquer peça — a correção não introduz um conceito novo, apenas estende o mecanismo existente para também consultar corretamente o estado de colapso da casa de canto antes (não depois) de confiar nos direitos de roque que o `chess.js` mantém internamente (o `chess.js`, lembrando, não sabe que nossas peças são quânticas).

---

## 7. Resumo das regras propostas (conjunto completo)

1. Rei e Dama de cada lado são sempre clássicos (sem superposição), desde a configuração inicial.
2. Peões permanecem clássicos (já implementado, mantido).
3. Cada flanco (Torre/Cavalo/Bispo de um lado) é um único sistema quântico de 6 estados-base — as permutações de {R, N, B} sobre as 3 casas — com amplitude uniforme 1/√6 sobre os estados permitidos pela Regra 4.
4. Os bispos dos dois flancos de um mesmo jogador são conjuntamente restritos a cores de casa diferentes (Exclusão de Pauli aplicada à "cor" como número quântico do bispo); o estado inicial completo é a superposição uniforme sobre as 20 (de 36) combinações globais que respeitam essa restrição.
5. O colapso é sempre uma amostragem aleatória com peso igual entre as possibilidades **ainda vivas** no momento da medição — nunca uma escolha determinística por ordem de lista.
6. Tanto mover quanto **capturar** uma peça ainda não colapsada conta como medição, disparando a cascata de colapso (regra 7).
7. Ao colapsar a primeira casa de um flanco, as outras duas passam a um estado emaranhado residual de 2 possibilidades (par de Bell); a segunda medição resolve deterministicamente a terceira casa.
8. O roque só é legal enquanto `'r'` permanece uma possibilidade viva da casa de canto correspondente; a tentativa de roque pode, ela mesma, ser o evento que colapsa essa casa para Torre, mas nunca "ignora" um colapso anterior para outro tipo.

---

## 8. Uma variante mais simples, se a complexidade acima for grande demais para o público-alvo

Reconheço que passar de "pares independentes" para "permutação de 3 elementos com restrição global entre flancos" é um salto de complexidade real — matematicamente correto, mas potencialmente pesado para o primeiro contato de um estudante de ensino médio. Se a equipe julgar necessário, uma variante mais simples, ainda estruturalmente consistente (apenas com um espaço de estados menor), é restringir cada flanco às **4 permutações alcançáveis por no máximo uma troca** a partir da configuração clássica (identidade + 3 trocas simples), em vez das 6 completas. A Regra 4 (restrição de cor entre flancos) continua se aplicando da mesma forma, só que sobre um espaço amostral menor — recomendo, se essa via for escolhida, refazer a contagem da seção 3.4 para o novo espaço, em vez de reaproveitar os números aqui calculados.

---

## 9. Notas de implementação (para quando formos ao código)

Esboço de direção, não uma especificação fechada — fica para uma próxima rodada de trabalho, se você confirmar que quer seguir com o modelo completo:

- Substituir o campo `emaranhadaComId` (aponta para **um** parceiro fixo) por um `grupoFlancoId` compartilhado pelas 3 casas do flanco, com o estado do grupo guardado uma única vez (lista de permutações ainda vivas), não replicado em cada casa.
- Adicionar um vínculo de segundo nível (`parCorBispoId`, por exemplo) ligando os dois `grupoFlancoId` de um mesmo jogador, usado apenas para filtrar as permutações vivas de um flanco no momento em que o bispo do outro flanco colapsa (Regra 4).
- Generalizar `executarMovimento` para: (a) sortear com peso igual entre possibilidades vivas em vez de testar em ordem fixa; (b) ao colapsar, filtrar as permutações vivas do próprio grupo e do grupo emparelhado, não apenas de "um parceiro".
- Adicionar o mesmo gancho de colapso no fluxo de captura (hoje ausente).
- Antes de permitir um roque, checar explicitamente se `'r'` ∈ possibilidades vivas da casa de canto, em vez de confiar nos direitos de roque nativos do `chess.js`.

## 10. Nota para o material didático já existente

Este parecer, se adotado, enriquece consideravelmente o que já está em `GUIA_DE_ESTUDOS_IA.md` e no artigo da página de boas-vindas: regras de superseleção, o Princípio de Exclusão de Pauli, estados GHZ e o postulado de projeção são todos conceitos reais e citáveis, agora genuinamente implementados no jogo, não apenas mencionados por analogia. Vale, numa próxima etapa, atualizar o artigo introdutório com uma seção curta sobre "por que dois bispos não podem ficar do mesmo lado" como uma aplicação concreta e visível do Princípio de Exclusão — é o tipo de gancho que fica melhor guardado na memória de um estudante do que a definição abstrata sozinha.
