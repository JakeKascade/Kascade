import { CATALOG_VERSION } from "@/data/catalog";
import { run, toInput, type Scenario } from "./scenario";

export const MODEL_VERSION = "Kascade × Real Coder referral model 1.0";

/** The full scenario and its results, straight from the engine, in exact cents. */
export function exportResults(scenario: Scenario) {
  const results = run(scenario);
  return {
    model: MODEL_VERSION,
    catalogue: CATALOG_VERSION,
    classification: "PROPOSED PARTNERSHIP — ILLUSTRATIVE SCENARIO, NOT A FORECAST OR AGREEMENT",
    units: "All money values are integer AUD cents, excluding GST.",
    scenario,
    input: toInput(scenario),
    results: { months: results.months, totals: results.totals },
    assumptions: results.assumptions,
    definitions: {
      clientReceipts: "Payments clients made to Kascade for the modelled referrals.",
      totalCommission: "Real Coder's referral commission on eligible client payments.",
      kascadeAfterReferral:
        "Client payments less referral commission, before Kascade's delivery and operating costs. Not profit.",
    },
  };
}

export function exportCsv(scenario: Scenario) {
  const { months, totals } = run(scenario);
  const dollars = (c: number) => (c / 100).toFixed(2);
  const header = [
    "month",
    "projects_paying",
    "new_retainer_clients",
    "active_paid_retainers",
    "client_payments_AUD",
    "eligible_payments_AUD",
    "one_off_commission_AUD",
    "recurring_commission_AUD",
    "real_coder_commission_AUD",
    "cumulative_commission_AUD",
    "kascade_after_referral_before_costs_AUD",
  ].join(",");
  const rows = months.map((m) =>
    [
      m.month,
      m.projectsPaying,
      m.newRetainerClients,
      m.activePaidRetainers,
      ...[
        m.clientReceipts,
        m.eligibleReceipts,
        m.oneOffCommission,
        m.recurringCommission,
        m.totalCommission,
        m.cumulativeCommission,
        m.kascadeAfterReferral,
      ].map(dollars),
    ].join(","),
  );
  const total = [
    "total",
    "",
    "",
    totals.paidClientMonths,
    ...[
      totals.clientReceipts,
      totals.eligibleReceipts,
      totals.oneOffCommission,
      totals.recurringCommission,
      totals.totalCommission,
      totals.totalCommission,
      totals.kascadeAfterReferral,
    ].map(dollars),
  ].join(",");
  return [header, ...rows, total].join("\n") + "\n";
}
