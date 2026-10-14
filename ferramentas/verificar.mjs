// Confere um deck depois de qualquer mudança no sistema ou no conteúdo.
// Uso: node ferramentas/verificar.mjs [deck.html]      (padrão: decks/modelo-base.html)
// Checa: biblioteca de ícones válida; nos dois formatos, navegação, ícones desenhados,
// proporção do slide e nenhum conteúdo transbordando; e que as animações terminam.
// Sai com código 1 se algo falhar.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { findBrowser, repoRoot } from './navegador.mjs';

const deck = path.resolve(process.argv[2] || path.join(repoRoot, 'decks', 'modelo-base.html'));
const browser = findBrowser();
let failures = 0;
const report = (ok, text) => { if (!ok) failures++; console.log((ok ? 'ok     ' : 'FALHOU ') + text); };

// 1. ícones
const build = spawnSync(process.execPath, [path.join(repoRoot, 'icons', 'build.mjs'), '--check'], { encoding: 'utf8' });
report(build.status === 0, 'ícones: ' + (build.stdout || build.stderr || '').trim().split('\n').pop());

// 2. o deck no navegador, com uma sonda acrescentada a uma cópia temporária
const probe = `<script>
(function () {
  function key(k) { window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })); }
  function active() { return Number(document.querySelector('.slide.is-active').id); }
  var slides = [].slice.call(document.querySelectorAll('.slide'));
  var r = { total: slides.length };
  key('End'); r.end = active(); key('Home'); r.home = active();
  r.visible = slides.filter(function (s) { return getComputedStyle(s).display !== 'none'; }).length;
  r.missingIcons = [].filter.call(document.querySelectorAll('.px[data-icon]'), function (x) { return !x.querySelector('path'); })
    .map(function (x) { return x.dataset.icon; });
  var box = slides[0].getBoundingClientRect(); r.ratio = box.width / box.height;
  r.steps = document.querySelectorAll('.step').length;
  r.motion = document.documentElement.classList.contains('motion');
  setTimeout(function () {
    r.running = document.getAnimations().length;
    r.overflow = slides.filter(function (s) {
      s.classList.add('is-active');
      return s.scrollHeight > s.clientHeight + 1 || s.scrollWidth > s.clientWidth + 1;
    }).map(function (s) { return Number(s.id); });
    document.body.setAttribute('data-probe', encodeURIComponent(JSON.stringify(r)));
  }, 9000);
})();
</script>
</body>`;

const copy = path.join(path.dirname(deck), '_verificar-tmp.html');
const source = fs.readFileSync(deck, 'utf8');
if (!source.includes('</body>')) { console.error('Deck sem </body>: ' + deck); process.exit(1); }
fs.writeFileSync(copy, source.replace('</body>', () => probe));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'deck-verificar-'));

try {
  for (const [formato, ratio] of [['slide', 16 / 9], ['post', 4 / 5]]) {
    const run = spawnSync(browser, ['--headless=new', '--disable-gpu', '--window-size=1600,1000', '--virtual-time-budget=12000',
      `--user-data-dir=${profile}`, '--dump-dom', pathToFileURL(copy).href + '?formato=' + formato], { encoding: 'utf8', maxBuffer: 1 << 26 });
    const match = /data-probe="([^"]*)"/.exec(run.stdout || '');
    if (!match) { report(false, formato + ': a página não respondeu (erro de script ou navegador)'); continue; }
    const r = JSON.parse(decodeURIComponent(match[1]));
    report(r.end === r.total && r.home === 1 && r.visible === 1, `${formato}: navegação (${r.total} slides, um visível por vez)`);
    report(r.missingIcons.length === 0, `${formato}: ícones` + (r.missingIcons.length ? ' sem desenho: ' + r.missingIcons.join(', ') : ' todos desenhados'));
    report(Math.abs(r.ratio - ratio) < 0.01, `${formato}: proporção ${r.ratio.toFixed(3)}`);
    report(r.overflow.length === 0, `${formato}: transbordo` + (r.overflow.length ? ' nos slides ' + r.overflow.join(', ') : ' em nenhum slide'));
    report(r.running === 0, `${formato}: animações terminam` + (r.motion ? '' : ' (animação desligada neste deck)') + (r.steps ? `; ${r.steps} elementos com .step` : ''));
  }
} finally {
  fs.rmSync(copy, { force: true });
  fs.rmSync(profile, { recursive: true, force: true });
}

console.log(failures ? `\n${failures} verificação(ões) falharam.` : '\nTudo certo.');
process.exitCode = failures ? 1 : 0;
