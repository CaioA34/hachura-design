import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXPECTED_CATEGORIES = [
  'setas',
  'estado',
  'pessoas',
  'arquivos',
  'codigo',
  'seguranca',
  'tempo-dados',
  'midia',
  'ideias'
];

const EXPECTED_ICONS_BY_CATEGORY = {
  'setas': [
    'arrow-right', 'arrow-left', 'arrow-up', 'arrow-down',
    'chevron-right', 'chevron-left', 'chevron-up', 'chevron-down',
    'refresh', 'external'
  ],
  'estado': [
    'check', 'cross', 'plus', 'minus', 'warn', 'info',
    'question', 'star', 'heart', 'flag'
  ],
  'pessoas': [
    'person', 'people', 'chat', 'mail', 'bell', 'eye', 'phone', 'quote'
  ],
  'arquivos': [
    'doc', 'folder', 'image', 'link', 'bookmark',
    'pencil', 'trash', 'search', 'download', 'upload'
  ],
  'codigo': [
    'code', 'terminal', 'bug', 'git-branch', 'db', 'server',
    'cloud', 'cpu', 'plug', 'globe', 'wifi', 'package'
  ],
  'seguranca': [
    'lock', 'unlock', 'key', 'shield'
  ],
  'tempo-dados': [
    'clock', 'calendar', 'hourglass', 'chart-bar', 'chart-line', 'target'
  ],
  'midia': [
    'play', 'pause', 'stop', 'monitor', 'mobile', 'camera'
  ],
  'ideias': [
    'bolt', 'bulb', 'rocket', 'gear', 'coin', 'cart', 'home', 'trophy'
  ]
};

const ALL_EXPECTED_ICONS = new Set();
for (const list of Object.values(EXPECTED_ICONS_BY_CATEGORY)) {
  for (const name of list) {
    ALL_EXPECTED_ICONS.add(name);
  }
}

export function rowsToPath(rows) {
  let d = '';
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    let x = 0;
    while (x < row.length) {
      if (row[x] === '#') {
        const startX = x;
        while (x < row.length && row[x] === '#') {
          x++;
        }
        const w = x - startX;
        d += `M${startX} ${y}h${w}v1h-${w}z`;
      } else {
        x++;
      }
    }
  }
  return d;
}

