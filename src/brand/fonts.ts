/**
 * Brand typefaces (all SIL Open Font License), self-hosted through next/font:
 * - Geist Sans: everything by default.
 * - Instrument Serif italic: at most one highlighted word or phrase per heading.
 * - Geist Mono: small uppercase labels.
 * - Doto: dot-matrix numerals for steps and terms only.
 * The CSS refers only to --font-sans, --font-serif, --font-mono and --font-dots.
 */
import { Doto, Instrument_Serif } from "next/font/google";

export { GeistSans as sans } from "geist/font/sans";
export { GeistMono as mono } from "geist/font/mono";

export const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["italic", "normal"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const dots = Doto({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-doto",
  display: "swap",
});
