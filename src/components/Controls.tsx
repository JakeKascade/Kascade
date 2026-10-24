"use client";
import { useEffect, useState } from "react";
import type { Assumptions } from "@/lib/model";
import { DEFAULTS, money, percent } from "@/lib/model";
import { Disclosure } from "./Primitives";

/** A small ⓘ that reveals a dial's explanation where there's no room to show it. */
function InfoButton({
  label,
  open,
  controls,
  onToggle,
}: {
  label: string;
  open: boolean;
  controls: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="info-button"
      aria-label={`About ${label}`}
      aria-expanded={open}
      aria-controls={controls}
      onClick={onToggle}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <circle
          cx="8"
          cy="8"
          r="7.25"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <path d="M8 7v4.5" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="8" cy="4.6" r="0.8" fill="currentColor" />
      </svg>
    </button>
  );
}
function Info({ id, open, text }: { id: string; open: boolean; text: string }) {
  return (
    <div className="control-info" id={id} data-open={open} hidden={!open}>
      {text}
    </div>
  );
}

function Range({
  id,
  title,
  help,
  info,
  infoOpen,
  onInfo,
  value,
  min,
  max,
  step,
  display,
  scale,
  onChange,
}: {
  id: string;
  title: string;
  help: string;
  info: string;
  infoOpen: boolean;
  onInfo: () => void;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  scale: [string, string];
  onChange: (value: number) => void;
}) {
  return (
    <div className="control">
      <div className="control-head">
        <span className="control-label">
          <label htmlFor={id}>{title}</label>
          <InfoButton
            label={title}
            open={infoOpen}
            controls={`${id}-info`}
            onToggle={onInfo}
          />
        </span>
        <output htmlFor={id}>{display}</output>
      </div>
      <Info id={`${id}-info`} open={infoOpen} text={info} />
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={display}
        aria-describedby={`${id}-help`}
        style={
          {
            "--fill": `${((value - min) / (max - min)) * 100}%`,
          } as React.CSSProperties
        }
      />
      <div className="control-scale" aria-hidden="true">
        <span>{scale[0]}</span>
        <span>{scale[1]}</span>
      </div>
      <p className="control-help" id={`${id}-help`}>
        {help}
      </p>
    </div>
  );
}
function Switch({
  label,
  help,
  checked,
  onChange,
}: {
  label: string;
  help: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch-text">
        <span>{label}</span>
        <small>{help}</small>
      </span>
      <span className="switch-ui" aria-hidden="true" />
    </label>
  );
}
export default function Controls({
  value,
  onChange,
  onMethodology,
  idPrefix = "",
}: {
  value: Assumptions;
  onChange: (a: Assumptions) => void;
  onMethodology: () => void;
  /** Keeps ids unique when the dials appear twice (calculator and scenario panel). */
  idPrefix?: string;
}) {
  const update = <K extends keyof Assumptions>(key: K, next: Assumptions[K]) =>
    onChange({ ...value, [key]: next });
  const [info, setInfo] = useState<string | null>(null);
  const toggleInfo = (id: string) =>
    setInfo((open) => (open === id ? null : id));
  // An open explanation closes on a tap elsewhere or Escape.
  useEffect(() => {
    if (!info) return;
    const close = (e: Event) => {
      const target = e.target as Element;
      if (!target.closest(".control-info, .info-button")) setInfo(null);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInfo(null);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [info]);
  return (
    <div className="controls" role="group" aria-label="Simulator assumptions">
      <div className="fixed-capital">
        <p>
          <span>Starting capital</span>
          <small>Fixed in the proposal</small>
        </p>
        <strong>{money(value.initialCapital * 100)}</strong>
      </div>
      <Range
        id={`${idPrefix}settlement`}
        title="Average settlement time"
        help="From purchase to cleared sale proceeds."
        info="The average number of days from funding a purchase to cleared sale proceeds. Faster settlement recycles the capital more often, so the fund grows faster."
        infoOpen={info === "settlement"}
        onInfo={() => toggleInfo("settlement")}
        value={value.settlementDays}
        min={10}
        max={30}
        step={1}
        display={`${value.settlementDays} days`}
        scale={["10 days", "30 days"]}
        onChange={(n) => update("settlementDays", n)}
      />
      <Range
        id={`${idPrefix}utilisation`}
        title="Average capital utilisation"
        help="On average, how much of the fund is out."
        info="On average, how much of the fund is out in purchases at any one time. The rest waits in the account as available capital."
        infoOpen={info === "utilisation"}
        onInfo={() => toggleInfo("utilisation")}
        value={Math.round(value.utilisation * 100)}
        min={40}
        max={85}
        step={1}
        display={percent(value.utilisation)}
        scale={["40%", "85%"]}
        onChange={(n) => update("utilisation", n / 100)}
      />
      <Range
        id={`${idPrefix}margin`}
        title="Net trading margin"
        help="After direct costs. Not the 25 / 75 split."
        info="The net profit on each purchase’s cost, after direct transaction costs. That profit is then split 25 / 75; this figure isn’t the split itself."
        infoOpen={info === "margin"}
        onInfo={() => toggleInfo("margin")}
        value={Math.round(value.margin * 1000)}
        min={30}
        max={100}
        step={5}
        display={percent(value.margin)}
        scale={["3%", "10%"]}
        onChange={(n) => update("margin", n / 1000)}
      />
      <fieldset className="period">
        <legend>
          <span className="legend-long">Operating period</span>
          <span className="legend-short">Period</span>
          <InfoButton
            label="Operating period"
            open={info === "period"}
            controls={`${idPrefix}period-info`}
            onToggle={() => toggleInfo("period")}
          />
        </legend>
        <Info
          id={`${idPrefix}period-info`}
          open={info === "period"}
          text="12 months is the proposed term. 90 or 180 days shows an early exit: buying stops, then open purchases settle and are included in the results."
        />
        <div className="segmented">
          {([90, 180, 365] as const).map((days) => (
            <button
              key={days}
              type="button"
              aria-pressed={value.termDays === days}
              onClick={() => update("termDays", days)}
            >
              {days === 365 ? "12 months" : `${days} days`}
            </button>
          ))}
        </div>
        <p className="control-help">90 or 180 days shows an early exit.</p>
      </fieldset>
      <Disclosure label="Advanced assumptions" className="advanced">
        <div className="advanced-body">
          <Switch
            label="Reduce utilisation as the fund grows"
            help="5 points less per extra A$100,000 of fund, to a 50% floor (or your lower setting)."
            checked={value.taper}
            onChange={(on) => update("taper", on)}
          />
          <Switch
            label="Limit actual purchasing demand"
            help="Caps purchase cost each month. Unused demand doesn’t carry forward."
            checked={value.monthlyDemand !== null}
            onChange={(on) => update("monthlyDemand", on ? 100_000 : null)}
          />
          {value.monthlyDemand !== null && (
            <div className="demand-input">
              <label htmlFor={`${idPrefix}monthly-demand`}>
                Monthly purchase-cost ceiling (AUD)
              </label>
              <input
                id={`${idPrefix}monthly-demand`}
                type="number"
                inputMode="numeric"
                min={0}
                max={10_000_000}
                step={5_000}
                value={value.monthlyDemand}
                onChange={(e) =>
                  update(
                    "monthlyDemand",
                    Math.max(
                      0,
                      Math.min(10_000_000, Number(e.target.value) || 0),
                    ),
                  )
                }
              />
            </div>
          )}
          <Switch
            label="Conservative second half"
            help="After the midpoint, new purchases earn 20% less margin and utilisation falls a further 10 points."
            checked={value.conditions === "conservative"}
            onChange={(on) =>
              update("conditions", on ? "conservative" : "steady")
            }
          />
          <div className="advanced-foot">
            <button
              type="button"
              className="text-button"
              onClick={() => onChange({ ...DEFAULTS })}
            >
              Reset assumptions
            </button>
            <button
              type="button"
              className="text-button"
              onClick={onMethodology}
            >
              How the model works
            </button>
          </div>
        </div>
      </Disclosure>
      <div className="print-assumptions">
        <p>Utilisation taper: {value.taper ? "on" : "off"}.</p>
        <p>
          Monthly purchasing demand:{" "}
          {value.monthlyDemand === null
            ? "not limited (capacity case)"
            : money(value.monthlyDemand * 100)}
          .
        </p>
        <p>
          Conditions:{" "}
          {value.conditions === "conservative"
            ? "conservative second half"
            : "steady"}
          .
        </p>
      </div>
    </div>
  );
}
