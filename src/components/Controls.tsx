import type { Assumptions } from "@/lib/model";
import { DEFAULTS, money, percent } from "@/lib/model";

function Range({
  id,
  title,
  value,
  min,
  max,
  step,
  display,
  onChange,
  hint,
}: {
  id: string;
  title: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
  hint?: string;
}) {
  return (
    <div className="range-control">
      <div className="control-label">
        <label htmlFor={id}>{title}</label>
        <output htmlFor={id}>{display}</output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={display}
        style={
          {
            "--range-fill": `${((value - min) / (max - min)) * 100}%`,
          } as React.CSSProperties
        }
      />
      {hint && <p className="control-hint">{hint}</p>}
    </div>
  );
}
export default function Controls({
  value,
  onChange,
}: {
  value: Assumptions;
  onChange: (a: Assumptions) => void;
}) {
  const update = <K extends keyof Assumptions>(key: K, next: Assumptions[K]) =>
    onChange({ ...value, [key]: next });
  return (
    <aside className="controls" aria-label="Simulator assumptions">
      <div className="controls-heading">
        <span className="eyebrow">Your assumptions</span>
        <button
          className="text-button reset"
          onClick={() => onChange({ ...DEFAULTS })}
        >
          Reset <span aria-hidden="true">↺</span>
        </button>
      </div>
      <Range
        id="capital"
        title="Committed capital"
        value={value.initialCapital}
        min={50_000}
        max={250_000}
        step={5_000}
        display={money(value.initialCapital * 100)}
        onChange={(n) => update("initialCapital", n)}
      />
      <Range
        id="settlement"
        title="Settlement period"
        value={value.settlementDays}
        min={10}
        max={30}
        step={1}
        display={`${value.settlementDays} days`}
        onChange={(n) => update("settlementDays", n)}
        hint="From funding to cleared sale proceeds."
      />
      <Range
        id="utilisation"
        title="Starting utilisation"
        value={Math.round(value.utilisation * 100)}
        min={40}
        max={85}
        step={1}
        display={percent(value.utilisation)}
        onChange={(n) => update("utilisation", n / 100)}
      />
      <Range
        id="margin"
        title="Net trading margin"
        value={Math.round(value.margin * 1000)}
        min={30}
        max={100}
        step={5}
        display={percent(value.margin)}
        onChange={(n) => update("margin", n / 1000)}
        hint="On purchase cost, after direct transaction costs."
      />
      <fieldset className="term-control">
        <legend>Operating term / exit election</legend>
        <div className="segmented">
          {([90, 180, 365] as const).map((days) => (
            <button
              key={days}
              aria-pressed={value.termDays === days}
              onClick={() => update("termDays", days)}
            >
              {days === 365 ? "12 months" : `${days} days`}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="print-assumptions">
        <p>Utilisation taper: {value.taper ? "enabled" : "disabled"}.</p>
        <p>
          Monthly purchasing demand:{" "}
          {value.monthlyDemand === null
            ? "uncapped capacity case"
            : money(value.monthlyDemand * 100)}
          .
        </p>
        <p>
          Conditions:{" "}
          {value.conditions === "conservative"
            ? "conservative second half (margin −20%, utilisation −10 points)"
            : "steady"}
          .
        </p>
      </div>
      <details className="advanced">
        <summary>
          Advanced assumptions <span aria-hidden="true">+</span>
        </summary>
        <div className="advanced-body">
          <label className="check-label">
            <input
              type="checkbox"
              checked={value.taper}
              onChange={(e) => update("taper", e.target.checked)}
            />
            <span>
              Reduce utilisation as the fund grows
              <small>
                5 percentage points per additional A$100,000; floor 50% (or your
                lower starting setting).
              </small>
            </span>
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={value.monthlyDemand !== null}
              onChange={(e) =>
                update("monthlyDemand", e.target.checked ? 100_000 : null)
              }
            />
            <span>Limit actual purchasing demand</span>
          </label>
          {value.monthlyDemand !== null && (
            <div className="demand-input">
              <label htmlFor="monthly-demand">
                Monthly purchase-cost ceiling (AUD)
              </label>
              <input
                id="monthly-demand"
                type="number"
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
              <small>
                Zero means no purchases. Unused demand does not carry forward.
              </small>
            </div>
          )}
          <label className="check-label">
            <input
              type="checkbox"
              checked={value.conditions === "conservative"}
              onChange={(e) =>
                update(
                  "conditions",
                  e.target.checked ? "conservative" : "steady",
                )
              }
            />
            <span>
              Conservative second half
              <small>
                New-purchase margins fall 20%; target utilisation falls a
                further 10 points after the term midpoint.
              </small>
            </span>
          </label>
        </div>
      </details>
      <div className="fixed-terms">
        <span className="eyebrow">Fixed proposed terms</span>
        <p>
          Jake <strong>25%</strong>
          <span>/</span> ELITA <strong>75%</strong>
        </p>
        <small>
          4% p.a. availability fee, calculated separately on original capital.
          All Jake profits and half of ELITA profits reinvested.
        </small>
      </div>
    </aside>
  );
}
