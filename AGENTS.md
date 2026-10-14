# Repositório de design

Sistema de design para materiais (slides 16:9 e posts 4:5). Leia este arquivo antes de criar
ou mudar qualquer coisa: ele diz onde está cada peça, como elas se encaixam e como acrescentar
uma nova sem quebrar as outras.

## Estrutura

```
AGENTS.md                 este arquivo
sistema.css               ponto de entrada do estilo: só @import, na ordem certa
sistema.js                comportamento: moldura, navegação, ícones, grade de células, passos
css/
  fontes.css              @font-face de Geist e Geist Mono, apontando para fonts/
  tokens.css              cores, fontes, unidades, velocidade das animações
  base.css                palco, moldura do slide e peças comuns (.label .card .px .hatch)
  componentes/
    fluxo.css             caixas ligadas, setas, fluxo vertical, bifurcação
    dados.css             barras, colunas, legenda, tabela, grade de células, número grande
    texto.css             comparação, linha do tempo, citação, resumo, encerramento
    codigo.css            bloco de código e terminal
    desenho.css           diagrama livre em SVG
  formatos.css            post 4:5, tela estreita, ?solo e PDF
  animacao.css            animações de entrada e passos por clique
fonts/                    arquivos das fontes (woff2) e a licença OFL
icons/
  icons.json              fonte da verdade dos 74 ícones (grade 11×11)
  build.mjs               valida e gera svg/, sprite.svg, preview.html e icons.js
  README.md               como usar e desenhar ícones
decks/
  modelo-base.html        catálogo vivo: um slide de exemplo por tipo e por componente
  readme.html             capa do README (a imagem é exportada para docs/readme/)
README.md                 apresentação do repositório para pessoas
docs/readme/              imagens do README, exportadas dos decks
docs/prompt-novo-deck.md  prompt pronto para uma pessoa pedir um deck a uma IA
ferramentas/
  exportar.mjs            um PNG por slide
  empacotar.mjs           deck em um arquivo HTML único, para enviar a alguém
  verificar.mjs           testes automáticos de um deck
  navegador.mjs           código comum das duas ferramentas
export/                   saída do exportar (fora do git)
.githooks/commit-msg      recusa commits fora do padrão (veja "Commits")
```

## Como as peças se encaixam

- Um deck é um HTML em `decks/` que carrega três arquivos: `../sistema.css`, `../icons/icons.js`
  e `../sistema.js`. Ele só contém conteúdo; nenhum estilo ou script próprio.
- `sistema.css` importa os módulos nesta ordem: fontes, tokens, base, componentes, formatos,
  animação.
  Formatos vêm depois dos componentes porque ajustam o layout deles; animação vem por último.
- Todo tamanho é múltiplo de `--u` e toda cor vem de `css/tokens.css`. Um componente nunca
  escreve cor ou pixel fixo.
- `sistema.js` é um arquivo só de propósito: decks são abertos direto do disco, e o navegador
  não carrega módulos JavaScript de arquivos locais. Ele é dividido em seções comentadas.

## Formatos

O mesmo HTML serve aos dois; o formato é o atributo `data-format` em `<main class="deck">`.

- **Slide 16:9** (padrão, 1920×1080): texto à esquerda, diagrama à direita.
- **Post 4:5** (`data-format="post"`, 1080×1350): texto em cima, diagrama embaixo.

`?formato=post` ou `?formato=slide` no endereço mostra qualquer deck no outro formato.

## Estático ou animado

Animado é o padrão ao apresentar. Para um resultado estático:

| Quero | Como |
|---|---|
| Um deck inteiro sem animação | `data-motion="off"` em `<main class="deck">` |
| Um slide sem animação | `data-motion="off"` na `<section class="slide">` |
| Desligar só nesta apresentação | `?animacao=off` no endereço |
| Imagem ou PDF | Já são estáticos: mostram o slide pronto |

`class="step"` em um elemento faz ele aparecer só quando a pessoa avança. A velocidade de tudo
é `--tempo` em `css/tokens.css`. O estilo é só de entrada: aparecer, subir um pouco, crescer.
Nada gira, quica ou pisca.

## Identidade visual

Valores em `css/tokens.css`. Use sempre os mesmos:

- Fundo `#0C0C0C`; superfície de cartões `#121214`; bordas `#242426`.
- Texto `#F2F2F2` (principal), `#A3A3A3` (secundário), `#858585` (apagado).
- Toda cor de texto precisa de contraste de pelo menos 4,5:1 sobre o fundo e sobre os cartões
  (WCAG AA). O verificador confere isso.
