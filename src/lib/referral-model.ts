/**
 * Referral commission model. Pure and deterministic: the same input always
 * gives the same output, with no dates, randomness or I/O.
 *
 * Every amount is integer AUD cents, excluding GST. Commission accrues only on
 * money a client has actually paid, rounded to the cent on each receipt.
 * Retainer commission runs for every paid month while the client stays
 * (matching Real Coder's proposal); a cap can be modelled for comparison. Nothing here is profit: Kascade amounts are receipts before
 * delivery, staff and operating costs. See docs/MODEL.md.
 */
import {
  REFERRAL_TERMS,
  SERVICES,
  type BrandingId,
  type CreativeId,
  type RealEstateId,
} from "@/data/catalog";

/** A client payment in a model month. A negative amount is a refund or credit. */
export type Receipt = { month: number; amountCents: number };

export type OneOffDeal = {
  id: string;
  service: BrandingId;
  /** Agreed Brand Strategy & Positioning fee attached to this project, or 0. */
  strategyCents: number;
  /** Agreed eligible project value (package + strategy). Commission is never paid on this, only on receipts. */
  valueCents: number;
  receipts: Receipt[];
};

export type RetainerCohort = {
  id: string;
  service: RealEstateId | CreativeId;
  /** Whole clients, each with the same fee and payment pattern. */
  customers: number;
  startMonth: number;
  /** Eligible monthly fee per client, including any explicitly selected add-on. */
  monthlyFeeCents: number;
  /** Part of the monthly fee that is the agency add-on (already in monthlyFeeCents). */
  addOnCents: number;
  /** The model months in which each client actually pays. */
  paidMonths: number[];
};

export type SimulationInput = {
  horizonMonths: number;
  feeBps: number;
  /** Paid months of commission per retainer client; null models commission while active. */
  recurringCapMonths: number | null;
  deals: OneOffDeal[];
  cohorts: RetainerCohort[];
};

export type MonthRecord = {
  month: number;
  /** Branding projects with a payment received this month. */
  projectsPaying: number;
  /** Retainer clients whose first paid month is this one. */
  newRetainerClients: number;
  /** Retainer clients paying this month. */
  activePaidRetainers: number;
  /** Paying retainer clients still inside the commission period. */
  commissionableRetainers: number;
  oneOffReceipts: number;
  retainerReceipts: number;
  /** Everything clients paid Kascade this month, for modelled referrals. */
  clientReceipts: number;
  /** The part of clientReceipts that earns commission. */
  eligibleReceipts: number;
  oneOffCommission: number;
  recurringCommission: number;
  totalCommission: number;
  cumulativeOneOff: number;
  cumulativeRecurring: number;
  cumulativeCommission: number;
  /** clientReceipts − totalCommission. Before delivery and operating costs; not profit. */
  kascadeAfterReferral: number;
};

export type SimulationTotals = {
  oneOffCommission: number;
  recurringCommission: number;
  totalCommission: number;
  oneOffReceipts: number;
  retainerReceipts: number;
  clientReceipts: number;
  eligibleReceipts: number;
  kascadeAfterReferral: number;
  /** Recurring commission earned in the final model month. */
  endRecurringRunRate: number;
  paidClientMonths: number;
  commissionedClientMonths: number;
  projects: number;
  retainerClients: number;
  /** Project payments that fall after the horizon and so are not counted. */
  receiptsAfterHorizon: number;
};

export type SimulationOutput = {
  input: SimulationInput;
  months: MonthRecord[];
  totals: SimulationTotals;
  assumptions: string[];
};

/** Commission on one receipt: amount × rate, rounded half away from zero to the cent. */
export function commissionOn(amountCents: number, feeBps: number): number {
  assertCents(amountCents, "amount");
  const sign = amountCents < 0 ? -1 : 1;
  return sign * Math.round((Math.abs(amountCents) * feeBps) / 10_000);
}

/** Commission over a retainer's paid months (optionally capped). */
export function retainerCommissionOver(
  monthlyFeeCents: number,
  paidMonths: number,
  feeBps: number = REFERRAL_TERMS.defaultFeeBps,
  cap: number | null = REFERRAL_TERMS.retainerCommissionMonths,
) {
  const months = cap === null ? paidMonths : Math.min(paidMonths, cap);
  return commissionOn(monthlyFeeCents, feeBps) * months;
}

function assertCents(value: number, label: string) {
  if (!Number.isSafeInteger(value))
    throw new RangeError(`${label} must be a whole number of cents`);
}
function assertInput(input: SimulationInput) {
  const { horizonMonths, feeBps, recurringCapMonths } = input;
  if (!Number.isInteger(horizonMonths) || horizonMonths < 1 || horizonMonths > 120)
    throw new RangeError("horizonMonths must be a whole number from 1 to 120");
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 10_000)
    throw new RangeError("feeBps must be a whole number from 0 to 10,000");
  if (
    recurringCapMonths !== null &&
    (!Number.isInteger(recurringCapMonths) || recurringCapMonths < 0)
  )
    throw new RangeError("recurringCapMonths must be a whole number or null");
  for (const d of input.deals) {
    if (SERVICES[d.service]?.billing !== "once")
      throw new RangeError(`${d.id}: ${d.service} is not a one-off service`);
    assertCents(d.valueCents, `${d.id} value`);
    assertCents(d.strategyCents, `${d.id} strategy`);
    for (const r of d.receipts) {
      assertCents(r.amountCents, `${d.id} receipt`);
      if (!Number.isInteger(r.month) || r.month < 1)
        throw new RangeError(`${d.id}: receipt months start at 1`);
    }
  }
  for (const c of input.cohorts) {
    if (SERVICES[c.service]?.billing !== "monthly")
      throw new RangeError(`${c.id}: ${c.service} is not a retainer`);
    if (!Number.isInteger(c.customers) || c.customers < 0)
      throw new RangeError(`${c.id}: customers must be a whole number`);
    assertCents(c.monthlyFeeCents, `${c.id} fee`);
    if (c.monthlyFeeCents < 0) throw new RangeError(`${c.id}: negative fee`);
    if (new Set(c.paidMonths).size !== c.paidMonths.length)
      throw new RangeError(`${c.id}: a month can only be paid once`);
    if (c.paidMonths.some((m) => !Number.isInteger(m) || m < c.startMonth))
      throw new RangeError(`${c.id}: paid months start at the start month`);
  }
}

