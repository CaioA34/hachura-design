// Confere um deck depois de qualquer mudança no sistema ou no conteúdo.
// Uso: node ferramentas/verificar.mjs [deck.html]      (padrão: decks/modelo-base.html)
// Checa: biblioteca de ícones válida; contraste das cores de texto; nos dois formatos,
// navegação, fontes, ícones desenhados,
// proporção do slide, nenhum conteúdo transbordando e animações que terminam com tudo visível.
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

// 2. contraste (WCAG AA): cada cor de texto sobre o fundo e sobre os cartões
const tokens = Object.fromEntries([...fs.readFileSync(path.join(repoRoot, 'css', 'tokens.css'), 'utf8')
  .matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\b/gi)].map((m) => [m[1], m[2]]));
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
const pairs = ['text', 'text-2', 'text-3', 'accent', 'alert'].flatMap((fg) => ['bg', 'surface'].map((bg) => ({
  name: `--${fg} sobre --${bg}`, ratio: tokens[fg] && tokens[bg] ? contrast(tokens[fg], tokens[bg]) : 0,
})));
const weak = pairs.filter((x) => x.ratio < 4.5);
const lowest = pairs.reduce((a, b) => (b.ratio < a.ratio ? b : a));
report(weak.length === 0, weak.length
  ? 'contraste abaixo de 4,5:1: ' + weak.map((x) => `${x.name} (${x.ratio.toFixed(2)})`).join(', ')
  : `contraste: todas as cores de texto passam; a menor é ${lowest.name}, ${lowest.ratio.toFixed(2)}:1`);

// 3. o deck no navegador, com uma sonda acrescentada a uma cópia temporária
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
  // Espera as fontes (mudam a largura do texto) antes de medir.
  function measure() {
    r.fonts = Array.from(document.fonts).filter(function (f) { return f.status === 'loaded'; })
      .map(function (f) { return f.family.replace(/["']/g, ''); })
      .filter(function (name, i, all) { return all.indexOf(name) === i; });
    // Animação: nenhuma pode ser infinita e, terminadas, nada do slide pode ficar invisível.
    // finish() leva cada uma ao fim na hora, sem depender do relógio.
    var animations = document.getAnimations();
    r.endless = animations.filter(function (a) { return !isFinite(a.effect.getComputedTiming().endTime); }).length;
    animations.forEach(function (a) { if (isFinite(a.effect.getComputedTiming().endTime)) a.finish(); });
    r.hidden = [].filter.call(document.querySelectorAll('.slide.is-active :is(.text > *, .art > *, .takeaway)'), function (x) {
      return !x.matches('.step:not(.shown)') && getComputedStyle(x).opacity !== '1';
    }).length;
    r.overflow = slides.filter(function (s) {
      s.classList.add('is-active');
      return s.scrollHeight > s.clientHeight + 1 || s.scrollWidth > s.clientWidth + 1;
    }).map(function (s) { return Number(s.id); });
    document.body.setAttribute('data-probe', encodeURIComponent(JSON.stringify(r)));
  }
  var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  fonts.then(function () { setTimeout(measure, 300); });
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
    report(['Geist', 'Geist Mono'].every((f) => r.fonts.includes(f)), `${formato}: fontes carregadas: ${r.fonts.join(', ') || 'nenhuma'}`);
    report(r.missingIcons.length === 0, `${formato}: ícones` + (r.missingIcons.length ? ' sem desenho: ' + r.missingIcons.join(', ') : ' todos desenhados'));
    report(Math.abs(r.ratio - ratio) < 0.01, `${formato}: proporção ${r.ratio.toFixed(3)}`);
    report(r.overflow.length === 0, `${formato}: transbordo` + (r.overflow.length ? ' nos slides ' + r.overflow.join(', ') : ' em nenhum slide'));
    report(r.endless === 0 && r.hidden === 0, `${formato}: animações terminam e deixam o slide visível` +
      (r.endless ? ` (${r.endless} sem fim)` : '') + (r.hidden ? ` (${r.hidden} elementos invisíveis)` : '') +
      (r.motion ? '' : ' (animação desligada neste deck)') + (r.steps ? `; ${r.steps} elementos com .step` : ''));
  }
} finally {
  fs.rmSync(copy, { force: true });
  fs.rmSync(profile, { recursive: true, force: true });
}

console.log(failures ? `\n${failures} verificação(ões) falharam.` : '\nTudo certo.');
process.exitCode = failures ? 1 : 0;
