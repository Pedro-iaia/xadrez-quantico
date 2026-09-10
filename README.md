# Xadrez de Schrödinger Quântico

Guia do usuário e colaboração do jogo de xadrez com superposição, emaranhamento quântico e adversário automatizado.

## Estrutura do projeto

- `index.html`: estrutura da aplicação pública;
- `css/style.css`: estilos separados da interface;
- `js/app.js`: estado, regras quânticas, renderização e sincronização com Chess.js;
- `docs/PROTOCOLO_BUGS.md`: protocolo de relato e resolução de bugs;
- `docs/DEPENDENCIAS.md`: dependências públicas e diagnóstico de falhas externas;
- `CONTRIBUTING.md`: fluxo de contribuição e publicação no GitHub;
- `Backup/`: versões históricas usadas como referência;
- `xadrez-quantico.html`: versão distribuível anterior.

Para iniciar o código modular, abra `index.html` em um navegador moderno.

## Como jogar

1. Abra `xadrez-quantico.html` em um navegador moderno.
2. Na tela **Nova partida**, escolha:
   - **Modo:** Clássico ou Quântico.
   - **Oponente:** adversário automatizado ou dois jogadores.
   - **Nível da IA:** fácil, médio ou difícil.
   - **Modalidade:** sem relógio, bullet, blitz, Fischer, rápida, clássica ou personalizada.
   - **Formato:** partida única ou melhor de três.
   - **Quem começa:** sorteio, Brancas ou Pretas.
3. Clique em **Começar partida**.

Não é necessário instalar o jogo. É preciso ter conexão com a internet para carregar o `chess.js` e as imagens das peças usadas pelo navegador.

## Modos de jogo

### Modo clássico

Segue as regras tradicionais do xadrez. As peças começam em suas posições normais e aparecem como peças individuais.

A IA possui três níveis:

- **Fácil:** escolhe um movimento válido aleatório.
- **Médio:** usa Minimax com poda alfa-beta em profundidade menor.
- **Difícil:** usa Minimax com uma profundidade maior.

Nos níveis médio e difícil clássicos, o cálculo é executado em um `Web Worker` para evitar o congelamento da interface.

### Modo quântico

Algumas peças começam em superposição. Por exemplo, uma peça pode aparecer como Cavalo/Bispo ou Torre/Dama.

Peças emaranhadas recebem uma aura azul. Quando uma delas se move e colapsa para uma possibilidade, a peça parceira também colapsa para a possibilidade complementar.

Exemplo:

- mova `b1` para `a3`;
- a peça movida pode colapsar para Cavalo;
- a peça emaranhada correspondente colapsa para Bispo.

O relógio é compartilhado normalmente por jogador. A superposição não cria tempos separados.

## Controles

- **Clique:** selecione a peça e depois a casa de destino.
- **Arrastar e soltar:** arraste uma peça até a casa desejada.
- **Desfazer jogada:** restaura a posição anterior, incluindo o estado quântico.
- **Voltar à configuração:** encerra a partida atual e retorna à tela inicial.

## Relógios

As modalidades disponíveis são:

| Modalidade | Tempo inicial | Incremento |
| --- | ---: | ---: |
| Sem relógio | ilimitado | 0 s |
| Bullet | 1 min | 0 s |
| Blitz | 3 min | 0 s |
| Blitz Fischer | 3 min | 2 s |
| Rápida | 10 min | 5 s |
| Clássica | 30 min | 10 s |
| Personalizada | definido pelo usuário | definido pelo usuário |

O relógio começa no primeiro lance, alterna automaticamente entre os jogadores e encerra a partida quando o tempo chega a zero.

## Melhor de três

No formato **Melhor de três**:

- o placar registra as vitórias de cada lado;
- a partida seguinte começa automaticamente quando necessário;
- o torneio termina quando um lado alcança duas vitórias;
- empates são registrados separadamente;
- a opção escolhida para o sorteio de quem começa é reaplicada nas novas partidas.

## Recursos didáticos

O painel de histórico apresenta os lances da partida e uma explicação curta sobre algumas sequências iniciais, como:

- Jogo Italiano;
- Defesa Siciliana;
- Defesa Francesa;
- Jogo de Dama;
- Defesas Índias.

A aplicação também indica situações de finalização, como xeque-mate, empate e derrota por tempo.

A biblioteca de aberturas é uma ferramenta de estudo, não uma garantia de que uma sequência seja a melhor em todos os estados quânticos. No modo quântico, os colapsos e emaranhamentos alteram a análise tradicional.

## Arquivos principais

- `xadrez-quantico.html`: versão pronta para distribuição e uso.
- `xadrez-quantico-distribuicao - Copia.html`: cópia da versão distribuível.
- `xadrez_quantico.html`: versão clássica anterior do projeto.
- `gerar-distribuicao.mjs`: gerador da cópia minificada com assinatura.
- `verificar-assinatura.mjs`: verificador da assinatura SHA-256.
- `Backup/`: arquivos de segurança do projeto.

## Assinatura de autoria

A versão distribuível contém uma marca no primeiro comentário HTML:

```text
XQ-AUTH: Projeto Xadrez Quântico | SHA-256: ...
```

Essa marca não é um segredo criptográfico. Ela serve para identificar a autoria e conferir se o arquivo permaneceu igual ao original distribuído.

Para conferir a integridade, execute no PowerShell dentro da pasta do projeto:

```powershell
node verificar-assinatura.mjs xadrez-quantico.html
```

O resultado esperado contém:

```json
"valid": true
```

Se o arquivo tiver sido alterado, o hash declarado e o hash calculado serão diferentes.

## Gerar uma nova distribuição

O gerador usa como fonte o nome `xadrez_quant-emaranhado.html`. Se a fonte de desenvolvimento tiver outro nome, ajuste `sourcePath` em `gerar-distribuicao.mjs` antes de executar:

```powershell
node gerar-distribuicao.mjs
node verificar-assinatura.mjs xadrez-quantico-distribuicao.html
```

A geração remove o bloco antigo inerte, comprime HTML/CSS/JavaScript de forma conservadora, calcula o SHA-256 e cria uma nova versão distribuível.

## Limitações e boas práticas

- Um arquivo HTML executado localmente pode ser inspecionado por quem o recebe. Minificação dificulta a leitura casual, mas não impede engenharia reversa.
- Não coloque chaves privadas, senhas ou segredos dentro do HTML.
- Para uma prova de autoria mais forte, mantenha uma cópia original datada e use assinatura digital assimétrica fora do arquivo distribuído.
- A aplicação depende de recursos externos do CDN e do Wikimedia. Para uma versão totalmente offline, seria necessário incluir localmente o `chess.js` e as imagens SVG.

## Licença e distribuição

Este projeto é distribuído entre os autores e amigos do grupo. Preserve a identificação `XQ-AUTH` ao compartilhar a versão distribuível e não remova a atribuição de autoria.
