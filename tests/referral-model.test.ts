import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AGENCY_ADD_ON,
  REFERRAL_TERMS,
  SERVICES,
  STRATEGY_ADD_ON,
} from "../src/data/catalog";
import {
  commissionOn,
  reconciles,
  retainerCommissionOver,
  simulate,
  type RetainerCohort,
  type SimulationInput,
} from "../src/lib/referral-model";
import {
  DEFAULT_SETTINGS,
  countsScenario,
  newLine,
  run,
  toInput,
  type Scenario,
} from "../src/lib/scenario";
import { PRICE_LISTS } from "../src/data/pricing";

const BPS = REFERRAL_TERMS.defaultFeeBps;
const price = (id: "basic" | "professional") => {
  const s = SERVICES[id];
  if (s.billing !== "once") throw new Error("not a project");
  return s.priceCents;
};
const monthly = (id: keyof typeof SERVICES) => {
  const s = SERVICES[id];
  if (s.billing !== "monthly" || s.monthlyCents === null) throw new Error("no fixed fee");
  return s.monthlyCents;
};
const base = (patch: Partial<SimulationInput> = {}): SimulationInput => ({
  horizonMonths: 12,
  feeBps: BPS,
  recurringCapMonths: REFERRAL_TERMS.proposedMaxPaidRetainerMonths,
  deals: [],
  cohorts: [],
  ...patch,
});
const cohort = (patch: Partial<RetainerCohort> & Pick<RetainerCohort, "service">): RetainerCohort => {
  const start = patch.startMonth ?? 1;
  return {
    id: `${patch.service}-${start}`,
    customers: 1,
    startMonth: start,
    monthlyFeeCents: monthly(patch.service),
    addOnCents: 0,
    paidMonths: Array.from({ length: 12 - start + 1 }, (_, i) => start + i),
    ...patch,
  };
};
const scenario = (lines: Partial<Scenario["lines"][number]>[], settings = {}): Scenario => ({
  lines: lines.map((l) => newLine(l)),
  settings: { ...DEFAULT_SETTINGS, ...settings },
});

/** Growth agencies starting months 1, 4, 7 and 10, plus two Professional projects. */
const quarterly = () =>
  scenario([
    { service: "reGrowth", startMonth: 1 },
    { service: "reGrowth", startMonth: 4 },
    { service: "reGrowth", startMonth: 7 },
    { service: "reGrowth", startMonth: 10 },
    { service: "professional", count: 2, startMonth: 3 },
  ]);
const mix = () =>
  scenario([
    { service: "basic", startMonth: 1 },
    { service: "basic", startMonth: 6 },
    { service: "professional", startMonth: 4, strategy: true },
    { service: "volume", startMonth: 5 },
    { service: "essential", startMonth: 3 },
  ]);

test("catalogue holds the commercial master's prices in cents", () => {
  assert.equal(price("basic"), 200_000);
  assert.equal(price("professional"), 400_000);
  assert.deepEqual(
    [monthly("boutique"), monthly("reGrowth"), monthly("volume")],
    [195_000, 345_000, 495_000],
  );
  assert.deepEqual(
    [monthly("essential"), monthly("creativeGrowth"), monthly("embedded")],
    [200_000, 400_000, 600_000],
  );
  assert.equal(SERVICES.reCustom.billing === "monthly" && SERVICES.reCustom.monthlyCents, null);
  assert.equal(STRATEGY_ADD_ON.minCents, 400_000);
  assert.equal(STRATEGY_ADD_ON.maxCents, 600_000);
  assert.equal(STRATEGY_ADD_ON.illustrativeCents, 500_000);
  assert.equal(AGENCY_ADD_ON.monthlyCents, 125_000);
  assert.equal(BPS, 1000);
  assert.equal(REFERRAL_TERMS.proposedMaxPaidRetainerMonths, 12);
});