export function validate(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    errors.push({ name: 'icons.json', reason: 'Formato JSON inválido.' });
    return errors;
  }

  if (data.grid !== 11) {
    errors.push({ name: 'icons.json', reason: `Tamanho da grade deve ser 11, encontrado ${data.grid}.` });
  }

  const icons = data.icons;
  if (!icons || typeof icons !== 'object') {
    errors.push({ name: 'icons.json', reason: 'Objeto "icons" ausente ou inválido.' });
    return errors;
  }

  const iconNames = Object.keys(icons);

  // 8. Todos os nomes da lista existem, e não há nomes fora dela
  for (const expected of ALL_EXPECTED_ICONS) {
    if (!icons[expected]) {
      errors.push({ name: expected, reason: 'Ícone obrigatório ausente na lista.' });
    }
  }
  for (const name of iconNames) {
    if (!ALL_EXPECTED_ICONS.has(name)) {
      errors.push({ name, reason: 'Ícone não permitido presente na lista.' });
    }
  }

  const gridMap = new Map();

  for (const name of iconNames) {
    const icon = icons[name];
    if (!icon || typeof icon !== 'object') {
      errors.push({ name, reason: 'Dados do ícone inválidos.' });
      continue;
    }

    // 2. Nome em kebab-case; category válida; de 2 a 5 tags
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
      errors.push({ name, reason: 'Nome deve estar em kebab-case (só a-z, 0-9 e hífen).' });
    }

    if (!EXPECTED_CATEGORIES.includes(icon.category)) {
      errors.push({ name, reason: `Categoria "${icon.category}" inválida.` });
    } else {
      const expectedCatList = EXPECTED_ICONS_BY_CATEGORY[icon.category] || [];
      if (!expectedCatList.includes(name)) {
        errors.push({ name, reason: `Ícone não pertence à categoria "${icon.category}".` });
      }
    }

    if (!Array.isArray(icon.tags) || icon.tags.length < 2 || icon.tags.length > 5) {
      errors.push({ name, reason: `Deve possuir entre 2 e 5 tags, possui ${icon.tags ? icon.tags.length : 0}.` });
    } else {
      for (const tag of icon.tags) {
        if (typeof tag !== 'string' || tag.trim() === '' || tag !== tag.toLowerCase()) {
          errors.push({ name, reason: `Tag "${tag}" deve ser string não vazia e em minúsculas.` });
        }
      }
    }

    // 1. Cada ícone tem exatamente 11 linhas de 11 caracteres, só # e .
    if (!Array.isArray(icon.rows) || icon.rows.length !== 11) {
      errors.push({ name, reason: `Deve ter exatamente 11 linhas, possui ${icon.rows ? icon.rows.length : 0}.` });
      continue;
    }

    let validRows = true;
    let paintedCount = 0;
    let minX = 11, maxX = -1, minY = 11, maxY = -1;

    for (let y = 0; y < 11; y++) {
      const row = icon.rows[y];
      if (typeof row !== 'string' || row.length !== 11) {
        errors.push({ name, reason: `Linha ${y + 1} deve ter 11 caracteres.` });
        validRows = false;
        break;
      }
      for (let x = 0; x < 11; x++) {
        const char = row[x];
        if (char === '#') {
          paintedCount++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        } else if (char !== '.') {
          errors.push({ name, reason: `Caractere inválido "${char}" na linha ${y + 1}, coluna ${x + 1}.` });
          validRows = false;
          break;
        }
      }
      if (!validRows) break;
    }

    if (!validRows) continue;

    // 3. Entre 12 e 90 células pintadas
    if (paintedCount < 12 || paintedCount > 90) {
      errors.push({ name, reason: `Células pintadas devem estar entre 12 e 90, possui ${paintedCount}.` });
    }

    if (paintedCount > 0) {
      const boxWidth = maxX - minX + 1;
      const boxHeight = maxY - minY + 1;

      // 4. A caixa que envolve o desenho tem pelo menos 9 células de largura OU de altura
      if (boxWidth < 9 && boxHeight < 9) {
        errors.push({ name, reason: `Caixa delimitadora (${boxWidth}×${boxHeight}) deve ter pelo menos 9 de largura ou altura.` });
      }

      // 5. Desenho centralizado: margem esquerda e direita diferem em no máximo 1; cima e baixo também
      const marginLeft = minX;
      const marginRight = 10 - maxX;
      const marginTop = minY;
      const marginBottom = 10 - maxY;

      if (Math.abs(marginLeft - marginRight) > 1) {
        errors.push({ name, reason: `Margem horizontal descentralizada: esquerda=${marginLeft}, direita=${marginRight}.` });
      }

      if (Math.abs(marginTop - marginBottom) > 1) {
        errors.push({ name, reason: `Margem vertical descentralizada: topo=${marginTop}, base=${marginBottom}.` });
      }
    }

    // 6. Não existem dois ícones com a mesma grade
    const gridKey = icon.rows.join('');
    if (gridMap.has(gridKey)) {
      errors.push({ name, reason: `Grade idêntica à do ícone "${gridMap.get(gridKey)}".` });
    } else {
      gridMap.set(gridKey, name);
    }
  }

  // 7. Pares espelhados são exatos
  function checkHorizontalMirror(nameA, nameB) {
    const a = icons[nameA];
    const b = icons[nameB];
    if (!a || !b || !a.rows || !b.rows) return;
    for (let y = 0; y < 11; y++) {
      const expectedRow = a.rows[y].split('').reverse().join('');
      if (b.rows[y] !== expectedRow) {
        errors.push({ name: nameB, reason: `Não é o espelho horizontal exato de "${nameA}" na linha ${y + 1}.` });
        return;
      }
    }
  }

  function checkVerticalMirror(nameA, nameB) {
    const a = icons[nameA];
    const b = icons[nameB];
    if (!a || !b || !a.rows || !b.rows) return;
    for (let y = 0; y < 11; y++) {
      const expectedRow = a.rows[10 - y];
      if (b.rows[y] !== expectedRow) {
        errors.push({ name: nameB, reason: `Não é o espelho vertical exato de "${nameA}" na linha ${y + 1}.` });
        return;
      }
    }
  }

  checkHorizontalMirror('arrow-right', 'arrow-left');
  checkVerticalMirror('arrow-up', 'arrow-down');
  checkHorizontalMirror('chevron-right', 'chevron-left');
  checkVerticalMirror('chevron-up', 'chevron-down');

  return errors;
}

