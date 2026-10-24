import type { Metadata } from "next";
import { BRAND } from "@/brand/brand";
import Presentation from "@/components/Presentation";

export const metadata: Metadata = {
  title: BRAND.title,
  description: BRAND.description,
};

export default function Page() {
  return <Presentation />;
}
