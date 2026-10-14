// Junta um deck e tudo o que ele carrega (estilo, script, ícones, imagens) em um único HTML,
// pronto para enviar a outra pessoa. O arquivo gerado abre em qualquer navegador, com
// navegação e animações, sem precisar do repositório.
// Uso: node ferramentas/empacotar.mjs <deck.html> [saida.html]
//   Sem saída, grava em export/<deck>.html na raiz do repositório.
// O que continua vindo da internet (por exemplo fontes do Google Fonts) é listado no fim.

import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './navegador.mjs';

const [deckArg, outArg] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!deckArg) {
  console.error('Uso: node ferramentas/empacotar.mjs <deck.html> [saida.html]');
  process.exit(1);
}

const deck = path.resolve(deckArg);
const out = path.resolve(outArg || path.join(repoRoot, 'export', path.basename(deck)));
if (out === deck) {
  console.error('A saída não pode ser o próprio deck.');
  process.exit(1);
}

const MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf',
};
const isLocal = (ref) => !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ref);
const localPath = (ref, baseDir) => path.resolve(baseDir, decodeURIComponent(ref.split(/[?#]/)[0]));
const inlined = [];
const missing = [];

function readLocal(ref, baseDir, encoding) {
  const file = localPath(ref, baseDir);
  if (!fs.existsSync(file)) {
    missing.push(path.relative(repoRoot, file));
    return null;
  }
  inlined.push(path.relative(repoRoot, file));
  return { file, content: fs.readFileSync(file, encoding) };
}

function dataUri(ref, baseDir) {
  const mime = MIME[path.extname(ref.split(/[?#]/)[0]).toLowerCase()];
  if (!mime) return null;
  const found = readLocal(ref, baseDir);
  return found ? `data:${mime};base64,${found.content.toString('base64')}` : null;
}

// CSS: resolve @import em cadeia e troca url(arquivo local) por data URI.
function bundleCss(file, seen = new Set()) {
  if (seen.has(file)) return '';
  seen.add(file);
  const dir = path.dirname(file);
  let css = fs.readFileSync(file, 'utf8');
  css = css.replace(/@import\s+(?:url\(\s*)?["']?([^"')\s]+)["']?\s*\)?\s*;/g, (rule, ref) => {
    if (!isLocal(ref)) return rule;
    const target = localPath(ref, dir);
    if (!fs.existsSync(target)) { missing.push(path.relative(repoRoot, target)); return ''; }
    inlined.push(path.relative(repoRoot, target));
    return bundleCss(target, seen);
  });
  return css.replace(/url\(\s*["']?([^"')]+)["']?\s*\)/g, (rule, ref) => {
    if (!isLocal(ref)) return rule;
    const uri = dataUri(ref, dir);
    return uri ? `url("${uri}")` : rule;
  });
}

const deckDir = path.dirname(deck);
let html = fs.readFileSync(deck, 'utf8').replace(/<!--[\s\S]*?-->\s*/g, '');

html = html.replace(/<link\b[^>]*>/gi, (tag) => {
  const href = /\bhref=["']([^"']+)["']/i.exec(tag);
  if (!/\brel=["']stylesheet["']/i.test(tag) || !href || !isLocal(href[1])) return tag;
  const file = localPath(href[1], deckDir);
  if (!fs.existsSync(file)) { missing.push(path.relative(repoRoot, file)); return tag; }
  inlined.push(path.relative(repoRoot, file));
  return '<style>\n' + bundleCss(file) + '</style>';
});

html = html.replace(/<script\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)><\/script>/gi, (tag, before, src, after) => {
  if (!isLocal(src)) return tag;
  const found = readLocal(src, deckDir, 'utf8');
  return found ? `<script${before}${after}>\n${found.content.replace(/<\/script/gi, '<\\/script')}</script>` : tag;
});

html = html.replace(/(<img\b[^>]*\bsrc=["'])([^"']+)(["'])/gi, (tag, start, src, end) => {
  if (!isLocal(src)) return tag;
  const uri = dataUri(src, deckDir);
  return uri ? start + uri + end : tag;
});

const origin = path.relative(repoRoot, deck).replace(/\\/g, '/');
html = html.replace(/<head>/i, `<head>\n<!-- Arquivo único gerado por ferramentas/empacotar.mjs a partir de ${origin}.\n     Não edite aqui: edite o deck e empacote de novo. -->`);

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);

const remote = [...new Set([...html.matchAll(/\b(?:href|src)=["'](https?:\/\/[^"'/]+)/gi)].map((m) => m[1]))];
console.log(`${out}  (${Math.round(html.length / 1024)} KB, ${inlined.length} arquivos embutidos)`);
if (remote.length) console.log('Ainda vem da internet: ' + remote.join(', ') + '\n  Sem rede, o deck abre, mas com as fontes do sistema.');
if (missing.length) {
  console.error('Não encontrei: ' + missing.join(', '));
  process.exitCode = 1;
}
