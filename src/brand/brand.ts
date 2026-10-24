/**
 * Brand and identity placeholders. The Kascade visual identity for this
 * proposal is deliberately deferred: replace these values, the wordmark
 * component and src/brand/tokens.css in the branding pass. Nothing else in the
 * page should need to change.
 */
export const BRAND = {
  studio: "Kascade Studio",
  /** Shown in the placeholder wordmark. */
  wordmark: { primary: "Kascade", secondary: "Studio" },
  partner: "Real Coder",
  /** The people the proposal is written for. */
  audience: "Matt and Sam",
  title: "Kascade Studio × Real Coder — Partnership proposal",
  description:
    "A proposed referral partnership between Kascade Studio and Real Coder: services, referral terms and an interactive commission calculator.",
  positioning: ["Better brands.", "Stronger digital experiences.", "Shared opportunities."],
  /** Remove or change once the proposal is approved for sharing. */
  status: "Working draft",
  dated: "October 2026",
} as const;
