/**
 * The calculator's editable scenario, and its translation into model input.
 * Lines describe signed-and-paid referrals; the model does all the arithmetic.
 */
import {
  AGENCY_ADD_ON,
  MODEL_DEFAULTS,
  REFERRAL_TERMS,
  SERVICES,
  STRATEGY_ADD_ON,
  isRetainer,
  type BrandingId,
  type CreativeId,
  type RealEstateId,
  type ServiceId,
} from "@/data/catalog";
import {
  simulate,
  type OneOffDeal,
  type RetainerCohort,
  type SimulationInput,
  type SimulationOutput,
} from "./referral-model";

export type ReferralLine = {
  id: string;
  service: ServiceId;
  /** Signed and paid clients (projects) or active paid clients (retainers). */
  count: number;
  /** Model month the project is paid or the retainer starts. */
  startMonth: number;
  /** Branding only: attach Brand Strategy & Positioning. */
  strategy: boolean;
  strategyCents: number;
  /** Real estate only: the agency marketing creative add-on, explicitly selected. */
  agencyAddOn: boolean;
  /** 10+ real estate only: the agreed monthly fee, entered by hand. */
  customMonthlyCents: number | null;
  /** Retainers: paid months per client. Null = pays every month to the end of the view. */
  stayMonths: number | null;
};

export type ScenarioSettings = {
  feeBps: number;
  horizonMonths: number;
  /** "proposed" = first 12 paid months; "ongoing" = while active (comparison only). */
  recurringPeriod: "proposed" | "ongoing";
  /** Branding: paid in full, or a 50% deposit with the balance a month later. */
  projectPayment: "full" | "split";
};

export type Scenario = {
  lines: ReferralLine[];
  settings: ScenarioSettings;
};

export const MAX_CLIENTS_PER_LINE = 20;
export const MAX_LINES = 12;

export const DEFAULT_SETTINGS: Readonly<ScenarioSettings> = Object.freeze({
  feeBps: REFERRAL_TERMS.defaultFeeBps,
  horizonMonths: MODEL_DEFAULTS.horizonMonths,
  recurringPeriod: "proposed",
  projectPayment: "full",
});

let counter = 0;
export function newLine(partial: Partial<ReferralLine> = {}): ReferralLine {
  counter += 1;
  return {
    id: partial.id ?? `line-${counter}`,
    service: "professional",
    count: 1,
    startMonth: 1,
    strategy: false,
    strategyCents: STRATEGY_ADD_ON.illustrativeCents,
    agencyAddOn: false,
    customMonthlyCents: null,
    stayMonths: null,
    ...partial,
  };
}

/** Why a line can't be modelled yet, or null when it can. */
export function lineIssue(line: ReferralLine): string | null {
  if (line.service === "reCustom" && !(line.customMonthlyCents! > 0))
    return "Enter the agreed monthly fee to include a 10+ listing retainer.";
  return null;
}

/** The monthly fee a retainer line is modelled at (per client), or null for projects. */
export function lineMonthlyFee(line: ReferralLine): number | null {
  const s = SERVICES[line.service];
  if (!isRetainer(s)) return null;
  const base =
    line.service === "reCustom" ? (line.customMonthlyCents ?? 0) : s.monthlyCents!;
  const addOn =
    s.category === "realEstate" && line.agencyAddOn ? AGENCY_ADD_ON.monthlyCents : 0;
  return base + addOn;
}

/** The project value a branding line is modelled at (per client), or null for retainers. */
export function lineProjectValue(line: ReferralLine): number | null {
  const s = SERVICES[line.service];
  if (isRetainer(s)) return null;
  return s.priceCents + (line.strategy ? line.strategyCents : 0);
}

function receiptsFor(value: number, month: number, payment: ScenarioSettings["projectPayment"]) {
  if (payment === "full") return [{ month, amountCents: value }];
  const deposit = Math.floor(value / 2);
  return [
    { month, amountCents: deposit },
    { month: month + 1, amountCents: value - deposit },
  ];
}

