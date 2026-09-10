import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const sourcePath = 'xadrez_quant-emaranhado.html';
const outputPath = 'xadrez-quantico-distribuicao.html';
let html = readFileSync(sourcePath, 'utf8');

html = html.replace(/<script type="text\/plain">[\s\S]*?<\/script>/i, '');
const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/i);
if (!inlineScript) throw new Error('Script principal não encontrado.');

const javascript = inlineScript[1]
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

html = html.replace(inlineScript[0], `<script>${javascript}</script>`);
html = html.replace(/<!--[\s\S]*?-->/g, '');
html = html.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();

const hash = createHash('sha256').update(html, 'utf8').digest('hex');
const signature = `<!-- XQ-AUTH: Projeto Xadrez Quântico | SHA-256: ${hash} -->\n`;
writeFileSync(outputPath, signature + html + '\n', 'utf8');
console.log(JSON.stringify({ outputPath, sha256: hash, bytes: Buffer.byteLength(signature + html + '\n') }, null, 2));
