# Como contribuir

## Preparação

1. Instale Git e Node.js.
2. Faça um fork ou clone do repositório.
3. Abra a pasta no VS Code.
4. Abra `index.html` no navegador ou use um servidor local.

## Fluxo de trabalho

```powershell
git switch -c correcao/nome-do-bug
```

Faça uma alteração pequena, documente o motivo e teste o caminho afetado. Para bugs, siga [docs/PROTOCOLO_BUGS.md](docs/PROTOCOLO_BUGS.md).

## Organização

- `index.html`: estrutura da aplicação;
- `css/style.css`: apresentação;
- `js/app.js`: regras, estado e interação;
- `docs/`: protocolos e decisões do projeto;
- `Backup/`: referências históricas, não é o ponto de entrada.

## Primeiro commit local

Na pasta do projeto:

```powershell
git init
git add .
git commit -m "chore: estrutura inicial do xadrez quantico"
git branch -M main
```

## Publicar no GitHub

Crie no GitHub um repositório vazio chamado `xadrez-quantico` na conta `Pedro-iaia`. Não marque README, `.gitignore` ou licença durante a criação, pois esses arquivos já existem localmente.

Depois execute:

```powershell
git remote add origin https://github.com/Pedro-iaia/xadrez-quantico.git
git push -u origin main
```

Para trabalhos futuros:

```powershell
git pull --rebase origin main
git switch -c tipo/descricao-curta
# edite e teste
git add .
git commit -m "tipo: resumo da mudança"
git push -u origin tipo/descricao-curta
```

Abra um Pull Request no GitHub e descreva o teste realizado.

## Antes de enviar

```powershell
node --check js/app.js
git diff --check
git status
```

Não publique chaves privadas, tokens ou senhas. O HTML pode ser inspecionado pelo usuário final; a marca XQ-AUTH identifica a versão, mas não substitui uma assinatura digital.
