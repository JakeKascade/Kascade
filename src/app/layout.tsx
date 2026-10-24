import type { Metadata, Viewport } from "next";
import { BRAND } from "@/brand/brand";
import { mono, sans } from "@/brand/fonts";
import "@/brand/tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  title: BRAND.title,
  description: BRAND.description,
  robots: { index: false, follow: false, nocache: true },
};
export const viewport: Viewport = {
  themeColor: "#111111",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
