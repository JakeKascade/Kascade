import type { Metadata } from "next";
import TypeBoard from "@/components/TypeBoard";
import { NUMERALS, PAIRINGS, SANS, SERIFS } from "./fonts";
import "./type.css";

export const metadata: Metadata = {
  title: "Kascade Studio — Typography study",
  robots: { index: false, follow: false, nocache: true },
};

export default function TypePage() {
  return <TypeBoard sans={SANS} serifs={SERIFS} numerals={NUMERALS} pairings={PAIRINGS} />;
}
