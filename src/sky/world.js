const DENSITY = 0.012;

const PHASE_SPEED_MIN = 0.0001; // ciclo ~10min (estrelas quase paradas)
const PHASE_SPEED_MAX = 0.0001;  // ciclo ~63s   (as "rápidas" ainda lentas)
const PHASE_SPEED_BIAS = 2;      // expoente: maior = mais estrelas lentas

const SPRITES = {
  tiny:   { radius: 0, low: [' '], high: ['.'] },
  dot:    { radius: 0, low: ['.'], high: [','] },
  medium: { radius: 0, low: ['.'], high: ['+'] },
  plus:   { radius: 0, low: ['+'], high: ['*'] },
  bright: { radius: 0, low: ['*'], high: ['o'] },
  glint:  { radius: 0, low: ["'"], high: ['*'] },

  cross: {
    radius: 1,
    low:  ['   ', ' + ', '   '],
    high: [' | ', '-+-', ' | '],
  },
  planet: {
    radius: 1,
    low:  ['   ', ' o ', '   '],
    high: [' | ', '-o-', ' | '],
  },
  asterisk: {
    radius: 1,
    low:  ['   ', ' * ', '   '],
    high: [' | ', '-*-', ' | '],
  },
  // '\\' em JS string é um único '\'.
  diag: {
    radius: 1,
    low:  ['   ', ' * ', '   '],
    high: ['\\ /', ' * ', '/ \\'],
  },
  star8: {
    radius: 1,
    low:  ['   ', ' * ', '   '],
    high: ['\\|/', '-*-', '/|\\'],
  },
};

const TYPE_WEIGHTS = {
  tiny:     0.30,
  dot:      0.20,
  medium:   0.20,
  plus:     0.10,
  bright:   0.05,
  glint:    0.05,
  cross:    0.04,
  planet:   0.02,
  asterisk: 0.02,
  diag:     0.015,
  star8:    0.005,
};

validateSprites(SPRITES);

const SHOOTING_HEAD_CHAR = '*';
const SHOOTING_TRAIL_CHARS = ['+', '.'];
const SHOOTING_MAX_TRAIL = SHOOTING_TRAIL_CHARS.length;

const SHOOTING_SPEED_MIN = 0.05;
const SHOOTING_SPEED_MAX = 0.08;

const SHOOTING_ANGLE_MIN = Math.PI / 6;
const SHOOTING_ANGLE_MAX = Math.PI / 3;

const SHOOTING_SPAWN_MIN = 5000;
const SHOOTING_SPAWN_MAX = 15000;

const SHOOTING_SPAWN_Y_TOP_RATIO = 0.4;

const SHOOTING_SPAWN_X_MARGIN = 3;
const SHOOTING_OFFSCREEN_MARGIN = 5;

const SHOOTING_MAX_LIFETIME = 5000;

export class World {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;

    this.stars = generateStarsInRect(starCount(cols, rows), 0, 0, cols, rows);

    this.populatedCols = cols;
    this.populatedRows = rows;

    this.shootingStars = [];
    this.timeUntilNextShootingStar = randSpawnDelay();
  }

  setSize(cols, rows) {
    const targetCols = Math.max(this.populatedCols, cols);
    const targetRows = Math.max(this.populatedRows, rows);

    if (targetCols > this.populatedCols) {
      this.stars.push(
        ...generateStarsInRect(
          starCount(targetCols - this.populatedCols, targetRows),
          this.populatedCols,
          0,
          targetCols,
          targetRows
        )
      );
    }
    if (targetRows > this.populatedRows) {
      this.stars.push(
        ...generateStarsInRect(
          starCount(this.populatedCols, targetRows - this.populatedRows),
          0,
          this.populatedRows,
          this.populatedCols,
          targetRows
        )
      );
    }

    this.populatedCols = targetCols;
    this.populatedRows = targetRows;
    this.cols = cols;
    this.rows = rows;
  }

  update(dt) {
    for (const obj of this.stars) {
      obj.phase += obj.phaseSpeed * dt;
      // Sem módulo de 2π: Math.sin engole números grandes sem perda relevante
      // de precisão na escala de horas. Simples vence.
    }

    for (const s of this.shootingStars) {
      updateShootingStar(s, dt, this.cols, this.rows);
    }
    this.shootingStars = this.shootingStars.filter((s) => s.alive);

    this.timeUntilNextShootingStar -= dt;
    if (this.timeUntilNextShootingStar <= 0) {
      this.shootingStars.push(spawnShootingStar(this.cols, this.rows));
      this.timeUntilNextShootingStar = randSpawnDelay();
    }
  }

  paint(buffer) {
    for (const obj of this.stars) {
      const sprite = spriteFor(obj);
      paintSprite(buffer, sprite, obj.x, obj.y);
    }
    for (const s of this.shootingStars) {
      paintShootingStar(buffer, s);
    }
  }
}

function spriteFor(star) {
  const def = SPRITES[star.type];
  const level = Math.sin(star.phase) > 0 ? 'high' : 'low';
  return def[level];
}