export function simulate(input: SimulationInput): SimulationOutput {
  assertInput(input);
  const { horizonMonths: H, feeBps, recurringCapMonths: cap } = input;
  const blank = (month: number): MonthRecord => ({
    month,
    projectsPaying: 0,
    newRetainerClients: 0,
    activePaidRetainers: 0,
    commissionableRetainers: 0,
    oneOffReceipts: 0,
    retainerReceipts: 0,
    clientReceipts: 0,
    eligibleReceipts: 0,
    oneOffCommission: 0,
    recurringCommission: 0,
    totalCommission: 0,
    cumulativeOneOff: 0,
    cumulativeRecurring: 0,
    cumulativeCommission: 0,
    kascadeAfterReferral: 0,
  });
  const months = Array.from({ length: H }, (_, i) => blank(i + 1));
  let receiptsAfterHorizon = 0;

  // One-off projects: each receipt earns commission once, when it is received.
  for (const deal of input.deals) {
    const paidIn = new Set<number>();
    for (const r of deal.receipts) {
      if (r.month > H) {
        receiptsAfterHorizon += r.amountCents;
        continue;
      }
      const m = months[r.month - 1];
      const fee = commissionOn(r.amountCents, feeBps);
      m.oneOffReceipts += r.amountCents;
      m.eligibleReceipts += r.amountCents;
      m.oneOffCommission += fee;
      if (r.amountCents > 0) paidIn.add(r.month);
    }
    paidIn.forEach((month) => months[month - 1].projectsPaying++);
  }

  // Retainers: commission on each paid month, for the first `cap` paid months only.
  for (const cohort of input.cohorts) {
    if (cohort.customers === 0) continue;
    const paid = [...cohort.paidMonths].sort((a, b) => a - b);
    const perMonthFee = commissionOn(cohort.monthlyFeeCents, feeBps);
    paid.forEach((month, index) => {
      if (month > H) return;
      const m = months[month - 1];
      const receipts = cohort.monthlyFeeCents * cohort.customers;
      const eligible = cap === null || index < cap;
      m.activePaidRetainers += cohort.customers;
      m.retainerReceipts += receipts;
      if (index === 0) m.newRetainerClients += cohort.customers;
      if (eligible) {
        m.commissionableRetainers += cohort.customers;
        m.eligibleReceipts += receipts;
        m.recurringCommission += perMonthFee * cohort.customers;
      }
    });
  }

  let oneOff = 0,
    recurring = 0;
  for (const m of months) {
    m.clientReceipts = m.oneOffReceipts + m.retainerReceipts;
    m.totalCommission = m.oneOffCommission + m.recurringCommission;
    m.kascadeAfterReferral = m.clientReceipts - m.totalCommission;
    oneOff += m.oneOffCommission;
    recurring += m.recurringCommission;
    m.cumulativeOneOff = oneOff;
    m.cumulativeRecurring = recurring;
    m.cumulativeCommission = oneOff + recurring;
  }

  const sum = (key: keyof MonthRecord) =>
    months.reduce((t, m) => t + m[key], 0);
  const totals: SimulationTotals = {
    oneOffCommission: oneOff,
    recurringCommission: recurring,
    totalCommission: oneOff + recurring,
    oneOffReceipts: sum("oneOffReceipts"),
    retainerReceipts: sum("retainerReceipts"),
    clientReceipts: sum("clientReceipts"),
    eligibleReceipts: sum("eligibleReceipts"),
    kascadeAfterReferral: sum("kascadeAfterReferral"),
    endRecurringRunRate: months[H - 1].recurringCommission,
    paidClientMonths: sum("activePaidRetainers"),
    commissionedClientMonths: sum("commissionableRetainers"),
    projects: input.deals.length,
    retainerClients: input.cohorts.reduce((t, c) => t + c.customers, 0),
    receiptsAfterHorizon,
  };

  return {
    input,
    months,
    totals,
    assumptions: [
      "Inputs are signed and paid projects, and active paid retainers — not leads.",
      `Commission is ${feeBps / 100}% of each eligible client payment, rounded to the cent per payment.`,
      cap === null
        ? "Retainer commission applies to every paid month while the client stays (as in Real Coder’s proposal)."
        : `Retainer commission is capped at each client’s first ${cap} paid months (comparison only).`,
      "No churn is assumed unless a shorter stay is entered. Unpaid months earn nothing.",
      "All amounts are AUD, excluding GST, before Kascade’s delivery and operating costs.",
      "Illustrative only: not a forecast, target or guarantee.",
    ],
  };
}

/** Every month: client payments = Real Coder commission + Kascade after referral. */
export function reconciles(output: SimulationOutput): boolean {
  return output.months.every(
    (m) =>
      m.clientReceipts === m.totalCommission + m.kascadeAfterReferral &&
      m.totalCommission === m.oneOffCommission + m.recurringCommission,
  );
}
