/**
 * Names, copy constants and logo files. Colours and type live in
 * src/brand/tokens.css and src/brand/fonts.ts.
 */
export const BRAND = {
  studio: "Kascade Studio",
  /** Supplied logo lockups (viewBox 949.79 × 170.95). */
  logo: {
    white: "/brand/kascade-logo-white.svg",
    black: "/brand/kascade-logo-black.svg",
    width: 950,
    height: 171,
  },
  partner: "Real Coder",
  /** The people the proposal is written for. */
  audience: "Matt and Sam",
  title: "Kascade Studio × Real Coder — Partnership proposal",
  description:
    "A proposed referral partnership between Kascade Studio and Real Coder: services, referral terms and an interactive commission calculator.",
  positioning: ["Better brands.", "Stronger digital experiences.", "Shared opportunities."],
  dated: "October 2026",
} as const;