test("Basic $2,000 at 10% earns $200 once; Kascade keeps $1,800 before costs", () => {
  const out = run(scenario([{ service: "basic", startMonth: 1 }]));
  assert.equal(out.totals.totalCommission, 20_000);
  assert.equal(out.totals.oneOffCommission, 20_000);
  assert.equal(out.totals.recurringCommission, 0);
  assert.equal(out.totals.kascadeAfterReferral, 180_000);
  assert.equal(out.months[0].totalCommission, 20_000);
  assert.ok(out.months.slice(1).every((m) => m.totalCommission === 0));
});

test("Professional $4,000 + Strategy $5,000 earns $900 on a fully paid $9,000", () => {
  const out = run(scenario([{ service: "professional", strategy: true }]));
  assert.equal(out.totals.clientReceipts, 900_000);
  assert.equal(out.totals.totalCommission, 90_000);
  assert.equal(out.input.deals.length, 1, "strategy attaches to the project, not a second deal");
  assert.equal(out.input.deals[0].strategyCents, 500_000);
});

test("a single fully paid retainer month earns $195 / $345 / $495", () => {
  for (const [service, expected] of [
    ["boutique", 19_500],
    ["reGrowth", 34_500],
    ["volume", 49_500],
  ] as const) {
    const out = simulate(base({ cohorts: [cohort({ service, paidMonths: [1] })] }));
    assert.equal(out.totals.recurringCommission, expected, service);
  }
});

test("one Growth retainer paid for 12 months from month 1 earns $4,140", () => {
  const out = simulate(base({ cohorts: [cohort({ service: "reGrowth" })] }));
  assert.equal(out.totals.totalCommission, 414_000);
  assert.equal(retainerCommissionOver(monthly("reGrowth"), 12), 414_000);
});

test("Growth agencies from months 1, 4, 7, 10: 30 client-months, $10,350, $1,380 run rate — never $16,560", () => {
  const input = base({
    cohorts: [1, 4, 7, 10].map((startMonth) => cohort({ service: "reGrowth", startMonth })),
  });
  const out = simulate(input);
  assert.equal(out.totals.paidClientMonths, 30);
  assert.equal(out.totals.totalCommission, 1_035_000);
  assert.equal(out.totals.endRecurringRunRate, 138_000);
  assert.notEqual(out.totals.totalCommission, out.totals.endRecurringRunRate * 12);
  assert.equal(out.months[3].newRetainerClients, 1);
  assert.equal(out.months[11].activePaidRetainers, 4);
});

test("adding two paid Professional projects brings year one to $11,150", () => {
  const out = run(quarterly());
  assert.equal(out.totals.oneOffCommission, 80_000);
  assert.equal(out.totals.recurringCommission, 1_035_000);
  assert.equal(out.totals.totalCommission, 1_115_000);
});

test("unpaid months, late starts and early cancellations create no phantom earnings", () => {
  // Pays months 1–3, misses 4 and 5, pays 6, then cancels.
  const out = simulate(
    base({ cohorts: [cohort({ service: "boutique", paidMonths: [1, 2, 3, 6] })] }),
  );
  assert.deepEqual(
    out.months.map((m) => m.recurringCommission),
    [19_500, 19_500, 19_500, 0, 0, 19_500, 0, 0, 0, 0, 0, 0],
  );
  assert.ok(out.months.every((m) => m.totalCommission >= 0), "no negative months without a refund");
  // A retainer starting in month 12 earns one month in year one.
  const late = run(scenario([{ service: "volume", startMonth: 12 }]));
  assert.equal(late.totals.totalCommission, 49_500);
  // A three-month stay earns three months.
  const short = run(scenario([{ service: "essential", startMonth: 2, stayMonths: 3 }]));
  assert.equal(short.totals.totalCommission, 60_000);
  assert.deepEqual(short.input.cohorts[0].paidMonths, [2, 3, 4]);
});

