/*
 * Autoria: Pedro Marcos Locatelli.
 * Desenvolvimento original em parceria com o GitHub Copilot no VS Code,
 * usando vibe coding como método de exploração, implementação e validação.
 * Este módulo segue a filosofia de front-end puro: APIs nativas do navegador,
 * HTML/CSS/JavaScript e dependências públicas explícitas.
 * O modelo específico usado pelo Copilot não foi registrado neste repositório;
 * por isso, nenhuma identificação de modelo é afirmada sem evidência.
 *
 * Núcleo do jogo.
 *
 * O chess.js valida as regras clássicas. O objeto pecasQuanticas guarda a
 * camada visual/quântica, porque uma casa pode representar mais de um tipo
 * de peça antes do colapso.
 */
const chess = new Chess();
const colunas = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const nomesPecas = { p: 'Peão', n: 'Cavalo', b: 'Bispo', r: 'Torre', q: 'Dama', k: 'Rei' };
const imagens = {
    w: { p: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg', n: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg', b: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg', r: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg', q: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg', k: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg' },
    b: { p: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg', n: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg', b: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg', r: 'https://commons.wikimedia.org/wiki/Special:FilePath/Chess_rdt45.svg', q: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg', k: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg' }
};

let modo = 'quantico';
let pecasQuanticas = {};
let casaSelecionada = null;
let historico = [];
let relogio = null;

function criarEstado(tipo, cor, grupo = null) {
    return { possibilidades: [tipo], cor, colapsada: tipo, emaranhadaComId: grupo };
}

function inicializarEstado() {
    pecasQuanticas = {};
    const pecas = { a: 'r', b: 'n', c: 'b', d: 'q', e: 'k', f: 'b', g: 'n', h: 'r' };
    for (const coluna of colunas) {
        pecasQuanticas[`${coluna}2`] = criarEstado('p', 'w');
        pecasQuanticas[`${coluna}7`] = criarEstado('p', 'b');
        if (modo === 'classico') {
            pecasQuanticas[`${coluna}1`] = criarEstado(pecas[coluna], 'w');
            pecasQuanticas[`${coluna}8`] = criarEstado(pecas[coluna], 'b');
        }
    }
    if (modo === 'quantico') {
        const grupos = [[['b1', 'c1'], ['n', 'b']], [['f1', 'g1'], ['n', 'b']], [['a1', 'd1'], ['r', 'q']], [['h1'], ['r', 'q']], [['e1'], ['k']], [['b8', 'c8'], ['n', 'b']], [['f8', 'g8'], ['n', 'b']], [['a8', 'd8'], ['r', 'q']], [['h8'], ['r', 'q']], [['e8'], ['k']]];
        let grupo = 1;
        for (const [casas, possibilidades] of grupos) {
            for (const casa of casas) {
                pecasQuanticas[casa] = { possibilidades: [...possibilidades], cor: Number(casa[1]) < 3 ? 'w' : 'b', colapsada: possibilidades.length === 1 ? possibilidades[0] : null, emaranhadaComId: casas.length > 1 ? grupo : null };
            }
            if (casas.length > 1) grupo++;
        }
    }
}

function imagem(cor, tipo) {
    const elemento = document.createElement('img');
    elemento.src = imagens[cor][tipo];
    elemento.alt = nomesPecas[tipo];
    elemento.className = 'peca-img';
    return elemento;
}

function renderizar() {
    const tabuleiro = document.getElementById('tabuleiro');
    tabuleiro.replaceChildren();
    for (let linha = 8; linha >= 1; linha--) {
        for (let coluna = 0; coluna < 8; coluna++) {
            const casa = `${colunas[coluna]}${linha}`;
            const elemento = document.createElement('div');
            elemento.className = `casa ${(linha + coluna) % 2 ? 'clara' : 'escura'}`;
            elemento.dataset.casa = casa;
            if (casaSelecionada === casa) elemento.classList.add('selecionada');
            elemento.onclick = () => selecionarCasa(casa);
            elemento.ondragover = evento => evento.preventDefault();
            elemento.ondrop = evento => mover(evento.dataTransfer.getData('text/plain'), casa);
            const estado = pecasQuanticas[casa];
            if (estado && chess.get(casa)) {
                const peca = document.createElement('div');
                peca.className = 'peca-container';
                peca.draggable = estado.cor === chess.turn();
                peca.ondragstart = evento => { evento.dataTransfer.setData('text/plain', casa); casaSelecionada = casa; };
                if (estado.emaranhadaComId && !estado.colapsada) peca.classList.add('emaranhada');
                if (estado.colapsada) peca.appendChild(imagem(estado.cor, estado.colapsada));
                else {
                    const superposicao = document.createElement('div');
                    superposicao.className = 'quantica-split';
                    estado.possibilidades.forEach(tipo => superposicao.appendChild(imagem(estado.cor, tipo)));
                    peca.appendChild(superposicao);
                }
                elemento.appendChild(peca);
            }
            tabuleiro.appendChild(elemento);
        }
    }
    document.getElementById('status').textContent = `Turno das ${chess.turn() === 'w' ? 'Brancas' : 'Pretas'}`;
    document.getElementById('historico').textContent = chess.history().join(' ');
    document.getElementById('btnDesfazer').disabled = historico.length === 0;
}

function selecionarCasa(casa) {
    if (!casaSelecionada) {
        const peca = chess.get(casa);
        if (peca && peca.color === chess.turn()) { casaSelecionada = casa; renderizar(); }
    } else {
        const origem = casaSelecionada;
        casaSelecionada = null;
        if (origem !== casa) mover(origem, casa); else renderizar();
    }
}

function mover(origem, destino) {
    const estado = pecasQuanticas[origem];
    if (!estado) return renderizar();
    let tipo = null;
    for (const possibilidade of estado.possibilidades) {
        chess.put({ type: possibilidade, color: estado.cor }, origem);
        const tentativa = chess.move({ from: origem, to: destino, promotion: 'q' });
        if (tentativa) { tipo = possibilidade; chess.undo(); break; }
        chess.remove(origem);
    }
    if (!tipo) return renderizar();

    historico.push(JSON.parse(JSON.stringify(pecasQuanticas)));
    const movimento = chess.move({ from: origem, to: destino, promotion: 'q' });
    estado.colapsada = tipo;
    estado.possibilidades = [tipo];
    pecasQuanticas[destino] = estado;
    delete pecasQuanticas[origem];
    sincronizarRoque(movimento);
    renderizar();
}

/*
 * chess.js move o rei e a torre internamente quando executa O-O/O-O-O.
 * A camada quântica não é movida pela biblioteca, portanto precisamos
 * sincronizar as casas da torre explicitamente. Sem isso, a renderização
 * encontra a torre em h1/a1, mas chess.js já deixou essas casas vazias e a
 * peça desaparece.
 */
function sincronizarRoque(movimento) {
    if (!movimento || !['O-O', 'O-O-O'].includes(movimento.san)) return;
    const branco = movimento.color === 'w';
    const ladoGrande = movimento.san === 'O-O-O';
    const origemTorre = `${ladoGrande ? 'a' : 'h'}${branco ? 1 : 8}`;
    const destinoTorre = `${ladoGrande ? 'd' : 'f'}${branco ? 1 : 8}`;
    const torre = pecasQuanticas[origemTorre];
    if (!torre) return;
    torre.colapsada = 'r';
    torre.possibilidades = ['r'];
    pecasQuanticas[destinoTorre] = torre;
    delete pecasQuanticas[origemTorre];
}

function desfazer() {
    if (!historico.length) return;
    chess.undo();
    pecasQuanticas = historico.pop();
    renderizar();
}

function iniciar() {
    modo = document.getElementById('configModo').value;
    chess.reset();
    historico = [];
    casaSelecionada = null;
    inicializarEstado();
    document.getElementById('telaInicial').classList.add('oculto');
    document.getElementById('areaJogo').classList.remove('oculto');
    renderizar();
}

document.getElementById('btnComecar').onclick = iniciar;
document.getElementById('btnDesfazer').onclick = desfazer;
document.getElementById('btnVoltar').onclick = () => { document.getElementById('areaJogo').classList.add('oculto'); document.getElementById('telaInicial').classList.remove('oculto'); };
