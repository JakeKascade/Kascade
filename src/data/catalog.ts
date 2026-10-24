/**
 * Kascade Studio service catalogue and proposed referral terms.
 *
 * The single source for every price, allowance and term on the page, in the
 * calculator, the exports and the tests. All money is integer AUD cents,
 * excluding GST. Source: "Kascade × Real Coder partnership — commercial and
 * copy master (V1)", a working draft pending Callum's commercial review.
 * Nothing here is an accepted or signed term.
 */

export type BrandingId = "basic" | "professional";
export type RealEstateId = "boutique" | "reGrowth" | "volume" | "reCustom";
export type CreativeId = "essential" | "creativeGrowth" | "embedded";
export type ServiceId = BrandingId | RealEstateId | CreativeId;
export type Category = "branding" | "realEstate" | "creative";

type Base = {
  id: ServiceId;
  category: Category;
  /** Full package name. */
  name: string;
  /** Shorter label for tight spaces (selects, table rows). */
  short: string;
  summary: string;
  fits: string;
  included: readonly string[];
  excluded: readonly string[];
};
export type OneOffService = Base & {
  billing: "once";
  priceCents: number;
};
export type RetainerService = Base & {
  billing: "monthly";
  /** Null where the fee is tailored and must be entered as an agreed amount. */
  monthlyCents: number | null;
  listingsPerMonth?: number;
  capacityHours?: number;
};
export type Service = OneOffService | RetainerService;

const BRAND_EXCLUDED_COMMON = [
  "Naming, trademark or legal research",
  "Website design or development",
  "Print production",
] as const;

export const SERVICES: Readonly<Record<ServiceId, Service>> = {
  basic: {
    id: "basic",
    category: "branding",
    billing: "once",
    name: "Basic / Refresh",
    short: "Basic / Refresh",
    priceCents: 180_000,
    summary: "A clean, consistent core identity.",
    fits: "New or established businesses that need a professional visual foundation, or a brand that needs refinement rather than reinvention.",
    included: [
      "Brief and focused creative discovery",
      "Logo refinement, or one focused new identity direction",
      "Primary and secondary logo variations",
      "Core colour palette and typography choices",
      "Essential digital-ready and print-ready logo exports",
      "Concise brand usage sheet",
      "Two consolidated feedback rounds on the selected direction",
    ],
    excluded: [
      "Extensive brand strategy",
      "Multiple fully developed creative routes",
      "Comprehensive rollout collateral",
      ...BRAND_EXCLUDED_COMMON,
    ],
  },
  professional: {
    id: "professional",
    category: "branding",
    billing: "once",
    name: "Professional Branding",
    short: "Professional Branding",
    priceCents: 480_000,
    summary: "A fuller identity system, ready for wider marketing.",
    fits: "Businesses that want a fully developed identity, better consistency across touchpoints and a stronger base for future marketing.",
    included: [
      "Brand discovery and creative briefing",
      "Two initial identity directions; one developed further",
      "Primary and secondary logo system and variations",
      "Typography, colour and supporting graphic language",
      "Expanded brand guidelines",
      "An agreed small set of essential applications, such as business cards, email signature or social brand assets",
      "Final editable brand asset package",
      "Two consolidated feedback rounds after direction selection",
    ],
    excluded: [
      "A formal brand strategy workshop and research programme",
      "Unlimited marketing collateral",
      ...BRAND_EXCLUDED_COMMON,
    ],
  },
  boutique: {
    id: "boutique",
    category: "realEstate",
    billing: "monthly",
    name: "Boutique",
    short: "Real estate · Boutique",
    monthlyCents: 195_000,
    listingsPerMonth: 3,
    summary: "Up to 3 new listing campaigns a month.",
    fits: "Smaller independent agencies with a steady flow of listings.",
    included: [],
    excluded: [],
  },
  reGrowth: {
    id: "reGrowth",
    category: "realEstate",
    billing: "monthly",
    name: "Growth",
    short: "Real estate · Growth",
    monthlyCents: 345_000,
    listingsPerMonth: 6,
    summary: "Up to 6 new listing campaigns a month.",
    fits: "Established agencies running several campaigns at once.",
    included: [],
    excluded: [],
  },
  volume: {
    id: "volume",
    category: "realEstate",
    billing: "monthly",
    name: "Volume",
    short: "Real estate · Volume",
    monthlyCents: 495_000,
    listingsPerMonth: 9,
    summary: "Up to 9 new listing campaigns a month.",
    fits: "Busy agencies that need dependable, high-volume production.",
    included: [],
    excluded: [],
  },
  reCustom: {
    id: "reCustom",
    category: "realEstate",
    billing: "monthly",
    name: "Higher volume (10+)",
    short: "Real estate · 10+ tailored",
    monthlyCents: null,
    summary: "10 or more new listing campaigns a month, on tailored terms.",
    fits: "High-volume agencies. Priced by scope; modelled only on an amount you enter.",
    included: [],
    excluded: [],
  },
  essential: {
    id: "essential",
    category: "creative",
    billing: "monthly",
    name: "Essential",
    short: "Creative Partner · Essential",
    monthlyCents: 180_000,
    capacityHours: 12,
    summary: "Up to 12 creative hours a month.",
    fits: "Businesses with light recurring campaign and design needs.",
    included: [],
    excluded: [],
  },
  creativeGrowth: {
    id: "creativeGrowth",
    category: "creative",
    billing: "monthly",
    name: "Growth",
    short: "Creative Partner · Growth",
    monthlyCents: 325_000,
    capacityHours: 26,
    summary: "Up to 26 creative hours a month.",
    fits: "Businesses with regular, multi-channel creative demand.",
    included: [],
    excluded: [],
  },
  embedded: {
    id: "embedded",
    category: "creative",
    billing: "monthly",
    name: "Embedded",
    short: "Creative Partner · Embedded",
    monthlyCents: 420_000,
    capacityHours: 42,
    summary: "Up to 42 creative hours a month.",
    fits: "Businesses needing substantial ongoing creative production.",
    included: [],
    excluded: [],
  },
};