test("a refund reduces the eligible base and the commission in the month it happens", () => {
  const out = simulate(
    base({
      deals: [
        {
          id: "refunded",
          service: "basic",
          strategyCents: 0,
          valueCents: 200_000,
          receipts: [
            { month: 2, amountCents: 200_000 },
            { month: 3, amountCents: -50_000 },
          ],
        },
      ],
    }),
  );
  assert.equal(out.months[1].oneOffCommission, 20_000);
  assert.equal(out.months[2].oneOffCommission, -5_000);
  assert.equal(out.totals.totalCommission, 15_000);
  assert.ok(reconciles(out));
});

test("deposits and balances each earn commission once; nothing is earned on invoiced value", () => {
  const out = run(scenario([{ service: "professional", startMonth: 3 }], { projectPayment: "split" }));
  assert.equal(out.months[2].oneOffCommission, 20_000);
  assert.equal(out.months[3].oneOffCommission, 20_000);
  assert.equal(out.totals.oneOffCommission, 40_000, "not value + receipts");
  // A deposit in month 12 leaves the balance outside year one.
  const edge = run(scenario([{ service: "professional", startMonth: 12 }], { projectPayment: "split" }));
  assert.equal(edge.totals.oneOffCommission, 20_000);
  assert.equal(edge.totals.receiptsAfterHorizon, 200_000);
  // An odd-cent value still reconciles to the cent.
  const deal = { id: "odd", service: "basic" as const, strategyCents: 0, valueCents: 200_001 };
  const odd = simulate(
    base({ deals: [{ ...deal, receipts: [{ month: 1, amountCents: 100_000 }, { month: 2, amountCents: 100_001 }] }] }),
  );
  assert.equal(odd.totals.clientReceipts, 200_001);
  assert.ok(reconciles(odd));
});

test("a repeated scenario run never duplicates a one-off commission", () => {
  const s = scenario([{ service: "basic" }]);
  assert.equal(run(s).totals.totalCommission, run(s).totals.totalCommission);
  assert.equal(run(s).totals.totalCommission, 20_000);
});

test("commission stops after 12 paid months even while the client keeps paying", () => {
  const out = run(scenario([{ service: "reGrowth", startMonth: 1 }], { horizonMonths: 24 }));
  assert.equal(out.totals.paidClientMonths, 24);
  assert.equal(out.totals.commissionedClientMonths, 12);
  assert.equal(out.totals.recurringCommission, 414_000);
  assert.equal(out.months[12].recurringCommission, 0);
  assert.equal(out.months[12].clientReceipts, 345_000);
  assert.equal(out.months[12].kascadeAfterReferral, 345_000);
  assert.equal(out.totals.endRecurringRunRate, 0);
  // The comparison setting models commission while active.
  const ongoing = run(
    scenario([{ service: "reGrowth" }], { horizonMonths: 24, recurringPeriod: "ongoing" }),
  );
  assert.equal(ongoing.totals.recurringCommission, 828_000);
});

test("the agency add-on counts only when selected, and only on real estate retainers", () => {
  const without = run(scenario([{ service: "boutique" }]));
  const withAddOn = run(scenario([{ service: "boutique", agencyAddOn: true }]));
  assert.equal(without.totals.recurringCommission, 19_500 * 12);
  assert.equal(withAddOn.totals.recurringCommission, (19_500 + 12_500) * 12);
  assert.equal(withAddOn.input.cohorts[0].addOnCents, 125_000);
  const creative = run(scenario([{ service: "essential", agencyAddOn: true }]));
  assert.equal(creative.input.cohorts[0].monthlyFeeCents, 200_000);
});

test("10+ listing retainers need an entered agreed fee and are never extrapolated", () => {
  const missing = run(scenario([{ service: "reCustom" }]));
  assert.equal(missing.input.cohorts.length, 0);
  assert.equal(missing.totals.totalCommission, 0);
  const agreed = run(scenario([{ service: "reCustom", customMonthlyCents: 620_000, stayMonths: 1 }]));
  assert.equal(agreed.totals.totalCommission, 62_000);
});