export function toInput(scenario: Scenario): SimulationInput {
  const { settings } = scenario;
  const H = settings.horizonMonths;
  const deals: OneOffDeal[] = [];
  const cohorts: RetainerCohort[] = [];
  for (const line of scenario.lines) {
    if (lineIssue(line)) continue;
    const s = SERVICES[line.service];
    const start = Math.max(1, Math.min(H, line.startMonth));
    const count = Math.max(0, Math.min(MAX_CLIENTS_PER_LINE, Math.round(line.count)));
    if (!isRetainer(s)) {
      const value = lineProjectValue(line)!;
      for (let i = 0; i < count; i++)
        deals.push({
          id: `${line.id}-${i + 1}`,
          service: line.service as BrandingId,
          strategyCents: line.strategy ? line.strategyCents : 0,
          valueCents: value,
          receipts: receiptsFor(value, start, settings.projectPayment),
        });
    } else {
      const last = line.stayMonths === null ? H : Math.min(H, start + line.stayMonths - 1);
      const paidMonths = Array.from({ length: Math.max(0, last - start + 1) }, (_, i) => start + i);
      const fee = lineMonthlyFee(line)!;
      cohorts.push({
        id: line.id,
        service: line.service as RealEstateId | CreativeId,
        customers: count,
        startMonth: start,
        monthlyFeeCents: fee,
        addOnCents: fee - (line.service === "reCustom" ? line.customMonthlyCents! : s.monthlyCents!),
        paidMonths,
      });
    }
  }
  return {
    horizonMonths: H,
    feeBps: settings.feeBps,
    recurringCapMonths:
      settings.recurringPeriod === "proposed"
        ? REFERRAL_TERMS.proposedMaxPaidRetainerMonths
        : null,
    deals,
    cohorts,
  };
}

export function run(scenario: Scenario): SimulationOutput {
  return simulate(toInput(scenario));
}

/** Settings differ from the proposal (used to flag a negotiation scenario). */
export function settingsAdjusted(settings: ScenarioSettings) {
  return (Object.keys(DEFAULT_SETTINGS) as (keyof ScenarioSettings)[]).some(
    (k) => settings[k] !== DEFAULT_SETTINGS[k],
  );
}

export type Preset = {
  id: string;
  name: string;
  description: string;
  lines: Omit<ReferralLine, "id">[];
};
const line = (p: Partial<ReferralLine>): Omit<ReferralLine, "id"> => {
  const { id: _id, ...rest } = newLine(p);
  void _id;
  return rest;
};

/** Three illustrative cases. Their assumptions are the lines themselves, shown in full. */
export const PRESETS: readonly Preset[] = [
  {
    id: "first",
    name: "One agency, one brand",
    description:
      "A Growth real estate agency from month 1 and a Professional Branding project paid in month 2.",
    lines: [
      line({ service: "reGrowth", count: 1, startMonth: 1 }),
      line({ service: "professional", count: 1, startMonth: 2 }),
    ],
  },
  {
    id: "quarterly",
    name: "An agency each quarter",
    description:
      "A new Growth real estate agency in months 1, 4, 7 and 10, plus two Professional Branding projects.",
    lines: [
      line({ service: "reGrowth", count: 1, startMonth: 1 }),
      line({ service: "reGrowth", count: 1, startMonth: 4 }),
      line({ service: "reGrowth", count: 1, startMonth: 7 }),
      line({ service: "reGrowth", count: 1, startMonth: 10 }),
      line({ service: "professional", count: 2, startMonth: 3 }),
    ],
  },
  {
    id: "mix",
    name: "A broader mix",
    description:
      "Two brand refreshes, one Professional brand with strategy, a Volume agency from month 5 and an Essential creative retainer from month 3.",
    lines: [
      line({ service: "basic", count: 1, startMonth: 1 }),
      line({ service: "basic", count: 1, startMonth: 6 }),
      line({ service: "professional", count: 1, startMonth: 4, strategy: true }),
      line({ service: "volume", count: 1, startMonth: 5 }),
      line({ service: "essential", count: 1, startMonth: 3 }),
    ],
  },
];

export function presetScenario(id: string, settings: ScenarioSettings = { ...DEFAULT_SETTINGS }): Scenario {
  const preset = PRESETS.find((p) => p.id === id) ?? PRESETS[0];
  return {
    lines: preset.lines.map((l, i) => ({ ...l, id: `${preset.id}-${i + 1}` })),
    settings,
  };
}

/** Which preset (if any) the current lines still match exactly. */
export function matchingPreset(lines: ReferralLine[]): string | null {
  const strip = (l: Omit<ReferralLine, "id">) =>
    JSON.stringify([l.service, l.count, l.startMonth, l.strategy, l.strategyCents, l.agencyAddOn, l.customMonthlyCents, l.stayMonths]);
  const current = lines.map(strip).join("|");
  return PRESETS.find((p) => p.lines.map(strip).join("|") === current)?.id ?? null;
}

export const DEFAULT_SCENARIO: Scenario = presetScenario("first");
