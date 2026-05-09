# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Personal static website (pt-BR) — a SPA (single-page application) overlaying an animated ASCII starfield rendered to a 2D canvas. No build system, no package manager, no dependencies. Pure HTML/CSS/ES-modules served as-is.

## Running locally

ES module imports (`<script type="module">`) require an HTTP origin — opening `index.html` via `file://` will fail with CORS errors.

**Important:** the router uses the History API (clean URLs). `python3 -m http.server` does **not** fallback to `index.html` on unknown paths, so navigating directly to `/posts/slug` gives 404. Use:

```sh
npx serve . --single
```

There is no test, lint, or build command.

## Architecture

### SPA shell

`index.html` is a thin shell: `<canvas id="sky">` + `<main id="view">` + a single `<script type="module" src="./src/main.js">`. The canvas lives **outside** `<main>` and is never touched by navigation — the starfield runs continuously across all page transitions.

`src/main.js` boots the sky animation once and starts the router.

### File structure

```
src/
  main.js             # entry: boota sky + router
  router.js           # History API — intercepta <a>, popstate, mapeia path -> view
  sky/
    renderer.js       # Canvas 2D, grid de caracteres
    world.js          # simulação: estrelas, shooting stars
  ui/
    divider.js        # mountDivider(el) -> unmount()
    bot.js            # mountBot(el) -> unmount()  (float + blink)
  views/
    home.js           # render() + mount() para a home
    post.js           # render({slug}) + mount() para posts
content/
  posts/
    index.json        # lista ordenada: [{slug, title, date}, ...]
    *.html            # parciais: só <article>…</article>
assets/               # ASCII art
icons/                # PNGs do manifest (gerar com scripts/gen-icons.mjs)
scripts/
  gen-icons.mjs       # gera icons/icon-{192,512}.png (node scripts/gen-icons.mjs)
  new-post.mjs        # scaffolding de novo post
```

### Router

`src/router.js` exporta `route(pattern, view)` e `start()`. Padrões suportados: `/` e `/posts/:slug`. Cada view é um objeto com:
- `render(params) -> Promise<string>` — retorna HTML para injetar em `<main id="view">`
- `mount(el, params) -> Promise<unmount|null>` — inicializa JS no HTML injetado; retorna função de limpeza opcional

O router chama `unmount()` da view anterior antes de montar a próxima.

### Sky (starfield)

- **`src/sky/renderer.js`** — Canvas 2D rendering on a character grid. Cell width is derived from `ctx.measureText('M').width`; cell height is locked to `FONT_SIZE` (1.0× line-height — tight grid). `resize()` recomputes `cols`/`rows` from window size and DPR. **Order matters in `resize`**: assigning `canvas.width` resets the context, so `font` / `textBaseline` / `fillStyle` must be re-set after `ctx.scale(dpr, dpr)`. Each `draw()` allocates a fresh `rows × cols` buffer of spaces, hands it to `world.paint(buffer)`, then fills only non-space cells.

- **`src/sky/world.js`** — owns the simulation. Two kinds of objects:
  - **Twinkling stars**: position + `phase` + `phaseSpeed`. Sprite swaps between `low`/`high` based on `Math.sin(phase) > 0`. Phase speed uses a biased distribution (`Math.random() ** PHASE_SPEED_BIAS`) so most stars twinkle very slowly with a long tail of faster ones. Star count scales with `cols * rows * DENSITY`. **Phase and phaseSpeed must stay independent of x/y/type** — correlating them produces visible spatial waves across the screen.
  - **Shooting stars**: spawned on a random timer, given an angle and velocity, leave a short trail of decaying chars. The trail only advances when the integer cell changes — at low speeds vs. high `dt` the head can stay in the same cell across frames, and unconditional pushes would duplicate trail cells.
  - `setSize` only *grows* the populated region. Stars are kept for any area the window has ever covered, so shrinking and re-growing the window doesn't regenerate stars in the previously-populated rect (avoids visible re-randomization).
  - `SPRITES` is validated at module load via `validateSprites` — every sprite line must be exactly `2*radius+1` chars.

- **`src/main.js`** — owns the `requestAnimationFrame` loop. Two non-obvious behaviors:
  - `dt` is clamped to `DT_MAX = 100ms`. When a tab returns from background rAF delivers multi-second deltas; without clamping every star's phase jumps visibly.
  - `resize` events only set a `needsResize` flag. The actual resize runs at the *start* of the next frame, before `draw`. Setting `canvas.width` clears the backing store, so resizing after draw would leave one black frame (visible while drag-resizing on macOS).

## Adding a new post

```sh
node scripts/new-post.mjs meu-slug "Título do Post"
```

This creates `content/posts/meu-slug.html` with a template `<article>` and adds the entry to `content/posts/index.json`. Edit the HTML file to add the actual content. No other changes needed.

Manual steps (sem o script):
1. Criar `content/posts/<slug>.html` com `<article>…</article>` (sem `<html>`/`<head>`)
2. Adicionar `{"slug": "<slug>", "title": "...", "date": "YYYY-MM-DD"}` em `content/posts/index.json`
3. Adicionar o arquivo ao array `STATIC` em `sw.js` (para funcionar offline)

## Generating icons

```sh
node scripts/gen-icons.mjs
```

Gera `icons/icon-192.png`, `icons/icon-512.png` e variantes maskable com fundo sólido `#1a1a1a`. Substitua por ícones melhores quando quiser.

## Deploy no GitHub Pages

O site funciona no GitHub Pages **se o repositório for o `username.github.io`** (servido na raiz `/`).

O `404.html` na raiz resolve o problema da History API: o GitHub Pages serve esse arquivo para qualquer URL inexistente, ele salva o path no `sessionStorage` e redireciona para `/`; o router detecta o redirect e navega para a rota correta.

Para repositório de projeto (servido em `/nome-do-repo/`), os paths do router precisariam de um prefixo de base — nesse caso, hash routing (`/#/posts/slug`) seria mais simples.

## Service worker

`sw.js` usa cache-first para todos os assets estáticos e serve `index.html` do cache para qualquer navegação (SPA fallback offline). Para atualizar o cache em produção, incremente a versão `CACHE = "sky-v2"` em `sw.js` e adicione os novos arquivos à lista `STATIC`.

## Conventions

- Comments and user-facing text are in **Portuguese**; keep new comments in Portuguese to match.
- The bot animation (`src/ui/bot.js`) runs its own rAF loop — keep it **independent** of the canvas loop.
