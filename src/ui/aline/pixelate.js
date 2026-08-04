// Animação retro: revela uma imagem de blocos grandes para 1:1.
// Renderiza a imagem em um canvas pequeno, depois escala para o tamanho
// natural com imageSmoothingEnabled = false. Itera por divisores
// crescentes até chegar em 1 (resolução cheia).

const STEPS = [40, 28, 20, 14, 10, 7, 5, 3, 2, 1];
const STEP_MS = 35;

export function createPixelatingImage(src) {
  const canvas = document.createElement("canvas");
  canvas.className = "modal-pix";

  let cancelled = false;
  let timer = 0;

  const img = new Image();
  img.onload = () => {
    if (cancelled) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    let stepIdx = 0;
    const renderStep = () => {
      if (cancelled) return;
      const divisor = STEPS[stepIdx++];
      if (divisor === undefined) return;
      const sw = Math.max(1, Math.round(w / divisor));
      const sh = Math.max(1, Math.round(h / divisor));
      const off = document.createElement("canvas");
      off.width = sw;
      off.height = sh;
      const octx = off.getContext("2d");
      octx.imageSmoothingEnabled = true;
      octx.drawImage(img, 0, 0, sw, sh);
      ctx.drawImage(off, 0, 0, sw, sh, 0, 0, w, h);
      if (stepIdx < STEPS.length) {
        timer = setTimeout(renderStep, STEP_MS);
      }
    };
    renderStep();
  };
  img.src = src;

  return {
    el: canvas,
    cancel() {
      cancelled = true;
      clearTimeout(timer);
    },
  };
}
