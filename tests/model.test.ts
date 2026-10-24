import assert from "node:assert/strict";
import { test } from "node:test";
import {
  allocation,
  availabilityFee,
  compare,
  comparisonDays,
  DEFAULTS,
  monthOf,
  simulate,
  targetUtilisation,
} from "../src/lib/model";
import { exportCsv, exportResults } from "../src/lib/export";

test("A$10,000 example allocates 25/75 and retains exactly A$6,250", () => {
  assert.deepEqual(allocation(1_000_000), {
    jake: 250_000,
    elita: 750_000,
    withdrawn: 375_000,
    retained: 375_000,
  });
  // A cent that cannot be split is still accounted for exactly once.
  for (let cents = 0; cents < 100; cents++) {
    const s = allocation(cents);
    assert.equal(s.jake + s.elita, cents);
    assert.equal(s.withdrawn + s.retained, s.elita);
  }
});
test("initial ramp, independent settlements and no premature profit recognition", () => {
  const s = simulate({ ...DEFAULTS });
  assert.equal(s.purchases[0].fundedDay, 1);
  assert.equal(s.purchases[0].settlementDay, 16);
  assert.equal(s.purchases[1].settlementDay, 17);
  assert.equal(s.daily[1].funded, 466_666);
  assert.equal(s.daily[15].committed, 6_999_990);
  assert.equal(s.daily[15].cumulativeProfit, 0);
  assert.equal(s.daily[15].fund, 10_000_000);
  // Hand reconciliation: A$4,666.66 × 7% = A$326.67 on day 16.
  assert.equal(s.daily[16].realisedProfit, 32_667);
  assert.equal(s.daily[16].jakeRetained, 8_167);
  assert.equal(s.daily[16].elitaRetained, 12_250);
  assert.equal(s.daily[16].elitaWithdrawn, 12_250);
  assert.equal(s.daily[16].fund, 10_020_417);
  assert.equal(s.daily[16].settledCost, s.purchases[0].cost);
  assert.ok(
    s.purchases[15].cost > s.purchases[0].cost,
    "realised retention can fund a larger next tranche",
  );
});
test("every daily balance reconciles and no purchase uses unavailable cash", () => {
  for (const settlementDays of [10, 15, 20, 30]) {
    const s = simulate({ ...DEFAULTS, settlementDays });
    let ledgerCash = s.payout.principal;
    let ledgerCommitted = 0;
    let ledgerJake = 0,
      ledgerElita = 0,
      ledgerWithdrawals = 0;
    for (const day of s.daily.slice(1)) {
      const settled = s.settlements.filter((t) => t.settlementDay === day.day);
      for (const t of settled) {
        ledgerCash += t.cost + t.profit - t.withdrawn;
        ledgerCommitted -= t.cost;
        ledgerJake += t.jake;
        ledgerElita += t.retained;
        ledgerWithdrawals += t.withdrawn;
      }
      assert.ok(
        day.funded <= ledgerCash,
        "cannot borrow against future settlement",
      );
      ledgerCash -= day.funded;
      ledgerCommitted += day.funded;
      assert.equal(day.cash, ledgerCash);
      assert.equal(day.committed, ledgerCommitted);
      assert.equal(day.jakeRetained, ledgerJake);
      assert.equal(day.elitaRetained, ledgerElita);
      assert.equal(day.elitaWithdrawn, ledgerWithdrawals);
      assert.equal(day.fund, day.cash + day.committed);
      assert.equal(day.fund, s.payout.principal + ledgerJake + ledgerElita);
      assert.equal(
        day.cumulativeProfit,
        ledgerJake + ledgerElita + ledgerWithdrawals,
      );
      assert.ok(day.cash >= 0 && day.committed >= 0);
    }
  }
});
test("monthly demand limits purchase cost, resets at month boundaries and never carries forward", () => {
  const s = simulate({ ...DEFAULTS, monthlyDemand: 10_000 });
  assert.equal(s.months.length, 12);
  assert.ok(s.months.every((m) => m.funded === 1_000_000));
  assert.equal(s.daily[31].funded, 0);
  assert.ok(s.daily[32].funded > 0);
  assert.equal(s.daily[31].month, 1);
  assert.equal(s.daily[32].month, 2);
  const zero = simulate({ ...DEFAULTS, monthlyDemand: 0 });
  assert.equal(zero.purchases.length, 0);
  assert.equal(zero.payout.jakeTradingProfit, 0);
  assert.equal(zero.atTerm.cash, 10_000_000);
  assert.equal(
    zero.payout.elitaFinalPayout,
    -400_000,
    "ELITA owes fee externally when there is no retained profit",
  );
  assert.equal(
    zero.payout.jakeFinalPayout,
    10_400_000,
    "fee is a separate claim, not a deduction from principal",
  );
});
test("taper is continuous, respects the floor and does not increase a lower starting setting", () => {
  assert.equal(targetUtilisation({ ...DEFAULTS }, 10_000_000, 1), 0.7);
  assert.ok(
    Math.abs(targetUtilisation({ ...DEFAULTS }, 20_000_000, 1) - 0.65) < 1e-12,
  );
  assert.equal(targetUtilisation({ ...DEFAULTS }, 100_000_000, 1), 0.5);
  assert.equal(
    targetUtilisation({ ...DEFAULTS, utilisation: 0.4 }, 20_000_000, 1),
    0.4,
  );
  const tapered = simulate({ ...DEFAULTS }),
    untapered = simulate({ ...DEFAULTS, taper: false });
  assert.ok(tapered.atTerm.fund < untapered.atTerm.fund);
});
test("fee accrual is Actual/365 on original capital for 90, 180 and 365 days", () => {
  assert.equal(availabilityFee(10_000_000, 90), 98_630);
  assert.equal(availabilityFee(10_000_000, 180), 197_260);
  assert.equal(availabilityFee(10_000_000, 365), 400_000);
  for (const termDays of [90, 180, 365] as const) {
    const s = simulate({ ...DEFAULTS, termDays });
    assert.equal(s.payout.fee, availabilityFee(10_000_000, termDays));
    assert.notEqual(s.payout.fee, availabilityFee(s.atTerm.fund, termDays));
  }
});
test("early election stops funding; payout includes orderly settlement without extra fee days", () => {
  for (const termDays of [90, 180] as const) {
    const s = simulate({ ...DEFAULTS, termDays });
    assert.equal(s.purchases.at(-1)!.fundedDay, termDays);
    assert.equal(s.daily.length, termDays + 16);
    assert.ok(s.daily.slice(termDays + 1).every((d) => d.funded === 0));
    assert.equal(s.afterWindDown.committed, 0);
    assert.equal(s.windDownDays, 15);
    assert.ok(s.afterWindDown.fund > s.atTerm.fund);
    assert.equal(
      s.payout.jakeFinalPayout + s.payout.elitaFinalPayout,
      s.afterWindDown.cash,
    );
    assert.equal(
      s.payout.elitaNetProfit,
      s.payout.elitaWithdrawn + s.payout.elitaFinalPayout,
    );
    assert.equal(
      s.payout.jakeTotalProfit,
      s.payout.jakeTradingProfit + s.payout.fee,
    );
  }
});
test("fee does not change trading allocations or compound inside the fund", () => {
  const s = simulate({ ...DEFAULTS });
  const sum = (key: "profit" | "jake" | "elita" | "withdrawn" | "retained") =>
    s.settlements.reduce((total, x) => total + x[key], 0);
  assert.equal(sum("profit"), s.afterWindDown.cumulativeProfit);
  assert.equal(s.payout.jakeTradingProfit, sum("jake"));
  assert.equal(s.payout.elitaTradingProfit, sum("elita"));
  assert.equal(s.payout.elitaWithdrawn, sum("withdrawn"));
  assert.equal(s.payout.elitaRetained, sum("retained"));
  assert.equal(
    s.afterWindDown.cash + s.payout.elitaWithdrawn,
    s.payout.principal + s.afterWindDown.cumulativeProfit,
  );
});
test("zero margin, low volume and insufficient whole-cent cash do not invent returns or purchases", () => {
  const zero = simulate({ ...DEFAULTS, margin: 0 });
  assert.equal(zero.afterWindDown.fund, 10_000_000);
  assert.equal(zero.payout.jakeTradingProfit, 0);
  assert.equal(zero.payout.elitaNetProfit, -400_000);
  const tiny = simulate({ ...DEFAULTS, initialCapital: 0.01 });
  assert.equal(tiny.purchases.length, 0);
  assert.equal(tiny.afterWindDown.cash, 1);
  const idle = simulate({ ...DEFAULTS, utilisation: 0 });
  assert.equal(idle.purchases.length, 0);
  const low = simulate({ ...DEFAULTS, monthlyDemand: 1 });
  assert.equal(low.months[0].funded, 100);
  assert.ok(low.afterWindDown.cash >= low.payout.principal);
});
test("conservative conditions change only new purchases in the second half", () => {
  const steady = simulate({ ...DEFAULTS }),
    stress = simulate({ ...DEFAULTS, conditions: "conservative" });
  assert.deepEqual(stress.daily.slice(0, 183), steady.daily.slice(0, 183));
  assert.ok(
    stress.purchases
      .filter((p) => p.fundedDay > 182)
      .every((p) => Math.abs(p.margin - 0.056) < 1e-12),
  );
  assert.ok(
    stress.purchases
      .filter((p) => p.fundedDay <= 182)
      .every((p) => p.margin === 0.07),
  );
  assert.ok(stress.atTerm.fund < steady.atTerm.fund);
  assert.equal(stress.payout.fee, steady.payout.fee);
});
test("all three comparisons preserve assumptions other than settlement days", () => {
  assert.deepEqual(comparisonDays(15), [10, 15, 20]);
  for (let days = 10; days <= 30; days++) {
    const a = { ...DEFAULTS, settlementDays: days };
    const results = compare(a);
    assert.equal(
      new Set(results.map((r) => r.assumptions.settlementDays)).size,
      3,
    );
    assert.ok(
      results.every(
        (s) =>
          s.assumptions.settlementDays >= 10 &&
          s.assumptions.settlementDays <= 30,
      ),
    );
    assert.ok(results.some((s) => s.assumptions.settlementDays === days));
    for (const s of results)
      assert.deepEqual({ ...s.assumptions, settlementDays: days }, a);
  }
});
test("chart data, monthly table and JSON/CSV exports use one reconciled ledger", () => {
  const a = {
    ...DEFAULTS,
    monthlyDemand: 75_000,
    conditions: "conservative" as const,
  };
  const s = simulate(a),
    exported = exportResults(a);
  const selected = exported.scenarios.find((x) => x.settlementDays === 15)!;
  assert.deepEqual(selected.atTerm, s.daily[365]);
  assert.deepEqual(selected.payout, s.payout);
  assert.deepEqual(selected.months, s.months);
  assert.equal(
    s.months.reduce((total, m) => total + m.funded, 0),
    s.purchases.reduce((total, p) => total + p.cost, 0),
  );
  assert.deepEqual(selected.months.at(-1)!.end, s.atTerm);
  const csv = exportCsv(a).split("\n");
  const final = csv.find((row) => row.startsWith("15,365,"))!.split(",");
  assert.equal(final[3], (s.atTerm.fund / 100).toFixed(2));
  assert.equal(
    csv.length,
    1 + exported.scenarios.reduce((total, x) => total + x.daily.length, 0),
  );
  assert.equal(exported.steadyCounterpart?.assumptions.conditions, "steady");
});
test("invalid financial inputs are rejected instead of producing misleading NaN values", () => {
  for (const invalid of [
    { initialCapital: 0 },
    { margin: -0.1 },
    { utilisation: 1.1 },
    { settlementDays: 0 },
    { settlementDays: 10.5 },
    { monthlyDemand: -1 },
    { monthlyDemand: NaN },
    { initialCapital: Infinity },
  ]) {
    assert.throws(() => simulate({ ...DEFAULTS, ...invalid }), RangeError);
  }
  assert.equal(monthOf(59), 2);
  assert.equal(monthOf(60), 3);
  assert.equal(monthOf(365), 12);
});
