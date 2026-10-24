"use client";
import { useMemo, useState } from "react";
import type { ServiceId } from "@/data/catalog";
import { HORIZON_MONTHS, PRICE_LISTS } from "@/data/pricing";
import { money } from "@/lib/format";
import { countsScenario, run, type Counts } from "@/lib/scenario";
import { Card, Money, Screen, Stepper, tone } from "../Primitives";

const MAX = 20;
const START: Counts = { professional: 1, reGrowth: 1 };

export default function Calculator() {
  const [counts, setCounts] = useState<Counts>(START);
  const { totals } = useMemo(() => run(countsScenario(counts)), [counts]);
  const set = (id: ServiceId, n: number) => setCounts((c) => ({ ...c, [id]: n }));
  return (
    <Screen
      id="calculator"
      title={tone("Calculate **your earnings**")}
      intro="Choose how many clients you might refer in a year."
    >
      <div className="calc">
        <div className="calc-inputs">
          {PRICE_LISTS.map((list) => (
            <div key={list.id} className="calc-group">
              <h3>{list.title}</h3>
              <ul>
                {list.rows
                  .filter((r) => r.service)
                  .map((r) => (
                    <li key={r.key}>
                      <span className="calc-name">
                        {r.name}
                        <small>
                          {money(r.price as number)}
                          {r.billing === "monthly" ? " / month" : " one-off"}
                        </small>
                      </span>
                      <Stepper
                        label={`${list.title}, ${r.name}: clients`}
                        value={counts[r.service!] ?? 0}
                        max={MAX}
                        onChange={(n) => set(r.service!, n)}
                      />
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
        <Card className="calc-result">
          <div aria-live="polite" aria-atomic="true">
          <p className="result-label">Real Coder earns in the first {HORIZON_MONTHS} months</p>
          <Money cents={totals.totalCommission} className="result-total" testId="total" />
          <dl className="result-split">
            <div>
              <dt>From one-off projects</dt>
              <dd>
                <Money cents={totals.oneOffCommission} testId="oneoff" />
              </dd>
            </div>
            <div>
              <dt>From monthly packages</dt>
              <dd>
                <Money cents={totals.endRecurringRunRate} testId="monthly" /> / month
              </dd>
            </div>
          </dl>
          <p className="fine">
            Assumes every client signs and pays in month 1 and monthly clients
            stay all {HORIZON_MONTHS} months. Commission continues for as long as
            they stay. Excludes GST. An illustration, not a forecast.
          </p>
          </div>
        </Card>
      </div>
    </Screen>
  );
}
