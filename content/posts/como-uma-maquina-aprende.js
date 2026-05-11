export function mount(root) {
  const target = root.querySelector("#loss-graph");
  if (!target) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const wrapper = document.createElement("div");
  target.appendChild(wrapper);

  const graphsRow = document.createElement("div");
  graphsRow.style.cssText = "display:flex;justify-content:space-between;align-items:flex-start;";
  wrapper.appendChild(graphsRow);

  const preCss =
    "color:inherit;font-family:monospace;font-size:clamp(9px,1.1vw,13px);" +
    "line-height:1.2;margin:0;white-space:pre;overflow-x:auto;";
  const preL = document.createElement("pre");
  preL.style.cssText = preCss;
  graphsRow.appendChild(preL);

  const preR = document.createElement("pre");
  preR.style.cssText = preCss;
  graphsRow.appendChild(preR);

  const legendRow = document.createElement("div");
  legendRow.style.cssText =
    "display:flex;font-family:monospace;margin-top:0.75em;" +
    "font-size:clamp(11px,1vw,13px);align-items:baseline;";
  wrapper.appendChild(legendRow);

  const leftLegend = document.createElement("div");
  leftLegend.style.cssText = ";font-size:14px";
  leftLegend.innerHTML =
    `<span style="color:#c084fc">*</span> dados &nbsp;&nbsp;` +
    `<span style="color:#59b292">─</span> linha de previsão &nbsp;&nbsp;` +
    `<span style="color:#ff6b35">│</span> erro (distância dados reais)`;
  legendRow.appendChild(leftLegend);

  const rightLegend = document.createElement("div");
  rightLegend.style.cssText = "flex:1;text-align:right;";
  const lossSpan = document.createElement("span");
  lossSpan.style.cssText =
    "color:#ff6b35;font-size:16px;font-weight:bold;" +
    "font-family:monospace;letter-spacing:0.02em;";
  lossSpan.textContent = "perda: —";
  rightLegend.appendChild(lossSpan);
  legendRow.appendChild(rightLegend);

  const genData = () =>
    Array.from({ length: 6 }, (_, i) => {
      const x = (i + 0.5) / 6 + (Math.random() - 0.5) * 0.08;
      const y = Math.max(
        0.05,
        Math.min(0.95, 0.82 * x + 0.12 + (Math.random() - 0.5) * 0.18),
      );
      return [x, y];
    });

  const ROWS = 24;
  // LP: scatter+line panel (local coords)
  const LP = { axc: 1, axr: 22, x0: 2, x1: 40, y0: 1, y1: 21 };
  const LP_W = LP.x1 + 3; // x-axis extends to x1+1, plus margin
  // RP: loss-curve panel (local coords, origin at axis)
  const RP = { axc: 0, axr: 22, x0: 1, x1: 39, y0: 1, y1: 21 };
  const RP_W = RP.x1 + 3;

  const MAX_ITER = 60;
  // primeiras iterações bem lentas para mostrar o início da descida,
  // depois acelera (como no exemplo do Manim)
  const stepMs = (s) => (s < 3 ? 500 : s < 8 ? 300 : 180);
  const PAUSE_MS = 2500;

  const C_LINE = "#59b292";
  const C_RESID = "#ff6b35";
  const C_LOSS = "#ff6b35";
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
    let dw = 0,
      db = 0;
    const n = DATA.length;
    for (const [x, y] of DATA) {
      const e = w * x + b - y;
      dw += e * x;
      db += e;
    }
    w -= 0.08 * ((2 * dw) / n);
    b -= 0.08 * ((2 * db) / n);
    hist.push(mse());
    step++;
  };

  const mkGrid = (W) =>
    Array.from({ length: ROWS }, () =>
      Array.from({ length: W }, () => ({ ch: " ", color: null })),
    );

  const lCol = (x) => LP.x0 + Math.round(x * (LP.x1 - LP.x0));
  const lRow = (y) => LP.y1 - Math.round(y * (LP.y1 - LP.y0));
  // escala logarítmica: y / maxLoss em [FLOOR_R, 1] mapeado linearmente em log,
  // padrão para curvas de perda — espalha a descida pelo gráfico inteiro
  const FLOOR_R = 0.05; // piso da escala (5% da perda inicial = fundo)
  const rRow = (y) => {
    const clamped = Math.max(Math.min(y, 1), FLOOR_R);
    const t = Math.log(clamped) / Math.log(FLOOR_R); // 0 no topo, 1 no fundo
    return RP.y0 + Math.round(t * (RP.y1 - RP.y0));
  };

  const drawLine = (pL) => {
    let prevRow = null;
    for (let c = LP.x0; c <= LP.x1; c++) {
      const x = (c - LP.x0) / (LP.x1 - LP.x0);
      const row = lRow(w * x + b);
      if (row < LP.y0 || row > LP.y1) {
        prevRow = null;
        continue;
      }
      if (prevRow === null || row === prevRow) {
        pL(row, c, "─", C_LINE);
      } else if (row === prevRow - 1) {
        pL(row, c, "/", C_LINE);
      } else if (row === prevRow + 1) {
        pL(row, c, "\\", C_LINE);
      } else if (row < prevRow) {
        for (let r = prevRow - 1; r > row; r--)
          if (r >= LP.y0) pL(r, c, "│", C_LINE);
        pL(row, c, "/", C_LINE);
      } else {
        for (let r = prevRow + 1; r < row; r++)
          if (r <= LP.y1) pL(r, c, "│", C_LINE);
        pL(row, c, "\\", C_LINE);
      }
      prevRow = row;
    }
  };

  const drawResiduals = (pL) => {
    for (const [x, y] of DATA) {
      const col = lCol(x);
      const rowData = lRow(y);
      const rowFit = lRow(w * x + b);
      const rMin = Math.min(rowData, rowFit);
      const rMax = Math.max(rowData, rowFit);
      for (let r = rMin; r <= rMax; r++)
        if (r >= LP.y0 && r <= LP.y1 && r !== rowData)
          pL(r, col, "│", C_RESID);
    }
  };

  const gridToHtml = (g) =>
    g
      .map((row) => {
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
          if (color !== currentColor) {
            flush();
            currentColor = color;
          }
          buf +=
            ch === "&"
              ? "&amp;"
              : ch === "<"
                ? "&lt;"
                : ch === ">"
                  ? "&gt;"
                  : ch;
        }
        flush();
        return line;
      })
      .join("\n");

  const render = () => {
    const gL = mkGrid(LP_W);
    const gR = mkGrid(RP_W);
    const pL = (r, c, ch, color = null) => {
      if (r >= 0 && r < ROWS && c >= 0 && c < LP_W) gL[r][c] = { ch, color };
    };
    const pR = (r, c, ch, color = null) => {
      if (r >= 0 && r < ROWS && c >= 0 && c < RP_W) gR[r][c] = { ch, color };
    };

    for (let r = 0; r <= LP.axr; r++) pL(r, LP.axc, "│");
    for (let c = LP.axc; c <= LP.x1 + 1; c++) pL(LP.axr, c, "─");
    pL(LP.axr, LP.axc, "└");
    pL(0, LP.axc + 1, "y");
    pL(LP.axr + 1, LP.x1 - 1, "x");

    drawLine(pL);
    drawResiduals(pL);
    for (const [x, y] of DATA) pL(lRow(y), lCol(x), "*", C_POINT);

    for (let r = 0; r <= RP.axr; r++) pR(r, RP.axc, "│");
    for (let c = RP.axc; c <= RP.x1; c++) pR(RP.axr, c, "─");
    pR(RP.axr, RP.axc, "└");
    "Perda".split("").forEach((ch, i) => pR(0, RP.axc + 1 + i, ch));
    "iteração".split("").forEach((ch, i) => pR(RP.axr + 1, RP.x1 - 7 + i, ch));

    let prevRow = null;
    for (let c = RP.x0; c <= RP.x1; c++) {
      const t = (c - RP.x0) / (RP.x1 - RP.x0);
      const i = Math.round(t * MAX_ITER);
      if (i >= hist.length) {
        prevRow = null;
        continue;
      }
      const row = rRow(hist[i] / maxLoss);
      if (row < RP.y0 || row > RP.y1) {
        prevRow = null;
        continue;
      }
      // preenche o gap vertical com pontos para a curva ficar contínua
      if (prevRow !== null && row !== prevRow) {
        const rMin = Math.min(row, prevRow);
        const rMax = Math.max(row, prevRow);
        for (let r = rMin; r <= rMax; r++)
          if (r >= RP.y0 && r <= RP.y1) pR(r, c, ".", C_LOSS);
      }
      pR(row, c, ".", C_LOSS);
      prevRow = row;
    }
    if (hist.length > 0) {
      const i = hist.length - 1;
      const c = RP.x0 + Math.round((i / MAX_ITER) * (RP.x1 - RP.x0));
      const r = rRow(hist[i] / maxLoss);
      if (r >= RP.y0 && r <= RP.y1) pR(r, c, "@", C_LOSS);
    }

    lossSpan.textContent =
      hist.length > 0
        ? "perda: " + hist[hist.length - 1].toFixed(4)
        : "perda: —";

    preL.innerHTML = gridToHtml(gL);
    preR.innerHTML = gridToHtml(gR);
  };

  const reset = () => {
    DATA = genData();
    w = 0.0;
    b = 0.0;
    hist.length = 0;
    maxLoss = mse();
    hist.push(maxLoss); // inclui perda inicial para a curva partir do topo
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
      if (ts - lastStepTs >= stepMs(step) && step < MAX_ITER) {
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
