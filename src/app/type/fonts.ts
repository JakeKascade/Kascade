/**
 * Candidate typefaces for the typography study (/type). All SIL Open Font
 * License, self-hosted through next/font. Loaded only on the study page.
 */
import {
  Albert_Sans,
  Bricolage_Grotesque,
  Cormorant_Garamond,
  Doto,
  EB_Garamond,
  Fraunces,
  Funnel_Display,
  Hanken_Grotesk,
  Host_Grotesk,
  IBM_Plex_Mono,
  Instrument_Serif,
  Inter_Tight,
  JetBrains_Mono,
  Newsreader,
  Playfair_Display,
  Schibsted_Grotesk,
} from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

// next/font needs literal options at every call (no shared spreads).
const interTight = Inter_Tight({ subsets: ["latin"], display: "swap", style: ["normal", "italic"] });
const hostGrotesk = Host_Grotesk({ subsets: ["latin"], display: "swap" });
const hankenGrotesk = Hanken_Grotesk({ subsets: ["latin"], display: "swap" });
const schibstedGrotesk = Schibsted_Grotesk({ subsets: ["latin"], display: "swap" });
const funnelDisplay = Funnel_Display({ subsets: ["latin"], display: "swap" });
const albertSans = Albert_Sans({ subsets: ["latin"], display: "swap" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], display: "swap" });

const instrumentSerif = Instrument_Serif({ subsets: ["latin"], display: "swap", weight: "400", style: ["normal", "italic"] });
const ebGaramond = EB_Garamond({ subsets: ["latin"], display: "swap", style: ["normal", "italic"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], display: "swap", style: ["normal", "italic"] });
const newsreader = Newsreader({ subsets: ["latin"], display: "swap", style: ["normal", "italic"] });
const fraunces = Fraunces({ subsets: ["latin"], display: "swap", style: ["normal", "italic"] });
const playfair = Playfair_Display({ subsets: ["latin"], display: "swap", style: ["normal", "italic"] });

const doto = Doto({ subsets: ["latin"], display: "swap", weight: ["500", "700"] });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], display: "swap", weight: ["400", "500"] });

export type Face = { code: string; name: string; family: string; note: string };

export const SANS: Face[] = [
  { code: "S1", name: "Geist", family: GeistSans.style.fontFamily, note: "Current. Neutral and technical, slightly narrow." },
  { code: "S2", name: "Inter Tight", family: interTight.style.fontFamily, note: "Closest free match to Neue Haas / Helvetica Now, as in the pixel reference." },
  { code: "S3", name: "Host Grotesk", family: hostGrotesk.style.fontFamily, note: "A warmer grotesk with open, rounded shapes." },
  { code: "S4", name: "Hanken Grotesk", family: hankenGrotesk.style.fontFamily, note: "Friendly and very legible at small sizes." },
  { code: "S5", name: "Schibsted Grotesk", family: schibstedGrotesk.style.fontFamily, note: "Editorial newspaper grotesk; strongest at heavier weights." },
  { code: "S6", name: "Funnel Display", family: funnelDisplay.style.fontFamily, note: "Distinctive display grotesk with quirky details." },
  { code: "S7", name: "Albert Sans", family: albertSans.style.fontFamily, note: "Scandinavian, geometric-leaning; elegant when light." },
  { code: "S8", name: "Bricolage Grotesque", family: bricolage.style.fontFamily, note: "The most characterful of the set; very ‘agency’." },
];

export const SERIFS: Face[] = [
  { code: "R1", name: "Instrument Serif", family: instrumentSerif.style.fontFamily, note: "Current. Condensed, sharp italic, like the Colab reference." },
  { code: "R2", name: "EB Garamond", family: ebGaramond.style.fontFamily, note: "Classic and bookish, like the Axion reference." },
  { code: "R3", name: "Cormorant Garamond", family: cormorant.style.fontFamily, note: "Very high contrast; elegant, delicate at small sizes." },
  { code: "R4", name: "Newsreader", family: newsreader.style.fontFamily, note: "Contemporary editorial serif; sturdy and readable." },
  { code: "R5", name: "Fraunces", family: fraunces.style.fontFamily, note: "Soft and warm, with a characterful italic." },
  { code: "R6", name: "Playfair Display", family: playfair.style.fontFamily, note: "High contrast, fashion and luxury feel." },
];

export const NUMERALS: Face[] = [
  { code: "N1", name: "Doto (dot matrix)", family: doto.style.fontFamily, note: "Current, for step and term numbers." },
  { code: "N2", name: "Geist Mono", family: GeistMono.style.fontFamily, note: "Clean, technical." },
  { code: "N3", name: "JetBrains Mono", family: jetbrains.style.fontFamily, note: "Slightly taller, coder feel." },
  { code: "N4", name: "IBM Plex Mono", family: plexMono.style.fontFamily, note: "Warmer, with serifed details." },
];

export type Pairing = { code: string; sans: string; serif: string | null; weight: number; note: string };

/** Curated combinations, by face code. */
export const PAIRINGS: Pairing[] = [
  { code: "P1", sans: "S2", serif: "R1", weight: 500, note: "Crisp Swiss sans with a sharp condensed italic. Closest to the references." },
  { code: "P2", sans: "S3", serif: "R2", weight: 400, note: "Warm and literary. Calm, premium, a little softer." },
  { code: "P3", sans: "S4", serif: "R4", weight: 500, note: "Friendly and highly readable. Least risky." },
  { code: "P4", sans: "S5", serif: "R5", weight: 600, note: "Bolder and warmer, with more personality." },
  { code: "P5", sans: "S7", serif: "R3", weight: 300, note: "Light and elegant. Most refined, least punchy." },
  { code: "P6", sans: "S2", serif: null, weight: 500, note: "Control: one sans only, no serif accents." },
];
