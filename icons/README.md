# Biblioteca de ícones em pixel (11×11)

Sistema de ícones em pixel art monocromático em grade 11×11 para uso em slides, documentos e posts técnicos.

> **Regra de ouro:** `icons.json` é a única fonte da verdade. Todos os outros arquivos (`svg/*.svg`, `sprite.svg`, `preview.html`) são gerados automaticamente pelo script de build e nunca devem ser editados manualmente.

---

## Como usar um ícone

Existem três formas suportadas de utilizar qualquer ícone da biblioteca:

### 1. Colar o SVG inline
Ideal para componentes isolados ou layouts que precisam de SVG autocontido:
```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 11 11" shape-rendering="crispEdges" fill="currentColor">
  <path d="..."/>
</svg>
```

### 2. Usar o sprite SVG (`<use>`)
Ideal para referenciar múltiplos ícones sem duplicar caminhos vetoriais:
```html
<svg viewBox="0 0 11 11" shape-rendering="crispEdges" width="24" height="24">
  <use href="icons/sprite.svg#px-arrow-right"></use>
</svg>
```

### 3. Usar nos decks (`decks/*.html`)
Os decks carregam `icons/icons.js`, gerado pelo build, e já enxergam todos os ícones:
1. Escreva `<i class="px" data-icon="nome"></i>` no HTML.
2. Tamanhos: `.lg` e `.xl`. A classe `.no` risca o ícone ("não faça").
3. Não copie grades para dentro do deck; um ícone novo entra em `icons.json`.

---

## Dimensionamento e cores

- **Cor:** Todos os ícones herdam `currentColor`. Para mudar a cor do ícone, altere a propriedade CSS `color` do elemento pai ou do próprio `<svg>`.
- **Dimensões:** Defina apenas a largura (`width`) ou apenas a altura (`height`) mantendo a proporção 1:1, ou utilize classes utilitárias (ex.: `.px`, `.px.lg`, `.px.xl`).
- **Renderização nítida:** Mantenha sempre `shape-rendering="crispEdges"` nos elementos `<svg>` para preservar a nitidez geométrica dos pixels.

---

## Lista de ícones por categoria (74)

| Categoria | Ícones |
|---|---|
| `setas` (10) | `arrow-right`, `arrow-left`, `arrow-up`, `arrow-down`, `chevron-right`, `chevron-left`, `chevron-up`, `chevron-down`, `refresh`, `external` |
| `estado` (10) | `check`, `cross`, `plus`, `minus`, `warn`, `info`, `question`, `star`, `heart`, `flag` |
| `pessoas` (8) | `person`, `people`, `chat`, `mail`, `bell`, `eye`, `phone`, `quote` |
| `arquivos` (10) | `doc`, `folder`, `image`, `link`, `bookmark`, `pencil`, `trash`, `search`, `download`, `upload` |
| `codigo` (12) | `code`, `terminal`, `bug`, `git-branch`, `db`, `server`, `cloud`, `cpu`, `plug`, `globe`, `wifi`, `package` |
| `seguranca` (4) | `lock`, `unlock`, `key`, `shield` |
| `tempo-dados` (6) | `clock`, `calendar`, `hourglass`, `chart-bar`, `chart-line`, `target` |
| `midia` (6) | `play`, `pause`, `stop`, `monitor`, `mobile`, `camera` |
| `ideias` (8) | `bolt`, `bulb`, `rocket`, `gear`, `coin`, `cart`, `home`, `trophy` |

---

## Como adicionar ou alterar um ícone

1. Abra `icons/icons.json`.
2. Adicione ou edite o ícone na chave `icons`:
   - Nome em inglês, kebab-case (`a-z`, `0-9`, `-`).
   - `category` pertencente a uma das 9 categorias válidas.
   - De 2 a 5 `tags` em português, minúsculas.
   - Array `rows` com exatamente 11 strings de 11 caracteres (`#` para pixel pintado, `.` para vazio).
   - Mantenha a ordenação alfabética das chaves.
3. Execute a validação e o build:
   ```bash
   node icons/build.mjs
   ```
   (Para rodar apenas as validações sem gerar arquivos, use `node icons/build.mjs --check`.)
4. Abra `icons/preview.html` no navegador para verificar o resultado visual.

---

## Regras de desenho

- **Grade 11×11:** O desenho deve ser imediatamente reconhecível a 24px de altura.
- **Contornos e traços:** Traço principal de 1 célula; detalhes pequenos podem ser formas cheias.
- **Diagonais:** Escada regular de 1 célula por passo.
- **Sem pixels soltos:** Exceto pontos intencionais (como o pingo do `i`, `?` e `!`).
- **Simetria:** Ícones simétricos por natureza (`plus`, `minus`, `cross`, setas cardeais) devem ser perfeitamente simétricos.
- **Pares espelhados:** Ícones de direção oposta (`arrow-left`/`arrow-right`, `chevron-up`/`chevron-down`, etc.) devem ser espelhos exatos.
- **Peso visual equilibrado:** Entre 12 e 90 células pintadas, sem parecer nem um fio frágil nem um bloco maciço.
- **Caixa delimitadora e centralização:** Largura ou altura da caixa envolvente deve ter pelo menos 9 células. Margens opostas (esquerda/direita e topo/base) não podem diferir em mais de 1 célula.
