# plan.md

Plano de evolução do site para suportar múltiplos posts, ter cara de PWA e ficar mais organizado.

## Objetivos

1. **Background contínuo (cara de PWA).** O canvas do céu não pode ser destruído nem reinicializado quando o usuário navega entre páginas. Hoje cada `.html` recarrega tudo: o canvas pisca, as estrelas são re-randomizadas e o loop começa do zero.
2. **Reuso real.** Sky, divider, layout de post e shell HTML devem existir em um único lugar. Hoje `index.html` e `posts/como-uma-maquina-aprende.html` duplicam: `<canvas id="sky">`, o script do divider, o overlay, a importação de `main.js`.
3. **Escalar posts.** Adicionar um post novo deve ser editar/criar **um arquivo de conteúdo** — não duplicar HTML, scripts e markup de página.
4. **Zero JavaScript inline em HTML.** Todo `<script>` que não seja `type="module" src="…"` deve sair dos `.html`.
5. **PWA instalável e offline.** Manifest, service worker com cache dos assets estáticos, ícones, meta tags (`theme-color`, viewport, `apple-mobile-web-app-capable`).
6. **Organização do código.** Separar em pastas por responsabilidade.

## Diagnóstico do estado atual

| Problema | Onde |
|---|---|
| Canvas reinicializa em cada navegação | navegação multi-page nativa entre `index.html` e `posts/*.html` |
| Script do divider duplicado (~20 linhas) | `index.html:31-52`, `posts/como-uma-maquina-aprende.html:18-39` |
| Animação do bot inline | `index.html:53-110` |
| Carregamento dos ASCII inline | `index.html:54-66` |
| Overlay/canvas duplicados em cada página de post | `posts/como-uma-maquina-aprende.html:9-17` |
| Adicionar post = criar HTML novo do zero | `posts/` |
| Sem manifest, sem service worker, sem ícones | raiz |
| `.DS_Store` versionados | raiz, `assets/` |

## Arquitetura alvo

**SPA shell + roteamento client-side via History API.** Um único `index.html` carrega o canvas e o overlay; um `router` troca apenas o conteúdo do `<main>` em cada navegação. O canvas vive fora do `<main>` e nunca é tocado pela navegação — atende objetivo 1 sem View Transitions API nem hacks.

Posts viram **dados** (HTML parcial ou Markdown), não páginas inteiras. Um template renderiza qualquer post a partir do conteúdo + metadados.

```
site/
├── index.html              # shell único: canvas + overlay + <main id="view">
├── manifest.webmanifest
├── sw.js                   # service worker (cache-first dos estáticos)
├── icons/                  # 192/512 png + maskable
├── src/
│   ├── main.js             # entry: boota sky + router
│   ├── sky/
│   │   ├── renderer.js     # (movido)
│   │   └── world.js        # (movido)
│   ├── ui/
│   │   ├── divider.js      # fillDivider() reutilizável, observa resize uma vez
│   │   └── bot.js          # animação do bot (float + blink) como módulo
│   ├── router.js           # History API, mapeia path -> view
│   └── views/
│       ├── home.js         # renderiza intro + bot + lista de posts
│       └── post.js         # renderiza um post a partir do conteúdo carregado
├── content/
│   └── posts/
│       ├── index.json      # lista ordenada: [{slug, title, date}, ...]
│       └── como-uma-maquina-aprende.html   # só o <article>, sem <html>/<head>
└── assets/                 # ASCII art (já existe)
```

Notas de design:

- O **canvas** fica em `index.html`, **fora** do `<main id="view">`. O router só troca o conteúdo de `<main>`. Sky nunca remonta.
- `router.js` intercepta cliques em `<a>` internos, faz `history.pushState`, busca o conteúdo correspondente e injeta no `<main>`. Dispara um evento `view:mounted` que cada view escuta para inicializar o que precisa (divider, bot, etc).
- Cada **view** é um módulo com `render(params) -> string|Node` e opcionalmente `mount(el)` para anexar comportamento. Sem framework.
- Posts são **HTML parciais** (`<article>…</article>`) — Markdown adicionaria parser + dependência sem ganho real para o volume previsto. `index.json` é a fonte de verdade da listagem.
- `divider.js` exporta `mountDivider(el)`: mede um caractere, preenche, registra `resize` uma única vez, retorna `unmount()` para o router chamar quando a view sai.
- Service worker: cache `cache-first` para `index.html`, JS, CSS, ASCII assets, ícones. Posts (`content/posts/*`) também cacheáveis — invalidação por versão no nome do cache.

## Fases

Cada fase deixa o site funcionando. Não dá para fazer tudo num commit só sem perder isso.

### Fase 1 — Limpeza e organização (sem mudar comportamento)

- [ ] Mover `main.js`, `renderer.js`, `world.js` para `src/sky/` (ajustar imports).
- [ ] Adicionar `.gitignore` com `.DS_Store`; remover os já versionados.
- [ ] Extrair `fillDivider` para `src/ui/divider.js` exportando `mountDivider(el)`.
- [ ] Extrair animação do bot para `src/ui/bot.js` exportando `mountBot(el)`.
- [ ] Substituir os `<script>` inline em `index.html` e `posts/como-uma-maquina-aprende.html` por `import` + chamada via `<script type="module" src="…">`. Resolve objetivo 4 já nesta fase.

