"use client";
import { useMemo } from "react";
import {
  AGENCY_ADD_ON,
  BRANDING_IDS,
  CREATIVE_IDS,
  MODEL_DEFAULTS,
  REAL_ESTATE_IDS,
  REFERRAL_TERMS,
  SERVICES,
  STRATEGY_ADD_ON,
  isRetainer,
  type ServiceId,
} from "@/data/catalog";
import { money, percentBps, plural } from "@/lib/format";
import {
  DEFAULT_SETTINGS,
  MAX_CLIENTS_PER_LINE,
  MAX_LINES,
  PRESETS,
  lineIssue,
  lineMonthlyFee,
  lineProjectValue,
  matchingPreset,
  newLine,
  presetScenario,
  run,
  type ReferralLine,
  type Scenario,
  type ScenarioSettings,
} from "@/lib/scenario";
import { Disclosure, Icon, Stepper } from "../Primitives";

const GROUPS: { label: string; ids: readonly ServiceId[] }[] = [
  { label: "Branding & Identity · one-off", ids: BRANDING_IDS },
  { label: "Real Estate Campaign Creative · monthly", ids: [...REAL_ESTATE_IDS, "reCustom"] },
  { label: "Creative Partner · monthly", ids: CREATIVE_IDS },
];
const optionLabel = (id: ServiceId) => {
  const s = SERVICES[id];
  if (!isRetainer(s)) return `${s.name} · ${money(s.priceCents)}`;
  const prefix = s.category === "realEstate" ? "Agency" : "Creative";
  return s.monthlyCents === null
    ? `${prefix} 10+ · agreed fee`
    : `${prefix} ${s.name} · ${money(s.monthlyCents)}/mo`;
};
const strategySteps = Array.from(
  { length: (STRATEGY_ADD_ON.maxCents - STRATEGY_ADD_ON.minCents) / STRATEGY_ADD_ON.stepCents + 1 },
  (_, i) => STRATEGY_ADD_ON.minCents + i * STRATEGY_ADD_ON.stepCents,
);

