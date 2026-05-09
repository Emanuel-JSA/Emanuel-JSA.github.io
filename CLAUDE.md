# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Personal static website (pt-BR) — a single page (`index.html`) overlaying an animated ASCII starfield rendered to a 2D canvas. No build system, no package manager, no dependencies. Pure HTML/CSS/ES-modules served as-is.

## Running locally

ES module imports (`<script type="module">`) require an HTTP origin — opening `index.html` via `file://` will fail with CORS errors. Serve the directory:

```sh
python3 -m http.server 8000
# or: npx serve .
```

There is no test, lint, or build command.

## Architecture

The starfield is a frame-loop simulation drawn as ASCII on a character grid. Three modules participate:

- **`main.js`** — owns the `requestAnimationFrame` loop. Two non-obvious behaviors here:
  - `dt` is clamped to `DT_MAX = 100ms`. When a tab returns from background rAF delivers multi-second deltas; without clamping every star's phase jumps visibly.
  - `resize` events only set a `needsResize` flag. The actual resize runs at the *start* of the next frame, before `draw`. Setting `canvas.width` clears the backing store, so resizing after draw would leave one black frame (visible while drag-resizing on macOS).

- **`renderer.js`** — Canvas 2D rendering on a character grid. Cell width is derived from `ctx.measureText('M').width`; cell height is locked to `FONT_SIZE` (1.0× line-height — tight grid). `resize()` recomputes `cols`/`rows` from window size and DPR. **Order matters in `resize`**: assigning `canvas.width` resets the context, so `font` / `textBaseline` / `fillStyle` must be re-set after `ctx.scale(dpr, dpr)`. Each `draw()` allocates a fresh `rows × cols` buffer of spaces, hands it to `world.paint(buffer)`, then fills only non-space cells.

- **`world.js`** — owns the simulation. Two kinds of objects:
  - **Twinkling stars**: position + `phase` + `phaseSpeed`. Sprite swaps between `low`/`high` based on `Math.sin(phase) > 0`. Phase speed uses a biased distribution (`Math.random() ** PHASE_SPEED_BIAS`) so most stars twinkle very slowly with a long tail of faster ones. Star count scales with `cols * rows * DENSITY`. **Phase and phaseSpeed must stay independent of x/y/type** — correlating them produces visible spatial waves across the screen.
  - **Shooting stars**: spawned on a random timer, given an angle and velocity, leave a short trail of decaying chars. The trail only advances when the integer cell changes — at low speeds vs. high `dt` the head can stay in the same cell across frames, and unconditional pushes would duplicate trail cells.
  - `setSize` only *grows* the populated region. Stars are kept for any area the window has ever covered, so shrinking and re-growing the window doesn't regenerate stars in the previously-populated rect (avoids visible re-randomization).
  - `SPRITES` is validated at module load via `validateSprites` — every sprite line must be exactly `2*radius+1` chars.

The HTML overlay (`.overlay`, `pointer-events: none`) sits on top of the canvas with `pointer-events: auto` re-enabled only on `.links`. The ASCII bot in `index.html` runs its own inline animation loop (sinusoidal float + randomized blink state machine cycling through three text frames in `assets/`) — independent of the canvas loop.

## Conventions

- Comments and user-facing text are in **Portuguese**; keep new comments in Portuguese to match.
- The `posts/` directory exists but is currently empty — reserved for future blog content.
