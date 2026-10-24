/**
 * One price-list format for every service, built from the catalogue so the
 * three service screens and the calculator can never disagree.
 */
import {
  AGENCY_ADD_ON,
  CREATIVE_SCOPE,
  REAL_ESTATE_SCOPE,
  REFERRAL_TERMS,
  SERVICES,
  STRATEGY_ADD_ON,
  type ServiceId,
} from "./catalog";

export type PriceRow = {
  key: string;
  name: string;
  detail: string;
  billing: "once" | "monthly";
  /** Fixed price in cents, a [min, max] range, or "quoted". */
  price: number | [number, number] | "quoted";
  addOn?: boolean;
  /** Set when the row can be counted in the calculator. */
  service?: ServiceId;
};

export type PriceList = {
  id: "branding" | "real-estate" | "ongoing";
  eyebrow: string;
  title: string;
  intro: string;
  billing: "once" | "monthly";
  rows: PriceRow[];
  /** Plain one-line rule specific to this service, or nothing. */
  note?: string;
  included: { heading: string; items: readonly string[] }[];
};

const fixed = (id: ServiceId) => {
  const s = SERVICES[id];
  return s.billing === "once" ? s.priceCents : (s.monthlyCents ?? 0);
};
const hours = (id: ServiceId) => {
  const s = SERVICES[id];
  return s.billing === "monthly" ? s.capacityHours : undefined;
};
const listings = (id: ServiceId) => {
  const s = SERVICES[id];
  return s.billing === "monthly" ? s.listingsPerMonth : undefined;
};

export const PRICE_LISTS: readonly PriceList[] = [
  {
    id: "branding",
    eyebrow: "Service A · One-off projects",
    title: "Branding & Identity",
    intro: "Logos and brand identities for new or growing businesses.",
    billing: "once",
    rows: [
      {
        key: "basic",
        name: SERVICES.basic.name,
        detail: "Logo refresh or one new direction, colours, type and a usage sheet",
        billing: "once",
        price: fixed("basic"),
        service: "basic",
      },
      {
        key: "professional",
        name: SERVICES.professional.name,
        detail: "Two directions, a full logo system, guidelines and essential applications",
        billing: "once",
        price: fixed("professional"),
        service: "professional",
      },
      {
        key: "strategy",
        name: "Brand Strategy",
        detail: "Positioning, audience and messaging, added to either package",
        billing: "once",
        price: [STRATEGY_ADD_ON.minCents, STRATEGY_ADD_ON.maxCents],
        addOn: true,
      },
    ],
    included: [
      { heading: SERVICES.basic.name, items: SERVICES.basic.included },
      { heading: SERVICES.professional.name, items: SERVICES.professional.included },
      { heading: "Brand Strategy", items: STRATEGY_ADD_ON.included },
      {
        heading: "Not included",
        items: [
          "Naming, trademark or legal research",
          "Website design or development",
          "Print production",
        ],
      },
    ],
  },
  {
    id: "real-estate",
    eyebrow: "Service B · Monthly packages",
    title: "Real Estate Campaign Retainers",
    intro: `Standard agency deliverables for every listing: ${REAL_ESTATE_SCOPE.summary.charAt(0).toLowerCase()}${REAL_ESTATE_SCOPE.summary.slice(1)}`,
    billing: "monthly",
    rows: [
      ...(["boutique", "reGrowth", "volume"] as const).map((id) => ({
        key: id,
        name: SERVICES[id].name,
        detail: `Up to ${listings(id)} new listings a month`,
        billing: "monthly" as const,
        price: fixed(id),
        service: id,
      })),
      {
        key: "reCustom",
        name: "10+ listings",
        detail: "Higher-volume agencies",
        billing: "monthly",
        price: "quoted",
      },
      {
        key: "agency",
        name: "Agency Marketing",
        detail: `Up to ${AGENCY_ADD_ON.capacityHours} extra design hours a month for agency-wide marketing`,
        billing: "monthly",
        price: AGENCY_ADD_ON.monthlyCents,
        addOn: true,
      },
    ],
    note: "A listing counts once, when we accept its brief. All later artwork for that property is included.",
    included: [
      { heading: "Every listing includes", items: REAL_ESTATE_SCOPE.included },
      { heading: "Not included", items: REAL_ESTATE_SCOPE.excluded },
    ],
  },
  {
    id: "ongoing",
    eyebrow: "Service C · Monthly packages",
    title: "Ongoing Design Retainers",
    intro: "A monthly design team for businesses outside real estate.",
    billing: "monthly",
    rows: (["essential", "creativeGrowth", "embedded"] as const).map((id) => ({
      key: id,
      name: SERVICES[id].name,
      detail: `Up to ${hours(id)} design hours a month`,
      billing: "monthly" as const,
      price: fixed(id),
      service: id,
    })),
    included: [
      { heading: "What the hours cover", items: CREATIVE_SCOPE.services },
      { heading: "How it works", items: CREATIVE_SCOPE.mechanics },
      { heading: "Not included", items: CREATIVE_SCOPE.excluded },
    ],
  },
];

export const RATE_BPS = REFERRAL_TERMS.defaultFeeBps;
export const CAP_MONTHS = REFERRAL_TERMS.proposedMaxPaidRetainerMonths;