test("strategy never applies to retainers", () => {
  const r = run(scenario([{ service: "reGrowth", strategy: true, stayMonths: 1 }]));
  assert.equal(r.totals.clientReceipts, 345_000);
});

test("commission rounds half away from zero, per receipt, in whole cents", () => {
  assert.equal(commissionOn(5, 1000), 1); // 0.5c → 1c
  assert.equal(commissionOn(4, 1000), 0);
  assert.equal(commissionOn(-5, 1000), -1);
  assert.equal(commissionOn(195_000, 1250), 24_375);
  assert.throws(() => commissionOn(1.5, 1000));
});

test("invalid inputs are rejected rather than silently modelled", () => {
  assert.throws(() => simulate(base({ horizonMonths: 0 })));
  assert.throws(() => simulate(base({ feeBps: 10.5 })));
  assert.throws(() =>
    simulate(base({ cohorts: [cohort({ service: "boutique", paidMonths: [1, 1] })] })),
  );
  assert.throws(() =>
    simulate(base({ cohorts: [cohort({ service: "boutique", startMonth: 3, paidMonths: [2, 3] })] })),
  );
  assert.throws(() =>
    simulate(
      base({
        deals: [{ id: "x", service: "boutique" as never, strategyCents: 0, valueCents: 1, receipts: [] }],
      }),
    ),
  );
});

test("every month reconciles: client payments = commission + Kascade after referral", () => {
  for (const make of [quarterly, mix]) {
    for (const settings of [
      {},
      { projectPayment: "split" as const },
      { horizonMonths: 24 },
      { feeBps: 1250, recurringPeriod: "ongoing" as const },
    ]) {
      const s = make();
      const out = run({ ...s, settings: { ...s.settings, ...settings } });
      assert.ok(reconciles(out));
      const t = out.totals;
      assert.equal(t.clientReceipts, t.totalCommission + t.kascadeAfterReferral);
      assert.equal(t.totalCommission, out.months.at(-1)!.cumulativeCommission);
      assert.equal(t.clientReceipts, t.oneOffReceipts + t.retainerReceipts);
    }
  }
  // 2 × $200 + $900 + 8 × $495 + 10 × $200
  assert.equal(run(mix()).totals.totalCommission, 726_000);
});

test("the calculator counts clients from month 1, retainers for 12 paid months", () => {
  const out = run(countsScenario({ professional: 1, reGrowth: 1, basic: 0 }));
  assert.equal(out.totals.totalCommission, 454_000);
  assert.equal(out.totals.oneOffCommission, 40_000);
  assert.equal(out.totals.endRecurringRunRate, 34_500);
  assert.equal(out.input.cohorts.length, 1, "zero counts are left out");
  const many = run(countsScenario({ basic: 3, essential: 2, embedded: 1 }));
  assert.equal(many.totals.totalCommission, 3 * 20_000 + (2 * 20_000 + 60_000) * 12);
});

test("every price list row matches the catalogue and calculator rows are fixed-price", () => {
  const ids = PRICE_LISTS.flatMap((l) => l.rows.filter((r) => r.service).map((r) => r.service!));
  assert.deepEqual(ids, ["basic", "professional", "boutique", "reGrowth", "volume", "essential", "creativeGrowth", "embedded"]);
  for (const list of PRICE_LISTS)
    for (const row of list.rows) {
      if (!row.service) continue;
      const s = SERVICES[row.service];
      assert.equal(row.price, s.billing === "once" ? s.priceCents : s.monthlyCents);
      assert.equal(row.billing, s.billing);
    }
  const strategy = PRICE_LISTS[0].rows.find((r) => r.key === "strategy")!;
  assert.deepEqual(strategy.price, [STRATEGY_ADD_ON.minCents, STRATEGY_ADD_ON.maxCents]);
  const agency = PRICE_LISTS[1].rows.find((r) => r.key === "agency")!;
  assert.equal(agency.price, AGENCY_ADD_ON.monthlyCents);
});
