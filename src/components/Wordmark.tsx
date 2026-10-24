import { BRAND } from "@/brand/brand";

/** Typographic placeholder for the Kascade Studio logo, until the brand pass. */
export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`wordmark ${className}`} aria-label={BRAND.studio} role="img">
      <span aria-hidden="true">{BRAND.wordmark.primary}</span>
      <span aria-hidden="true">{BRAND.wordmark.secondary}</span>
    </span>
  );
}
