import { BRAND } from "@/brand/brand";
import { REFERRAL_TERMS } from "@/data/catalog";
import { Screen, tone } from "../Primitives";

const TERMS = [
  "10% of every payment a referred client makes, excluding GST.",
  "On monthly packages, 10% of every payment for as long as the client stays.",
  `Paid within ${REFERRAL_TERMS.paymentDaysAfterMonthEnd} days of the end of the month the client pays.`,
  "The client agrees to the introduction, and we both record it.",
  `An introduction is protected for ${REFERRAL_TERMS.registrationProtectionMonths} months.`,
  "No quotas and no exclusivity. Each team keeps its own clients and work.",
  "The same both ways: Kascade earns 10% on SEO retainers it refers to Real Coder, while they stay active.",
  "Optional cross-promotion of each other’s services.",
];

export function Terms() {
  return (
    <Screen id="terms" title={tone("**Terms**")}>
      <ol className="terms">
        {TERMS.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ol>
      <p className="discuss">
        <strong>Matched to your proposal:</strong> the same 10%, on the same
        ongoing basis, in both directions.
      </p>
      <p className="fine">
        Proposed terms only, subject to a written agreement between {BRAND.studio} and {BRAND.partner}.
      </p>
    </Screen>
  );
}

const NEXT = [
  "Agree the terms",
  `Trial it with a few clients for ${REFERRAL_TERMS.pilotDays} days`,
  "Review it together",
];

export function NextSteps() {
  return (
    <Screen id="next" centered title={tone("**Next** steps")}>
      <ol className="next">
        {NEXT.map((n, i) => (
          <li key={n}>
            <span className="step-num">{String(i + 1).padStart(2, "0")}</span>
            {n}
          </li>
        ))}
      </ol>
      <p className="fine colophon">
        {BRAND.status} · Prepared for {BRAND.audience} at {BRAND.partner} ·{" "}
        {BRAND.dated} · All prices AUD excluding GST
      </p>
    </Screen>
  );
}