**Critério de pronto:** `index.html` e o post existente continuam funcionando idênticos, mas nenhum `<script>` tem corpo.

### Fase 2 — SPA shell + router

- [ ] Criar `src/router.js` (History API, intercepta `<a>` internos, `popstate`, fallback 404).
- [ ] Criar `src/views/home.js` e `src/views/post.js`. `home` renderiza o que hoje está no `index.html` abaixo do canvas; `post` recebe slug, busca o parcial e o monta.
- [ ] `index.html` vira shell: `<canvas id="sky">` + `<div class="overlay"><main id="view"></main></div>`. Sem conteúdo de página.
- [ ] `src/main.js` boota o sky **uma vez** e chama `router.start()`.
- [ ] Mover `posts/como-uma-maquina-aprende.html` para `content/posts/como-uma-maquina-aprende.html` reduzido ao `<article>`. Criar `content/posts/index.json`.
- [ ] Configurar fallback do servidor de dev para `index.html` (documentar `python3 -m http.server` não faz isso por padrão — opção: rodar `npx serve .` que aceita `--single`, ou usar hash routing como fallback simples).

**Decisão a tomar nesta fase:** History API (URLs limpas, exige fallback no servidor) **ou** hash routing (`/#/posts/slug`, funciona com qualquer servidor estático). Recomendo History API + documentar no `CLAUDE.md` como rodar localmente.

**Critério de pronto:** navegar de home pra post e voltar **não** pisca o canvas, **não** reinicia estrelas, e o histórico do navegador funciona (back/forward).

### Fase 3 — PWA

- [ ] `manifest.webmanifest` com nome, ícones, `theme_color: #1a1a1a`, `background_color: #1a1a1a`, `display: standalone`, `start_url: /`.
- [ ] Ícones 192/512 + maskable em `icons/`.
- [ ] Meta tags em `index.html`: `theme-color`, `viewport`, `apple-mobile-web-app-capable`, `apple-touch-icon`.
- [ ] `sw.js`: cache versionado, `cache-first` para estáticos, `network-falling-back-to-cache` para `content/posts/*` e `index.json`. Limpar caches antigos no `activate`.
- [ ] Registrar o SW em `src/main.js` atrás de `if ('serviceWorker' in navigator)`.

**Critério de pronto:** Lighthouse PWA install criteria atende; o site abre offline depois da primeira visita; é instalável.

### Fase 4 — Ergonomia para novos posts

- [ ] Documentar em `CLAUDE.md` o fluxo: "para adicionar um post, criar `content/posts/<slug>.html` com `<article>…</article>` e adicionar entrada em `content/posts/index.json`".
- [ ] (Opcional) Pequeno script Node `scripts/new-post.mjs` que cria o arquivo e atualiza o JSON.

## Mudanças por arquivo (resumo)

| Arquivo | Ação |
|---|---|
| `index.html` | Reduz a shell: canvas + `<main id="view">` + `<script type="module" src="./src/main.js">`. Sem JS inline. Adiciona meta tags PWA e link do manifest. |
| `posts/como-uma-maquina-aprende.html` | **Removido**; conteúdo migra para `content/posts/como-uma-maquina-aprende.html` (só `<article>`). |
| `main.js` | Move para `src/main.js`. Passa a bootar sky **e** router. |
| `renderer.js`, `world.js` | Movem para `src/sky/`. |
| `styles.css` | Mantém. Pequenos ajustes se algo da home virar específico de view. |
| `src/ui/divider.js` | Novo — extrai script duplicado. |
| `src/ui/bot.js` | Novo — extrai animação inline. |
| `src/router.js` | Novo. |
| `src/views/home.js` | Novo. |
| `src/views/post.js` | Novo. |
| `content/posts/index.json` | Novo — lista de posts. |
| `manifest.webmanifest`, `sw.js`, `icons/` | Novos. |
| `.gitignore` | Novo — `.DS_Store`. |
| `CLAUDE.md` | Atualizar seções "Architecture" e "Conventions"; adicionar fluxo de novo post. |

## Riscos e pontos de atenção

- **`python3 -m http.server` não faz fallback para `index.html`.** Recarregar `/posts/<slug>` direto vai dar 404. Mitigação: usar `npx serve . --single` em dev, ou adotar hash routing (mais simples, sem custo perceptível).
- **`CLAUDE.md` afirma que a animação do bot é "independent of the canvas loop"** — preservar essa independência ao migrar para `bot.js` (não meter no rAF do sky).
- **`world.setSize` só cresce a região populada** — comportamento intencional. Não regredir ao reorganizar.
- **Service worker em desenvolvimento atrapalha:** cachear `index.html` agressivamente engana durante mudanças. Registrar SW só em produção, ou deixar `index.html` como `network-first`.
- **Cache busting do SW:** versionar o nome do cache (`sky-v1`, `sky-v2`) e limpar antigos no `activate`. Sem build system, não temos hash automático nos arquivos.

## Não-objetivos (explicitamente fora de escopo)

- Adotar bundler, framework ou TypeScript.
- View Transitions API (não resolve o problema do canvas reiniciar entre documentos sem mais infraestrutura).
- Sistema de comentários, analytics, RSS — podem virar fases futuras.
