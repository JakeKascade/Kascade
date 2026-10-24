"use client";
import { useEffect, useRef } from "react";
import { cellSize, drawCells, noise, seeded } from "@/lib/pixels";

/**
 * A strip of the pixel grid between two sections, so a change of background
 * steps down in rounded cells instead of a hard line. Static and decorative.
 * `from` and `to` are CSS colour tokens (e.g. "--bg", "--light").
 */
export default function PixelBand({ from, to, seed }: { from: string; to: string; seed: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const css = getComputedStyle(document.documentElement);
    const top = css.getPropertyValue(from).trim();
    const bottom = css.getPropertyValue(to).trim();
    const draw = () => {
      const width = el.clientWidth;
      if (!width) return;
      const size = cellSize(width);
      const rows = width < 1100 ? 5 : 6;
      const cols = Math.ceil(width / size);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      el.width = Math.round(width * dpr);
      el.height = Math.round(rows * size * dpr);
      el.style.height = `${rows * size}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const random = seeded(seed);
      // Each column steps down at its own row, with a few loose cells either side.
      // A slow swell plus a quicker jitter, scaled to this width's own range so
      // the edge always uses every row, however few columns there are.
      const wave = Array.from(
        { length: cols },
        (_, x) => noise(x * 0.3 + seed, seed * 0.37) * 0.65 + noise(x * 0.9 + seed * 2, 3.1) * 0.35,
      );
      const low = Math.min(...wave),
        span = Math.max(...wave) - low || 1;
      const edge = wave.map((v) => 1 + Math.round(((v - low) / span) * (rows - 2)));
      const cells: boolean[] = [];
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          let lower = y >= edge[x];
          const nearEdge = Math.abs(y - edge[x]) <= 1;
          if (nearEdge && y > 0 && y < rows - 1 && random() < 0.12) lower = !lower;
          cells.push(lower);
        }
      drawCells(ctx, cols, rows, size, (x, y) => cells[y * cols + x], top, bottom);
    };
    draw();
    const resize = new ResizeObserver(draw);
    resize.observe(el);
    return () => resize.disconnect();
  }, [from, to, seed]);
  return (
    <div className="pixel-band" style={{ ["--from" as string]: `var(${from})`, ["--to" as string]: `var(${to})` }} aria-hidden="true">
      <canvas ref={canvas} />
    </div>
  );
}
