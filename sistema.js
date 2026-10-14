(function () {
  // Ícones em pixel: vêm de icons/icons.js (gerado de icons/icons.json).
  var ICONS = window.PX_ICONS || {};

  function iconSvg(name) {
    var rows = ICONS[name];
    if (!rows) return '';
    var d = '';
    rows.forEach(function (row, y) {
      for (var x = 0; x < row.length; x++) if (row[x] === '#') d += 'M' + x + ' ' + y + 'h1v1h-1z';
    });
    return '<svg viewBox="0 0 ' + rows[0].length + ' ' + rows.length +
      '" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="' + d + '"/></svg>';
  }

  var root = document.documentElement;
  var deck = document.querySelector('.deck');
  // Sem o contêiner do deck não há o que montar: avisa em vez de quebrar mais adiante.
  if (!deck) {
    console.error('sistema.js: o deck precisa de um <main class="deck"> envolvendo os slides.');
    return;
  }
  var slides = Array.prototype.slice.call(deck.querySelectorAll('.slide'));
  var stage = window.matchMedia('(min-aspect-ratio:1001/1000) and (min-width:701px)');
  var current = 0;

  // ?formato=post mostra o mesmo deck em 4:5 sem editar o arquivo.
  // ?solo deixa só o slide atual na página (usado por exportar.mjs).
  var params = new URLSearchParams(location.search);
  var formato = params.get('formato');
  if (formato) deck.dataset.format = formato;
  if (params.has('solo')) root.classList.add('solo');

  // Grade de células: data-cols, data-rows, data-on (quantas cheias desde a primeira),
  // data-hot e data-alert (posições separadas por vírgula, começando em 1).
  function positions(value) { return (value || '').split(',').map(Number).filter(Boolean); }
  document.querySelectorAll('.cells[data-cols]').forEach(function (grid) {
    var cols = Number(grid.dataset.cols);
    var total = cols * (Number(grid.dataset.rows) || 1);
    var on = Number(grid.dataset.on) || 0;
    var hot = positions(grid.dataset.hot);
    var alert = positions(grid.dataset.alert);
    grid.style.setProperty('--n', cols);
    for (var i = 1; i <= total; i++) {
      var cell = el('i', alert.indexOf(i) > -1 ? 'alert' : hot.indexOf(i) > -1 ? 'hot' : i <= on ? 'on' : '');
      cell.style.setProperty('--i', i);
      grid.appendChild(cell);
    }
  });

  document.querySelectorAll('.px[data-icon]').forEach(function (el) {
    el.innerHTML = iconSvg(el.dataset.icon);
  });

  // Ordem de entrada nas animações: cada item de uma lista recebe --i com a sua posição.
  document.querySelectorAll('.flow,.timeline,.steps,.pair,.cols').forEach(function (list) {
    Array.prototype.forEach.call(list.children, function (child, i) { child.style.setProperty('--i', i); });
  });

  // Terminal: cada linha vira um <span class="ln"> para entrar uma por vez.
  document.querySelectorAll('.code.term').forEach(function (pre) {
    pre.innerHTML = pre.innerHTML.split('\n').map(function (line, i) {
      return '<span class="ln" style="--i:' + i + '">' + line + '</span>';
    }).join('\n');
  });

  function pad(n) { return String(n).padStart(2, '0'); }
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }

  // Moldura: faixa do topo e barra de progresso em cada slide.
  slides.forEach(function (slide, i) {
    slide.id = String(i + 1);
    var top = el('header', 'top');
    var left = el('span');
    left.appendChild(el('b', '', pad(i + 1)));
    left.appendChild(document.createTextNode('/' + pad(slides.length) + ' · ' +
      (slide.dataset.section || deck.dataset.section || '')));
    top.appendChild(left);
    top.appendChild(el('span', 'brand', deck.dataset.brand || ''));
    slide.insertBefore(top, slide.firstChild);

    var bar = el('div', 'progress');
    slides.forEach(function (_, j) { bar.appendChild(el('i', j < i ? 'on' : j === i ? 'now' : '')); });
    slide.appendChild(bar);
  });

  // Animação: ligada no modo apresentação. Desliga com data-motion="off" no deck ou em um slide,
  // com ?animacao=off no endereço, em ?solo, ou quando o sistema pede menos movimento.
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  var motion = deck.dataset.motion !== 'off' && !params.has('solo') && params.get('animacao') !== 'off';
  if (motion) root.classList.add('motion');
  function stepping() { return motion && stage.matches && !calm.matches && slides[current].dataset.motion !== 'off'; }

  function go(i) {
    var target = Math.max(0, Math.min(slides.length - 1, i));
    var back = target < current;
    current = target;
    slides.forEach(function (slide, j) { slide.classList.toggle('is-active', j === current); });
    // Indo para a frente, os .step começam escondidos; voltando, o slide aparece completo.
    Array.prototype.forEach.call(slides[current].querySelectorAll('.step'), function (step) {
      step.classList.toggle('shown', back);
    });
    try { history.replaceState(null, '', '#' + (current + 1)); } catch (e) {}
  }

  // Avançar revela o próximo .step do slide; sem passos pendentes, vai ao slide seguinte.
  function next() {
    var step = stepping() && slides[current].querySelector('.step:not(.shown)');
    if (step) step.classList.add('shown');
    else if (current < slides.length - 1) go(current + 1);
  }
  function prev() { if (current > 0) go(current - 1); }

  window.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'f' || e.key === 'F') {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (root.requestFullscreen) root.requestFullscreen();
      return;
    }
    if (!stage.matches) return;
    var nextKeys = ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'];
    var prevKeys = ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'];
    if (nextKeys.indexOf(e.key) > -1) { e.preventDefault(); next(); }
    else if (prevKeys.indexOf(e.key) > -1) { e.preventDefault(); prev(); }
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(slides.length - 1);
  });

  deck.addEventListener('click', function (e) {
    if (!stage.matches || e.target.closest('a,button')) return;
    if (e.clientX < window.innerWidth / 3) prev(); else next();
  });

  window.addEventListener('hashchange', function () {
    var n = parseInt(location.hash.slice(1), 10);
    if (n && n - 1 !== current) go(n - 1);
  });

  root.classList.add('js');
  go((parseInt(location.hash.slice(1), 10) || 1) - 1);
  if (!stage.matches && current > 0) slides[current].scrollIntoView();
})();