- Destaque/solução `#8F8CFF`; problema/atenção `#FFB020`. Nenhuma outra cor.
- Títulos em Geist, peso 700, letras apertadas. Rótulos, código e diagramas em Geist Mono.
  As duas fontes estão em `fonts/`; um deck não carrega nada da internet.
- Preenchimento de diagramas com hachura diagonal; nada de gradiente, sombra ou brilho.

## Como acrescentar

**Um deck.** Copie `decks/modelo-base.html` para `decks/<nome>.html`, apague os slides de
exemplo e escreva os seus. O guia de marcação está no comentário do topo do modelo.

**Um componente.**
1. Crie `css/componentes/<nome>.css` (ou acrescente ao arquivo da mesma família), só com `--u`
   e tokens.
2. Acrescente `@import "css/componentes/<nome>.css";` em `sistema.css`, antes de `formatos.css`.
3. Se ele precisa de ajuste no 4:5 ou em tela estreita, a regra entra em `css/formatos.css`.
4. Se ele deve animar, a regra entra em `css/animacao.css`, com tempos multiplicados por `--tempo`.
5. Acrescente um slide de exemplo em `decks/modelo-base.html` e uma linha no guia do topo.
6. Rode a verificação (abaixo).

**Um ícone.** Edite `icons/icons.json`, rode `node icons/build.mjs` e confira
`icons/preview.html`. As regras de desenho estão em `icons/README.md`.

**Uma cor ou medida.** Só em `css/tokens.css`. Cor nova precisa de significado próprio.

**Uma fonte.** O arquivo `.woff2` entra em `fonts/` (com a licença, se ela exigir), o
`@font-face` em `css/fontes.css` e o nome da família em `css/tokens.css`. Nunca um `<link>`
para fonte externa dentro de um deck.

**Uma animação.** Só em `css/animacao.css`, dentro do bloco de mídia que já existe, e só de
entrada. Nunca dentro de um deck.

**Um formato** (por exemplo 9:16). Em `css/formatos.css`, seguindo o bloco do post 4:5:
redefina `--w`, `--u` e a grade do `.slide`. Acrescente o tamanho em `ferramentas/exportar.mjs`
e a proporção em `ferramentas/verificar.mjs`.

**Um comportamento** (algo que precise de script). Uma seção nova em `sistema.js`, ativada por
classe ou atributo `data-`, como a grade de células. O deck continua sem script próprio.

## Regras para qualquer peça

1. Uma ideia por slide ou por tela.
2. Cor só com significado: destaque para a solução, alerta para o problema.
3. Ícones vêm de `icons/`. Se faltar um, adicione em `icons/icons.json`.
4. Rótulos de diagrama em minúsculas e em fonte mono.
5. Não escreva à mão o que o sistema gera sozinho (faixa do topo, contador, barra de progresso).
6. Não coloque `<style>` nem `<script>` dentro de um deck. Se falta algo, falta no sistema.

## Commits

Todo commit segue o [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0-beta.4/):

```
<tipo>(<escopo opcional>): <descrição>

<corpo opcional: o que mudou e por quê>

<rodapé opcional, por exemplo BREAKING CHANGE: ...>
```

- **Tipos:** `feat` (algo novo), `fix` (correção), `docs`, `style` (formatação, sem mudar
  comportamento), `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- **Escopos usados aqui:** `fontes`, `tokens`, `base`, `componentes`, `formatos`, `animacao`, `js`,
  `icons`, `decks`, `ferramentas`.
- **Descrição:** em português, no imperativo, minúscula, sem ponto final
  (`feat(icons): adiciona ícone de impressora`).
- **Quebra de compatibilidade** (renomear classe, mover arquivo que os decks usam): `!` depois
  do tipo e rodapé `BREAKING CHANGE:` dizendo o que os decks precisam mudar.
- **Um commit por mudança lógica.** Componente novo e correção de ícone são dois commits.
- **Sem IA como coautora.** Não acrescente `Co-Authored-By` nem assinatura de ferramenta
  ("Generated with ...") em commits ou pull requests.
- Trabalhe em um branch, nunca direto no `main`.

O hook em `.githooks/commit-msg` recusa mensagens fora do padrão. Em um clone novo, ative com
`git config core.hooksPath .githooks`.

## Antes de entregar

```
node ferramentas/verificar.mjs decks/<nome>.html     navegação, ícones, proporção, transbordo
node ferramentas/exportar.mjs decks/<nome>.html      um PNG por slide, para olhar
```

Para enviar um deck a alguém sem o repositório, `node ferramentas/empacotar.mjs decks/<nome>.html`
gera `export/<nome>.html`, um arquivo único com estilo, script e ícones embutidos. Nunca edite
o arquivo empacotado: edite o deck e empacote de novo.

Diga o que você conferiu de fato (rodou a verificação, olhou as imagens) e o que não conferiu.