function LineEditor({
  line,
  index,
  settings,
  idPrefix,
  onChange,
  onRemove,
  canRemove,
}: {
  line: ReferralLine;
  index: number;
  settings: ScenarioSettings;
  idPrefix: string;
  onChange: (line: ReferralLine) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const id = `${idPrefix}${line.id}`;
  const s = SERVICES[line.service];
  const retainer = isRetainer(s);
  const issue = lineIssue(line);
  const H = settings.horizonMonths;
  const set = <K extends keyof ReferralLine>(key: K, value: ReferralLine[K]) =>
    onChange({ ...line, [key]: value });
  const result = useMemo(() => run({ lines: [line], settings }), [line, settings]);
  const fee = retainer ? lineMonthlyFee(line) : lineProjectValue(line);
  return (
    <li className="line" data-issue={Boolean(issue)}>
      <div className="line-head">
        <label className="line-service" htmlFor={`${id}-service`}>
          <span className="sr-only">Referral {index + 1}: service</span>
          <select
            id={`${id}-service`}
            value={line.service}
            onChange={(e) => {
              const next = e.target.value as ServiceId;
              onChange({ ...line, service: next, strategy: next === line.service ? line.strategy : false });
            }}
          >
            {GROUPS.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.ids.map((sid) => (
                  <option key={sid} value={sid}>
                    {optionLabel(sid)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        {canRemove && (
          <button type="button" className="icon-button" onClick={onRemove} aria-label={`Remove referral ${index + 1}`}>
            <Icon name="close" size={16} />
          </button>
        )}
      </div>
      <div className="line-controls" data-retainer={retainer}>
        <div className="field">
          <span aria-hidden="true">{retainer ? "Paying clients" : "Paid projects"}</span>
          <Stepper
            id={`${id}-count`}
            label={retainer ? "Active paid clients" : "Signed and paid projects"}
            value={line.count}
            min={1}
            max={MAX_CLIENTS_PER_LINE}
            onChange={(n) => set("count", n)}
          />
        </div>
        <label className="field" htmlFor={`${id}-month`}>
          <span>{retainer ? "Starts" : "Paid"}</span>
          <select id={`${id}-month`} value={Math.min(line.startMonth, H)} onChange={(e) => set("startMonth", Number(e.target.value))}>
            {Array.from({ length: H }, (_, i) => (
              <option key={i} value={i + 1}>
                Month {i + 1}
              </option>
            ))}
          </select>
        </label>
        {retainer && (
          <label className="field" htmlFor={`${id}-stay`}>
            <span>Pays for</span>
            <select
              id={`${id}-stay`}
              value={line.stayMonths ?? "all"}
              onChange={(e) => set("stayMonths", e.target.value === "all" ? null : Number(e.target.value))}
            >
              <option value="all">Every month</option>
              {Array.from({ length: H - 1 }, (_, i) => (
                <option key={i} value={i + 1}>
                  {plural(i + 1, "paid month")} only
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {s.category === "branding" && (
        <div className="line-addon">
          <label className="check">
            <input type="checkbox" checked={line.strategy} onChange={(e) => set("strategy", e.target.checked)} />
            <span>+ Brand Strategy & Positioning</span>
          </label>
          {line.strategy && (
            <label className="field field-inline" htmlFor={`${id}-strategy`}>
              <span className="sr-only">Agreed strategy fee</span>
              <select id={`${id}-strategy`} value={line.strategyCents} onChange={(e) => set("strategyCents", Number(e.target.value))}>
                {strategySteps.map((c) => (
                  <option key={c} value={c}>
                    {money(c)}
                    {c === STRATEGY_ADD_ON.illustrativeCents ? " (illustrative midpoint)" : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
      {s.category === "realEstate" && (
        <div className="line-addon">
          <label className="check">
            <input type="checkbox" checked={line.agencyAddOn} onChange={(e) => set("agencyAddOn", e.target.checked)} />
            <span>+ {AGENCY_ADD_ON.name} ({money(AGENCY_ADD_ON.monthlyCents)}/mo)</span>
          </label>
          {line.service === "reCustom" && (
            <label className="field field-inline" htmlFor={`${id}-custom`}>
              <span>Agreed monthly fee (AUD, ex GST)</span>
              <input
                id={`${id}-custom`}
                type="number"
                inputMode="numeric"
                min={0}
                max={50_000}
                step={50}
                placeholder="e.g. 6,200"
                value={line.customMonthlyCents === null ? "" : line.customMonthlyCents / 100}
                onChange={(e) => {
                  const dollars = Math.max(0, Math.min(50_000, Math.round(Number(e.target.value) || 0)));
                  set("customMonthlyCents", e.target.value === "" ? null : dollars * 100);
                }}
              />
            </label>
          )}
        </div>
      )}
      <p className="line-result" aria-live="polite">
        {issue ? (
          issue
        ) : retainer ? (
          <>
            {money(fee!)}/mo each · <strong>{money(result.totals.totalCommission)}</strong> to Real Coder by month {H}
          </>
        ) : (
          <>
            {money(fee!)} each · <strong>{money(result.totals.totalCommission)}</strong> to Real Coder
            {result.totals.receiptsAfterHorizon > 0 && ` (balance falls after month ${H})`}
          </>
        )}
      </p>
    </li>
  );
}

export default function Builder({
  scenario,
  onChange,
  idPrefix = "",
}: {
  scenario: Scenario;
  onChange: (s: Scenario) => void;
  /** Keeps ids unique when the builder appears twice (calculator and drawer). */
  idPrefix?: string;
}) {
  const { lines, settings } = scenario;
  const preset = matchingPreset(lines);
  const setLines = (next: ReferralLine[]) => onChange({ ...scenario, lines: next });
  const setSettings = <K extends keyof ScenarioSettings>(key: K, value: ScenarioSettings[K]) =>
    onChange({
      lines:
        key === "horizonMonths"
          ? lines.map((l) => ({
              ...l,
              startMonth: Math.min(l.startMonth, value as number),
              stayMonths: l.stayMonths !== null && l.stayMonths >= (value as number) ? null : l.stayMonths,
            }))
          : lines,
      settings: { ...settings, [key]: value },
    });
  return (
    <div className="builder">
      <fieldset className="presets">
        <legend>Illustrative scenarios</legend>
        <div className="chip-select">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={preset === p.id}
              onClick={() => onChange(presetScenario(p.id, settings))}
            >
              {p.name}
            </button>
          ))}
        </div>
        <p className="preset-note" aria-live="polite">
          {preset ? PRESETS.find((p) => p.id === preset)!.description : "Your own scenario. Pick a starting point above at any time."}
        </p>
      </fieldset>
      <p className="builder-label" id={`${idPrefix}lines-label`}>
        Signed and paid referrals
      </p>
      <ol className="lines" aria-labelledby={`${idPrefix}lines-label`}>
        {lines.map((line, i) => (
          <LineEditor
            key={line.id}
            line={line}
            index={i}
            settings={settings}
            idPrefix={idPrefix}
            canRemove={lines.length > 1}
            onChange={(next) => setLines(lines.map((l) => (l.id === line.id ? next : l)))}
            onRemove={() => setLines(lines.filter((l) => l.id !== line.id))}
          />
        ))}
      </ol>
      {lines.length < MAX_LINES && (
        <button type="button" className="add-line" onClick={() => setLines([...lines, newLine({ service: "basic" })])}>
          <Icon name="plus" size={16} /> Add a referral
        </button>
      )}
      <Disclosure label="Negotiation and modelling settings" className="settings">
        <div className="settings-body">
          <div className="setting">
            <label htmlFor={`${idPrefix}fee`}>
              Referral rate <output htmlFor={`${idPrefix}fee`}>{percentBps(settings.feeBps)}</output>
            </label>
            <input
              id={`${idPrefix}fee`}
              type="range"
              min={REFERRAL_TERMS.minFeeBps}
              max={REFERRAL_TERMS.maxFeeBps}
              step={REFERRAL_TERMS.stepFeeBps}
              value={settings.feeBps}
              aria-valuetext={percentBps(settings.feeBps)}
              onChange={(e) => setSettings("feeBps", Number(e.target.value))}
              style={{ ["--fill" as string]: `${((settings.feeBps - REFERRAL_TERMS.minFeeBps) / (REFERRAL_TERMS.maxFeeBps - REFERRAL_TERMS.minFeeBps)) * 100}%` }}
            />
            <small>For testing only. The proposal is {percentBps(REFERRAL_TERMS.defaultFeeBps)}.</small>
          </div>
          <fieldset className="setting">
            <legend>Retainer commission period</legend>
            <div className="segmented">
              <button type="button" aria-pressed={settings.recurringPeriod === "proposed"} onClick={() => setSettings("recurringPeriod", "proposed")}>
                First {REFERRAL_TERMS.proposedMaxPaidRetainerMonths} paid months
              </button>
              <button type="button" aria-pressed={settings.recurringPeriod === "ongoing"} onClick={() => setSettings("recurringPeriod", "ongoing")}>
                While active
              </button>
            </div>
            <small>
              {REFERRAL_TERMS.proposedMaxPaidRetainerMonths} paid months is proposed. “While active” is shown for comparison only.
            </small>
          </fieldset>
          <fieldset className="setting">
            <legend>View</legend>
            <div className="segmented">
              <button type="button" aria-pressed={settings.horizonMonths === MODEL_DEFAULTS.horizonMonths} onClick={() => setSettings("horizonMonths", MODEL_DEFAULTS.horizonMonths)}>
                {MODEL_DEFAULTS.horizonMonths} months
              </button>
              <button type="button" aria-pressed={settings.horizonMonths === MODEL_DEFAULTS.extendedHorizonMonths} onClick={() => setSettings("horizonMonths", MODEL_DEFAULTS.extendedHorizonMonths)}>
                {MODEL_DEFAULTS.extendedHorizonMonths} months (extended)
              </button>
            </div>
            <small>The extended view shows where the commission period ends.</small>
          </fieldset>
          <fieldset className="setting">
            <legend>Branding payments</legend>
            <div className="segmented">
              <button type="button" aria-pressed={settings.projectPayment === "full"} onClick={() => setSettings("projectPayment", "full")}>
                Paid in full
              </button>
              <button type="button" aria-pressed={settings.projectPayment === "split"} onClick={() => setSettings("projectPayment", "split")}>
                50% deposit, then balance
              </button>
            </div>
            <small>Commission follows each payment once; the balance lands a month after the deposit.</small>
          </fieldset>
          <button type="button" className="text-button" onClick={() => onChange({ lines, settings: { ...DEFAULT_SETTINGS } })}>
            Reset to the proposed terms
          </button>
        </div>
      </Disclosure>
    </div>
  );
}
