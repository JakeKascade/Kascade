import type { Metadata } from "next";
import AccessGate from "@/components/AccessGate";
import { accessCode } from "@/lib/access";

export const metadata: Metadata = {
  title: "ELITA — Confidential",
  robots: { index: false, follow: false, nocache: true },
};
export default function AccessPage() {
  // Only the code's length reaches the browser, never the code itself.
  return <AccessGate length={accessCode().length} />;
}
