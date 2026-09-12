# 🤝 Protocolo de Colaboração

Este documento descreve **como** o desenvolvimento colaborativo deste projeto funciona no dia a dia: como reportar e corrigir bugs, como testar novas funcionalidades antes de mesclá-las, e como sugestões de usuários finais (que não necessariamente programam) entram no fluxo de trabalho.

Ele complementa o [`PLANO_DE_EXPANSAO.md`](./PLANO_DE_EXPANSAO.md) (que trata do **quê** construir) com o **como** construir em conjunto.

---

## 1. Canais oficiais

| Canal | Uso |
|---|---|
| **Issues** | Bugs confirmados, tarefas técnicas concretas, propostas de funcionalidade já bem definidas. |
| **Discussions** (ou uma seção equivalente, se o repositório não tiver Discussions habilitado) | Ideias em estado bruto, dúvidas, "seria legal se...", conversas que ainda não são uma tarefa acionável. |
| **Pull Requests** | Qualquer mudança de código, documentação ou conteúdo pedagógico (lições/desafios). |

Regra prática: **ideia crua → Discussion. Tarefa definida → Issue. Código → Pull Request.** Ninguém é obrigado a saber essa distinção de antemão — parte do trabalho de quem faz a triagem (ver seção 5) é mover a conversa para o lugar certo.

---

## 2. Como reportar um bug

### 2.1 Antes de abrir uma issue

1. Procure por issues abertas ou fechadas com sintomas parecidos.
2. Confirme que o problema acontece também numa aba anônima/privada (elimina extensões do navegador como causa).

### 2.2 Informações essenciais no relatório

Um bug relatado sem informação suficiente para reproduzir é, na prática, um bug que não pode ser corrigido. Inclua sempre:

- **Navegador e versão**, **sistema operacional**, e **dispositivo** (desktop, tablet, celular).
- **Passos exatos** para reproduzir, numerados.
- **Comportamento esperado** vs. **comportamento observado**.
- **Print de tela ou gravação curta**, se for algo visual.
- **O estado da partida no momento do bug** — isto é especialmente importante neste projeto, porque o estado real não é só o FEN do `chess.js`: é o FEN **mais** o objeto `pecasQuanticas` (quais casas estão em superposição, quais estão emaranhadas). Sem isso, quem for investigar não consegue reproduzir o cenário quântico exato.

**Enquanto não existir um botão pronto no app para isso**, gere esse "pacote de depuração" manualmente: abra o console do navegador (F12) durante a partida com o bug e rode:

```js
copy(JSON.stringify({ fen: chess.fen(), pecasQuanticas, configuracaoPartida }))
```

Isso copia o estado completo para a área de transferência — cole no corpo da issue. **Sugestão de melhoria para quem quiser um "good first issue" de engenharia**: transformar esse comando em um botão "Copiar estado para relatório de bug" na própria interface, visível quando `areaJogo` está ativo.

### 2.3 Severidade

Classifique (ou aceite a classificação que a triagem atribuir) usando estas categorias, do mais para o menos urgente:

- **Crítico**: impede jogar (a partida trava, o app não carrega).
- **Alto**: uma regra do jogo é violada (lance ilegal aceito, colapso não respeita emaranhamento).
- **Médio**: funcionalidade secundária quebrada (relógio, torneio, desfazer).
- **Baixo**: comportamento incômodo mas contornável.
- **Cosmético**: visual/CSS, não afeta a jogabilidade.

---

## 3. Ciclo de vida de um bug

```
Reportado → Triagem → Confirmado/Não reproduzido → Atribuído → Em correção → PR aberto → Revisado → Mesclado → Issue fechada
```

- **Triagem**: alguém da manutenção confirma que o bug é reproduzível, aplica um label de severidade e, se possível, uma área (`board`, `ia`, `relogio`, `didatica`, `ui`).
- **Não reproduzido**: se não for possível reproduzir com as informações dadas, a issue volta para quem reportou com um pedido específico do que falta (não feche a issue direto — isso desestimula quem reportou de boa fé).
- **Em correção**: crie um branch a partir de `main` com o padrão `fix/descricao-curta` (ex.: `fix/colapso-nao-propaga-em-desfazer`).
- **PR aberto**: referencie a issue original (`Corrige #123`) para que o fechamento seja automático ao mesclar.

---

## 4. Convenção de branches e commits

- `fix/...` — correção de bug.
- `feature/...` — nova funcionalidade.
- `docs/...` — só documentação.
- `content/...` — lições/desafios do módulo didático.
- `chore/...` — manutenção (dependências, configuração, sem mudança de comportamento).

Mensagens de commit: comece com um verbo no imperativo e seja específico (`Corrige colapso duplicado ao desfazer jogada` é melhor que `fix bug`). Não é obrigatório seguir *Conventional Commits* à risca, mas é bem-vindo para quem já tiver o hábito.

---

## 5. Estresse-teste de novas funcionalidades

Toda funcionalidade nova — e principalmente qualquer mudança nas regras quânticas ou no motor de IA — deve passar por este roteiro manual antes do PR ser mesclado. Se o repositório evoluir para ter testes automatizados (Puppeteer/Playwright, como usado para validar a última leva de mudanças visuais), este roteiro deve virar a base dos casos de teste.

### 5.1 Matriz de configuração (teste por pares, não força-bruta)

