// Animação do post "Como uma máquina aprende?"
//
// Contrato: exporta mount(root) → unmount?.
// `root` é o elemento .post-page já injetado no DOM. Procuramos nossos
// próprios alvos por id/classe — o post.js não impõe nada.
//
// Toda subscrição (rAF, listeners, observers) tem que ser desfeita no
// cleanup retornado, senão a animação continua rodando após navegar.
//
// Render-agnóstico: este stub usa <pre> ASCII só pra provar que o
// pipeline funciona. Pode virar canvas, SVG, WebGL — o contrato externo
// não muda.

export function mount(root) {
  const target = root.querySelector("#loss-graph");
  if (!target) return;

  // Respeita usuários com motion reduzido: render estático.
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const pre = document.createElement("pre");
  pre.style.cssText =
    "color:#fff;font-family:monospace;font-size:clamp(10px,1vw,14px);line-height:1;margin:0;white-space:pre;";
  target.appendChild(pre);

  // Placeholder: parábola simples com um marcador deslizando.
  // Substituir por gradient descent de verdade depois.
  const COLS = 60;
  const ROWS = 14;
  const curve = new Array(COLS);
  for (let x = 0; x < COLS; x++) {
    // y normalizado 0..1, parábola centrada
    const t = (x / (COLS - 1)) * 2 - 1;
    curve[x] = Math.round((1 - t * t) * (ROWS - 2));
  }

  let raf = 0;
  let t0 = 0;

  const draw = (phase) => {
    // phase: 0..1, posição do marcador na curva
    const px = Math.round(phase * (COLS - 1));
    const py = ROWS - 1 - curve[px];

    const buf = Array.from({ length: ROWS }, () => new Array(COLS).fill(" "));
    // curva
    for (let x = 0; x < COLS; x++) {
      const y = ROWS - 1 - curve[x];
      if (buf[y]) buf[y][x] = ".";
    }
    // marcador (otimizador)
    if (buf[py]) buf[py][px] = "@";

    pre.textContent = buf.map((row) => row.join("")).join("\n");
  };

  if (reduced) {
    draw(0.5);
    return;
  }

  const tick = (ts) => {
    if (!t0) t0 = ts;
    const elapsed = (ts - t0) / 1000;
    // vai e volta a cada ~4s; só pra mostrar movimento
    const phase = 0.5 + 0.5 * Math.sin(elapsed * 0.8);
    draw(phase);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    pre.remove();
  };
}
