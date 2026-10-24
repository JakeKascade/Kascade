"use client";
import { useRef, useState, type KeyboardEvent } from "react";
import { MONTH_LENGTHS, money, type Simulation } from "@/lib/model";
import { Money, useSize, useTween } from "./Primitives";

const SAMPLES = 120;
/** Line treatments for the selected scenario and its two comparisons. */
const LINE_STYLES = [
  { stroke: "#F0F0F0", width: 2.25, dash: "" },
  { stroke: "#8C8C8C", width: 1.25, dash: "" },
  { stroke: "#8C8C8C", width: 1.25, dash: "5 5" },
];
export function niceScale(lo: number, hi: number, count: number) {
  let range = hi - lo;
  if (range <= 0) range = Math.max(1, Math.abs(hi) * 0.2);
  const raw = range / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / mag;
  const step =
    (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * mag;
  const min = Math.floor(lo / step) * step;
  let max = Math.ceil(hi / step) * step;
  if (max <= min) max = min + step;
  return { min, max, step };
}
export function compactMoney(cents: number) {
  const dollars = cents / 100;
  if (Math.abs(dollars) >= 1_000_000)
    return `A$${(dollars / 1_000_000).toLocaleString("en-AU", { maximumFractionDigits: 2 })}m`;
  return `A$${Math.round(dollars / 1000).toLocaleString("en-AU")}k`;
}
export function lineStyles(scenarios: Simulation[], selected: number) {
  let other = 1;
  return scenarios.map((s) =>
    s.assumptions.settlementDays === selected
      ? LINE_STYLES[0]
      : LINE_STYLES[other++],
  );
}

export function FundChart({
  scenarios,
  selected,
  steady,
  termLabel,
}: {
  scenarios: Simulation[];
  selected: number;
  steady?: Simulation;
  termLabel: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  // The frame's height comes from CSS: fixed on small screens, and stretched to
  // match the assumptions column on desktop.
  const { width, height } = useSize(frame, { width: 760, height: 420 });
  const active =
    scenarios.find((s) => s.assumptions.settlementDays === selected) ||
    scenarios[0];
  const term = active.assumptions.termDays;
  const [inspect, setInspect] = useState<number | null>(null);
  const day = inspect === null ? null : Math.min(term, inspect);

  const sample = (s: Simulation) =>
    Array.from(
      { length: SAMPLES + 1 },
      (_, i) => s.daily[Math.round((i / SAMPLES) * term)].fund,
    );
  const series = scenarios.map(sample);
  const steadySeries = steady ? sample(steady) : [];
  const values = [...series.flat(), ...steadySeries];
  const scale = niceScale(
    Math.min(active.payout.principal, ...values),
    Math.max(...values),
    // Fewer gridlines when a short phone leaves the graph little height.
    height < 180 ? 2 : 4,
  );
  const tweened = useTween([scale.min, scale.max, ...series.flat()]);
  const [lo, hi] = tweened;
  const pad = { l: 58, r: 12, t: 12, b: 34 };
  const plotW = width - pad.l - pad.r,
    plotH = height - pad.t - pad.b;
  const X = (i: number) => pad.l + (i / SAMPLES) * plotW;
  const Y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo || 1)) * plotH;
  const path = (points: number[]) =>
    points
      .map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`)
      .join(" ");
  const styles = lineStyles(scenarios, selected);
  const ticks: number[] = [];
  for (let v = scale.min; v <= scale.max + 1; v += scale.step) ticks.push(v);
  const every =
    (term === 365 ? 3 : term === 180 ? 2 : 1) * (width < 560 ? 2 : 1);
  const xTicks = active.months
    .filter((m) => m.month % every === 0 || m.lastDay === term)
    .map((m) => ({
      day: m.lastDay,
      label:
        m.lastDay - m.firstDay + 1 === MONTH_LENGTHS[m.month - 1]
          ? `Month ${m.month}`
          : `Day ${m.lastDay}`,
    }));
  const dayX = (d: number) => pad.l + (d / term) * plotW;
  const toDay = (clientX: number, rect: DOMRect) =>
    Math.round(
      Math.max(0, Math.min(1, (clientX - rect.left - pad.l) / plotW)) * term,
    );
  const onKey = (e: KeyboardEvent) => {
    const current = day ?? term;
    const moves: Record<string, number> = {
      ArrowRight: 1,
      ArrowUp: 1,
      ArrowLeft: -1,
      ArrowDown: -1,
      PageUp: 30,
      PageDown: -30,
    };
    if (e.key in moves)
      setInspect(Math.max(0, Math.min(term, current + moves[e.key])));
    else if (e.key === "Home") setInspect(0);
    else if (e.key === "End") setInspect(term);
    else return;
    e.preventDefault();
  };
  const row = day === null ? null : active.daily[day];
  return (
    <div className="fund-chart">
      <div className="chart-head" aria-live="polite">
        {row ? (
          <>
            <p className="chart-title">Combined fund on day {row.day}</p>
            <p className="chart-readout">
              <strong data-testid="inspect-fund">{money(row.fund)}</strong>
              <span>
                {money(row.cash)} available · {money(row.committed)} committed
              </span>
            </p>
          </>
        ) : (
          <>
            <p className="chart-title">Combined fund at {termLabel}</p>
            <p className="chart-readout">
              <Money
                cents={active.atTerm.fund}
                testId="fund-value"
                className="readout-value"
              />
              <span>
                {money(active.atTerm.cash)} available ·{" "}
                {money(active.atTerm.committed)} committed
              </span>
            </p>
          </>
        )}
      </div>
      <div className="chart-plot">
        {/* The key sits over the empty top-left of the plot, where the lines never reach. */}
        <ul
          className="chart-legend"
          aria-label="Settlement scenarios"
          style={{ left: pad.l + 18 }}
        >
          {scenarios.map((s, i) => (
            <li
              key={s.assumptions.settlementDays}
              data-active={s.assumptions.settlementDays === selected}
            >
              <svg width="22" height="8" aria-hidden="true">
                <line
                  x1="0"
                  x2="22"
                  y1="4"
                  y2="4"
                  stroke={styles[i].stroke}
                  strokeWidth={styles[i].width}
                  strokeDasharray={styles[i].dash}
                />
              </svg>
              {s.assumptions.settlementDays} days
              {s.assumptions.settlementDays === selected && (
                <span className="sr-only"> (selected)</span>
              )}
            </li>
          ))}
          {steady && (
            <li className="stress-comparison">
              <svg width="22" height="8" aria-hidden="true">
                <line
                  x1="0"
                  x2="22"
                  y1="4"
                  y2="4"
                  stroke="#BFBFBF"
                  strokeWidth="1.25"
                  strokeDasharray="1 4"
                  strokeLinecap="round"
                />
              </svg>
              If conditions stay steady: {money(steady.atTerm.fund)}
            </li>
          )}
        </ul>
        <div
          ref={frame}
          className="chart-frame"
          role="slider"
          tabIndex={0}
          aria-label="Inspect a day on the fund graph"
          aria-valuemin={0}
          aria-valuemax={term}
          aria-valuenow={day ?? term}
          aria-valuetext={
            row
              ? `Day ${row.day}: fund ${money(row.fund)}`
              : `Day ${term}: fund ${money(active.atTerm.fund)}`
          }
          onKeyDown={onKey}
          onBlur={() => setInspect(null)}
          onPointerMove={(e) =>
            setInspect(
              toDay(e.clientX, e.currentTarget.getBoundingClientRect()),
            )
          }
          onPointerDown={(e) =>
            setInspect(
              toDay(e.clientX, e.currentTarget.getBoundingClientRect()),
            )
          }
          onPointerLeave={() => setInspect(null)}
        >
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            aria-hidden="true"
          >
            {ticks.map((v) => (
              <g key={v}>
                <line
                  x1={pad.l}
                  x2={width - pad.r}
                  y1={Y(v)}
                  y2={Y(v)}
                  className="grid"
                />
                <text x={pad.l - 12} y={Y(v) + 4} textAnchor="end">
                  {compactMoney(v)}
                </text>
              </g>
            ))}
            <text x={pad.l} y={height - 10} textAnchor="start">
              Start
            </text>
            {xTicks.map((t) => (
              <text
                key={t.day}
                x={dayX(t.day)}
                y={height - 10}
                textAnchor={t.day === term ? "end" : "middle"}
              >
                {t.label}
              </text>
            ))}
            {steady && (
              <path
                d={path(steadySeries)}
                fill="none"
                stroke="#BFBFBF"
                strokeWidth="1.25"
                strokeDasharray="1 4"
                strokeLinecap="round"
              />
            )}
            {series.map((_, i) => {
              const points = tweened.slice(
                2 + i * (SAMPLES + 1),
                2 + (i + 1) * (SAMPLES + 1),
              );
              return styles[i] === LINE_STYLES[0] ? null : (
                <path
                  key={i}
                  d={path(points)}
                  fill="none"
                  stroke={styles[i].stroke}
                  strokeWidth={styles[i].width}
                  strokeDasharray={styles[i].dash}
                  opacity="0.9"
                />
              );
            })}
            {series.map((_, i) => {
              if (styles[i] !== LINE_STYLES[0]) return null;
              const points = tweened.slice(
                2 + i * (SAMPLES + 1),
                2 + (i + 1) * (SAMPLES + 1),
              );
              return (
                <g key={i}>
                  <path
                    d={`${path(points)} L${X(SAMPLES)},${pad.t + plotH} L${X(0)},${pad.t + plotH} Z`}
                    fill="#F0F0F0"
                    opacity="0.045"
                  />
                  <path
                    d={path(points)}
                    fill="none"
                    stroke={styles[i].stroke}
                    strokeWidth={styles[i].width}
                    strokeLinejoin="round"
                  />
                  <circle
                    cx={X(SAMPLES)}
                    cy={Y(points[SAMPLES])}
                    r="4"
                    fill="#F0F0F0"
                  />
                </g>
              );
            })}
            {row && (
              <g className="inspect">
                <line
                  x1={dayX(row.day)}
                  x2={dayX(row.day)}
                  y1={pad.t}
                  y2={pad.t + plotH}
                />
                {scenarios.map((s, i) => (
                  <circle
                    key={i}
                    cx={dayX(row.day)}
                    cy={Y(s.daily[row.day].fund)}
                    r={styles[i] === LINE_STYLES[0] ? 5 : 3}
                    fill={styles[i] === LINE_STYLES[0] ? "#ED1C24" : "#8C8C8C"}
                  />
                ))}
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}

export type Bar = {
  key: number | string;
  label: string;
  value: number;
  aria: string;
};
export function MonthBars({
  bars,
  selected,
  onSelect,
  cap,
  capLabel,
  label,
}: {
  bars: Bar[];
  selected?: number | string;
  onSelect?: (key: number | string) => void;
  cap?: number | null;
  capLabel?: string;
  label: string;
}) {
  const max = Math.max(1, ...bars.map((b) => b.value), cap || 0) * 1.08;
  const heights = useTween(bars.map((b) => (Math.max(0, b.value) / max) * 100));
  return (
    <div
      className="month-bars"
      role={onSelect ? "group" : "img"}
      aria-label={label}
    >
      <div className="bars-plot">
        {bars.map((b, i) => {
          const style = { height: `${Math.max(1.5, heights[i] ?? 0)}%` };
          return onSelect ? (
            <button
              key={b.key}
              type="button"
              className="bar"
              aria-pressed={selected === b.key}
              aria-label={b.aria}
              onClick={() => onSelect(b.key)}
            >
              <span style={style} />
            </button>
          ) : (
            <span key={b.key} className="bar" title={b.aria}>
              <span style={style} />
            </span>
          );
        })}
        {cap !== null && cap !== undefined && (
          <div className="bars-cap" style={{ bottom: `${(cap / max) * 100}%` }}>
            <span>{capLabel}</span>
          </div>
        )}
      </div>
      <div className="bars-axis" aria-hidden="true">
        {bars.map((b) => (
          <span key={b.key} data-selected={selected === b.key}>
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
