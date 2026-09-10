# Dependências públicas

## Chess.js

O projeto usa `chess.js` 0.10.3 pelo CDNJS:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js"></script>
```

A biblioteca valida regras clássicas, incluindo:

- movimentos legais;
- xeque e xeque-mate;
- empate;
- roque;
- promoção;
- histórico e notação dos lances.

Ela não conhece a mecânica quântica. O projeto mantém uma segunda camada, `pecasQuanticas`, para superposição e emaranhamento. Por isso, toda alteração de posição precisa manter as duas camadas sincronizadas.

## Como distinguir um bug externo

1. Reproduza o comportamento usando apenas Chess.js, sem a interface.
2. Compare `chess.fen()`, `chess.get(casa)` e `chess.history()` antes e depois do lance.
3. Consulte a documentação e o changelog da versão usada.
4. Verifique a aba Network: status HTTP, MIME type e conteúdo do CDN.
5. Repita o teste com uma cópia local da biblioteca ou com outra versão conhecida.
6. Confira se a camada `pecasQuanticas` diverge do FEN retornado pelo motor.

Um exemplo de diagnóstico:

```javascript
console.log(chess.fen());
console.log(chess.get('f1'), chess.get('g1'), chess.get('h1'));
console.log(chess.history({ verbose: true }).at(-1));
```

Se Chess.js informar rei em `g1` e torre em `f1`, mas a tela não mostrar a torre, o defeito é local na renderização ou no estado quântico. Se o motor já retornar uma posição incorreta em um teste isolado, investigue a versão, a chamada da API e a dependência.

## Outras dependências

As imagens SVG das peças são carregadas do Wikimedia Commons. Falhas 404 ou indisponibilidade do serviço podem deixar imagens ausentes sem significar erro nas regras do jogo.

Para uma distribuição totalmente offline, copie localmente `chess.js` e os SVGs, registre as versões e atualize os caminhos em `js/app.js`.
