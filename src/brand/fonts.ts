/**
 * One typeface: Inter Tight (SIL Open Font License), self-hosted through
 * next/font. Light and regular weights, tight tracking; emphasis comes from
 * colour (white against grey), never from a second face. The CSS refers only
 * to --font-sans.
 */
import { Inter_Tight } from "next/font/google";

export const sans = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});
