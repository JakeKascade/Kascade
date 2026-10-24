import { compare, simulate, type Assumptions } from "./model";

export const MODEL_VERSION = "ELITA daily settlement 1.0";
export function exportResults(assumptions: Assumptions) {
  const scenarios = compare(assumptions);
  return {
    model: MODEL_VERSION,
    classification: "PRIVATE & CONFIDENTIAL — HYPOTHETICAL DISCUSSION DRAFT",
    units:
      "All output money values are integer AUD cents; assumption amounts are AUD dollars.",
    assumptions: { ...assumptions },
    methodology:
      "Daily settlements before purchases; daily deployment <= target/settlementDays, available cash, target headroom and remaining monthly demand. Cost-basis fund. Fee on original capital, Actual/365. No new purchases after selected term; final payouts include subsequent settlement of existing purchases.",
    scenarios: scenarios.map((s) => ({
      settlementDays: s.assumptions.settlementDays,
      atTerm: s.atTerm,
      payout: s.payout,
      windDownDays: s.windDownDays,
      afterWindDown: s.afterWindDown,
      months: s.months,
      daily: s.daily,
      purchases: s.purchases,
      settlements: s.settlements,
    })),
    steadyCounterpart:
      assumptions.conditions === "conservative"
        ? simulate({ ...assumptions, conditions: "steady" })
        : null,
    disclosure:
      "Illustrative capacity model, not forecast or agreement. No tax, FX, general overheads or defaults. Unsettled assumed margins are not realised at the selected term. External ELITA funding may be needed for the fee. No security or guarantee is represented.",
  };
}
export function exportCsv(assumptions: Assumptions) {
  const header =
    "scenario_days,day,phase,fund_AUD,cash_AUD,committed_cost_AUD,new_purchases_AUD,settled_cost_AUD,realised_profit_AUD,jake_retained_AUD,elita_retained_AUD,elita_withdrawn_AUD";
  const rows = compare(assumptions).flatMap((s) =>
    s.daily.map((d) =>
      [
        s.assumptions.settlementDays,
        d.day,
        d.day <= assumptions.termDays ? "operating" : "wind_down",
        ...[
          d.fund,
          d.cash,
          d.committed,
          d.funded,
          d.settledCost,
          d.realisedProfit,
          d.jakeRetained,
          d.elitaRetained,
          d.elitaWithdrawn,
        ].map((v) => (v / 100).toFixed(2)),
      ].join(","),
    ),
  );
  return [header, ...rows].join("\n");
}
