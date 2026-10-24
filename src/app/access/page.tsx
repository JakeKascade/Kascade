import type { Metadata } from "next";
import { headers } from "next/headers";
import { connection } from "next/server";
import AccessGate from "@/components/AccessGate";
import { BRAND } from "@/brand/brand";
import { PROPOSAL_HEADER, codeLength } from "@/lib/access";

/** The proposal whose link was opened, if any (set by src/proxy.ts). */
async function proposal() {
  return (await headers()).get(PROPOSAL_HEADER) === "real-coder";
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: (await proposal())
      ? `${BRAND.studio} × ${BRAND.partner} — Private proposal`
      : `${BRAND.studio} — Private proposal`,
    robots: { index: false, follow: false, nocache: true },
  };
}
export default async function AccessPage() {
  // Read the configured code at request time, not build time.
  await connection();
  // Only the code's length reaches the browser, never the code itself.
  return <AccessGate length={codeLength()} partner={await proposal()} />;
}