Combinar todas as opções do formulário inicial geraria dezenas de combinações. Em vez de testar tudo, use **teste por pares**: garanta que cada par de opções (Modo × Oponente, Oponente × Nível, Relógio × Formato, etc.) apareça em pelo menos uma execução. Como mínimo aceitável antes de qualquer PR de funcionalidade nova:

- [ ] Quântico + IA fácil + sem relógio + partida única (o caminho padrão/primeiro contato)
- [ ] Quântico + IA difícil + relógio blitz Fischer
- [ ] Clássico + dois jogadores + melhor de três
- [ ] Quântico + IA + relógio personalizado no limite (1 minuto, incremento 0)

### 5.2 Casos de borda específicos deste jogo

- [ ] Forçar o colapso de uma peça emaranhada e confirmar que o par correto colapsa para o tipo complementar.
- [ ] Xeque-mate aplicado por uma peça que **ainda está em superposição** no momento do mate.
- [ ] Tentar mover uma peça quântica para uma casa que só seria válida para **uma** das possibilidades (deve testar ambas antes de rejeitar).
- [ ] **Desfazer jogada** depois de um colapso — o estado quântico anterior (peça ainda em superposição) precisa voltar corretamente, não só o tabuleiro do `chess.js`.
- [ ] Relógio chegando a zero **durante** o lance da IA (condição de corrida entre o timer e o `setTimeout` da IA).
- [ ] Torneio "melhor de três" terminando exatamente na segunda vitória de um lado (não deve iniciar uma terceira partida).
- [ ] Redimensionar a janela / girar a tela do celular **no meio de uma partida** (o painel deve empilhar/desempilhar sem perder estado).

### 5.3 Compatibilidade

- [ ] Pelo menos dois motores de navegador diferentes (ex.: um baseado em Chromium e o Firefox/WebKit).
- [ ] Um dispositivo touch real ou emulado (o clique deve funcionar mesmo sem drag-and-drop, que depende de mouse).
- [ ] Uma tela estreita (≤ 380px de largura) para confirmar que nada é cortado.

### 5.4 Performance

- [ ] A IA em nível difícil não deve travar a interface — o cálculo roda em *Web Worker*; confirme que o tabuleiro continua responsivo (ex.: o botão "Voltar à configuração" continua clicável) enquanto a IA "pensa".
- [ ] Tempo de resposta da IA em cada nível é razoável (documente o tempo observado no PR se a mudança afeta o motor).

### 5.5 Regressão

- [ ] Re-execute os fluxos críticos documentados acima mesmo que a mudança pareça isolada — várias partes do estado quântico são compartilhadas (`pecasQuanticas`, `historicoEstadosQuanticos`), e uma mudança pequena em uma função pode afetar outra que não parece relacionada.

---

## 6. Checklist de revisão de Pull Request

Quem revisar (mantenedor ou outro colaborador) deve confirmar:

- [ ] A funcionalidade foi testada seguindo a seção 5 (o autor do PR deve descrever o que testou, não só dizer "funciona").
- [ ] Não quebra nenhum dos três modos (Quântico solo, Clássico solo, dois jogadores).
- [ ] Não introduz dependências novas sem discutir antes (ver [`DEPENDENCIAS.md`](./DEPENDENCIAS.md)).
- [ ] Mantém atribuições de licença de bibliotecas/assets de terceiros.
- [ ] Atualiza a documentação relevante (`README.md`, `PLANO_DE_EXPANSAO.md`) se o comportamento do usuário muda.
- [ ] Segue o estilo de nomenclatura já usado no projeto (nomes de função e variável em português, consistente com o restante do código).

---

## 7. Recebendo sugestões de usuários finais

Nem toda sugestão vem de quem programa. Um professor de xadrez, um estudante ou um curioso pode ter uma ideia excelente ("seria legal ter som quando uma peça colapsa") sem saber abrir uma issue técnica. Protocolo sugerido:

1. **Onde recolher**: um canal de baixo atrito — Discussions, um formulário simples, ou até uma issue fixada ("Sugestões e feedback — poste aqui") para quem não sabe usar labels/templates.
2. **Triagem amigável**: alguém da manutenção reformula a sugestão em linguagem técnica e cria a issue correspondente, **linkando de volta** para a sugestão original e citando quem sugeriu — reconhecimento importa, mesmo para quem não escreveu código.
3. **Gerenciamento de expectativa**: nem toda sugestão será implementada. Responder com uma explicação curta do porquê (ex.: "foge do escopo didático", "já está no roadmap, ver item X do plano de expansão") é melhor do que silêncio — mantém a comunidade engajada mesmo quando a resposta é "não agora".
4. **Da sugestão ao roadmap**: sugestões recorrentes ou muito votadas devem subir para o `PLANO_DE_EXPANSAO.md` como um item formal, não ficar perdidas numa thread antiga.

---

## 8. Código de conduta

Este projeto é feito para (e, idealmente, com) educadores e estudantes de todos os níveis. Recomenda-se adotar um código de conduta padrão como o [Contributor Covenant](https://www.contributor-covenant.org/) — resumo prático: seja respeitoso com quem está aprendendo, critique o código e as ideias, nunca as pessoas, e assuma boa-fé por padrão.

## 9. Reconhecimento

Toda contribuição — código, documentação, conteúdo pedagógico, revisão de PR, ou até uma sugestão bem formulada — merece ser reconhecida (ex.: uma seção de agradecimentos no `README.md`, ou uma ferramenta como o bot [All Contributors](https://allcontributors.org/)). Um projeto educacional colaborativo se sustenta em boa parte pelo reconhecimento de quem contribui com seu tempo.
