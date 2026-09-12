# 🎬 Colaboração na Prática: o Bug do Roque

Este documento é um **exemplo real**, do início ao fim, de como um bug relatado por uma usuária percorreu o [`PROTOCOLO_DE_COLABORACAO.md`](./PROTOCOLO_DE_COLABORACAO.md): do relato, à correção, ao Pull Request. Serve tanto como registro histórico da correção quanto como tutorial para o próximo colaborador que nunca tiver enviado uma contribuição ao repositório [`Pedro-iaia/xadrez-quantico`](https://github.com/Pedro-iaia/xadrez-quantico).

> 💡 Se você já sabe usar Git/GitHub no dia a dia, pode pular direto para a **Parte 3** (o bug em si). As Partes 1 e 2 são o passo a passo completo para quem está clonando e configurando o ambiente pela primeira vez.

---

## Parte 1 — Clonar o repositório (primeira vez)

### 1.1 Você tem acesso de escrita direto ao repositório?

- **Sim** (foi adicionado como colaborador no GitHub): pule para 1.3, você pode clonar e trabalhar em branches diretamente no repositório original.
- **Não** (contribuidor externo, caso mais comum em projeto open source): faça um **fork** primeiro (1.2).

### 1.2 Fazendo um fork (contribuidores externos)

1. Acesse [github.com/Pedro-iaia/xadrez-quantico](https://github.com/Pedro-iaia/xadrez-quantico).
2. Clique em **Fork** (canto superior direito) — isso cria uma cópia do repositório na sua própria conta (`https://github.com/SEU-USUARIO/xadrez-quantico`).

### 1.3 Clonando na sua máquina

```bash
# Se você tem acesso direto ao repositório original:
git clone https://github.com/Pedro-iaia/xadrez-quantico.git

# Se você fez um fork:
git clone https://github.com/SEU-USUARIO/xadrez-quantico.git

cd xadrez-quantico
```

Se for a primeira vez usando Git nesta máquina, configure sua identidade (usada nos commits):

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

### 1.4 (Só quem fez fork) Conectar ao repositório original

Isso permite trazer atualizações futuras do projeto original para o seu fork:

```bash
git remote add upstream https://github.com/Pedro-iaia/xadrez-quantico.git
git remote -v   # confirma que "origin" (seu fork) e "upstream" (original) estão configurados
```

---

## Parte 2 — Reportar o bug do roque

Antes de qualquer linha de código, o bug entra no fluxo como uma **Issue**, seguindo a seção 2 do `PROTOCOLO_DE_COLABORACAO.md`.

### 2.1 Abrindo a issue

No GitHub, em **Issues → New Issue**, escolha o template **🐞 Relato de bug** (`bug_report.md`, já configurado no repositório) e preencha assim:

> **Título:** `[Bug] Torre desaparece após o roque`
>
> **Navegador e versão:** relatado pela usuária em navegador baseado em Chromium (a confirmar versão exata na resposta)
> **Sistema operacional / dispositivo:** Windows, desktop (a confirmar)
>
> **Passos para reproduzir:**
> 1. Iniciar uma partida no Modo Quântico (padrão).
> 2. Abrir espaço para o roque curto das Brancas (mover o cavalo e o bispo do flanco do rei).
> 3. Realizar o roque curto (mover o Rei de e1 para g1).
>
> **Comportamento esperado:**
> O Rei se move para g1 e a Torre se move de h1 para f1, como em um roque normal.
>
> **Comportamento observado:**
> O Rei se move corretamente para g1, mas a Torre **desaparece do tabuleiro** — não aparece em f1 nem continua em h1.
>
> **Estado da partida:**
> ```json
> { "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", "pecasQuanticas": { "h1": { "possibilidades": ["r","q"], "cor": "w", "colapsada": null, "emaranhadaComId": null }, "...": "..." } }
> ```
>
> **Severidade sugerida:** Alto (quebra uma regra fundamental do xadrez, embora não trave o app).

### 2.2 Triagem

Alguém da manutenção confirma o bug (reproduzindo os passos acima), aplica os labels `bug` + `alto` + área `board`, e o bug está pronto para ser atribuído — no nosso caso, para nós mesmos, agora.

---

## Parte 3 — Investigando e corrigindo o bug

### 3.1 Diagnóstico

Reproduzindo o cenário com um teste automatizado (Puppeteer), confirmamos exatamente o que a usuária relatou e encontramos a causa raiz em `script.js`, dentro de `executarMovimento`:

- O `chess.js` já sabe fazer roque: quando o Rei se move duas casas, a biblioteca **move fisicamente a Torre também**, por conta própria, dentro do seu próprio tabuleiro interno.
- Só que o nosso código só atualizava o dicionário `pecasQuanticas` (o registro de "qual peça quântica está em qual casa") para a casa de origem/destino **do Rei** — nunca para a Torre.
- Resultado: `chess.get('f1')` passava a retornar a Torre (o `chess.js` sabia que ela estava lá), mas `pecasQuanticas['f1']` não existia. Como a função que desenha o tabuleiro só desenha uma peça quando **os dois registros concordam**, a Torre ficava invisível — presente para as regras, ausente para os olhos.

### 3.2 A correção

Em `executarMovimento`, passamos a capturar o resultado de `chess.move(...)` e, quando esse resultado indica um roque (flag `k` ou `q`), sincronizamos manualmente a entrada da Torre no dicionário quântico — incluindo o caso dela ainda estar em superposição, tratando o roque como a revelação de que aquela peça é, de fato, uma Torre (só uma Torre de verdade pode rocar).

```js
// Roque: o chess.js move a torre internamente também (sem passar por
// executarMovimento), então precisamos sincronizar manualmente o registro
// quântico dela — senão ela "desaparece" (fica só no chess.js, não no
// nosso dicionário de peças). Também tratamos o roque como um lance que
// revela a torre: classicamente só uma torre de verdade pode rocar.
if (resultadoLance && (resultadoLance.flags.includes('k') || resultadoLance.flags.includes('q'))) {
  const linha = pecaQ.cor === 'w' ? '1' : '8';
  const ladoRei = resultadoLance.flags.includes('k');
  const torreOrigem = ladoRei ? `h${linha}` : `a${linha}`;
  const torreDestino = ladoRei ? `f${linha}` : `d${linha}`;
  const torreQ = pecasQuanticas[torreOrigem];
  if (torreQ) {
    if (!torreQ.colapsada) {
      torreQ.colapsada = 'r';
      torreQ.possibilidades = ['r'];
      // ...propaga o colapso complementar se a torre estiver emaranhada...
    }
    pecasQuanticas[torreDestino] = torreQ;
    delete pecasQuanticas[torreOrigem];
  }
}
```

### 3.3 Validação (estresse-teste, seção 5 do protocolo)

Antes de considerar corrigido, testamos:

- [x] Roque curto das Brancas (cenário exato do relato) — Torre aparece corretamente em f1.
- [x] **Desfazer jogada** logo após o roque — Rei e Torre voltam corretamente para e1/h1, inclusive com a Torre voltando ao estado de superposição original (não fica "travada" como Torre revelada).
- [x] Roque longo (torre do lado da Dama, que é emaranhada com a peça em d1) — funciona, mas revelou um **segundo problema**, relatado separadamente (ver seção 5).
- [x] Regressão: reexecutada toda a suíte de testes de aberturas, responsividade e renderização usada nas entregas anteriores — nenhuma quebra.

---

## Parte 4 — Commit, push e Pull Request (reportando a solução)

### 4.1 Criar um branch dedicado

Seguindo a convenção do protocolo (`fix/descricao-curta`):

```bash
git checkout main
git pull origin main          # (ou "upstream main" se estiver usando fork)
git checkout -b fix/torre-desaparece-no-roque
```

### 4.2 Aplicar a mudança e conferir

(A edição já foi feita em `script.js`, conforme a seção 3.2.)

```bash
git status                     # confirma que só script.js foi alterado
git diff script.js             # revisão final antes de commitar
```

### 4.3 Commit

Mensagem no imperativo, específica, referenciando o efeito observado:

```bash
git add script.js
git commit -m "Corrige torre que desaparecia após o roque

Sincroniza pecasQuanticas com o movimento interno da torre que o
chess.js executa automaticamente durante o roque. Também colapsa a
torre para o tipo 'r' quando ainda em superposição, já que roque
exige uma torre de verdade.

Corrige #<número-da-issue>"
```

> Escrever `Corrige #<número-da-issue>` (ou `Fixes #<número>`, em inglês, ambos funcionam) faz o GitHub fechar a issue automaticamente quando este commit for mesclado à `main`.

### 4.4 Push

```bash
# Se você tem acesso direto ao repositório original:
git push origin fix/torre-desaparece-no-roque

# Se você está usando um fork:
git push origin fix/torre-desaparece-no-roque
# (aqui "origin" já aponta para o SEU fork, configurado na Parte 1.3)
```

### 4.5 Abrir o Pull Request (reportando a solução)

No GitHub, abra **Pull Requests → New Pull Request**, escolhendo:
- **base:** `main` do repositório `Pedro-iaia/xadrez-quantico`
- **compare:** seu branch `fix/torre-desaparece-no-roque` (do seu fork, se aplicável)

O template `PULL_REQUEST_TEMPLATE.md` já configurado no repositório será carregado automaticamente. Preenchido para este caso:

> **O que este PR faz**
> Corrige o bug em que a Torre desaparecia do tabuleiro ao realizar o roque. A causa era a falta de sincronização entre o estado interno do `chess.js` (que move a Torre automaticamente durante o roque) e o nosso dicionário `pecasQuanticas`.
>
> **Issue relacionada**
> Corrige #12 *(número de exemplo — usar o número real da issue aberta na Parte 2)*
>
> **Como testei**
> - [x] Testei nos três modos (Quântico solo, Clássico solo, Dois jogadores)
> - [x] Casos de borda testados: roque curto (cenário original do bug), roque longo com torre emaranhada, desfazer jogada logo após o roque
> - [x] Testado em Chromium via automação (Puppeteer) e revisado visualmente por captura de tela
> - [x] Testado em tela estreita (mobile) — roque não depende de layout, mas confirmei que a UI não quebra
> - [x] Sem travamentos perceptíveis
>
> **Checklist**
> - [x] Não precisou de atualização de documentação de usuário (comportamento agora está *correto*, não *novo*)
> - [x] Nenhuma dependência ou licença de terceiros afetada
> - [x] Nomenclatura em português mantida

### 4.6 Revisão e merge

Quem revisar segue o checklist da seção 6 do `PROTOCOLO_DE_COLABORACAO.md`: confirma que os três modos continuam funcionando, aprova, e mescla o PR (geralmente via **Squash and merge**, para manter o histórico da `main` limpo). Ao mesclar, a issue original é fechada automaticamente pela referência `Corrige #12`.

### 4.7 Depois do merge

```bash
git checkout main
git pull origin main            # (ou upstream main, se usou fork)
git branch -d fix/torre-desaparece-no-roque   # apaga o branch local, já não é mais necessário
```

Se você trabalhou a partir de um fork, sincronize-o também:

```bash
git push origin main            # atualiza a branch main do seu fork no GitHub
```

---

## Parte 5 — Comentários e sugestões desta primeira experiência

Algumas observações genuínas que essa primeira volta completa do protocolo já deixou claras — vale registrar para os próximos colaboradores:

1. **O protocolo "funcionou" mesmo em uma correção pequena.** Reportar → triar → reproduzir com teste automatizado → corrigir → validar com estresse-teste → documentar no PR não foi burocracia desnecessária: foi justamente o estresse-teste (testar o roque *longo*, não só o curto do relato original) que revelou o problema da seção seguinte, que passaria despercebido em uma correção "no olho".

2. **Um bug relatado por usuário quase sempre esconde um segundo, mais sutil.** Ao testar o roque longo (torre emaranhada com a peça em d1), descobrimos que se essa torre **já tiver colapsado para Dama** antes do roque (porque seu par emaranhado se moveu primeiro), o `chess.js` ainda permite o roque — o que não deveria ser possível, já que classicamente só uma Torre pode rocar. Isso **não é o mesmo bug** relatado pela usuária (a peça não desaparece mais, ela corretamente vira uma "Dama que rocou", o que é a permissão indevida do roque em si, não o desaparecimento), então, seguindo a seção 5.5 do protocolo (regressão) e a boa prática de não misturar escopos num PR só, ele deve virar uma **nova issue**, não um adendo a este PR:

   > **Novo título de issue sugerido:** `[Bug] Roque é permitido mesmo quando a peça do canto já colapsou para Dama`
   > **Severidade sugerida:** Médio (é uma violação de regra rara — só ocorre se o par emaranhado da torre do roque grande já tiver colapsado antes — mas ainda assim uma violação de regra).

   Isso é, por si só, uma boa demonstração prática de por que a seção 5 do protocolo pede um roteiro de estresse-teste específico do jogo, e não só "funciona no caso que a pessoa reportou".

3. **Sugestão de melhoria de engenharia, motivada por esta correção**: o "pacote de depuração" (`copy(JSON.stringify({ fen, pecasQuanticas, configuracaoPartida }))`) sugerido no protocolo se mostrou realmente útil para reproduzir o estado exato de um bug — vale priorizar a ideia, já registrada em `PROTOCOLO_DE_COLABORACAO.md`, de transformar isso num botão real da interface, especialmente porque bugs de roque só se manifestam depois de uma sequência específica de vários lances, difícil de descrever só em texto.

4. **Sugestão para o `PLANO_DE_EXPANSAO.md`**: a nova issue do item 2 acima também é um bom lembrete de que qualquer implementação futura de um motor de IA mais forte (minimax, PIMC, etc.) **não pode assumir que os direitos de roque do `chess.js` refletem corretamente as regras quânticas** — o motor de busca precisaria verificar separadamente se a peça do canto realmente colapsou para Torre antes de considerar o roque como um lance válido a avaliar. Vale anotar isso como uma nota técnica quando aquele trabalho começar.
