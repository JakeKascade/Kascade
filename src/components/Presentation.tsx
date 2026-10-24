"use client";
import { useEffect, useMemo, useState } from "react";
import {
  compare,
  DEFAULTS,
  money,
  percent,
  simulate,
  type Assumptions,
  type Simulation,
} from "@/lib/model";
import { exportCsv, exportResults } from "@/lib/export";
import Controls from "./Controls";
import { GrowthChart, ProfitChart, COLOURS } from "./Charts";
import { Arrow, DownloadIcon, SectionHeading } from "./Primitives";

const payoutRows: {
  label: string;
  key: keyof Simulation["payout"];
  total?: boolean;
  group?: string;
}[] = [
  { label: "Original committed capital", key: "principal", group: "Jake" },
  { label: "Accumulated trading profit · 25%", key: "jakeTradingProfit" },
  { label: "Accrued availability fee · 4% p.a.", key: "fee" },
  { label: "Total profit, including fee", key: "jakeTotalProfit", total: true },
  {
    label: "Final payout, including principal",
    key: "jakeFinalPayout",
    total: true,
  },
  {
    label: "Total trading profit allocation · 75%",
    key: "elitaTradingProfit",
    group: "ELITA",
  },
  { label: "Cash withdrawn as purchases settle", key: "elitaWithdrawn" },
  { label: "Retained and reinvested profit", key: "elitaRetained" },
  {
    label: "Final lump sum, less availability fee",
    key: "elitaFinalPayout",
    total: true,
  },
  {
    label: "Total profit, after availability fee",
    key: "elitaNetProfit",
    total: true,
  },
];
function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function Presentation() {
  const [assumptions, setAssumptions] = useState<Assumptions>({ ...DEFAULTS });
  const [inspected, setInspected] = useState(15);
  const [month, setMonth] = useState(1);
  const [exported, setExported] = useState("");
  useEffect(() => {
    const original = new Map<HTMLDetailsElement, boolean>();
    const prepare = () =>
      document
        .querySelectorAll<HTMLDetailsElement>("main details")
        .forEach((detail) => {
          if (!original.has(detail)) original.set(detail, detail.open);
          detail.open = true;
        });
    const restore = () => {
      original.forEach((open, detail) => {
        detail.open = open;
      });
      original.clear();
    };
    window.addEventListener("beforeprint", prepare);
    window.addEventListener("afterprint", restore);
    return () => {
      window.removeEventListener("beforeprint", prepare);
      window.removeEventListener("afterprint", restore);
    };
  }, []);
  const scenarios = useMemo(() => compare(assumptions), [assumptions]);
  const active =
    scenarios.find((s) => s.assumptions.settlementDays === inspected) ||
    scenarios.find(
      (s) => s.assumptions.settlementDays === assumptions.settlementDays,
    )!;
  const capacityScenarios = useMemo(
    () =>
      assumptions.monthlyDemand === null
        ? scenarios
        : scenarios.map((s) =>
            simulate({ ...s.assumptions, monthlyDemand: null }),
          ),
    [assumptions, scenarios],
  );
  const steady = useMemo(
    () =>
      assumptions.conditions === "conservative"
        ? simulate({ ...active.assumptions, conditions: "steady" })
        : undefined,
    [active, assumptions.conditions],
  );
  const selectedMonth = Math.min(month, active.months.length);
  const setModel = (next: Assumptions) => {
    setAssumptions(next);
    setInspected(next.settlementDays);
    setExported("");
  };
  const exportFile = (format: "json" | "csv") => {
    const payload =
      format === "json"
        ? JSON.stringify(exportResults(assumptions), null, 2)
        : exportCsv(assumptions);
    download(
      `ELITA-private-capital-model.${format}`,
      payload,
      format === "json" ? "application/json" : "text/csv",
    );
    setExported(
      `${format.toUpperCase()} exported with all three scenarios and current assumptions.`,
    );
  };
  const termLabel =
    assumptions.termDays === 365 ? "12 months" : `${assumptions.termDays} days`;
  const p = active.payout;
  return (
    <>
      <a className="skip-link" href="#simulator">
        Skip to the simulator
      </a>
      <header className="site-header">
        <div className="header-inner">
          {/* Exact supplied artwork; intentionally no filters, recolouring or redraw. */}
          <a
            className="brand"
            href="#opportunity"
            aria-label="ELITA — return to introduction"
          >
            <img
              src="/brand/elita-logo.png"
              alt="ELITA"
              width="150"
              height="23"
            />
          </a>
          <nav aria-label="Presentation sections">
            <a href="#structure">The structure</a>
            <a href="#simulator">The numbers</a>
            <a href="#viability">The consideration</a>
          </nav>
          <span className="header-private">
            <span className="status-dot" />
            Private & confidential
          </span>
        </div>
      </header>
      <main>
        <section id="opportunity" className="hero page-width">
          <div className="hero-topline">
            <span className="eyebrow">01 / A preliminary idea</span>
            <span className="eyebrow">Jake × ELITA</span>
          </div>
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow muted">
                Capital partnership · Discussion draft
              </p>
              <h1>
                A potential
                <br />
                partnership.
                <br />
                <span>
                  An opportunity
                  <br />
                  worth exploring.
                </span>
              </h1>
              <p className="hero-description">
                A continuously available purchasing fund. A shared interest in
                considered growth.
              </p>
              <a className="primary-button" href="#simulator">
                Explore the proposal <Arrow />
              </a>
              <p className="hero-footnote">
                An idea for consideration. No decision required now.
              </p>
            </div>
            <div className="hero-aside">
              <div className="proposal-caption">
                <span className="eyebrow">The proposed starting point</span>
                <span className="folio">/ 001</span>
              </div>
              <div className="hero-capital">
                <span className="eyebrow">Committed purchasing capital</span>
                <strong>{money(assumptions.initialCapital * 100)}</strong>
                <p>
                  A revolving facility for qualifying
                  <br />
                  luxury-watch customer orders.
                </p>
              </div>
              <div
                className="capital-illustration"
                aria-label="Capital circulates through purchases, settlement and reinvestment"
              >
                <div className="orbital outer-orbit">
                  <span className="orbit-label top-label">PURCHASE</span>
                  <span className="orbit-label bottom-label">REINVEST</span>
                </div>
                <div className="orbital inner-orbit">
                  <span className="orbit-point point-a" />
                  <span className="orbit-point point-b" />
                </div>
                <div className="orbit-centre">
                  <span className="eyebrow">Capital</span>
                  <span>in motion</span>
                  <svg
                    viewBox="0 0 50 15"
                    width="50"
                    height="15"
                    aria-hidden="true"
                  >
                    <path
                      d="M0 7.5h48m-6-6 6 6-6 6"
                      fill="none"
                      stroke="currentColor"
                    />
                  </svg>
                </div>
                <span className="orbit-label settlement-label">SETTLE</span>
              </div>
              <div className="aside-bottom">
                <span>
                  Purchasing capacity.
                  <br />
                  Subject to real demand.
                </span>
                <span className="eyebrow">
                  {termLabel}
                  <br />
                  Proposed term
                </span>
              </div>
            </div>
          </div>
          <div className="hero-terms">
            <div>
              <span className="eyebrow">Trading profit allocation</span>
              <p>
                25<span className="unit">%</span>
                <span className="term-separator">/</span>75
                <span className="unit">%</span>
                <small>Jake / ELITA</small>
              </p>
            </div>
            <div>
              <span className="eyebrow">Capital availability fee</span>
              <p>
                4<span className="unit">% p.a.</span>
                <small>Separate from trading profit</small>
              </p>
            </div>
            <div>
              <span className="eyebrow">Review & exit opportunities</span>
              <p>
                90<span className="term-separator">/</span>180
                <small>Days · at either party’s election</small>
              </p>
            </div>
          </div>
          <div className="context-note">
            <span className="eyebrow">The context</span>
            <p>
              This would only be explored if both parties are pleased with how
              their existing commercial relationship develops. It is a
              preliminary proposal, subject to discussion, due diligence and
              formal agreement.
            </p>
          </div>
        </section>

        <section id="structure" className="motion-section">
          <div className="page-width">
            <SectionHeading
              number="02"
              label="Capital in motion"
              title="One fund. Many opportunities."
            >
              <p>
                Independent purchases. Independent settlements. Realised profits
                returned to work.
              </p>
            </SectionHeading>
            <div
              className="flow-diagram"
              aria-label="Capital recycling process"
            >
              {[
                "Available capital",
                "Watch purchases",
                "Customer settlement",
                "Profit allocation",
                "Reinvestment",
                "Greater capacity",
              ].map((label, i) => (
                <div key={label} className="flow-step">
                  <span className="eyebrow">0{i + 1}</span>
                  <p>{label}</p>
                  {i < 5 && <Arrow />}
                </div>
              ))}
            </div>
            <div className="motion-detail">
              <div className="settlement-lanes">
                <span className="eyebrow">
                  Multiple purchases, progressing independently
                </span>
                <div className="lane-axis">
                  <span>Funding</span>
                  <span>Cleared settlement</span>
                </div>
                {[
                  ["Illustrative purchase A", 68, "10 days"],
                  ["Illustrative purchase B", 86, "15 days"],
                  ["Illustrative purchase C", 100, "20 days"],
                ].map(([label, width, days], i) => (
                  <div className="purchase-lane" key={label}>
                    <span>{label}</span>
                    <div className="lane-track">
                      <div
                        style={{ width: `${width}%`, marginLeft: `${i * 3}%` }}
                      >
                        <i />
                        <span>{days}</span>
                        <i />
                      </div>
                    </div>
                  </div>
                ))}
                <p className="fine-print">
                  Illustration only. No group settlement requirement and no
                  reference to current transactions. Larger purchases use more
                  capital; they do not create demand.
                </p>
              </div>
              <div className="split-example">
                <span className="eyebrow">
                  An illustrative A$10,000 net trading profit
                </span>
                <div className="allocation-bar">
                  <span>25% Jake</span>
                  <span>75% ELITA</span>
                </div>
                <dl>
                  <div>
                    <dt>Jake · reinvested</dt>
                    <dd>A$2,500</dd>
                  </div>
                  <div>
                    <dt>ELITA · withdrawn</dt>
                    <dd>A$3,750</dd>
                  </div>
                  <div>
                    <dt>ELITA · reinvested</dt>
                    <dd>A$3,750</dd>
                  </div>
                </dl>
                <div className="reinvest-result">
                  <span>Added to the purchasing pool</span>
                  <strong>
                    + A$6,250 <Arrow />
                  </strong>
                </div>
                <p className="fine-print">
                  Potential capacity for higher-value pieces or several smaller
                  purchases, where qualifying customer demand exists.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="simulator" className="simulator-section page-width">
          <SectionHeading
            number="03"
            label="Explore the numbers"
            title="Change the assumptions. See the possibilities."
          >
            <p>
              An illustrative daily cash-flow model. The{" "}
              {DEFAULTS.settlementDays}-day default is a central illustration,
              not a proven operating average.
            </p>
          </SectionHeading>
          <div className="simulator-layout">
            <Controls value={assumptions} onChange={setModel} />
            <div className="model-results">
              <GrowthChart
                scenarios={scenarios}
                selected={active.assumptions.settlementDays}
                onSelect={setInspected}
                steady={steady}
              />
              <div
                className="model-readouts"
                aria-live="polite"
                aria-atomic="true"
              >
                <div>
                  <span className="eyebrow">
                    Fund at day {assumptions.termDays}
                  </span>
                  <strong>{money(active.atTerm.fund)}</strong>
                  <small>Before outstanding purchases settle</small>
                </div>
                <div>
                  <span className="eyebrow">Jake · total profit</span>
                  <strong>{money(p.jakeTotalProfit)}</strong>
                  <small>Trading allocation + availability fee</small>
                </div>
                <div>
                  <span className="eyebrow">ELITA · total profit</span>
                  <strong>{money(p.elitaNetProfit)}</strong>
                  <small>Trading allocation − availability fee</small>
                </div>
              </div>
              <p className="fine-print payout-timing">
                {active.windDownDays > 0
                  ? `Profit figures include settlement over ${active.windDownDays} further days after day ${assumptions.termDays}, at the modelled margins. They are not all available as cash on the selected day.`
                  : "No outstanding purchases require a further wind-down in this illustration."}
              </p>
              {steady && (
                <div className="stress-comparison">
                  <span className="eyebrow">
                    Second-half sensitivity ·{" "}
                    {active.assumptions.settlementDays} days
                  </span>
                  <p>
                    Fund at term: <strong>{money(active.atTerm.fund)}</strong>{" "}
                    under conservative conditions, compared with{" "}
                    <strong>{money(steady.atTerm.fund)}</strong> if conditions
                    remain steady.
                  </p>
                </div>
              )}
              <div className="model-qualification">
                <span className="eyebrow">Capacity is not demand</span>
                <p>
                  {assumptions.monthlyDemand === null
                    ? "These scenarios assume sufficient qualifying opportunities to fill the deployment budget. Enable the purchasing-demand ceiling to explore a smaller real pipeline."
                    : `Actual simulated purchases are capped at ${money(assumptions.monthlyDemand * 100)} of purchase cost per model month. Available capital can remain idle.`}
                </p>
              </div>
            </div>
          </div>
          <details className="methodology">
            <summary>
              <span>How the model works</span>
              <span className="eyebrow">
                Methodology & assumptions <span aria-hidden="true">+</span>
              </span>
            </summary>
            <div className="methodology-grid">
              <div>
                <span className="eyebrow">01 / Settle, then deploy</span>
                <p>
                  At the beginning of each day, each due purchase returns its
                  cost and realises its purchase-day margin. Only then are
                  profits allocated and new purchases funded. Each daily dollar
                  tranche settles independently after the chosen number of days.
                </p>
                <p>
                  Daily new purchases are limited to the smallest of cash
                  available, utilisation headroom, target deployed capital ÷
                  settlement days, and unused monthly demand. There is no
                  borrowing.
                </p>
              </div>
              <div>
                <span className="eyebrow">02 / Retain, then grow</span>
                <p>
                  Jake retains 25% of each realised profit. ELITA withdraws half
                  of its 75% allocation and retains the rest. The fund equals
                  original capital + Jake’s retained profit + ELITA’s retained
                  profit, also equal to cash + outstanding purchase cost.
                </p>
                <p>
                  With taper enabled, utilisation falls continuously by 5 points
                  per additional A$100,000 of fund growth, to 50%. A starting
                  setting below 50% is never increased by the taper.
                  Conservative conditions apply an additional 10-point
                  reduction.
                </p>
              </div>
              <div>
                <span className="eyebrow">03 / Stop, then wind down</span>
                <p>
                  New purchases stop at day {assumptions.termDays}. Existing
                  purchases settle over up to{" "}
                  {active.assumptions.settlementDays} further days. Payouts
                  include those later realised profits; the fund chart ends at
                  the selected term. This assumes orderly settlement at each
                  purchase’s modelled margin.
                </p>
                <p>
                  The fee is original capital × 4% × selected term days ÷ 365,
                  due separately from ELITA at termination or scheduled
                  maturity. It does not compound or reduce the profit before the
                  25/75 split. No extra fee is assumed during wind-down. Payout
                  totals aggregate the fee and later capital distributions;
                  actual payment dates would need formal agreement.
                </p>
              </div>
              <div>
                <span className="eyebrow">04 / Read as an illustration</span>
                <p>
                  Inputs use AUD. A year is 365 days; model months follow a
                  non-leap-year calendar from day 1, with partial final months
                  shown as such. Unused demand does not carry forward. No actual
                  calendar start date is implied.
                </p>
                <p>
                  Tranches model divisible purchase-cost dollars, not whole
                  watches or customer demand. Calculations use integer cents and
                  round each settlement and allocation; screen values round to
                  whole dollars. Excludes tax, FX movements, general overheads,
                  late settlement, default and actual trading losses.
                </p>
              </div>
            </div>
          </details>
        </section>

        <section id="earnings" className="earnings-section">
          <div className="page-width">
            <SectionHeading
              number="04"
              label="A shared outcome"
              title="What each party could earn."
            >
              <p>
                Same assumptions. Different settlement speeds. Every figure
                below includes settlement of purchases outstanding at the
                selected term.
              </p>
            </SectionHeading>
            <div className="earnings-heading">
              <span className="eyebrow">
                Inspecting {active.assumptions.settlementDays}-day settlement
              </span>
              <span className="fine-print">
                {termLabel} operating term + {active.windDownDays} days
                wind-down · before tax
              </span>
            </div>
            <div className="party-comparison">
              <div className="party jake">
                <div className="party-title">
                  <h3>Jake</h3>
                  <span className="eyebrow">25% of trading profit</span>
                </div>
                <span className="eyebrow muted">
                  Total profit, including fee
                </span>
                <strong className="party-value">
                  {money(p.jakeTotalProfit)}
                </strong>
                <dl>
                  <div>
                    <dt>Original capital</dt>
                    <dd>{money(p.principal)}</dd>
                  </div>
                  <div>
                    <dt>Trading profit · all reinvested</dt>
                    <dd>{money(p.jakeTradingProfit)}</dd>
                  </div>
                  <div>
                    <dt>Availability fee</dt>
                    <dd>{money(p.fee)}</dd>
                  </div>
                </dl>
                <div className="party-total">
                  <span>Final payout, including principal</span>
                  <strong data-testid="jake-payout">
                    {money(p.jakeFinalPayout)}
                  </strong>
                </div>
              </div>
              <div className="party elita">
                <div className="party-title">
                  <h3>ELITA</h3>
                  <span className="eyebrow">75% of trading profit</span>
                </div>
                <span className="eyebrow muted">Total profit, after fee</span>
                <strong className="party-value">
                  {money(p.elitaNetProfit)}
                </strong>
                <dl>
                  <div>
                    <dt>Total trading allocation</dt>
                    <dd>{money(p.elitaTradingProfit)}</dd>
                  </div>
                  <div>
                    <dt>Withdrawn as purchases settle</dt>
                    <dd>{money(p.elitaWithdrawn)}</dd>
                  </div>
                  <div>
                    <dt>Retained and reinvested</dt>
                    <dd>{money(p.elitaRetained)}</dd>
                  </div>
                </dl>
                <div className="party-total">
                  <span>Final lump sum, less {money(p.fee)} fee</span>
                  <strong data-testid="elita-payout">
                    {money(p.elitaFinalPayout)}
                  </strong>
                </div>
              </div>
            </div>
            <p className="fine-print party-note">
              ELITA’s total profit equals its periodic withdrawals plus its
              final lump sum. This is transaction-level profit before general
              overheads and tax, not Aston’s personal net income. A negative
              final lump sum means ELITA must contribute external funds to pay
              the fee.
            </p>
            <ProfitChart scenarios={scenarios} />
            <div className="table-scroll">
              <table className="financial-table" data-testid="payout-table">
                <caption>
                  Reconciled outcomes · all scenarios use the same inputs except
                  settlement days · AUD, rounded
                </caption>
                <thead>
                  <tr>
                    <th scope="col">After orderly wind-down</th>
                    {scenarios.map((s, i) => (
                      <th
                        key={i}
                        scope="col"
                        className={s === active ? "selected-column" : ""}
                      >
                        <span
                          className="table-legend"
                          style={{ background: COLOURS[i] }}
                        />
                        {s.assumptions.settlementDays} days
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payoutRows.map((row) => (
                    <tr
                      key={row.key}
                      className={`${row.total ? "total-row" : ""} ${row.group ? "group-start" : ""}`}
                    >
                      <th scope="row">
                        {row.group && (
                          <span className="row-group eyebrow">{row.group}</span>
                        )}
                        {row.label}
                      </th>
                      {scenarios.map((s) => (
                        <td
                          key={s.assumptions.settlementDays}
                          className={s === active ? "selected-column" : ""}
                        >
                          {money(s.payout[row.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="export-toolbar">
              <p className="fine-print">
                Export the current assumptions, exact cents, and daily
                settlement ledger.
              </p>
              <div>
                <button
                  className="outline-button"
                  onClick={() => exportFile("json")}
                >
                  <DownloadIcon /> Model JSON
                </button>
                <button
                  className="outline-button"
                  onClick={() => exportFile("csv")}
                >
                  <DownloadIcon /> Daily CSV
                </button>
                <button
                  className="outline-button"
                  onClick={() => window.print()}
                >
                  Print / PDF <Arrow diagonal />
                </button>
              </div>
              <span className="export-status" role="status">
                {exported}
              </span>
            </div>
          </div>
        </section>

        <section id="benefits" className="benefits-section page-width">
          <SectionHeading
            number="05"
            label="Aligned interests"
            title="A considered benefit on both sides."
          />
          <div className="benefits-grid">
            <div>
              <span className="eyebrow muted">For the capital partner</span>
              <h3>
                Participation.
                <br />
                With a clear framework.
              </h3>
              <ul>
                <li>
                  A share of net trading profits, with reinvestment potential.
                </li>
                <li>Compensation for continuously available capital.</li>
                <li>
                  Transparency over capital, transactions and allocations.
                </li>
                <li>Defined review and termination opportunities.</li>
                <li>
                  A basis to explore a longer-term commercial relationship.
                </li>
              </ul>
            </div>
            <div>
              <span className="eyebrow muted">For ELITA / Aston</span>
              <h3>
                Capacity.
                <br />
                With room to develop.
              </h3>
              <ul>
                <li>
                  Dependable purchasing capital for qualifying confirmed orders.
                </li>
                <li>
                  Faster execution and several purchases funded concurrently.
                </li>
                <li>
                  Capacity for higher-value pieces where real demand exists.
                </li>
                <li>
                  Half of ELITA’s trading allocation available as periodic cash.
                </li>
                <li>
                  Growth in retained capital without matching the initial
                  contribution immediately.
                </li>
                <li>A potentially scalable source of long-term funding.</li>
              </ul>
            </div>
          </div>
          <div className="safeguards">
            <div>
              <span className="eyebrow">Proposed operating safeguards</span>
              <h3>Clarity before commitment.</h3>
              <p>
                Terms would require independent legal and tax review before
                implementation.
              </p>
            </div>
            <ol>
              <li>
                Dedicated facility account or a documented segregated accounting
                arrangement; no unrelated use of funds.
              </li>
              <li>
                Live watch-level transaction register and a monthly statement of
                cash, active deals, allocations, withdrawals, capital ownership
                and accrued fees.
              </li>
              <li>
                Explicit treatment of foreign exchange, payment costs,
                termination, wind-down, reconciliation and capital repayment.
              </li>
            </ol>
          </div>
          <div className="risk-note">
            <span className="eyebrow">Capital remains at risk</span>
            <p>
              ELITA would be responsible for trading losses under the proposed
              funding structure, subject to formal agreement. That obligation
              depends on ELITA’s ability to perform. It does not make the
              capital secured or risk-free. A dedicated bank account alone does
              not create legal security.
            </p>
          </div>
        </section>

        <section id="viability" className="viability-section">
          <div className="page-width">
            <SectionHeading
              number="06"
              label="Commercial viability"
              title="The central consideration."
            />
            <div className="central-question">
              <p>
                Can ELITA consistently deploy this level of purchasing capital
                into genuinely profitable customer transactions without
                accepting weaker deals or unnecessary additional risk?
              </p>
              <p>
                And as the fund grows, are there sufficient opportunities for
                larger, higher-value pieces to make productive use of the
                additional capital?
              </p>
            </div>
            <div className="viability-table-heading">
              <div>
                <span className="eyebrow">
                  The volume behind the illustration
                </span>
                <p>Compare the initial month with a later point in the term.</p>
              </div>
              <div className="month-selector">
                <label htmlFor="model-month">Inspect period</label>
                <select
                  id="model-month"
                  value={selectedMonth}
                  onChange={(e) => setMonth(Number(e.target.value))}
                >
                  {active.months.map((m) => (
                    <option key={m.month} value={m.month}>
                      Month {m.month}
                      {m.lastDay - m.firstDay + 1 !==
                      [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][
                        m.month - 1
                      ]
                        ? " (partial)"
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="table-scroll">
              <table className="viability-table" data-testid="viability-table">
                <caption>
                  Month {selectedMonth} · days{" "}
                  {active.months[selectedMonth - 1].firstDay}–
                  {active.months[selectedMonth - 1].lastDay} · purchase cost,
                  not sale revenue
                </caption>
                <thead>
                  <tr>
                    <th scope="col">
                      Settlement
                      <br />
                      scenario
                    </th>
                    <th scope="col">
                      Purchases without
                      <br />a demand ceiling¹
                    </th>
                    <th scope="col">
                      Actual simulated
                      <br />
                      funded volume
                    </th>
                    <th scope="col">
                      End-period
                      <br />
                      fund capacity²
                    </th>
                    <th scope="col">
                      Committed to
                      <br />
                      open purchases
                    </th>
                    <th scope="col">
                      Cash available for
                      <br />
                      new transactions³
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scenarios.map((s, i) => {
                    const m = s.months[selectedMonth - 1];
                    return (
                      <tr
                        key={i}
                        className={s === active ? "active-scenario" : ""}
                      >
                        <th scope="row">
                          <span
                            className="table-legend"
                            style={{ background: COLOURS[i] }}
                          />
                          {s.assumptions.settlementDays} days
                        </th>
                        <td>
                          {money(
                            capacityScenarios[i].months[selectedMonth - 1]
                              .funded,
                          )}
                        </td>
                        <td>{money(m.funded)}</td>
                        <td>{money(m.end.fund)}</td>
                        <td>{money(m.end.committed)}</td>
                        <td>{money(m.end.cash)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="viability-notes">
              <p>
                ¹ A companion run of the same daily model with the demand
                ceiling removed. This is the purchase-cost volume needed for
                that capacity case; it is not a pipeline forecast.
              </p>
              <p>
                ² Cash + open purchase cost, including retained realised
                profits. This is a balance, while funded volume is a flow and
                can exceed it as capital is recycled.
              </p>
              <p>
                ³ All cash remains in the fund; only utilisation headroom may be
                deployed. For the inspected {active.assumptions.settlementDays}
                -day scenario, that headroom is{" "}
                {money(active.months[selectedMonth - 1].end.availableForNew)} at
                a {percent(active.months[selectedMonth - 1].end.utilisation)}{" "}
                target. Demand can impose a further limit.
              </p>
            </div>
            <div className="closing-note">
              <span className="eyebrow">
                A conversation, when the time is right.
              </span>
              <p>
                No commitment is requested. If the relationship and the
                commercial evidence support it, the next step could be a mutual
                review of this framework. Any renewal, increased contribution or
                further partnership discussion after 12 months would be by
                mutual agreement.
              </p>
              <a href="#simulator" className="text-link">
                Return to the assumptions <Arrow />
              </a>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer page-width">
        <img src="/brand/elita-logo.png" alt="ELITA" width="110" height="17" />
        <div>
          <span className="eyebrow">
            Private & confidential · Discussion draft
          </span>
          <p>
            Hypothetical, non-binding and subject to formal agreement.
            <br />
            All figures in Australian dollars. Not a forecast or investment
            recommendation.
          </p>
        </div>
        <a href="#opportunity" className="text-link">
          Back to the beginning ↑
        </a>
      </footer>
    </>
  );
}