function paintSprite(buffer, spriteLines, cx, cy) {
  const size = spriteLines.length;
  const radius = (size - 1) / 2;
  const rows = buffer.length;
  const cols = rows > 0 ? buffer[0].length : 0;
  for (let dy = -radius; dy <= radius; dy++) {
    const line = spriteLines[dy + radius];
    for (let dx = -radius; dx <= radius; dx++) {
      const ch = line[dx + radius];
      if (ch === ' ') continue;
      const bx = cx + dx;
      const by = cy + dy;
      if (bx < 0 || bx >= cols || by < 0 || by >= rows) continue;
      buffer[by][bx] = ch;
    }
  }
}

function weightedPick(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [key, w] of entries) {
    if (r < w) return key;
    r -= w;
  }
  return entries[entries.length - 1][0];
}

function starCount(cols, rows) {
  return Math.floor(cols * rows * DENSITY);
}

function generateStarsInRect(count, x0, y0, x1, y1) {
  const w = x1 - x0;
  const h = y1 - y0;
  const stars = [];
  for (let i = 0; i < count; i++) {
    const type = weightedPick(TYPE_WEIGHTS);
    const radius = SPRITES[type].radius;
    if (w < 2 * radius + 1 || h < 2 * radius + 1) continue;
    const x = randIntInRange(x0 + radius, x1 - 1 - radius);
    const y = randIntInRange(y0 + radius, y1 - 1 - radius);
    stars.push({
      type,
      x,
      y,
      // phase e phaseSpeed independentes de x/y/type — senão aparecem
      // padrões espaciais ou ondas atravessando a tela.
      phase: Math.random() * Math.PI * 2,
      phaseSpeed:
        PHASE_SPEED_MIN +
        Math.random() ** PHASE_SPEED_BIAS *
          (PHASE_SPEED_MAX - PHASE_SPEED_MIN),
    });
  }
  return stars;
}

function randIntInRange(lo, hi) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function randSpawnDelay() {
  return (
    SHOOTING_SPAWN_MIN +
    Math.random() * (SHOOTING_SPAWN_MAX - SHOOTING_SPAWN_MIN)
  );
}

function spawnShootingStar(cols, rows) {
  const goingRight = Math.random() < 0.5;
  const angle =
    SHOOTING_ANGLE_MIN +
    Math.random() * (SHOOTING_ANGLE_MAX - SHOOTING_ANGLE_MIN);
  const speed =
    SHOOTING_SPEED_MIN +
    Math.random() * (SHOOTING_SPEED_MAX - SHOOTING_SPEED_MIN);
  const vx = (goingRight ? 1 : -1) * speed * Math.cos(angle);
  const vy = speed * Math.sin(angle);
  const x = goingRight
    ? -SHOOTING_SPAWN_X_MARGIN
    : cols - 1 + SHOOTING_SPAWN_X_MARGIN;
  const y = Math.random() * rows * SHOOTING_SPAWN_Y_TOP_RATIO;
  return {
    type: 'shooting',
    x,
    y,
    vx,
    vy,
    trail: [],
    age: 0,
    alive: true,
  };
}

function updateShootingStar(s, dt, cols, rows) {
  const oldX = Math.round(s.x);
  const oldY = Math.round(s.y);
  s.x += s.vx * dt;
  s.y += s.vy * dt;
  s.age += dt;
  const newX = Math.round(s.x);
  const newY = Math.round(s.y);
  // Empurra no trail só se a célula mudou — evita rastro com células
  // duplicadas quando velocidade é baixa frente ao dt.
  if (newX !== oldX || newY !== oldY) {
    s.trail.unshift({ x: oldX, y: oldY });
    if (s.trail.length > SHOOTING_MAX_TRAIL) s.trail.pop();
  }
  const M = SHOOTING_OFFSCREEN_MARGIN;
  const offscreen =
    newX < -M || newX >= cols + M || newY < -M || newY >= rows + M;
  if (offscreen || s.age > SHOOTING_MAX_LIFETIME) {
    s.alive = false;
  }
}

function paintShootingStar(buffer, s) {
  const rows = buffer.length;
  const cols = rows > 0 ? buffer[0].length : 0;
  for (let i = 0; i < s.trail.length; i++) {
    const ch = SHOOTING_TRAIL_CHARS[i];
    if (!ch || ch === ' ') continue;
    const { x, y } = s.trail[i];
    if (x < 0 || x >= cols || y < 0 || y >= rows) continue;
    buffer[y][x] = ch;
  }
  const hx = Math.round(s.x);
  const hy = Math.round(s.y);
  if (hx >= 0 && hx < cols && hy >= 0 && hy < rows) {
    buffer[hy][hx] = SHOOTING_HEAD_CHAR;
  }
}

function validateSprites(sprites) {
  for (const [type, def] of Object.entries(sprites)) {
    const expected = 2 * def.radius + 1;
    for (const state of ['low', 'high']) {
      const lines = def[state];
      if (!Array.isArray(lines) || lines.length !== expected) {
        throw new Error(
          `sprite ${type}.${state}: ${lines?.length} linhas, esperado ${expected}`
        );
      }
      for (const line of lines) {
        if (typeof line !== 'string' || line.length !== expected) {
          throw new Error(
            `sprite ${type}.${state}: linha "${line}" tem ${line?.length} chars, esperado ${expected}`
          );
        }
      }
    }
  }
}
