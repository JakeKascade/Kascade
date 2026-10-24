import { BRAND } from "@/brand/brand";
import { REFERRAL_TERMS } from "@/data/catalog";
import { Screen, emphasise } from "../Primitives";

const TERMS = [
  "10% of every payment a referred client makes, excluding GST.",
  `On monthly packages, 10% for each client’s first ${REFERRAL_TERMS.proposedMaxPaidRetainerMonths} paid months.`,
  `Paid within ${REFERRAL_TERMS.paymentDaysAfterMonthEnd} days of the end of the month the client pays.`,
  "The client agrees to the introduction, and we both record it.",
  `An introduction is protected for ${REFERRAL_TERMS.registrationProtectionMonths} months.`,
  "No quotas and no exclusivity. Each team keeps its own clients and work.",
  "It works both ways: Kascade refers web and SEO work to Real Coder.",
];

export function Terms() {
  return (
    <Screen id="terms" title="Terms">
      <ol className="terms">
        {TERMS.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ol>
      <p className="discuss">
        <strong>To agree together:</strong> your proposal offers ongoing
        commission on SEO retainers; ours offers {REFERRAL_TERMS.proposedMaxPaidRetainerMonths} months
        on monthly design packages. Let’s settle on one approach.
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
    <Screen id="next" title={emphasise("Next steps", "steps")}>
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
