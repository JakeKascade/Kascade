import type { Metadata, Viewport } from "next";
import { BRAND } from "@/brand/brand";
import { sans } from "@/brand/fonts";
import "@/brand/tokens.css";
import "./globals.css";

// Neutral by default: only the proposal's own page (and its code screen) names the partner.
export const metadata: Metadata = {
  title: `${BRAND.studio} — Private proposal`,
  robots: { index: false, follow: false, nocache: true },
};
export const viewport: Viewport = {
  themeColor: "#111317",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}
