"use client";
import { REFERRAL_TERMS } from "@/data/catalog";
import type { SimulationOutput } from "@/lib/referral-model";
import type { Scenario } from "@/lib/scenario";
import Builder from "../calculator/Builder";
import EarningsChart from "../calculator/EarningsChart";
import MonthTable from "../calculator/MonthTable";
import Results from "../calculator/Results";
import { Disclosure, Icon } from "../Primitives";

export const METHOD = [
  {
    term: "Signed and paid, not leads",
    text: "Every input is a client who has signed and paid, or an active retainer client who pays. There are no conversion rates or expected values, so a client is never shown as a fraction.",
  },
  {
    term: "Eligible payment",
    text: "Money a referred client has actually paid Kascade for eligible creative work, excluding GST and pass-through costs such as print or media. Refunds and credits reduce it.",
  },
  {
    term: "One-off commission",
    text: "Earned once on each payment received for a branding project, including any strategy add-on attached to it. Deposits and balances each count once; invoiced but unpaid amounts never count.",
  },
  {
    term: "Active paid retainer",
    text: "A retainer client in a month they pay. A paused or unpaid month earns nothing. No churn is assumed unless you set a shorter stay.",
  },
  {
    term: `First ${REFERRAL_TERMS.proposedMaxPaidRetainerMonths} paid months`,
    text: `Proposed: recurring commission applies to each retainer client’s first ${REFERRAL_TERMS.proposedMaxPaidRetainerMonths} paid months, then stops even if the client keeps paying. Year-one figures add up the actual paid months; they are never a month-12 figure multiplied by 12.`,
  },
  {
    term: "New listing campaign",
    text: "Counted once, when Kascade accepts the complete campaign brief. Later stages of the same property’s campaign are included, not counted again.",
  },
  {
    term: "Kascade after commission",
    text: "Client payments less Real Coder’s commission, before any of Kascade’s delivery, staff or operating costs. It is revenue, not profit.",
  },
  {
    term: "Precision",
    text: "Whole cents throughout; commission is rounded to the cent on each payment. Screens round to the dollar. Model months are not calendar dates. AUD, excluding GST.",
  },
] as const;

export default function Calculator({
  scenario,
  output,
  onChange,
  onExport,
  exported,
}: {
  scenario: Scenario;
  output: SimulationOutput;
  onChange: (s: Scenario) => void;
  onExport: (format: "json" | "csv") => void;
  exported: string;
}) {
  return (
    <section id="calculator" className="panel panel-calc tone-alt" data-group="referrals" aria-labelledby="calc-title">
      <div className="wrap">
        <div className="section-head" data-reveal>
          <div>
            <p className="index">
              <span>03 · Calculator</span>Explore the opportunity
            </p>
            <h2 id="calc-title" className="section-title">
              What could the partnership add?
            </h2>
          </div>
          <p className="lead">
            Add the clients you can picture introducing. Every figure uses the
            same commission rules. These are illustrations, not projected or
            guaranteed revenue.
          </p>
        </div>
        <div className="calc" data-reveal>
          {/* Phones: result, then the builder, then the chart. Wider: builder beside both. */}
          <div className="calc-total">
            <Results output={output} settings={scenario.settings} />
          </div>
          <div className="calc-builder module">
            <Builder scenario={scenario} onChange={onChange} />
          </div>
          <div className="calc-chart">
            <EarningsChart output={output} />
          </div>
        </div>
        <div className="calc-more" data-reveal>
          <Disclosure label="Month-by-month breakdown" className="details">
            <MonthTable output={output} />
          </Disclosure>
          <Disclosure label="How the numbers work" className="details">
            <dl className="method">
              {METHOD.map((m) => (
                <div key={m.term}>
                  <dt>{m.term}</dt>
                  <dd>{m.text}</dd>
                </div>
              ))}
            </dl>
            <p className="fine">
              Hypothetical scenarios only. Nothing here guarantees introductions,
              conversions, client retention or earnings.
            </p>
          </Disclosure>
          <div className="exports">
            <p className="fine">Take this scenario with you, in exact cents:</p>
            <button type="button" className="text-button" onClick={() => onExport("json")}>
              <Icon name="download" size={14} /> Scenario JSON
            </button>
            <button type="button" className="text-button" onClick={() => onExport("csv")}>
              <Icon name="download" size={14} /> Monthly CSV
            </button>
            <p className="export-status" role="status">
              {exported}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
