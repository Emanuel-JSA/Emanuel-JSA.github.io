import { Renderer } from "./renderer.js";
import { World } from "./world.js";

const canvas = document.getElementById("sky");
const renderer = new Renderer(canvas);
const world = new World(renderer.cols, renderer.rows);

let lastTimestamp;

// Clamp do dt: voltar de aba em background pode entregar dt gigante (segundos).
// 100ms ≈ 6 frames a 60fps; mais que isso e a fase pula visivelmente.
const DT_MAX = 100;

// Flag setada no resize, consumida no início do próximo frame — ANTES do draw.
// Setar canvas.width limpa o backing store; se o resize rodasse num rAF
// separado depois do draw, a tela ficaria preta até o próximo frame (visível
// durante drag de janela no macOS).
let needsResize = false;
window.addEventListener("resize", () => {
  needsResize = true;
});

function loop(timestamp) {
  const rawDt = lastTimestamp === undefined ? 0 : timestamp - lastTimestamp;
  const dt = Math.min(rawDt, DT_MAX);
  lastTimestamp = timestamp;

  if (needsResize) {
    needsResize = false;
    renderer.resize();
    world.setSize(renderer.cols, renderer.rows);
  }

  world.update(dt);
  renderer.draw(world);

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
