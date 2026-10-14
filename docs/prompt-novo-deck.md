# Prompt para pedir um deck a uma IA

Use com uma IA que tenha acesso à pasta deste repositório (Claude Code, agy, Codex e
similares), aberta na raiz do projeto. Troque o que está entre `< >` e cole.

```text
Você vai criar um deck usando o sistema de design deste repositório.

Antes de escrever qualquer coisa:
1. Leia o AGENTS.md inteiro.
2. Leia o guia no topo de decks/modelo-base.html e os slides de exemplo dele.
3. Para ícones, consulte os nomes em icons/README.md.

O deck:
- Arquivo: decks/<nome>.html, copiado de decks/modelo-base.html.
- Formato: <slide 16:9 | post 4:5>
- Público e objetivo: <quem vai ver e o que deve sair sabendo>
- Tamanho: <número de slides>
- Faixa do topo: nome "<seu nome>", seção "<tema>"
- Animação: <padrão | estático>

Conteúdo:
<cole aqui o texto, os tópicos ou o material bruto>

Como trabalhar:
- Primeiro me mostre o roteiro: um título e um componente por slide. Espere eu aprovar.
- Uma ideia por slide; prefira diagrama a texto; cor só com significado.
- Não mude nada fora de decks/. Se faltar um componente ou ícone, pare e me avise.
- Ao terminar, rode `node ferramentas/verificar.mjs decks/<nome>.html` e
  `node ferramentas/exportar.mjs decks/<nome>.html`, olhe as imagens e me diga
  o que conferiu e o que não conferiu.
- Trabalhe em um branch e não faça commit sem eu pedir.
```

## Por que cada parte está aí

- **Ler o `AGENTS.md` primeiro.** As regras do sistema estão lá; sem isso a IA inventa um
  estilo próprio.
- **Roteiro antes dos slides.** Corrigir a ordem das ideias em uma lista custa pouco; em um
  deck pronto, custa refazer.
- **Nada fora de `decks/`.** Impede que a IA altere o sistema para encaixar um slide.
- **Verificar e olhar as imagens.** Sem isso, o deck é declarado pronto sem ninguém ter visto
  o resultado.

## Sem acesso a arquivos

Em uma IA de chat, anexe o `AGENTS.md` e o `decks/modelo-base.html`, peça só o HTML do deck e
salve o arquivo em `decks/`. Ela não consegue rodar a verificação, então rode você:

```bash
node ferramentas/verificar.mjs decks/<nome>.html
```
