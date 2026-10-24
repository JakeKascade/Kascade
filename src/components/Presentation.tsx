"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  availabilityFee,
  compare,
  DEFAULTS,
  MONTH_LENGTHS,
  money,
  percent,
  simulate,
  TERMS,
  type Assumptions,
  type Simulation,
} from "@/lib/model";
import { exportCsv, exportResults } from "@/lib/export";
import Controls from "./Controls";
import ProfitSplit from "./ProfitSplit";
import BrandTexture from "./BrandTexture";
import { FundChart, MonthBars, lineStyles, type Bar } from "./Charts";
import { Disclosure, DownloadIcon, Money } from "./Primitives";

const breakdownRows: {
  label: string;
  key: keyof Simulation["payout"];
  total?: boolean;
  group?: string;
  negative?: boolean;
}[] = [
  {
    label: "75% share of net trading profit",
    key: "elitaTradingProfit",
    group: "ELITA",
  },
  { label: "Withdrawn as sales settle (50%)", key: "elitaWithdrawn" },
  { label: "Retained in the fund (50%)", key: "elitaRetained" },
  { label: "Availability fee paid to Jake", key: "fee", negative: true },
  { label: "Final lump sum, after fee", key: "elitaFinalPayout", total: true },
  {
    label: "Total net profit (withdrawals + lump sum)",
    key: "elitaNetProfit",
    total: true,
  },
  { label: "Original contribution", key: "principal", group: "Jake" },
  {
    label: "25% share of net trading profit, reinvested",
    key: "jakeTradingProfit",
  },
  { label: "Availability fee", key: "fee" },
  { label: "Total profit, including fee", key: "jakeTotalProfit", total: true },
  {
    label: "Final payout, including original capital",
    key: "jakeFinalPayout",
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
const isPartial = (m: Simulation["months"][number]) =>
  m.lastDay - m.firstDay + 1 !== MONTH_LENGTHS[m.month - 1];
const monthName = (m: Simulation["months"][number]) =>
  `Month ${m.month}${isPartial(m) ? " (part)" : ""}`;

const GROUPS = [
  { id: "proposal", number: "01", label: "Proposal" },
  { id: "numbers", number: "02", label: "Numbers" },
  { id: "gains", number: "03", label: "Gains" },
  { id: "viability", number: "04", label: "Viability" },
] as const;
type Group = (typeof GROUPS)[number]["id"];

export default function Presentation() {
  const [assumptions, setAssumptions] = useState<Assumptions>({ ...DEFAULTS });
  const [month, setMonth] = useState(1);
  const [termsTab, setTermsTab] = useState<"exit" | "risk" | "model">("exit");
  const [exported, setExported] = useState("");
  const [party, setParty] = useState<"elita" | "jake">("elita");
  const [current, setCurrent] = useState<Group>("proposal");
  const scenarioDialog = useRef<HTMLDialogElement>(null);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [monthPicked, setMonthPicked] = useState(false);
  const [monthsHeld, setMonthsHeld] = useState(false);
  const [monthsVisible, setMonthsVisible] = useState(false);
  const progress = useRef<HTMLSpanElement>(null);

  // Marks the page as interactive (used by the browser tests before typing).
  useEffect(() => {
    document.documentElement.dataset.ready = "true";
  }, []);

  // Quiet fade-in for each panel as it arrives.
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    )
      return;
    const root = document.documentElement;
    root.classList.add("motion");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }),
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
    );
    document
      .querySelectorAll("[data-reveal]")
      .forEach((el) => observer.observe(el));
    const reveal = () =>
      document
        .querySelectorAll("[data-reveal]")
        .forEach((el) => el.classList.add("is-in"));
    window.addEventListener("beforeprint", reveal);
    return () => {
      observer.disconnect();
      window.removeEventListener("beforeprint", reveal);
      root.classList.remove("motion");
    };
  }, []);

  // A thin line under the header that fills as the page is read.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = document.documentElement;
      const range = el.scrollHeight - window.innerHeight;
      const share = range > 0 ? Math.min(1, el.scrollTop / range) : 0;
      progress.current?.style.setProperty("--progress", String(share));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  // Track which of the four areas is in view, for the header navigation.
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting)
            setCurrent(entry.target.getAttribute("data-group") as Group);
        }),
      { rootMargin: "-50% 0px -50% 0px" },
    );
    document.querySelectorAll(".panel").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Only cycle the months while that panel is on screen.
  useEffect(() => {
    const el = document.getElementById("viability");
    if (!el || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => setMonthsVisible(entry.isIntersecting),
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scenarios = useMemo(() => compare(assumptions), [assumptions]);
  const activeIndex = scenarios.findIndex(
    (s) => s.assumptions.settlementDays === assumptions.settlementDays,
  );
  const active = scenarios[activeIndex];
  // Required volume comes from the same engine with only the demand ceiling removed.
  const capacity = useMemo(
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
        ? simulate({ ...assumptions, conditions: "steady" })
        : undefined,
    [assumptions],
  );
  const activeCapacity = capacity[activeIndex];
  const p = active.payout;
  const termLabel =
    assumptions.termDays === 365 ? "12 months" : `${assumptions.termDays} days`;
  const selectedMonth = Math.min(month, active.months.length);
  const monthCount = active.months.length;
  // Step through the months until someone picks one; hovering pauses.
  useEffect(() => {
    if (monthPicked || monthsHeld || !monthsVisible) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(
      () => setMonth((m) => (m >= monthCount ? 1 : m + 1)),
      1800,
    );
    return () => clearTimeout(timer);
  }, [month, monthPicked, monthsHeld, monthsVisible, monthCount]);
  const monthRow = active.months[selectedMonth - 1];
  const monthCapacity = activeCapacity.months[selectedMonth - 1];
  const firstNeed = activeCapacity.months[0];
  const lastNeed = activeCapacity.months[activeCapacity.months.length - 1];
  const styles = lineStyles(scenarios, assumptions.settlementDays);
  const days = scenarios.map((s) => s.assumptions.settlementDays);
  const compareDays = `${days.slice(0, -1).join(", ")} and ${days[days.length - 1]}`;

  // ELITA's cash withdrawals by month, plus any from purchases settling after the term.
  let previous = 0;
  const withdrawals: Bar[] = active.months.map((m) => {
    const amount = m.end.elitaWithdrawn - previous;
    previous = m.end.elitaWithdrawn;
    return {
      key: m.month,
      label: String(m.month),
      value: amount,
      aria: `${monthName(m)}: ${money(amount)} withdrawn`,
    };
  });
  const afterTerm = p.elitaWithdrawn - active.atTerm.elitaWithdrawn;
  if (afterTerm > 0)
    withdrawals.push({
      key: "after",
      label: "+",
      value: afterTerm,
      aria: `After day ${assumptions.termDays}, as open purchases settle: ${money(afterTerm)} withdrawn`,
    });

  const principal = DEFAULTS.initialCapital * 100;
  const setModel = (next: Assumptions) => {
    // Starting capital is a fixed term of the proposal, not a modelling input.
    setAssumptions({ ...next, initialCapital: DEFAULTS.initialCapital });
    setExported("");
  };
  const openScenario = () => {
    setScenarioOpen(true);
    scenarioDialog.current?.showModal();
  };
  const closeScenario = () => scenarioDialog.current?.close();
  const adjusted = (
    [
      "settlementDays",
      "utilisation",
      "margin",
      "termDays",
      "taper",
      "monthlyDemand",
      "conditions",
    ] as const
  ).some((key) => assumptions[key] !== DEFAULTS[key]);
  const scenarioSummary = `${assumptions.settlementDays} days · ${percent(assumptions.utilisation)} · ${percent(assumptions.margin)} · ${
    assumptions.termDays === 365 ? "12 mo" : `${assumptions.termDays} d`
  }`;
  const openMethodology = () => {
    setTermsTab("model");
    requestAnimationFrame(() =>
      document.getElementById("terms")?.scrollIntoView({ behavior: "smooth" }),
    );
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
      `${format.toUpperCase()} downloaded with all three settlement scenarios and the current assumptions.`,
    );
  };

  return (
    <>
      <a className="skip-link" href="#numbers">
        Skip to the numbers
      </a>
      <header className="site-header">
        <div className="wrap header-inner">
          {/* Supplied ELITA artwork, reproduced in white as the brand guidelines permit. */}
          <a
            className="brand"
            href="#proposal"
            aria-label="ELITA, back to the top"
          >
            <img
              src="/brand/elita-logo-white.png"
              alt="ELITA"
              width="104"
              height="16"
            />
          </a>
          <nav aria-label="Sections">
            {GROUPS.map((g) => (
              <a
                key={g.id}
                href={`#${g.id}`}
                aria-current={current === g.id ? "true" : undefined}
              >
                <span>{g.number}</span>
                {g.label}
              </a>
            ))}
          </nav>
          <button
            type="button"
            className="scenario-button"
            onClick={openScenario}
            aria-haspopup="dialog"
            aria-label={`Scenario: ${scenarioSummary}${adjusted ? ", adjusted" : ""}. Change the figures used across the page`}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M3 5h9M16 5h1M3 10h3M10 10h7M3 15h7M14 15h3" />
              <circle cx="14" cy="5" r="2" />
              <circle cx="8" cy="10" r="2" />
              <circle cx="12" cy="15" r="2" />
            </svg>
            <span className="scenario-label">Scenario</span>
            <span className="scenario-summary">{scenarioSummary}</span>
            <span className="scenario-edit">Edit scenario</span>
            {adjusted && <span className="scenario-dot" aria-hidden="true" />}
          </button>
        </div>
        <span className="read-progress" ref={progress} aria-hidden="true" />
      </header>

      {/* The same dials as the calculator, reachable from anywhere on the page. */}
      <dialog
        ref={scenarioDialog}
        className="scenario"
        aria-labelledby="scenario-title"
        onClose={() => setScenarioOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeScenario();
        }}
      >
        {/* Mounted only while open, so the page never holds a hidden second set of dials. */}
        {scenarioOpen && (
          <div className="scenario-inner">
            <div className="scenario-head">
              <h2 id="scenario-title">Scenario</h2>
              <button
                type="button"
                className="scenario-close"
                onClick={closeScenario}
                aria-label="Close the scenario panel"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M5 5l10 10M15 5L5 15" />
                </svg>
              </button>
            </div>
            <p className="scenario-note">
              Every figure on this page follows these settings: the calculator,
              both partners’ results and the viability numbers. Set them at
              realistic or target benchmarks.
            </p>
            <dl className="scenario-results" aria-live="polite">
              <div>
                <dt>ELITA’s potential profit</dt>
                <dd className="is-out">
                  <Money cents={p.elitaNetProfit} />
                </dd>
              </div>
              <div>
                <dt>Jake’s potential profit</dt>
                <dd>
                  <Money cents={p.jakeTotalProfit} />
                </dd>
              </div>
            </dl>
            <Controls
              idPrefix="s-"
              value={assumptions}
              onChange={setModel}
              onMethodology={() => {
                closeScenario();
                openMethodology();
              }}
            />
            <div className="scenario-actions">
              <button
                type="button"
                className="text-button"
                onClick={() => setModel({ ...DEFAULTS })}
              >
                Reset to the proposal
              </button>
              <button
                type="button"
                className="scenario-done"
                onClick={closeScenario}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </dialog>

      <main>
        {/* 01 — The proposal */}
        <section
          id="proposal"
          className="panel panel-hero"
          data-group="proposal"
        >
          <BrandTexture />
          <div className="wrap">
            <div className="section-head" data-reveal>
              <div>
                <p className="index">
                  <span>01</span>The proposal
                </p>
                <h1>A purchasing fund we grow together.</h1>
              </div>
              <p className="lead">
                An idea for us to consider, if we’re both happy with how our
                current work together develops. I’d make {money(principal)}{" "}
                available for ELITA’s purchases, and we’d share the profit from
                every successful sale.
              </p>
            </div>
            <dl className="terms" data-reveal>
              <div>
                <dt>Starting capital</dt>
                <dd>
                  <strong>{money(principal)}</strong>
                  <span className="term-note">
                    A fixed, revolving facility for qualifying purchases.
                  </span>
                </dd>
              </div>
              <div>
                <dt>Trading-profit split</dt>
                <dd>
                  <strong>
                    {TERMS.jakeShare * 100} <span>/</span>{" "}
                    {TERMS.elitaShare * 100}
                  </strong>
                  <span className="term-note">
                    Jake / ELITA, on realised net trading profit.
                  </span>
                </dd>
              </div>
              <div>
                <dt>Availability fee</dt>
                <dd>
                  <strong>
                    {TERMS.annualFee * 100}% <span>a year</span>
                  </strong>
                  <span className="term-note">
                    On the original capital. Separate from the split.
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section
          className="panel"
          data-group="proposal"
          aria-labelledby="sale-title"
        >
          <div className="wrap sale" data-reveal>
            <div className="sale-copy">
              <h2 id="sale-title" className="panel-title">
                When a watch sells
              </h2>
              <p>
                Here’s what happens to a hypothetical {money(1_000_000)} of net
                trading profit from one sale.
              </p>
              <p className="sale-line">
                Every successful sale generates cash flow for ELITA while
                increasing the capital available for the next opportunity.
              </p>
              <p className="fine">
                The availability fee sits outside this split: ELITA pays{" "}
                {TERMS.annualFee * 100}% a year on the original{" "}
                {money(principal)}, which is{" "}
                {money(availabilityFee(principal, 365))} over 12 months or{" "}
                {money(availabilityFee(principal, 90))} if it ends at 90 days.
              </p>
            </div>
            <ProfitSplit principal={principal} />
          </div>
        </section>

        <section
          className="panel panel-evolve"
          data-group="proposal"
          aria-labelledby="evolve-title"
        >
          <div className="wrap evolve" data-reveal>
            <div className="evolve-head">
              <h2 id="evolve-title" className="panel-title">
                Why evolve the arrangement?
              </h2>
            </div>
            <ul className="advantages">
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
                </svg>
                <h3>Less friction, faster execution</h3>
                <p>
                  ELITA could draw on an established pool of capital, within
                  agreed limits, instead of arranging funding deal by deal.
                </p>
              </li>
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <h3>Clear visibility of purchasing capacity</h3>
                <p>
                  A shared register would show what’s committed, what’s
                  available and each partner’s retained profit, so ELITA can
                  plan ahead.
                </p>
              </li>
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="6" cy="5" r="2" />
                  <circle cx="6" cy="19" r="2" />
                  <circle cx="18" cy="7" r="2" />
                  <path d="M6 7v10M18 9c0 5-12 3-12 8" />
                </svg>
                <h3>Independent deals running concurrently</h3>
                <p>
                  Several watches could be funded at once, each settling on its
                  own timeline, so one slow sale wouldn’t hold up the rest.
                </p>
              </li>
            </ul>
            <div className="evolve-takeaway">
              <p>Less friction. Greater visibility. More flexibility.</p>
              <p>
                A dedicated purchasing facility that allows multiple deals to
                progress independently, while realised profits support ELITA’s
                cash flow and build the fund over time.
              </p>
              <p className="fine">
                All subject to real demand, available capital, agreed operating
                controls and transaction performance.
              </p>
            </div>
          </div>
        </section>

        {/* 02 — Explore the numbers */}
        <section
          id="numbers"
          className="panel panel-numbers tone-alt"
          data-group="numbers"
        >
          {/* Side by side on wider screens; stacked on one screen on phones. */}
          <div className="wrap calc-layout">
            <div className="section-head calc-head" data-reveal>
              <h2 className="section-title">
                <span>02</span>Explore the numbers
              </h2>
              <p className="lead">
                Set these at realistic, achievable levels. Every figure in the
                sections that follow is calculated from them, and you can change
                them at any time from Scenario in the header.
              </p>
              {/* The same point, in one line for compact screens. */}
              <p className="calc-note">
                Use realistic figures: everything below uses them.
              </p>
              <p className="calc-capital">
                <strong>{money(principal)}</strong> fixed
              </p>
            </div>
            <div className="calc-main" data-reveal>
              <dl className="results" aria-live="polite" aria-atomic="true">
                <div>
                  <dt>ELITA’s potential profit</dt>
                  <dd>
                    <Money cents={p.elitaNetProfit} testId="elita-profit" />
                    <small>
                      Cash withdrawals plus final lump sum, after the fee
                    </small>
                  </dd>
                </div>
                <div>
                  <dt>Jake’s potential profit</dt>
                  <dd>
                    <Money cents={p.jakeTotalProfit} testId="jake-profit" />
                    <small>25% profit share plus the availability fee</small>
                  </dd>
                </div>
              </dl>
              <FundChart
                scenarios={scenarios}
                selected={assumptions.settlementDays}
                steady={steady}
                termLabel={termLabel}
              />
            </div>
            <div className="calc-dials" data-reveal>
              <Controls
                value={assumptions}
                onChange={setModel}
                onMethodology={openMethodology}
              />
            </div>
          </div>
        </section>

        {/* 03 — What we both gain */}
        <section id="gains" className="panel" data-group="gains">
          <div className="wrap">
            <div className="section-head" data-reveal>
              {adjusted && (
                <button
                  type="button"
                  className="adjusted-note"
                  onClick={openScenario}
                  aria-haspopup="dialog"
                >
                  <i aria-hidden="true" />
                  Scenario adjusted
                  <span>{scenarioSummary}</span>
                </button>
              )}
              <h2 className="section-title">
                <span>03</span>What we both gain
              </h2>
              <p className="lead">
                ELITA earns three-quarters of the trading profit, draws half of
                it as cash along the way, and leaves the rest working in the
                fund.
              </p>
            </div>
            <div
              className="party-tabs"
              role="group"
              aria-label="Show a partner"
            >
              <button
                type="button"
                aria-pressed={party === "elita"}
                onClick={() => setParty("elita")}
              >
                ELITA <Money cents={p.elitaNetProfit} className="tab-figure" />
              </button>
              <button
                type="button"
                aria-pressed={party === "jake"}
                onClick={() => setParty("jake")}
              >
                Jake <Money cents={p.jakeTotalProfit} className="tab-figure" />
              </button>
            </div>
            <div className="parties" data-reveal>
              <article
                className="party"
                data-hidden={party !== "elita"}
                aria-labelledby="elita-name"
              >
                <div className="party-head">
                  <h3 id="elita-name">ELITA</h3>
                  <p className="party-label">Total potential profit</p>
                </div>
                <div className="party-figure">
                  <Money cents={p.elitaNetProfit} className="party-total" />
                  <p className="party-sub">Without contributing capital</p>
                </div>
                <dl className="ledger">
                  <div>
                    <dt>75% share of net trading profit</dt>
                    <dd>
                      <Money cents={p.elitaTradingProfit} />
                    </dd>
                  </div>
                  <div className="ledger-sub ledger-cash">
                    <dt>
                      <span className="legend-long">
                        Withdrawn as cash as sales settle (50%)
                      </span>
                      <span className="legend-short">
                        Withdrawn as cash (50%)
                      </span>
                    </dt>
                    <dd>
                      <Money cents={p.elitaWithdrawn} />
                    </dd>
                    <dd className="ledger-bars">
                      <MonthBars
                        bars={withdrawals}
                        label={`ELITA’s cash withdrawals by month, totalling ${money(p.elitaWithdrawn)}`}
                      />
                    </dd>
                  </div>
                  <div className="ledger-sub">
                    <dt>Retained in the fund (50%)</dt>
                    <dd>
                      <Money cents={p.elitaRetained} />
                    </dd>
                  </div>
                  <div className="ledger-sub">
                    <dt>Less the availability fee</dt>
                    <dd>
                      −<Money cents={p.fee} />
                    </dd>
                  </div>
                  <div className="ledger-total">
                    <dt>
                      {p.elitaFinalPayout < 0
                        ? "Fee top-up due from ELITA at the end"
                        : "Final lump sum at the end"}
                    </dt>
                    <dd>
                      <Money
                        cents={Math.abs(p.elitaFinalPayout)}
                        testId="elita-payout"
                      />
                    </dd>
                  </div>
                </dl>
              </article>
              <article
                className="party"
                data-hidden={party !== "jake"}
                aria-labelledby="jake-name"
              >
                <div className="party-head">
                  <h3 id="jake-name">Jake</h3>
                  <p className="party-label">Total potential profit</p>
                </div>
                <div className="party-figure">
                  <Money cents={p.jakeTotalProfit} className="party-total" />
                  <p className="party-sub">
                    {percent(p.jakeTotalProfit / p.principal)} on the{" "}
                    {money(p.principal)} over {termLabel}
                  </p>
                </div>
                <dl className="ledger">
                  <div>
                    <dt>Original contribution, returned at the end</dt>
                    <dd>
                      <Money cents={p.principal} />
                    </dd>
                  </div>
                  <div>
                    <dt>25% share of net trading profit, all reinvested</dt>
                    <dd>
                      <Money cents={p.jakeTradingProfit} />
                    </dd>
                  </div>
                  <div>
                    <dt>
                      Availability fee, {TERMS.annualFee * 100}% a year on the
                      original capital
                    </dt>
                    <dd>
                      <Money cents={p.fee} />
                    </dd>
                  </div>
                  <div className="ledger-total">
                    <dt>Final payout, including original capital</dt>
                    <dd>
                      <Money cents={p.jakeFinalPayout} testId="jake-payout" />
                    </dd>
                  </div>
                </dl>
              </article>
            </div>
            <p className="fine gains-note">
              {active.windDownDays > 0
                ? `Includes purchases still settling for ${active.windDownDays} days after day ${assumptions.termDays}, at their modelled margins.`
                : "No purchases are still open at the end of the period."}{" "}
              {assumptions.monthlyDemand === null
                ? "Assumes enough qualifying purchases to use the capital."
                : `Purchases are capped at ${money(assumptions.monthlyDemand * 100)} of cost a month, so some capital may wait.`}
            </p>
            <Disclosure label="View detailed breakdown" className="breakdown">
              <div className="table-scroll">
                <table className="data-table" data-testid="payout-table">
                  <caption>
                    After orderly wind-down of open purchases. Each column uses
                    the same assumptions except settlement time. AUD, rounded.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">{termLabel} operating period</th>
                      {scenarios.map((s, i) => (
                        <th scope="col" key={i} data-active={i === activeIndex}>
                          {s.assumptions.settlementDays}-day settlement
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="group-start">
                      <th scope="row">
                        <span className="row-group">Fund</span>Combined fund at
                        day {assumptions.termDays}
                      </th>
                      {scenarios.map((s, i) => (
                        <td key={i} data-active={i === activeIndex}>
                          {money(s.atTerm.fund)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row">After open purchases settle</th>
                      {scenarios.map((s, i) => (
                        <td key={i} data-active={i === activeIndex}>
                          {money(s.afterWindDown.fund)}
                        </td>
                      ))}
                    </tr>
                    {breakdownRows.map((row) => (
                      <tr
                        key={`${row.group}-${row.key}-${row.label}`}
                        className={`${row.total ? "total-row" : ""} ${row.group ? "group-start" : ""}`}
                      >
                        <th scope="row">
                          {row.group && (
                            <span className="row-group">{row.group}</span>
                          )}
                          {row.label}
                        </th>
                        {scenarios.map((s, i) => (
                          <td key={i} data-active={i === activeIndex}>
                            {row.negative ? "−" : ""}
                            {money(s.payout[row.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="fine">
                ELITA’s total net profit equals its withdrawals plus its final
                lump sum. It’s transaction-level profit before overheads and
                tax. A negative lump sum would mean ELITA pays the fee from
                outside the fund; Jake’s original capital is never used for it.
              </p>
            </Disclosure>
          </div>
        </section>

        {/* 04 — Is this viable? */}
        <section
          id="viability"
          className="panel tone-alt"
          data-group="viability"
        >
          <div
            className="wrap"
            onPointerEnter={() => setMonthsHeld(true)}
            onPointerLeave={() => setMonthsHeld(false)}
            onFocus={() => setMonthsHeld(true)}
            onBlur={() => setMonthsHeld(false)}
          >
            <div className="section-head" data-reveal>
              {adjusted && (
                <button
                  type="button"
                  className="adjusted-note"
                  onClick={openScenario}
                  aria-haspopup="dialog"
                >
                  <i aria-hidden="true" />
                  Scenario adjusted
                  <span>{scenarioSummary}</span>
                </button>
              )}
              <h2 className="section-title">
                <span>04</span>Is this viable?
              </h2>
              <p className="lead">
                The growth assumes the capital stays at work. This is the
                purchasing it takes each month, at purchase cost rather than
                sales revenue.
              </p>
            </div>
            <div className="months" data-reveal>
              <div className="months-chart">
                <p className="months-hint">
                  At {assumptions.settlementDays}-day settlement. Tap or click
                  any month to see its figures.
                </p>
                <MonthBars
                  bars={activeCapacity.months.map((m) => ({
                    key: m.month,
                    label: String(m.month),
                    value: m.funded,
                    aria: `${monthName(m)}: ${money(m.funded)} of purchasing needed`,
                  }))}
                  selected={selectedMonth}
                  onSelect={(k) => {
                    setMonthPicked(true);
                    setMonth(Number(k));
                  }}
                  cap={
                    assumptions.monthlyDemand === null
                      ? null
                      : assumptions.monthlyDemand * 100
                  }
                  capLabel={
                    assumptions.monthlyDemand === null
                      ? undefined
                      : `Demand ceiling ${money(assumptions.monthlyDemand * 100)}`
                  }
                  label="Monthly purchasing volume needed. Select a month."
                />
              </div>
              <div
                className="month-detail"
                data-testid="month-detail"
                aria-live={monthPicked ? "polite" : "off"}
              >
                <p className="month-name">
                  {monthName(monthRow)} · days {monthRow.firstDay}–
                  {monthRow.lastDay}
                </p>
                <dl>
                  <div>
                    <dt>Purchasing needed</dt>
                    <dd>
                      {money(monthCapacity.funded)}
                      <small>
                        Funded purchase cost this month, if demand allows
                      </small>
                    </dd>
                  </div>
                  <div>
                    <dt>Actual purchasing demand</dt>
                    {assumptions.monthlyDemand === null ? (
                      <dd>
                        Not limited
                        <small>Assumes enough qualifying opportunities</small>
                      </dd>
                    ) : (
                      <dd>
                        {money(monthRow.funded)}
                        <small>
                          Funded within a{" "}
                          {money(assumptions.monthlyDemand * 100)} ceiling
                        </small>
                      </dd>
                    )}
                  </div>
                  <div>
                    <dt>Committed to purchases</dt>
                    <dd>
                      {money(monthRow.end.committed)}
                      <small>Balance at month end</small>
                    </dd>
                  </div>
                  <div>
                    <dt>Available capital</dt>
                    <dd>
                      {money(monthRow.end.cash)}
                      <small>
                        {money(monthRow.end.availableForNew)} deployable at the{" "}
                        {percent(monthRow.end.utilisation)} target
                      </small>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            <Disclosure
              label={`Compare ${compareDays}-day settlement`}
              className="volume-compare"
            >
              <div className="table-scroll">
                <table
                  className="data-table volume-table"
                  data-testid="volume-table"
                >
                  <caption>
                    Monthly purchasing volume needed, with no demand ceiling
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">
                        <span className="legend-long">
                          Average settlement time
                        </span>
                        <span className="legend-short">Settlement</span>
                      </th>
                      <th scope="col">Month 1</th>
                      <th scope="col">{monthName(lastNeed)}</th>
                      <th scope="col">Whole {termLabel}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {capacity.map((s, i) => (
                      <tr key={i} data-active={i === activeIndex}>
                        <th scope="row">
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
                          {i === activeIndex && (
                            <span className="sr-only"> (selected)</span>
                          )}
                        </th>
                        <td>{money(s.months[0].funded)}</td>
                        <td>{money(s.months[s.months.length - 1].funded)}</td>
                        <td>
                          {money(s.months.reduce((t, m) => t + m.funded, 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="fine">
                Volume is a monthly flow; committed and available capital are
                month-end balances. Because capital recycles, monthly volume can
                exceed the fund itself.
              </p>
            </Disclosure>
          </div>
        </section>

        <section
          className="panel tone-alt"
          data-group="viability"
          aria-label="The question for us"
        >
          <div className="wrap question" data-reveal>
            <p>
              Can ELITA <em>consistently deploy</em> around{" "}
              <strong>{money(firstNeed.funded)}</strong> a month at the start,
              rising to <strong>{money(lastNeed.funded)}</strong> by{" "}
              {monthName(lastNeed).toLowerCase()}, into{" "}
              <em>genuine, profitable transactions</em>?
            </p>
            <p>
              And as the fund grows, can the extra capacity support{" "}
              <em>larger, higher-value watches</em> without{" "}
              <em>compromising transaction quality</em> or taking on unnecessary
              risk?
            </p>
            <p className="fine">
              That’s the conversation to have. You know the pipeline; the
              calculator gives us the numbers for it.
            </p>
          </div>
        </section>

        <section
          className="panel tone-alt"
          data-group="viability"
          aria-labelledby="benefits-title"
        >
          <div className="wrap" data-reveal>
            <h2 id="benefits-title" className="panel-title">
              Why it could work for both of us
            </h2>
            <div className="benefits">
              <div>
                <h3>For ELITA</h3>
                <ul>
                  <li>
                    Dependable purchasing capital for confirmed, qualifying
                    orders.
                  </li>
                  <li>
                    Several purchases funded at once, without waiting on earlier
                    sales.
                  </li>
                  <li>Half of its profit share as regular cash flow.</li>
                  <li>
                    Retained profit builds purchasing capacity without a
                    matching contribution up front.
                  </li>
                  <li>
                    Room for higher-value pieces where real demand exists.
                  </li>
                </ul>
              </div>
              <div>
                <h3>For Jake</h3>
                <ul>
                  <li>
                    A share of net trading profit, reinvested to compound.
                  </li>
                  <li>A fee for keeping capital continuously available.</li>
                  <li>
                    Clear visibility of capital, transactions and allocations.
                  </li>
                  <li>Defined review and exit points at 90 and 180 days.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section
          id="terms"
          className="panel panel-terms tone-alt"
          data-group="viability"
          aria-labelledby="terms-title"
        >
          <div className="wrap" data-reveal>
            <h2 id="terms-title" className="panel-title">
              Terms &amp; considerations
            </h2>
            {/* One column at a time below desktop width. */}
            <div className="terms-tabs" role="group" aria-label="Show terms">
              {(
                [
                  ["exit", "Term & exit"],
                  ["risk", "Capital & risk"],
                  ["model", "The model"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={termsTab === key}
                  onClick={() => setTermsTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="terms-grid">
              <div data-hidden={termsTab !== "exit"}>
                <h3>Term and exit</h3>
                <ul>
                  <li>An initial 12-month arrangement.</li>
                  <li>Either of us could elect to end it at 90 or 180 days.</li>
                  <li>
                    Outstanding purchases would settle and accounts be
                    reconciled in an orderly wind-down.
                  </li>
                  <li>
                    At termination or maturity, the original capital, retained
                    profits and accrued fee are reconciled under the agreed
                    terms.
                  </li>
                  <li>
                    Continuing or expanding after 12 months would be by mutual
                    agreement.
                  </li>
                </ul>
              </div>
              <div data-hidden={termsTab !== "risk"}>
                <h3>Capital and risk</h3>
                <ul>
                  <li>
                    ELITA would be responsible for trading losses, subject to
                    formal agreement.
                  </li>
                  <li>
                    ELITA would be obliged to return Jake’s original capital.
                  </li>
                  <li>
                    The arrangement isn’t secured. A repayment obligation
                    doesn’t guarantee recovery, and a dedicated account alone
                    doesn’t create security.
                  </li>
                  <li>
                    A dedicated or segregated purchasing account, with tracking
                    of capital ownership, transactions, profits, fees and
                    withdrawals, and a monthly statement.
                  </li>
                  <li>
                    Foreign-exchange exposure, counterparty risk, payment costs
                    and late or failed settlement need explicit treatment.
                  </li>
                  <li>
                    Independent legal and tax review before entering any
                    arrangement.
                  </li>
                </ul>
              </div>
              <div data-hidden={termsTab !== "model"}>
                <h3>How the model works</h3>
                <ul>
                  <li>
                    Each day, purchases that are due settle first: cost returns
                    and the profit is realised. New purchases are then funded.
                  </li>
                  <li>
                    Daily buying is limited by available cash, the utilisation
                    target, the target spread across one settlement period, and
                    any monthly demand ceiling. No borrowing.
                  </li>
                  <li>
                    Every purchase settles independently after the chosen number
                    of days. Growth comes only from realised, retained profit.
                  </li>
                  <li>
                    The fund equals original capital plus Jake’s and ELITA’s
                    retained profit, which also equals cash plus open purchase
                    cost.
                  </li>
                  <li>
                    Buying stops at the end of the selected period. Open
                    purchases then settle at their modelled margins, with no
                    extra fee days.
                  </li>
                  <li>
                    The fee is original capital × {TERMS.annualFee * 100}% ×
                    days ÷ 365, paid separately by ELITA. It doesn’t compound or
                    reduce the profit before the split.
                  </li>
                  <li>
                    Purchases are divisible dollars, not individual watches.
                    Calculations use whole cents; screen values round to
                    dollars. Excludes tax, FX, overheads, defaults and trading
                    losses.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section
          className="panel panel-last tone-alt"
          data-group="viability"
          aria-label="Next step"
        >
          <div className="wrap" data-reveal>
            <p className="closing">
              No decision is needed now. If our relationship and the numbers
              support it, a sensible next step would be to review this framework
              together.
            </p>
            <div className="exports">
              <button
                type="button"
                className="pdf-button"
                onClick={() => window.print()}
              >
                <DownloadIcon /> Print or save as PDF
              </button>
              <p className="fine">
                Or take the model itself, with the current assumptions, exact
                cents and the daily ledger for all three settlement times:{" "}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => exportFile("json")}
                >
                  Model JSON
                </button>{" "}
                ·{" "}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => exportFile("csv")}
                >
                  Daily CSV
                </button>
              </p>
              <p className="export-status" role="status">
                {exported}
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="wrap footer-inner">
          <img
            src="/brand/elita-logo-white.png"
            alt="ELITA"
            width="80"
            height="12"
          />
          <p>
            Private and confidential. A hypothetical discussion draft, not a
            forecast, offer or agreement. All figures in Australian dollars,
            before tax.
          </p>
        </div>
      </footer>
    </>
  );
}
