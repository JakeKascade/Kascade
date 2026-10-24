import { REFERRAL_TERMS, SERVICES, type ServiceId } from "@/data/catalog";
import { CAP_MONTHS, RATE_BPS } from "@/data/pricing";
import { money } from "@/lib/format";
import { commissionOn, retainerCommissionOver } from "@/lib/referral-model";
import { Card, Screen, tone } from "../Primitives";

const STEPS = [
  { title: "You introduce", text: "A client who needs design, with their permission." },
  { title: "We quote", text: "Kascade scopes and quotes the work directly with them." },
  { title: "The client pays", text: "The client pays Kascade for the work." },
  {
    title: "You earn 10%",
    text: `Paid to you within ${REFERRAL_TERMS.paymentDaysAfterMonthEnd} days of the end of that month.`,
  },
];

const amount = (id: ServiceId) => {
  const s = SERVICES[id];
  return s.billing === "once" ? s.priceCents : (s.monthlyCents ?? 0);
};

function Example({ id, label }: { id: ServiceId; label: string }) {
  const paid = amount(id);
  const fee = commissionOn(paid, RATE_BPS);
  const monthly = SERVICES[id].billing === "monthly";
  const suffix = monthly ? " a month" : "";
  return (
    <Card className="example">
    <figure aria-label={`${label}: the client pays ${money(paid)}${suffix}; Real Coder earns ${money(fee)}${suffix}`}>
      <figcaption>
        <span>{label}</span>
        <strong>
          Client pays {money(paid)}
          {suffix}
        </strong>
      </figcaption>
      <div className="split-bar" aria-hidden="true">
        <span className="split-ks" style={{ flexGrow: paid - fee }} />
        <span className="split-rc" style={{ flexGrow: fee }} />
      </div>
      <dl>
        <div>
          <dt>Kascade</dt>
          <dd>
            {money(paid - fee)}
            {suffix}
          </dd>
        </div>
        <div className="split-you">
          <dt>Real Coder</dt>
          <dd data-testid={`example-${id}`}>
            {money(fee)}
            {suffix}
          </dd>
          {monthly && (
            <small>
              {money(retainerCommissionOver(paid, CAP_MONTHS, RATE_BPS))} over the first {CAP_MONTHS} paid months
            </small>
          )}
        </div>
      </dl>
    </figure>
    </Card>
  );
}

export default function Referrals() {
  return (
    <Screen id="referrals" title={tone("**How referrals** work")}>
      <ol className="steps">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <span className="step-num">{String(i + 1).padStart(2, "0")}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </li>
        ))}
      </ol>
      <div className="examples">
        <Example id="professional" label="Professional Branding · one-off" />
        <Example id="reGrowth" label="Real Estate Growth · monthly" />
      </div>
    </Screen>
  );
}
