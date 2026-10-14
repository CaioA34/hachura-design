// Exporta cada slide de um deck como PNG, usando o Edge ou o Chrome sem interface.
// Uso: node ferramentas/exportar.mjs <deck.html> [pasta-de-saida] [--formato=slide|post]
//   slide = 1920×1080 (16:9)   post = 1080×1350 (4:5)
// Sem --formato, vale o data-format do deck. A saída padrão é export/<deck>-<formato>/ na raiz.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { findBrowser, repoRoot } from './navegador.mjs';

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith('--'));
const [deckArg, outArg] = args.filter((a) => !a.startsWith('--'));

if (!deckArg) {
  console.error('Uso: node ferramentas/exportar.mjs <deck.html> [pasta-de-saida] [--formato=slide|post]');
  process.exit(1);
}

const deck = path.resolve(deckArg);
const html = fs.readFileSync(deck, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
const total = (html.match(/<section[^>]*class="[^"]*\bslide\b/g) || []).length;
if (!total) {
  console.error('Nenhum <section class="slide"> encontrado em ' + deck);
  process.exit(1);
}

const flagFormato = flags.find((f) => f.startsWith('--formato='));
const formato = flagFormato ? flagFormato.split('=')[1] : /<main\b[^>]*\bdata-format="post"/.test(html) ? 'post' : 'slide';
if (formato !== 'slide' && formato !== 'post') {
  console.error('Formato desconhecido: ' + formato + ' (use slide ou post)');
  process.exit(1);
}
const [width, height] = formato === 'post' ? [1080, 1350] : [1920, 1080];

const browser = findBrowser();

const outDir = path.resolve(outArg || path.join(repoRoot, 'export', path.basename(deck, '.html') + '-' + formato));
fs.mkdirSync(outDir, { recursive: true });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'deck-export-'));
const base = pathToFileURL(deck).href;

let failed = 0;
for (let n = 1; n <= total; n++) {
  const file = path.join(outDir, String(n).padStart(2, '0') + '.png');
  fs.rmSync(file, { force: true });
  spawnSync(browser, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    `--window-size=${width},${height}`,
    '--virtual-time-budget=6000',
    `--user-data-dir=${profile}`,
    `--screenshot=${file}`,
    `${base}?formato=${formato}&solo#${n}`,
  ], { stdio: 'ignore' });
  if (!fs.existsSync(file)) {
    failed++;
    console.error('Falhou: slide ' + n);
  }
}

fs.rmSync(profile, { recursive: true, force: true });
console.log(`${total - failed} de ${total} imagens (${width}×${height}) em ${outDir}`);
process.exitCode = failed ? 1 : 0;
