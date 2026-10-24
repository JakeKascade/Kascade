/**
 * Shared drawing for the pixel grid: the opening screen and the transition
 * strips between sections use the same cell size, rounding and fillets.
 */

export function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Deterministic hash in [0, 1) for a cell. */
export const hash = (x: number, y: number) => {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
};
/** Smooth value noise in [0, 1]. */
export function noise(x: number, y: number) {
  const xi = Math.floor(x),
    yi = Math.floor(y);
  const xf = x - xi,
    yf = y - yi;
  const s = (t: number) => t * t * (3 - 2 * t);
  const a = hash(xi, yi),
    b = hash(xi + 1, yi),
    c = hash(xi, yi + 1),
    d = hash(xi + 1, yi + 1);
  return a + (b - a) * s(xf) + (c - a) * s(yf) + (a - b - c + d) * s(xf) * s(yf);
}

/** Cell size for a given width; CSS mirrors these breakpoints for the strips. */
export const cellSize = (width: number) => (width < 600 ? 22 : width < 1100 ? 26 : 30);

/**
 * Fills the area with `light`, then draws the dark cells with rounded outer
 * corners and filleted inner corners, so masses read as smooth stepped shapes.
 * `darkAt` is only asked about cells inside the grid; above it counts as light,
 * below it as dark, and columns beyond the edges repeat the edge column.
 */
export function drawCells(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  size: number,
  darkAt: (x: number, y: number) => boolean,
  light: string,
  dark: string,
) {
  const r = size * 0.3;
  const at = (x: number, y: number) => {
    if (y < 0) return false;
    if (y >= rows) return true;
    return darkAt(Math.min(cols - 1, Math.max(0, x)), y);
  };
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, cols * size, rows * size);
  ctx.fillStyle = dark;
  ctx.beginPath();
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      if (!at(x, y)) continue;
      const up = at(x, y - 1),
        down = at(x, y + 1),
        left = at(x - 1, y),
        right = at(x + 1, y);
      ctx.roundRect(x * size, y * size, size + 0.5, size + 0.5, [
        !up && !left ? r : 0,
        !up && !right ? r : 0,
        !down && !right ? r : 0,
        !down && !left ? r : 0,
      ]);
    }
  ctx.fill();
  const corners: [number, number][] = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      if (at(x, y)) continue;
      for (const [dx, dy] of corners) {
        if (!at(x + dx, y) || !at(x, y + dy) || !at(x + dx, y + dy)) continue;
        const cx = x * size + (dx > 0 ? size : 0),
          cy = y * size + (dy > 0 ? size : 0);
        const sx = dx > 0 ? -1 : 1,
          sy = dy > 0 ? -1 : 1;
        ctx.fillStyle = dark;
        ctx.fillRect(Math.min(cx, cx + sx * r), Math.min(cy, cy + sy * r), r, r);
        ctx.fillStyle = light;
        ctx.beginPath();
        ctx.arc(cx + sx * r, cy + sy * r, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
}
