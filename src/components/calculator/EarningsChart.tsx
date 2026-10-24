"use client";
import { useRef, useState, type KeyboardEvent } from "react";
import { compactMoney, money, plural } from "@/lib/format";
import type { SimulationOutput } from "@/lib/referral-model";
import { useSize, useTween } from "../Primitives";

export function niceScale(hi: number, count: number) {
  const top = Math.max(hi, 1);
  const raw = top / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / mag;
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * mag;
  return { max: Math.ceil(top / step) * step, step };
}

/** Cumulative commission by month, stacked one-off (below) and recurring (above). */
export default function EarningsChart({ output }: { output: SimulationOutput }) {
  const frame = useRef<HTMLDivElement>(null);
  const { width, height } = useSize(frame, { width: 720, height: 300 });
  const { months } = output;
  const H = months.length;
  const [inspect, setInspect] = useState<number | null>(null);
  const scale = niceScale(months[H - 1].cumulativeCommission, height < 220 ? 3 : 4);
  const tweened = useTween([
    scale.max,
    ...months.flatMap((m) => [m.cumulativeOneOff, m.cumulativeRecurring]),
  ]);
  const max = tweened[0] || 1;
  const pad = { l: 52, r: 8, t: 10, b: 30 };
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;
  const slot = plotW / H;
  const barW = Math.max(6, Math.min(36, slot * 0.62));
  const X = (i: number) => pad.l + slot * i + (slot - barW) / 2;
  const Y = (v: number) => pad.t + plotH - (Math.max(0, v) / max) * plotH;
  const ticks: number[] = [];
  for (let v = 0; v <= scale.max + 1; v += scale.step) ticks.push(v);
  const labelEvery = H > 12 ? (width < 560 ? 4 : 2) : width < 420 ? 2 : 1;
  const selected = inspect === null ? H - 1 : inspect;
  const row = months[selected];
  const toMonth = (clientX: number, rect: DOMRect) =>
    Math.max(0, Math.min(H - 1, Math.floor((clientX - rect.left - pad.l) / slot)));
  const onKey = (e: KeyboardEvent) => {
    const moves: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 };
    if (e.key in moves) setInspect(Math.max(0, Math.min(H - 1, selected + moves[e.key])));
    else if (e.key === "Home") setInspect(0);
    else if (e.key === "End") setInspect(H - 1);
    else return;
    e.preventDefault();
  };
  // A path for a bar with rounded top corners only, anchored to the baseline.
  const bar = (x: number, y0: number, y1: number, rounded: boolean) => {
    const h = y0 - y1;
    if (h <= 0.25) return "";
    const r = rounded ? Math.min(3, barW / 2, h) : 0;
    return `M${x},${y0} V${y1 + r} Q${x},${y1} ${x + r},${y1} H${x + barW - r} Q${x + barW},${y1} ${x + barW},${y1 + r} V${y0} Z`;
  };
  return (
    <figure className="earnings-chart" aria-labelledby="chart-title">
      <div className="chart-head">
        <p className="chart-title" id="chart-title">
          Cumulative commission, month by month
        </p>
        <ul className="chart-legend">
          <li>
            <i className="key key-oneoff" aria-hidden="true" />
            One-off
          </li>
          <li>
            <i className="key key-recurring" aria-hidden="true" />
            Recurring
          </li>
        </ul>
      </div>
      <p className="chart-readout" aria-live="polite">
        <span className="readout-month">Month {row.month}</span>
        <span>
          <strong>{money(row.totalCommission)}</strong> earned this month
        </span>
        <span>
          <strong>{money(row.cumulativeCommission)}</strong> to date
        </span>
        <span className="readout-extra">
          {plural(row.activePaidRetainers, "paying retainer client")}
        </span>
      </p>
      <div
        ref={frame}
        className="chart-frame"
        role="slider"
        tabIndex={0}
        aria-label="Inspect a month of cumulative commission"
        aria-valuemin={1}
        aria-valuemax={H}
        aria-valuenow={row.month}
        aria-valuetext={`Month ${row.month}: ${money(row.totalCommission)} earned, ${money(row.cumulativeCommission)} cumulative`}
        onKeyDown={onKey}
        onPointerMove={(e) => setInspect(toMonth(e.clientX, e.currentTarget.getBoundingClientRect()))}
        onPointerDown={(e) => setInspect(toMonth(e.clientX, e.currentTarget.getBoundingClientRect()))}
        onPointerLeave={() => setInspect(null)}
        onBlur={() => setInspect(null)}
      >
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          {ticks.map((v) => (
            <g key={v}>
              <line x1={pad.l} x2={width - pad.r} y1={Y(v)} y2={Y(v)} className="grid" />
              <text x={pad.l - 10} y={Y(v) + 4} textAnchor="end">
                {compactMoney(v)}
              </text>
            </g>
          ))}
          {months.map((m, i) => {
            const oneOff = tweened[1 + i * 2];
            const recurring = tweened[2 + i * 2];
            const x = X(i);
            const base = Y(0);
            const yOne = Y(oneOff);
            const yTop = Y(oneOff + recurring);
            const gap = oneOff > 0 && recurring > 0 ? 2 : 0;
            return (
              <g key={m.month} className="col" data-active={i === selected}>
                <rect className="col-hit" x={pad.l + slot * i} y={pad.t} width={slot} height={plotH} />
                <path className="seg-oneoff" d={bar(x, base, yOne, recurring <= 0)} />
                <path className="seg-recurring" d={bar(x, yOne - gap, Math.min(yTop, yOne - gap), true)} />
                {(i % labelEvery === labelEvery - 1 || i === 0 || labelEvery === 1) && (
                  <text x={x + barW / 2} y={height - 10} textAnchor="middle" className={i === selected ? "is-selected" : ""}>
                    {i === 0 && width >= 420 ? "M1" : m.month}
                  </text>
                )}
              </g>
            );
          })}
          <line x1={pad.l} x2={width - pad.r} y1={Y(0)} y2={Y(0)} className="baseline" />
        </svg>
      </div>
      <figcaption className="fine">
        Commission earned on eligible client payments, by model month, not
        calendar month. Exact figures are in the month-by-month table.
      </figcaption>
    </figure>
  );
}
