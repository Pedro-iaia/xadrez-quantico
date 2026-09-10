# Protocolo de relato e resolução de bugs

## 1. Relato

Abra uma issue com um título objetivo:

```text
[Modo] [Ação] resultado observado
```

Inclua:

- modo: clássico ou quântico;
- oponente e nível da IA;
- modalidade do relógio;
- sequência exata de lances;
- resultado esperado;
- resultado observado;
- navegador e sistema operacional;
- mensagem do Console do navegador;
- arquivo e versão utilizada;
- captura de tela ou vídeo, quando útil.

Exemplo:

```text
[Clássico] O-O faz a torre desaparecer

Passos: e4 e5, Nf3 Nc6, Be2 Nf6, O-O.
Esperado: rei em g1 e torre em f1.
Observado: rei em g1 e casa f1 vazia.
```

## 2. Triagem

1. Reproduza o relato usando exatamente os passos fornecidos.
2. Confirme se ocorre na fonte modular e na versão distribuível.
3. Leia o Console e a aba Network.
4. Classifique o problema como interface, estado do jogo, regra, relógio, IA ou dependência externa.
5. Procure regressões recentes com `git log` e `git diff`.

## 3. Investigação

Registre uma hipótese falsificável antes de editar. Para o bug do roque:

> O motor move rei e torre, mas o estado visual só move o rei; por isso a torre não existe na casa de destino.

O teste mínimo é verificar simultaneamente:

```text
O-O -> rei em g1, torre em f1, casa h1 vazia
O-O-O -> rei em c1, torre em d1, casa a1 vazia
```

## 4. Correção

- escreva primeiro um teste ou reprodução mínima;
- corrija a camada que controla o estado, não apenas a aparência;
- mantenha comentários explicando regras quânticas e sincronização com Chess.js;
- não misture refatorações sem relação;
- atualize a documentação quando o comportamento mudar.

## 5. Verificação

Antes de fechar a issue:

- rode a checagem de sintaxe;
- teste o fluxo que falhava;
- teste pelo menos um lance comum e um lance especial;
- confira que não surgiram erros no Console;
- atualize a issue com evidência e hash/commit da correção.

## 6. Fechamento

Use estados claros: `reproduzido`, `em investigação`, `corrigido`, `aguardando confirmação` e `fechado`. Feche somente depois de registrar o resultado da verificação.