/** Brand Strategy & Positioning: an add-on to a branding project, never a base tier. */
export const STRATEGY_ADD_ON = {
  name: "Brand Strategy & Positioning",
  minCents: 400_000,
  maxCents: 600_000,
  /** A hypothetical midpoint used only for modelling. */
  illustrativeCents: 500_000,
  stepCents: 50_000,
  summary:
    "Deeper discovery, positioning, audience and messaging strategy, when the business needs it.",
  included: [
    "Stakeholder discovery",
    "Competitor and category scan",
    "Target audience and points of difference",
    "Positioning and value proposition",
    "Brand personality, messaging hierarchy and tone-of-voice direction",
    "A documented strategic platform",
  ],
} as const;

/** Optional agency-wide marketing creative, only alongside a real estate retainer. */
export const AGENCY_ADD_ON = {
  name: "Agency Marketing Creative",
  monthlyCents: 125_000,
  capacityHours: 10,
  summary:
    "Up to 10 additional agreed creative hours a month for agency-wide marketing, separate from listing campaigns.",
  examples: [
    "Agency and corporate collateral",
    "Recruitment and staff announcements",
    "Office and community campaign artwork",
    "Agency-wide newsletters",
    "Presentation decks",
    "Branded social templates",
  ],
  excluded: [
    "SEO/AEO and technical website development",
    "Paid-media management",
    "Significant marketing strategy or full campaign management",
    "An unlimited creative desk",
  ],
} as const;

export const REAL_ESTATE_SCOPE = {
  /** Deliberately open: standard agency deliverables, not an exhaustive list. */
  summary:
    "Coming soon, for sale and sold marketing collateral, including signboards, brochures, flyers, EDM designs and more.",
  included: [
    "Coming soon, for sale and sold marketing collateral",
    "Signboards, brochures and flyers",
    "Social and digital ad artwork",
    "EDM designs",
    "Other standard agency deliverables",
  ],
  excluded: [
    "Photography and video",
    "Printing",
    "Copywriting from scratch",
    "Ad spend and posting",
  ],
  definition:
    "A new listing campaign is counted once, when Kascade accepts the initial complete campaign brief. Standard later-stage artwork for the same property is part of that campaign, not another new listing.",
  term: "Proposed three-month initial engagement, billed monthly, reviewed against actual listings and workload.",
} as const;

export const CREATIVE_SCOPE = {
  services: [
    "Campaign creative",
    "Digital ad artwork",
    "Print collateral",
    "Promotional graphics",
    "EDM artwork",
    "Presentation design",
    "Social assets",
    "Brand-consistent collateral",
  ],
  excluded: [
    "A guaranteed number of every possible output, or unlimited concepts",
    "Media buying and ad account management",
    "SEO and technical websites",
    "Photography and video production",
    "Copy strategy by default, or broad marketing management",
  ],
  mechanics: [
    "An agreed monthly capacity, prioritised against an agreed scope",
    "Monthly reporting and a single intake and approval channel",
    "Reasonable feedback limits",
    "Work beyond the allocation is quoted, or moves to a higher tier",
    "Unused capacity doesn’t accumulate indefinitely",
    "A suggested three-month initial term",
  ],
} as const;

/**
 * Proposed referral terms. 10% on eligible paid fees; recurring commission for
 * the first 12 paid months of each retainer (a proposal, not agreed).
 */
export const REFERRAL_TERMS = {
  defaultFeeBps: 1000,
  /** Range available only in the clearly labelled negotiation settings. */
  minFeeBps: 500,
  maxFeeBps: 1500,
  stepFeeBps: 50,
  proposedMaxPaidRetainerMonths: 12,
  paymentDaysAfterMonthEnd: 14,
  registrationProtectionMonths: 6,
  pilotDays: 90,
} as const;

export const MODEL_DEFAULTS = {
  horizonMonths: 12,
  extendedHorizonMonths: 24,
} as const;

export function isRetainer(service: Service): service is RetainerService {
  return service.billing === "monthly";
}
