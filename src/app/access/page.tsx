import type { Metadata } from "next";
import { connection } from "next/server";
import AccessGate from "@/components/AccessGate";
import { BRAND } from "@/brand/brand";
import { codeLength } from "@/lib/access";

export const metadata: Metadata = {
  title: `${BRAND.studio} — Private proposal`,
  robots: { index: false, follow: false, nocache: true },
};
export default async function AccessPage() {
  // Read the configured code at request time, not build time.
  await connection();
  // Only the code's length reaches the browser, never the code itself.
  return <AccessGate length={codeLength()} />;
}
