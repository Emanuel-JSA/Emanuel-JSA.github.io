export function mount(root) {
  const target = root.querySelector("#neural-network");
  if (!target) return;

  const INPUT_WORDS = [
    { row: 2, text: "doença" },
    { row: 4, text: "príncipe" },
    { row: 6, text: "cobra" },
    { row: 8, text: "tal sujeito tem tal caracteristica" },
    { row: 10, text: "Bixonimania" },
  ];

  const OUTPUT_WORDS = [
    { row: 2, text: "o" },
    { row: 4, text: "príncipe" },
    { row: 6, text: "cobra" },
    { row: 8, text: "tem" },
    { row: 10, text: "bixonimania" },
  ];

  const LAYERS = [
    [
      [0, 1],
      [2, 1],
      [4, 1],
      [6, 1],
      [7, 1],
      [9, 1],
      [11, 1],
      [13, 1],
    ],
    [
      [1, 4],
      [5, 4],
      [8, 4],
      [12, 4],
    ],
    [
      [3, 8],
      [10, 8],
    ],
    [
      [1, 12],
      [5, 12],
      [8, 12],
      [12, 12],
    ],
    [
      [3, 16],
      [10, 16],
    ],
    [
      [1, 20],
      [5, 20],
      [8, 20],
      [12, 20],
    ],
    [
      [0, 23],
      [2, 23],
      [4, 23],
      [6, 23],
      [7, 23],
      [9, 23],
      [11, 23],
      [13, 23],
    ],
  ];

  // col layout: [0-35 input][36-59 network][60 sep][61-95 output]
  const LW = 37;
  const NW = 24;
  const ROWS = 14;
  const COLS = 96;

  let netBase = [];
  let matrix = [];
  let timer = null;

  const OUT_START = LW + NW + 1;
  const esc = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const render = () => {
    target.innerHTML = matrix
      .map((r) => {
        const left = esc(r.slice(0, OUT_START).join(""));
        const right = esc(r.slice(OUT_START).join(""));
        return `${left}<b>${right}</b>`;
      })
      .join("\n");
  };

  const reset = () => {
    matrix = Array.from({ length: ROWS }, (_, r) => {
      const row = Array(COLS).fill(" ");
      if (netBase[r]) {
        for (let c = 0; c < NW; c++) row[LW + c] = netBase[r][c] ?? " ";
      }
      return row;
    });
  };

  const setNode = (r, c, ch) => {
    if (matrix[r]) matrix[r][LW + c] = ch;
  };
  const setLayer = (i, ch) => LAYERS[i].forEach(([r, c]) => setNode(r, c, ch));
  const resetNodes = () => LAYERS.forEach((_, i) => setLayer(i, "○"));

  const go = (ms, fn) => {
    timer = setTimeout(fn, ms);
  };

  function typeWords(ci, done) {
    const maxLen = Math.max(...INPUT_WORDS.map((w) => w.text.length));
    if (ci >= maxLen) return done();
    for (const { row, text } of INPUT_WORDS) {
      if (ci < text.length && matrix[row]) {
        matrix[row][36 - text.length + ci] = text[ci];
      }
    }
    render();
    go(55, () => typeWords(ci + 1, done));
  }

  function propagate(i, done) {
    if (i > 0) setLayer(i - 1, "○");
    if (i >= LAYERS.length) {
      render();
      return go(200, done);
    }
    setLayer(i, "●");
    render();
    go(200, () => propagate(i + 1, done));
  }

  function blink(n, done) {
    if (n <= 0) {
      resetNodes();
      render();
      return go(100, done);
    }
    LAYERS.forEach((_, i) => setLayer(i, "●"));
    render();
    go(140, () => {
      resetNodes();
      render();
      go(140, () => blink(n - 1, done));
    });
  }

  function typeOutput(ci, done) {
    const maxLen = Math.max(...OUTPUT_WORDS.map((w) => w.text.length));
    if (ci >= maxLen) return done();
    for (const { row, text } of OUTPUT_WORDS) {
      if (ci < text.length && matrix[row]) {
        matrix[row][LW + NW + 1 + ci] = text[ci];
      }
    }
    render();
    go(60, () => typeOutput(ci + 1, done));
  }

  function cycle() {
    reset();
    render();
    go(400, () =>
      typeWords(0, () =>
        go(600, () =>
          propagate(0, () =>
            blink(3, () => typeOutput(0, () => go(3000, cycle))),
          ),
        ),
      ),
    );
  }

  fetch("/assets/ascii-nn.txt")
    .then((res) => res.text())
    .then((text) => {
      netBase = text.split("\n").map((l) => l.split(""));
      cycle();
    });

  return () => clearTimeout(timer);
}
