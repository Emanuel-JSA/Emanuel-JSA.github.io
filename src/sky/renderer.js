const FONT_SIZE = 14;
const FONT = `${FONT_SIZE}px monospace`;
const BG = "#1A1A1A";
const FG = "#838383";

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.resize();
  }

  // Ordem importa: mexer em canvas.width reseta o ctx, então re-setamos
  // font/baseline/fillStyle DEPOIS do scale.
  resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + "px";
    this.canvas.style.height = h + "px";

    this.ctx.scale(dpr, dpr);

    this.ctx.font = FONT;
    this.ctx.textBaseline = "top";
    this.ctx.fillStyle = FG;

    this.cellW = this.ctx.measureText("M").width;
    this.cellH = FONT_SIZE;

    this.w = w;
    this.h = h;
    this.cols = Math.floor(w / this.cellW);
    this.rows = Math.floor(h / this.cellH);
  }

  draw(world) {
    this.ctx.fillStyle = BG;
    this.ctx.fillRect(0, 0, this.w, this.h);

    const buffer = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(" "),
    );

    world.paint(buffer);

    this.ctx.fillStyle = FG;
    for (let y = 0; y < this.rows; y++) {
      const row = buffer[y];
      for (let x = 0; x < this.cols; x++) {
        const ch = row[x];
        if (ch !== " ") {
          this.ctx.fillText(ch, x * this.cellW, y * this.cellH);
        }
      }
    }
  }
}