function generateSvgContent(pathD) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 11 11" shape-rendering="crispEdges" fill="currentColor"><path d="${pathD}"/></svg>\n`;
}

function generateSpriteContent(sortedIcons) {
  const lines = [
    '<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" fill="currentColor">'
  ];
  for (const [name, icon] of sortedIcons) {
    const pathD = rowsToPath(icon.rows);
    lines.push(`  <symbol id="px-${name}" viewBox="0 0 11 11">`);
    lines.push(`    <path d="${pathD}"/>`);
    lines.push('  </symbol>');
  }
  lines.push('</svg>\n');
  return lines.join('\n');
}

function generatePreviewHtml(sortedIcons, iconsData) {
  const categoriesMap = new Map();
  for (const cat of EXPECTED_CATEGORIES) {
    categoriesMap.set(cat, []);
  }
  for (const [name, icon] of sortedIcons) {
    if (categoriesMap.has(icon.category)) {
      categoriesMap.get(icon.category).push({ name, icon, pathD: rowsToPath(icon.rows) });
    }
  }

  let categoriesHtml = '';
  for (const [catName, list] of categoriesMap.entries()) {
    if (list.length === 0) continue;
    let cardsHtml = '';
    for (const item of list) {
      const tagsString = item.icon.tags.join(', ');
      const tagsAttr = item.icon.tags.join(' ');
      cardsHtml += `
      <div class="card" data-name="${item.name}" data-tags="${tagsAttr}" data-category="${catName}">
        <div class="icon-frame">
          <svg viewBox="0 0 11 11" shape-rendering="crispEdges" width="44" height="44" fill="currentColor">
            <path d="${item.pathD}"/>
          </svg>
        </div>
        <div class="icon-name">${item.name}</div>
        <div class="icon-tags">${tagsString}</div>
      </div>`;
    }

    categoriesHtml += `
    <section class="category-section" data-category="${catName}">
      <h2 class="category-title">
        <span>${catName}</span>
        <span class="category-count">${list.length}</span>
      </h2>
      <div class="category-grid">
        ${cardsHtml}
      </div>
    </section>`;
  }

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Galeria de Ícones — Pixel 11×11</title>
<style>
:root {
  --bg: #0C0C0C;
  --surface: #121214;
  --border: #242426;
  --border-focus: #3A3A3D;
  --text: #F2F2F2;
  --text-dim: #A3A3A3;
  --text-muted: #6E6E6E;
  --accent: #8F8CFF;
  --font-mono: ui-monospace, "Cascadia Mono", "Segoe UI Mono", "Liberation Mono", Menlo, Monaco, Consolas, monospace;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-mono);
  padding: 32px 24px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

header {
  margin-bottom: 32px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 24px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

h1 {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.count-badge {
  font-size: 13px;
  color: var(--text-dim);
}

.count-badge b {
  color: var(--text);
}

.search-box {
  position: relative;
  width: 100%;
}

.search-input {
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px 16px;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s ease;
}

.search-input:focus {
  border-color: var(--accent);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.category-section {
  margin-bottom: 40px;
}

.category-title {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-dim);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-count {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 2px 6px;
  border-radius: 4px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.card:hover {
  border-color: var(--border-focus);
}

.icon-frame {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text);
}

.icon-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  word-break: break-word;
}

.icon-tags {
  font-size: 10px;
  color: var(--text-muted);
  line-height: 1.3;
}

.no-results {
  display: none;
  padding: 48px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
}
</style>
</head>
<body>
<div class="container">
  <header>
    <div class="header-top">
      <h1>Biblioteca de Ícones em Pixel (11×11)</h1>
      <div class="count-badge" id="count-badge">Mostrando <b id="visible-count">${sortedIcons.length}</b> de <b>${sortedIcons.length}</b> ícones</div>
    </div>
    <div class="search-box">
      <input type="text" id="search-input" class="search-input" placeholder="Buscar por nome ou tag..." autocomplete="off">
    </div>
  </header>

  <div id="gallery">
    ${categoriesHtml}
  </div>

  <div id="no-results" class="no-results">
    Nenhum ícone encontrado para a busca.
  </div>
</div>

<script>
(function() {
  const searchInput = document.getElementById('search-input');
  const cards = Array.from(document.querySelectorAll('.card'));
  const sections = Array.from(document.querySelectorAll('.category-section'));
  const visibleCountEl = document.getElementById('visible-count');
  const noResultsEl = document.getElementById('no-results');
  const totalCount = ${sortedIcons.length};

  function filter() {
    const q = searchInput.value.trim().toLowerCase();
    let visible = 0;

    cards.forEach(card => {
      const name = card.dataset.name.toLowerCase();
      const tags = card.dataset.tags.toLowerCase();
      const match = !q || name.includes(q) || tags.includes(q);
      card.style.display = match ? 'flex' : 'none';
      if (match) visible++;
    });

    sections.forEach(section => {
      const visibleCardsInSection = section.querySelectorAll('.card:not([style*="display: none"])');
      section.style.display = visibleCardsInSection.length > 0 ? 'block' : 'none';
    });

    visibleCountEl.textContent = visible;
    noResultsEl.style.display = visible === 0 ? 'block' : 'none';
  }

  searchInput.addEventListener('input', filter);
})();
</script>
</body>
</html>\n`;
}

function run() {
  const isCheckOnly = process.argv.includes('--check');
  const jsonPath = path.join(__dirname, 'icons.json');

  if (!fs.existsSync(jsonPath)) {
    console.error('Erro: Arquivo icons.json não encontrado em:', jsonPath);
    process.exit(1);
  }

  let raw;
  try {
    raw = fs.readFileSync(jsonPath, 'utf8');
  } catch (err) {
    console.error('Erro ao ler icons.json:', err.message);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error('Erro de sintaxe JSON em icons.json:', err.message);
    process.exit(1);
  }

  const errors = validate(data);

  if (errors.length > 0) {
    console.error(`Validação falhou com ${errors.length} erro(s):`);
    for (const err of errors) {
      console.error(`- [${err.name}]: ${err.reason}`);
    }
    process.exit(1);
  }

  if (isCheckOnly) {
    const total = Object.keys(data.icons).length;
    console.log(`Validação concluída com sucesso: todos os ${total} ícones são válidos.`);
    process.exit(0);
  }

  // Ordenação determinística alfabética
  const sortedNames = Object.keys(data.icons).sort();
  const sortedIcons = sortedNames.map(name => [name, data.icons[name]]);

  const svgDir = path.join(__dirname, 'svg');
  if (!fs.existsSync(svgDir)) {
    fs.mkdirSync(svgDir, { recursive: true });
  }

  // Gerar svg/<nome>.svg
  const validSvgFiles = new Set();
  for (const [name, icon] of sortedIcons) {
    const fileName = `${name}.svg`;
    validSvgFiles.add(fileName);
    const filePath = path.join(svgDir, fileName);
    const pathD = rowsToPath(icon.rows);
    const svgContent = generateSvgContent(pathD);
    fs.writeFileSync(filePath, svgContent, { encoding: 'utf8' });
  }

  // Apagar de svg/ qualquer .svg que não corresponda mais a um ícone
  const existingFiles = fs.readdirSync(svgDir);
  for (const file of existingFiles) {
    if (file.endsWith('.svg') && !validSvgFiles.has(file)) {
      fs.unlinkSync(path.join(svgDir, file));
    }
  }

  // Gerar sprite.svg
  const spritePath = path.join(__dirname, 'sprite.svg');
  const spriteContent = generateSpriteContent(sortedIcons);
  fs.writeFileSync(spritePath, spriteContent, { encoding: 'utf8' });

  // Gerar preview.html
  const previewPath = path.join(__dirname, 'preview.html');
  const previewContent = generatePreviewHtml(sortedIcons, data);
  fs.writeFileSync(previewPath, previewContent, { encoding: 'utf8' });

  // Gerar icons.js (grades prontas para <script src>, usado por sistema.js)
  const jsPath = path.join(__dirname, 'icons.js');
  const jsBody = sortedIcons.map(([name, icon]) => `  ${JSON.stringify(name)}: ${JSON.stringify(icon.rows)}`).join(',\n');
  fs.writeFileSync(jsPath, `// Gerado por build.mjs a partir de icons.json. Não edite.\nwindow.PX_ICONS = {\n${jsBody}\n};\n`, { encoding: 'utf8' });

  console.log(`Build concluído com sucesso: ${sortedIcons.length} ícones gerados em svg/, sprite.svg, preview.html e icons.js.`);
}

run();
