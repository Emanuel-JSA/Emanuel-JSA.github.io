export function mount(root) {
  const target = root.querySelector("#loss-graph");
  if (!target) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const wrapper = document.createElement("div");
  target.appendChild(wrapper);

  const pre = document.createElement("pre");
  pre.style.cssText =
    "color:inherit;font-family:monospace;font-size:clamp(9px,1.1vw,13px);" +
    "line-height:1.2;margin:0;white-space:pre;overflow-x:auto;";
  wrapper.appendChild(pre);

  const legendRow = document.createElement("div");
  legendRow.style.cssText =
    "display:flex;font-family:monospace;margin-top:0.75em;" +
    "font-size:clamp(11px,1vw,13px);align-items:baseline;";
  wrapper.appendChild(legendRow);

  const leftLegend = document.createElement("div");
  leftLegend.style.cssText = "flex:0 0 53%;";
  leftLegend.innerHTML =
    `<span style="color:#c084fc">&#x2605;</span> dados &nbsp;&nbsp;` +
    `<span style="color:#59b292">─</span> ajuste linear &nbsp;&nbsp;` +
    `<span style="color:#ff6b35">│</span> resíduo (erro)`;
  legendRow.appendChild(leftLegend);

  const rightLegend = document.createElement("div");
  rightLegend.style.cssText = "flex:1;text-align:right;";
  const lossSpan = document.createElement("span");
  lossSpan.style.cssText =
    "color:#ff6b35;font-size:clamp(18px,1.8vw,26px);font-weight:bold;" +
    "font-family:monospace;letter-spacing:0.02em;";
  lossSpan.textContent = "perda —";
  rightLegend.appendChild(lossSpan);
  legendRow.appendChild(rightLegend);

  const genData = () =>
    Array.from({ length: 6 }, (_, i) => {
      const x = (i + 0.5) / 6 + (Math.random() - 0.5) * 0.08;
      const y = Math.max(
        0.05,
        Math.min(0.95, 0.82 * x + 0.12 + (Math.random() - 0.5) * 0.42),
      );
      return [x, y];
    });

  const ROWS = 24;
  const TOTAL_W = 84;
  const LP = { axc: 1, axr: 22, x0: 2, x1: 40, y0: 1, y1: 21 };
  const RP = { axc: 45, axr: 22, x0: 46, x1: 83, y0: 1, y1: 21 };

  const MAX_ITER = 150;
  const STEP_MS = 120;
  const PAUSE_MS = 2500;

  const C_LINE  = "#59b292";
  const C_RESID = "#ff6b35";
  const C_LOSS  = "#ff6b35";
  const C_POINT = "#c084fc";

  let DATA, w, b, maxLoss;
  const hist = [];
  let step = 0;
  let lastStepTs = 0;
  let doneTs = -1;

  const mse = () => {
    let s = 0;
    for (const [x, y] of DATA) s += (w * x + b - y) ** 2;
    return s / DATA.length;
  };

  const gdStep = () => {
    let dw = 0, db = 0;
    const n = DATA.length;
    for (const [x, y] of DATA) {
      const e = w * x + b - y;
      dw += e * x;
      db += e;
    }
    w -= 0.4 * ((2 * dw) / n);
    b -= 0.4 * ((2 * db) / n);
    hist.push(mse());
    step++;
  };

  const plot = (g, r, c, ch, color = null) => {
    if (r >= 0 && r < ROWS && c >= 0 && c < TOTAL_W) g[r][c] = { ch, color };
  };

  const lCol = (x) => LP.x0 + Math.round(x * (LP.x1 - LP.x0));
  const lRow = (y) => LP.y1 - Math.round(y * (LP.y1 - LP.y0));
  const rRow = (y) => RP.y1 - Math.round(Math.min(y, 1) * (RP.y1 - RP.y0));

  const drawLine = (g) => {
    let prevRow = null;
    for (let c = LP.x0; c <= LP.x1; c++) {
      const x = (c - LP.x0) / (LP.x1 - LP.x0);
      const row = lRow(w * x + b);
      if (row < LP.y0 || row > LP.y1) { prevRow = null; continue; }

      if (prevRow === null || row === prevRow) {
        plot(g, row, c, "─", C_LINE);
      } else if (row === prevRow - 1) {
        plot(g, row, c, "/", C_LINE);
      } else if (row === prevRow + 1) {
        plot(g, row, c, "\\", C_LINE);
      } else if (row < prevRow) {
        for (let r = prevRow - 1; r > row; r--)
          if (r >= LP.y0) plot(g, r, c, "│", C_LINE);
        plot(g, row, c, "/", C_LINE);
      } else {
        for (let r = prevRow + 1; r < row; r++)
          if (r <= LP.y1) plot(g, r, c, "│", C_LINE);
        plot(g, row, c, "\\", C_LINE);
      }
      prevRow = row;
    }
  };

  const drawResiduals = (g) => {
    for (const [x, y] of DATA) {
      const col     = lCol(x);
      const rowData = lRow(y);
      const rowFit  = lRow(w * x + b);
      const rMin = Math.min(rowData, rowFit);
      const rMax = Math.max(rowData, rowFit);
      for (let r = rMin; r <= rMax; r++)
        if (r >= LP.y0 && r <= LP.y1 && r !== rowData)
          plot(g, r, col, "│", C_RESID);
    }
  };

  const render = () => {
    const g = Array.from({ length: ROWS }, () =>
      Array.from({ length: TOTAL_W }, () => ({ ch: " ", color: null })),
    );

    for (let r = 0; r <= LP.axr; r++) plot(g, r, LP.axc, "│");
    for (let c = LP.axc; c <= LP.x1 + 1; c++) plot(g, LP.axr, c, "─");
    plot(g, LP.axr, LP.axc, "└");
    plot(g, 0, LP.axc, "y");
    plot(g, LP.axr + 1, LP.x1 - 1, "x");

    drawLine(g);
    drawResiduals(g);
    for (const [x, y] of DATA) plot(g, lRow(y), lCol(x), "*", C_POINT);

    for (let r = 0; r <= RP.axr; r++) plot(g, r, RP.axc, "│");
    for (let c = RP.axc; c <= RP.x1; c++) plot(g, RP.axr, c, "─");
    plot(g, RP.axr, RP.axc, "└");
    plot(g, 0, RP.axc + 1, "L");
    "iter".split("").forEach((ch, i) => plot(g, RP.axr + 1, RP.x1 - 3 + i, ch));

    for (let c = RP.x0; c <= RP.x1; c++) {
      const t = (c - RP.x0) / (RP.x1 - RP.x0);
      const i = Math.round(t * (MAX_ITER - 1));
      if (i < hist.length) {
        const r = rRow(hist[i] / maxLoss);
        if (r >= RP.y0 && r <= RP.y1) plot(g, r, c, ".", C_LOSS);
      }
    }
    if (hist.length > 0) {
      const i = hist.length - 1;
      const c = RP.x0 + Math.round((i / (MAX_ITER - 1)) * (RP.x1 - RP.x0));
      const r = rRow(hist[i] / maxLoss);
      if (r >= RP.y0 && r <= RP.y1) plot(g, r, c, "@", C_LOSS);
    }

    lossSpan.textContent = hist.length > 0
      ? "perda " + hist[hist.length - 1].toFixed(4)
      : "perda —";

    const html = g.map((row) => {
      let line = "";
      let currentColor = null;
      let buf = "";
      const flush = () => {
        if (!buf) return;
        line += currentColor
          ? `<span style="color:${currentColor}">${buf}</span>`
          : buf;
        buf = "";
      };
      for (const { ch, color } of row) {
        if (color !== currentColor) { flush(); currentColor = color; }
        buf += ch === "&" ? "&amp;" : ch === "<" ? "&lt;" : ch === ">" ? "&gt;" : ch;
      }
      flush();
      return line;
    }).join("\n");

    pre.innerHTML = html;
  };

  const reset = () => {
    DATA = genData();
    w = 0.0;
    b = 0.9;
    maxLoss = mse() * 1.1;
    hist.length = 0;
    step = 0;
    lastStepTs = 0;
    doneTs = -1;
  };

  reset();

  if (reduced) {
    for (let i = 0; i < MAX_ITER; i++) gdStep();
    render();
    return;
  }

  let raf = 0;

  const tick = (ts) => {
    if (doneTs >= 0) {
      if (ts - doneTs > PAUSE_MS) reset();
    } else {
      if (ts - lastStepTs >= STEP_MS && step < MAX_ITER) {
        gdStep();
        lastStepTs = ts;
      }
      if (step >= MAX_ITER) doneTs = ts;
    }
    render();
    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    wrapper.remove();
  };
}
