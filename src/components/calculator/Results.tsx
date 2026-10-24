"use client";
import { money, percentBps, plural } from "@/lib/format";
import type { SimulationOutput } from "@/lib/referral-model";
import { settingsAdjusted, type ScenarioSettings } from "@/lib/scenario";
import { Money } from "../Primitives";

export function NegotiationBadge({ settings }: { settings: ScenarioSettings }) {
  if (!settingsAdjusted(settings)) return null;
  const parts = [
    percentBps(settings.feeBps),
    settings.recurringPeriod === "ongoing" ? "commission while active" : null,
    settings.horizonMonths !== 12 ? `${settings.horizonMonths}-month view` : null,
    settings.projectPayment === "split" ? "deposit + balance" : null,
  ].filter(Boolean);
  return (
    <p className="negotiation-badge">
      <i aria-hidden="true" />
      Testing settings: {parts.join(" · ")}
    </p>
  );
}

/** The headline result: what Real Coder could earn, one-off and recurring kept apart. */
export default function Results({
  output,
  settings,
  compact = false,
}: {
  output: SimulationOutput;
  settings: ScenarioSettings;
  compact?: boolean;
}) {
  const t = output.totals;
  const H = output.months.length;
  const total = Math.max(1, t.totalCommission);
  return (
    <div className={`results ${compact ? "results-compact" : ""}`} aria-live="polite" aria-atomic="true">
      <NegotiationBadge settings={settings} />
      <p className="results-label">Real Coder could earn</p>
      <p className="results-total">
        <Money cents={t.totalCommission} testId={compact ? "drawer-total" : "total-commission"} />
        <span>in commission over {H} months</span>
      </p>
      <div className="results-mix" aria-hidden="true">
        <span className="mix-oneoff" style={{ ["--share" as string]: `${(t.oneOffCommission / total) * 100}%` }} />
        <span className="mix-recurring" style={{ ["--share" as string]: `${(t.recurringCommission / total) * 100}%` }} />
      </div>
      <dl className="results-split">
        <div>
          <dt>
            <i className="key key-oneoff" aria-hidden="true" />
            One-off commission
          </dt>
          <dd>
            <Money cents={t.oneOffCommission} testId={compact ? undefined : "oneoff-commission"} />
          </dd>
          <small>{plural(t.projects, "branding project")}, paid once</small>
        </div>
        <div>
          <dt>
            <i className="key key-recurring" aria-hidden="true" />
            Recurring commission
          </dt>
          <dd>
            <Money cents={t.recurringCommission} testId={compact ? undefined : "recurring-commission"} />
          </dd>
          <small>{plural(t.commissionedClientMonths, "paid client-month")}</small>
        </div>
        {!compact && (
          <div>
            <dt>Month {H} recurring run rate</dt>
            <dd>
              <Money cents={t.endRecurringRunRate} testId="run-rate" />
              <span className="per">/mo</span>
            </dd>
            <small>Recurring commission earned in month {H}</small>
          </div>
        )}
      </dl>
      {!compact && (
        <dl className="results-secondary">
          <div>
            <dt>Client payments modelled</dt>
            <dd>{money(t.clientReceipts)}</dd>
          </div>
          <div>
            <dt>Kascade revenue after commission, before expenses</dt>
            <dd>{money(t.kascadeAfterReferral)}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
