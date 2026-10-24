import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ELITA — A Potential Partnership",
  description:
    "Private, hypothetical capital partnership discussion and interactive financial model.",
  robots: { index: false, follow: false, nocache: true },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
