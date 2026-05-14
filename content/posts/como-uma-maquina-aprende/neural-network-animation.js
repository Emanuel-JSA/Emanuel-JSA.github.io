export function mount(root) {
  const target = root.querySelector("#neural-network");
  if (!target) return;

  const layers = [
    [[0,1],[2,1],[4,1],[6,1],[7,1],[9,1],[11,1],[13,1]],
    [[1,4],[5,4],[8,4],[12,4]],
    [[3,8],[10,8]],
    [[1,12],[5,12],[8,12],[12,12]],
    [[3,16],[10,16]],
    [[1,20],[5,20],[8,20],[12,20]],
    [[0,23],[2,23],[4,23],[6,23],[7,23],[9,23],[11,23],[13,23]],
  ];

  let matrix = [];
  let timer = null;

  const render = () => {
    target.textContent = matrix.map(r => r.join("")).join("\n");
  };

  const setLayer = (i, char) => {
    for (const [r, c] of layers[i]) {
      if (matrix[r]) matrix[r][c] = char;
    }
  };

  function step(i) {
    if (i > 0) setLayer(i - 1, "○");
    if (i >= layers.length) {
      render();
      timer = setTimeout(() => step(0), 800);
      return;
    }
    setLayer(i, "●");
    render();
    timer = setTimeout(() => step(i + 1), 250);
  }

  fetch("/assets/ascii-nn.txt")
    .then((res) => res.text())
    .then((text) => {
      matrix = text.split("\n").map((l) => l.split(""));
      step(0);
    });

  return () => clearTimeout(timer);
}
