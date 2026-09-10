import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const filePath = process.argv[2] || 'xadrez-quantico-distribuicao.html';
const content = readFileSync(filePath, 'utf8');
const match = content.match(/XQ-AUTH: Projeto Xadrez Quântico \| SHA-256: ([a-f0-9]{64})/i);
if (!match) throw new Error('Assinatura XQ-AUTH não encontrada.');

const withoutSignature = content.replace(/^<!-- XQ-AUTH:[^\n]*-->\n/, '');
const actual = createHash('sha256').update(withoutSignature.replace(/\n$/, ''), 'utf8').digest('hex');
const valid = actual === match[1].toLowerCase();
console.log(JSON.stringify({ filePath, declaredSha256: match[1].toLowerCase(), actualSha256: actual, valid }, null, 2));
if (!valid) process.exitCode = 1;
