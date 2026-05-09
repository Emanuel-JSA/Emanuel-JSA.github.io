# sky

Site pessoal — um campo de estrelas ASCII animado como plano de fundo, com SPA por cima.

```
  . * .  . , .  * .   +   . *   .  ,  .   *  .
,  .   *   . + .  .  . *  ,  .  *  .   .   +  .
 .  ,  .  *   .   +  .  .  *  . ,  .  .  *  .  ,
```

## Rodar localmente

O projeto usa ES modules — `file://` não funciona. É necessário um servidor HTTP:

```sh
npx serve . --single
```

A flag `--single` é obrigatória: o router usa a History API e qualquer URL que não seja um arquivo (ex: `/posts/slug`) precisa ser servida como `index.html`.

Sem build, sem bundler, sem dependências de runtime.

## Estrutura

```
index.html              shell: canvas + <main id="view"> + script
styles.css
manifest.webmanifest
sw.js                   service worker (cache-first, fallback offline)
404.html                workaround GitHub Pages para History API

src/
  main.js               entry: inicia sky + router
  router.js             History API — mapeia paths para views
  sky/
    renderer.js         Canvas 2D, grid de caracteres monospace
    world.js            simulação: estrelas piscando + shooting stars
  ui/
    divider.js          mountDivider(el) — preenche com "---..." e observa resize
    bot.js              mountBot(el) — float sinusoidal + blink state machine
  views/
    home.js             view da home: bio, bot, lista de posts
    post.js             view de post: carrega parcial HTML por slug

content/
  posts/
    index.json          lista de posts [{slug, title, date}]
    *.html              conteúdo de cada post (só <article>, sem <html>/<head>)

assets/
  ascii-bem-vindo.txt
  ascii-bot-default.txt
  ascii-bot-blinking.txt
  ascii-bot-closed-eyes.txt

icons/                  PNGs do manifest PWA
scripts/
  gen-icons.mjs         gera os PNGs de ícone
  new-post.mjs          scaffolding de novo post
```

## Adicionar um post

```sh
node scripts/new-post.mjs meu-slug "Título do Post"
```

Cria `content/posts/meu-slug.html` com template e adiciona a entrada em `content/posts/index.json`. Depois é só editar o HTML com o conteúdo.

Estrutura do parcial:

```html
<article>
    <h1 class="post-title">Título do Post</h1>
    <p class="post-body">Conteúdo aqui.</p>
</article>
```

Após adicionar um post, inclua o caminho no array `STATIC` de `sw.js` para ele funcionar offline:

```js
"/content/posts/meu-slug.html",
```

## Ícones PWA

Os ícones em `icons/` são PNGs sólidos gerados por:

```sh
node scripts/gen-icons.mjs
```

Para substituir por ícones melhores, coloque os PNGs em `icons/` com os mesmos nomes (`icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png`) e regenere se quiser partir do script como base.

## Deploy no GitHub Pages

Funciona **em repositório `username.github.io`** (servido na raiz `/`).

O `404.html` resolve o problema da History API no GitHub Pages: qualquer URL sem arquivo correspondente cai no `404.html`, que salva o path no `sessionStorage` e redireciona para `/`; o router detecta o redirect e navega para a rota certa.

Para **repositório de projeto** (servido em `/nome-do-repo/`), o router precisaria de um prefixo de base — a alternativa mais simples é trocar para hash routing (`/#/posts/slug`).

## Service worker

`sw.js` usa estratégia cache-first para assets estáticos e intercepta toda navegação para servir `index.html` (necessário para o SPA funcionar offline).

Para atualizar o cache após mudanças em produção, incremente a versão:

```js
// sw.js
const CACHE = "sky-v2"; // era v1
```

O `activate` do SW apaga caches com nomes antigos automaticamente.

## Como funciona o starfield

O canvas cobre toda a tela e fica fora do `<main id="view">`, então a animação **não reinicia** ao navegar entre páginas.

- **`world.js`** — simulação pura: estrelas piscando (fase senoidal independente de posição) e shooting stars com trail de decay. `setSize` só cresce a área populada, nunca re-randomiza estrelas já existentes.
- **`renderer.js`** — desenha em uma grade de células monospace. A cada frame aloca um buffer de espaços, pede ao world para pintar, depois desenha só as células não-espaço.
- **`main.js`** — loop rAF com dt clampeado em 100ms (evita salto de fase ao voltar de aba em background). Resize é adiado para o início do próximo frame para evitar frame preto durante drag de janela.
