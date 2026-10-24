"use client";
import { useId, useState } from "react";
import { money, shortMoney, type Simulation } from "@/lib/model";

export const COLOURS = ["#B39A6A", "#7A1420", "#707276"];
export function GrowthChart({
  scenarios,
  selected,
  onSelect,
  steady,
}: {
  scenarios: Simulation[];
  selected: number;
  onSelect: (days: number) => void;
  steady?: Simulation;
}) {
  const titleId = useId();
  const current =
    scenarios.find((s) => s.assumptions.settlementDays === selected) ||
    scenarios[1];
  const term = current.assumptions.termDays;
  const [inspect, setInspect] = useState<number | null>(null);
  const day = Math.min(term, inspect ?? term);
  const all = steady ? [...scenarios, steady] : scenarios;
  const initial = current.daily[0].fund;
  const maxFund = Math.max(...all.map((s) => s.atTerm.fund), initial * 1.1);
  const yMin = initial * 0.9,
    yMax = Math.ceil(maxFund / 2_500_000) * 2_500_000;
  const left = 76,
    top = 20,
    width = 694,
    height = 260;
  const x = (d: number) => left + (d / term) * width;
  const y = (fund: number) =>
    top + height - ((fund - yMin) / (yMax - yMin)) * height;
  const path = (s: Simulation) =>
    s.daily
      .slice(0, term + 1)
      .map(
        (d, i) =>
          `${i ? "L" : "M"}${x(d.day).toFixed(2)},${y(d.fund).toFixed(2)}`,
      )
      .join(" ");
  return (
    <div className="growth-chart">
      <div className="chart-summary">
        <div>
          <span className="eyebrow">Combined purchasing fund</span>
          <strong data-testid="fund-value">
            {money(current.daily[day].fund)}
          </strong>
          <span className="chart-subtitle">
            Day {day} · {selected}-day settlement · cost basis
          </span>
        </div>
        <span className="model-tag">
          {current.assumptions.monthlyDemand === null
            ? "Hypothetical capacity case"
            : "Demand-limited illustration"}
        </span>
      </div>
      <div
        className="scenario-select"
        aria-label="Inspect a settlement scenario"
      >
        {scenarios.map((s, i) => (
          <button
            key={s.assumptions.settlementDays}
            onClick={() => onSelect(s.assumptions.settlementDays)}
            aria-pressed={selected === s.assumptions.settlementDays}
          >
            <span className="legend-line" style={{ background: COLOURS[i] }} />
            {s.assumptions.settlementDays} days
            {s.assumptions.settlementDays ===
              current.assumptions.settlementDays &&
              selected === s.assumptions.settlementDays && (
                <span className="sr-only"> selected</span>
              )}
          </button>
        ))}
        {steady && (
          <span className="steady-legend">
            - - Steady counterpart ({selected} days)
          </span>
        )}
      </div>
      <svg
        className="line-chart"
        viewBox="0 0 820 330"
        role="img"
        aria-labelledby={titleId}
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const svgX = ((e.clientX - rect.left) / rect.width) * 820;
          setInspect(
            Math.round(Math.max(0, Math.min(1, (svgX - left) / width)) * term),
          );
        }}
        onPointerLeave={() => setInspect(null)}
      >
        <title
          id={titleId}
        >{`Illustrative cost-basis purchasing fund through day ${term}; values for every day are available using the inspection slider and JSON export.`}</title>
        <text x={left} y="10" className="svg-unit">
          AUD
        </text>
        {[0, 1, 2, 3, 4].map((t) => {
          const value = yMin + ((yMax - yMin) * t) / 4;
          return (
            <g key={t}>
              <line
                x1={left}
                x2={left + width}
                y1={y(value)}
                y2={y(value)}
                className="grid-line"
              />
              <text x={left - 16} y={y(value) + 4} textAnchor="end">
                {shortMoney(value)}
              </text>
            </g>
          );
        })}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <text key={t} x={x(Math.round(term * t))} y="310" textAnchor="middle">
            {t === 0 ? "Day 0" : `Day ${Math.round(term * t)}`}
          </text>
        ))}
        {scenarios.map((s, i) => (
          <path
            key={s.assumptions.settlementDays}
            d={path(s)}
            fill="none"
            stroke={COLOURS[i]}
            strokeWidth={s.assumptions.settlementDays === selected ? 3 : 1.6}
            opacity={s.assumptions.settlementDays === selected ? 1 : 0.75}
          />
        ))}
        {steady && (
          <path
            d={path(steady)}
            fill="none"
            stroke="#25262A"
            strokeWidth="1.5"
            strokeDasharray="6 5"
          />
        )}
        <line
          x1={x(day)}
          x2={x(day)}
          y1={top}
          y2={top + height}
          stroke="#B39A6A"
          strokeDasharray="3 4"
        />
        {scenarios.map((s, i) => (
          <circle
            key={i}
            cx={x(day)}
            cy={y(s.daily[day].fund)}
            r={s.assumptions.settlementDays === selected ? 5 : 3}
            fill={COLOURS[i]}
            stroke="#FAFAF8"
            strokeWidth="2"
          />
        ))}
      </svg>
      <div className="chart-inspect">
        <label htmlFor="inspect-day">
          Inspect day <output>{day}</output>
        </label>
        <input
          id="inspect-day"
          type="range"
          min="0"
          max={term}
          value={day}
          onChange={(e) => setInspect(Number(e.target.value))}
        />
        <span>
          {money(current.daily[day].cash)} cash{" "}
          <span aria-hidden="true">/</span>{" "}
          {money(current.daily[day].committed)} committed
        </span>
      </div>
      <p className="fine-print chart-note">
        Includes original capital and retained, realised trading profits.
        Excludes withdrawn profits, the fee and unrealised gains. No growth is
        recognised before settlement.
      </p>
    </div>
  );
}
export function ProfitChart({ scenarios }: { scenarios: Simulation[] }) {
  const titleId = useId();
  const values = scenarios.flatMap((s) => [
    s.payout.jakeTotalProfit,
    s.payout.elitaNetProfit,
  ]);
  const max = Math.max(1, ...values),
    min = Math.min(0, ...values);
  const plotTop = 20,
    plotHeight = 195;
  const y = (value: number) =>
    plotTop + ((max - value) / (max - min)) * plotHeight;
  return (
    <div className="profit-chart">
      <div className="profit-chart-heading">
        <span className="eyebrow">Total profit by settlement scenario</span>
        <div>
          <span className="square red" />
          Jake, including fee <span className="square champagne" />
          ELITA, after fee
        </div>
      </div>
      <svg viewBox="0 0 920 300" role="img" aria-labelledby={titleId}>
        <title id={titleId}>
          Total profits before tax, after wind-down; exact values are in the
          following table.
        </title>
        <line x1="30" x2="900" y1={y(0)} y2={y(0)} className="grid-line" />
        {scenarios.map((s, i) => {
          const base = 140 + i * 300;
          return (
            <g key={s.assumptions.settlementDays}>
              {[s.payout.jakeTotalProfit, s.payout.elitaNetProfit].map(
                (v, j) => (
                  <g key={j}>
                    <rect
                      x={base + j * 88 - 65}
                      y={Math.min(y(v), y(0))}
                      width="66"
                      height={Math.max(1, Math.abs(y(v) - y(0)))}
                      fill={j === 0 ? "#7A1420" : "#B39A6A"}
                    />
                    <text
                      x={base + j * 88 - 32}
                      y={v >= 0 ? y(v) - 9 : y(v) + 18}
                      textAnchor="middle"
                    >
                      {money(v)}
                    </text>
                  </g>
                ),
              )}
              <text x={base + 12} y="268" textAnchor="middle">
                {s.assumptions.settlementDays}-day settlement
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
