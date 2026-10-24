import { BRAND } from "@/brand/brand";

/** The Kascade Studio logo lockup (supplied artwork, unaltered). */
export default function Wordmark({ tone = "white", className = "" }: { tone?: "white" | "black"; className?: string }) {
  return (
    <img
      className={`logo ${className}`}
      src={tone === "white" ? BRAND.logo.white : BRAND.logo.black}
      alt={BRAND.studio}
      width={BRAND.logo.width}
      height={BRAND.logo.height}
    />
  );
}
