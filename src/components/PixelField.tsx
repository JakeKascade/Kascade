"use client";
import { useEffect, useRef, type RefObject } from "react";

/**
 * The opening screen's background: a field of square cells in two colours.
 * Light at the top, breaking down into the black page below. Shapes have
 * softly rounded outer corners and filleted inner corners, so the masses read
 * as smooth stepped forms. The dark rises into place on load, a few edge cells
 * quietly flip, and the cell under the pointer softly highlights. Text sits
 * in a zone that is always kept light.
 */

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Deterministic hash in [0, 1) for a cell. */
const hash = (x: number, y: number) => {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
};
/** Smooth value noise in [0, 1]. */
function noise(x: number, y: number) {
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

export default function PixelField({ keepClear }: { keepClear: RefObject<HTMLElement | null> }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const host = el?.parentElement;
    const ctx = el?.getContext("2d");
    if (!el || !host || !ctx) return;
    const css = getComputedStyle(document.documentElement);
    const light = css.getPropertyValue("--light").trim() || "#e6e9ed";
    const dark = css.getPropertyValue("--bg").trim() || "#111317";
    // The pointer's cell: a step darker on light, a step lighter on dark.
    const hoverOnLight = "#cdd4dc";
    const hoverOnDark = "#242a33";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0,
      height = 0,
      size = 40,
      cols = 0,
      rows = 0,
      frame = 0,
      running = false,
      inView = false,
      start = 0,
      lastFlip = 0;
    let target: boolean[] = []; // final dark/light per cell
    let reveal: number[] = []; // seconds until a dark cell appears
    let clear: boolean[] = []; // cells kept light for the text
    let flips = new Map<number, number>(); // cell → time it flips back
    const hover = new Map<number, number>(); // cell → time last pointed at
    let pointer = -1;
    const random = seeded(2604);

    const idx = (x: number, y: number) => y * cols + x;

    const layout = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = host.clientWidth;
      height = host.clientHeight;
      if (!width || !height) return;
      el.width = Math.round(width * dpr);
      el.height = Math.round(height * dpr);
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      size = width < 600 ? 22 : width < 1100 ? 26 : 30;
      cols = Math.ceil(width / size);
      rows = Math.ceil(height / size);

      // Keep the text's cells (plus a cell of margin) light.
      const hostBox = host.getBoundingClientRect();
      const box = keepClear.current?.getBoundingClientRect();
      const cx0 = box ? Math.floor((box.left - hostBox.left) / size) - 1 : 0;
      const cx1 = box ? Math.ceil((box.right - hostBox.left) / size) : 0;
      const cy0 = box ? Math.floor((box.top - hostBox.top) / size) - 1 : 0;
      const cy1 = box ? Math.ceil((box.bottom - hostBox.top) / size) : 0;

      target = [];
      clear = [];
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          const xn = x / Math.max(1, cols - 1),
            yn = y / Math.max(1, rows - 1);
          // The text, and the wordmark's corner, always sit on light cells.
          const inText =
            (x >= cx0 && x <= cx1 && y >= cy0 && y <= cy1) || (y * size < 72 && x * size < 260);
          // Distance in cells from the text, so the dark bends softly around it.
          const dx = Math.max(cx0 - x, 0, x - cx1),
            dy = Math.max(cy0 - y, 0, y - cy1);
          const near = box ? Math.max(0, 1 - Math.hypot(dx, dy) / 7) : 0;
          // The dark rises from the bottom, higher on the right, with a ragged edge.
          const edge = 0.64 - (xn - 0.3) * 0.42 + near * 0.45;
          const level =
            yn + (noise(x * 0.11, y * 0.11) - 0.5) * 0.75 + (noise(x * 0.36 + 9, y * 0.36) - 0.5) * 0.2;
          let isDark = level > edge;
          if (y >= rows - 2) isDark = true;
          if (inText) isDark = false;
          clear.push(inText);
          target.push(isDark);
        }
      // Scatter single cells along the edge, like the reference: islands both ways.
      for (let y = 1; y < rows - 2; y++)
        for (let x = 1; x < cols - 1; x++) {
          const i = idx(x, y);
          if (clear[i]) continue;
          const near =
            target[idx(x - 1, y)] !== target[i] ||
            target[idx(x + 1, y)] !== target[i] ||
            target[idx(x, y - 1)] !== target[i] ||
            target[idx(x, y + 1)] !== target[i];
          if (!near) continue;
          else if (near && random() < 0.14) target[i] = !target[i];
        }
      reveal = target.map((_, i) => {
        const y = Math.floor(i / cols);
        return reduce ? 0 : 0.15 + (1 - y / rows) * 0.9 + random() * 0.18;
      });
      flips = new Map();
    };

    const isDark = (i: number, t: number) => {
      const on = target[i] && t >= reveal[i];
      return flips.has(i) ? !on : on;
    };

    const draw = (t: number) => {
      if (!width || !height) return;
      const r = size * 0.3;
      const darkAt = (x: number, y: number) =>
        x >= 0 && y >= 0 && x < cols && y < rows ? isDark(idx(x, y), t) : y >= rows;
      ctx.fillStyle = light;
      ctx.fillRect(0, 0, width, height);
      // Dark cells, rounding only the corners where both neighbours are light.
      ctx.fillStyle = dark;
      ctx.beginPath();
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          if (!darkAt(x, y)) continue;
          const up = darkAt(x, y - 1),
            down = darkAt(x, y + 1),
            left = darkAt(x - 1, y),
            right = darkAt(x + 1, y);
          ctx.roundRect(x * size, y * size, size + 0.5, size + 0.5, [
            !up && !left ? r : 0,
            !up && !right ? r : 0,
            !down && !right ? r : 0,
            !down && !left ? r : 0,
          ]);
        }
      ctx.fill();
      // Inner corners: fillet a light cell's corner where three dark cells meet it.
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          if (darkAt(x, y)) continue;
          const corners: [number, number][] = [
            [-1, -1],
            [1, -1],
            [1, 1],
            [-1, 1],
          ];
          for (const [dx, dy] of corners) {
            if (!darkAt(x + dx, y) || !darkAt(x, y + dy) || !darkAt(x + dx, y + dy)) continue;
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
      // The pointer's cell, fading as it moves on.
      for (const [i, at] of hover) {
        const a = i === pointer ? 1 : 1 - (t - at) / 0.7;
        if (a <= 0) {
          hover.delete(i);
          continue;
        }
        ctx.globalAlpha = a;
        ctx.fillStyle = isDark(i, t) ? hoverOnDark : hoverOnLight;
        ctx.beginPath();
        ctx.roundRect((i % cols) * size + 2, Math.floor(i / cols) * size + 2, size - 4, size - 4, r * 0.8);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const tick = (now: number) => {
      const t = (now - start) / 1000;
      // Now and then, an edge cell flips for a few seconds.
      if (!reduce && t > 2 && t - lastFlip > 1.1) {
        lastFlip = t;
        for (let tries = 0; tries < 30; tries++) {
          const x = 1 + Math.floor(Math.random() * (cols - 2)),
            y = 1 + Math.floor(Math.random() * (rows - 3));
          const i = idx(x, y);
          if (clear[i] || flips.has(i)) continue;
          if (target[idx(x - 1, y)] === target[idx(x + 1, y)] && target[idx(x, y - 1)] === target[idx(x, y + 1)] && target[i] === target[idx(x, y + 1)]) continue;
          flips.set(i, t + 3 + Math.random() * 4);
          break;
        }
      }
      for (const [i, until] of flips) if (t > until) flips.delete(i);
      if (pointer >= 0) hover.set(pointer, t);
      draw(t);
      if (running) frame = requestAnimationFrame(tick);
    };
    const play = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(tick);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const box = host.getBoundingClientRect();
      const x = Math.floor((e.clientX - box.left) / size),
        y = Math.floor((e.clientY - box.top) / size);
      pointer = x >= 0 && y >= 0 && x < cols && y < rows ? idx(x, y) : -1;
      if (pointer >= 0 && clear[pointer]) pointer = -1;
    };
    const onLeave = () => (pointer = -1);

    start = performance.now();
    layout();
    draw(reduce ? 99 : 0);
    const resize = new ResizeObserver(() => {
      layout();
      draw((performance.now() - start) / 1000);
    });
    resize.observe(host);
    const visible = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) play();
      else pause();
    });
    visible.observe(host);
    const onVisibility = () => (document.hidden || !inView ? pause() : play());
    document.addEventListener("visibilitychange", onVisibility);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      pause();
      resize.disconnect();
      visible.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [keepClear]);

  return <canvas ref={canvas} className="pixel-field" aria-hidden="true" />;
}
