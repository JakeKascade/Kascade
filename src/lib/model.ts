/** All result amounts are integer AUD cents. Inputs are dollars and decimal rates.
 * No stochastic forecasts, borrowed funds, taxes or unrealised profit.
 * See docs/MODEL.md for the daily order of operations and exit assumptions.
 */
export type Assumptions = {
  initialCapital: number;
  settlementDays: number;
  utilisation: number;
  margin: number;
  termDays: 90 | 180 | 365;
  taper: boolean;
  monthlyDemand: number | null;
  conditions: "steady" | "conservative";
};
export const DEFAULTS: Readonly<Assumptions> = Object.freeze({
  initialCapital: 100_000,
  settlementDays: 15,
  utilisation: 0.7,
  margin: 0.07,
  termDays: 365,
  taper: true,
  monthlyDemand: null,
  conditions: "steady",
});
export const TERMS = Object.freeze({
  jakeShare: 0.25,
  elitaShare: 0.75,
  elitaRetention: 0.5,
  annualFee: 0.04,
});
export const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export type Purchase = {
  id: number;
  fundedDay: number;
  settlementDay: number;
  cost: number;
  margin: number;
};
export type Settlement = Purchase & {
  profit: number;
  jake: number;
  elita: number;
  withdrawn: number;
  retained: number;
};
export type DailyRecord = {
  day: number;
  month: number;
  cash: number;
  committed: number;
  fund: number;
  utilisation: number;
  availableForNew: number;
  funded: number;
  settledCost: number;
  realisedProfit: number;
  cumulativeProfit: number;
  jakeRetained: number;
  elitaRetained: number;
  elitaWithdrawn: number;
};
export type MonthRecord = {
  month: number;
  firstDay: number;
  lastDay: number;
  funded: number;
  settledCost: number;
  realisedProfit: number;
  end: DailyRecord;
};
export type Payout = {
  principal: number;
  jakeTradingProfit: number;
  fee: number;
  jakeTotalProfit: number;
  jakeFinalPayout: number;
  elitaTradingProfit: number;
  elitaWithdrawn: number;
  elitaRetained: number;
  elitaFinalPayout: number;
  elitaNetProfit: number;
};
export type Simulation = {
  assumptions: Assumptions;
  daily: DailyRecord[];
  months: MonthRecord[];
  purchases: Purchase[];
  settlements: Settlement[];
  payout: Payout;
  atTerm: DailyRecord;
  afterWindDown: DailyRecord;
  windDownDays: number;
};
export function monthOf(day: number): number {
  let end = 0;
  for (let i = 0; i < MONTH_LENGTHS.length; i++) {
    end += MONTH_LENGTHS[i];
    if (day <= end) return i + 1;
  }
  return 13;
}
export function allocation(profit: number) {
  const jake = Math.round(profit * TERMS.jakeShare);
  const elita = profit - jake;
  const withdrawn = Math.round(elita * (1 - TERMS.elitaRetention));
  return { jake, elita, withdrawn, retained: elita - withdrawn };
}
export function availabilityFee(principalCents: number, days: number) {
  return Math.round((principalCents * TERMS.annualFee * days) / 365);
}
export function targetUtilisation(a: Assumptions, fund: number, day: number) {
  const growthDollars = Math.max(0, fund / 100 - a.initialCapital);
  // Never raise a deliberately selected utilisation below the 50% taper floor.
  const floor = Math.min(0.5, a.utilisation);
  const tapered = a.taper
    ? Math.max(floor, a.utilisation - (growthDollars / 100_000) * 0.05)
    : a.utilisation;
  const stressed =
    a.conditions === "conservative" && day > Math.floor(a.termDays / 2);
  return Math.max(0, tapered - (stressed ? 0.1 : 0));
}
function validate(a: Assumptions) {
  if (
    ![
      a.initialCapital,
      a.settlementDays,
      a.utilisation,
      a.margin,
      a.termDays,
    ].every(Number.isFinite) ||
    a.initialCapital <= 0 ||
    Math.round(a.initialCapital * 100) < 1 ||
    !Number.isInteger(a.settlementDays) ||
    a.settlementDays < 1 ||
    a.settlementDays > 365 ||
    a.utilisation < 0 ||
    a.utilisation > 1 ||
    a.margin < 0 ||
    a.margin > 1 ||
    ![90, 180, 365].includes(a.termDays) ||
    (a.monthlyDemand !== null &&
      (!Number.isFinite(a.monthlyDemand) || a.monthlyDemand < 0)) ||
    !["steady", "conservative"].includes(a.conditions)
  )
    throw new RangeError("Invalid model assumptions");
}
export function simulate(inputs: Assumptions): Simulation {
  validate(inputs);
  const a = { ...inputs };
  const principal = Math.round(a.initialCapital * 100);
  const demandLimit =
    a.monthlyDemand === null ? Infinity : Math.round(a.monthlyDemand * 100);
  let cash = principal,
    committed = 0,
    cumulativeProfit = 0;
  let jakeRetained = 0,
    elitaRetained = 0,
    elitaWithdrawn = 0;
  const purchases: Purchase[] = [],
    settlements: Settlement[] = [],
    daily: DailyRecord[] = [];
  const due = new Map<number, Purchase[]>();
  const monthlySpend = new Map<number, number>();
  const snapshot = (
    day: number,
    funded = 0,
    settledCost = 0,
    realisedProfit = 0,
  ): DailyRecord => {
    const fund = cash + committed;
    const utilisation = targetUtilisation(a, fund, day);
    return {
      day,
      month: monthOf(day),
      cash,
      committed,
      fund,
      utilisation,
      availableForNew: Math.max(
        0,
        Math.min(cash, Math.floor(fund * utilisation) - committed),
      ),
      funded,
      settledCost,
      realisedProfit,
      cumulativeProfit,
      jakeRetained,
      elitaRetained,
      elitaWithdrawn,
    };
  };
  daily.push(snapshot(0));
  // Settlements happen at the beginning of each day, then a new independent
  // dollar tranche may be purchased. No purchases after the election/maturity.
  for (let day = 1; day <= a.termDays + a.settlementDays; day++) {
    let settledCost = 0,
      realisedProfit = 0,
      funded = 0;
    for (const purchase of due.get(day) || []) {
      const profit = Math.round(purchase.cost * purchase.margin);
      const split = allocation(profit);
      committed -= purchase.cost;
      cash += purchase.cost + profit - split.withdrawn;
      cumulativeProfit += profit;
      jakeRetained += split.jake;
      elitaRetained += split.retained;
      elitaWithdrawn += split.withdrawn;
      settledCost += purchase.cost;
      realisedProfit += profit;
      settlements.push({ ...purchase, profit, ...split });
    }
    if (day <= a.termDays) {
      const fund = cash + committed;
      const target = Math.floor(fund * targetUtilisation(a, fund, day));
      const month = monthOf(day),
        spent = monthlySpend.get(month) || 0;
      // Spread replenishment across one settlement interval. This creates a
      // real initial ramp, rather than assuming a fully staggered book on day 1.
      funded = Math.max(
        0,
        Math.min(
          cash,
          target - committed,
          Math.floor(target / a.settlementDays),
          demandLimit - spent,
        ),
      );
      if (funded > 0) {
        const stressed =
          a.conditions === "conservative" && day > Math.floor(a.termDays / 2);
        const purchase = {
          id: purchases.length + 1,
          fundedDay: day,
          settlementDay: day + a.settlementDays,
          cost: funded,
          margin: a.margin * (stressed ? 0.8 : 1),
        };
        purchases.push(purchase);
        due.set(purchase.settlementDay, [
          ...(due.get(purchase.settlementDay) || []),
          purchase,
        ]);
        cash -= funded;
        committed += funded;
        monthlySpend.set(month, spent + funded);
      }
    }
    daily.push(snapshot(day, funded, settledCost, realisedProfit));
  }
  const atTerm = daily[a.termDays];
  const lastSettlement = settlements.at(-1)?.settlementDay || a.termDays;
  const finalDay = Math.max(a.termDays, lastSettlement);
  const afterWindDown = daily[finalDay];
  // The fee is external to trading profit, payable by ELITA. A negative final
  // ELITA payout represents an external payment due, never a principal haircut.
  const fee = availabilityFee(principal, a.termDays);
  const payout: Payout = {
    principal,
    jakeTradingProfit: jakeRetained,
    fee,
    jakeTotalProfit: jakeRetained + fee,
    jakeFinalPayout: principal + jakeRetained + fee,
    elitaTradingProfit: elitaRetained + elitaWithdrawn,
    elitaWithdrawn,
    elitaRetained,
    elitaFinalPayout: elitaRetained - fee,
    elitaNetProfit: elitaRetained + elitaWithdrawn - fee,
  };
  const months: MonthRecord[] = [];
  for (let day = 1; day <= a.termDays; day++) {
    const row = daily[day];
    let month = months.at(-1);
    if (!month || month.month !== row.month) {
      month = {
        month: row.month,
        firstDay: day,
        lastDay: day,
        funded: 0,
        settledCost: 0,
        realisedProfit: 0,
        end: row,
      };
      months.push(month);
    }
    month.lastDay = day;
    month.funded += row.funded;
    month.settledCost += row.settledCost;
    month.realisedProfit += row.realisedProfit;
    month.end = row;
  }
  return {
    assumptions: a,
    daily: daily.slice(0, finalDay + 1),
    months,
    purchases,
    settlements,
    payout,
    atTerm,
    afterWindDown,
    windDownDays: finalDay - a.termDays,
  };
}
export function comparisonDays(selected: number) {
  const others = [10, 15, 20, 25, 30]
    .filter((day) => day !== selected)
    .sort((a, b) => Math.abs(a - selected) - Math.abs(b - selected) || a - b)
    .slice(0, 2);
  return [selected, ...others].sort((a, b) => a - b);
}
export function compare(a: Assumptions): Simulation[] {
  return comparisonDays(a.settlementDays).map((settlementDays) =>
    simulate({ ...a, settlementDays }),
  );
}
export const money = (cents: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  })
    .format(cents / 100)
    .replace("AUD", "A$")
    .replace(/\s/g, "");
export const preciseMoney = (cents: number) =>
  `A$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const shortMoney = (cents: number) =>
  `A$${(cents / 100_000).toLocaleString("en-AU", { maximumFractionDigits: 0 })}k`;
export const percent = (value: number) =>
  `${(value * 100).toLocaleString("en-AU", { maximumFractionDigits: 1 })}%`;
