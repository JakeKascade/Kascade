"use client";
import { useEffect, useRef, useState } from "react";
import { BRAND } from "@/brand/brand";
import { REFERRAL_TERMS, SERVICES, type ServiceId } from "@/data/catalog";
import { money, percentBps } from "@/lib/format";
import { commissionOn } from "@/lib/referral-model";
import { Icon, prefersReducedMotion, useInView } from "../Primitives";

const STEPS = [
  {
    who: BRAND.partner,
    actor: "rc",
    title: "Introduction",
    text: "Real Coder spots a client who could benefit and, with their permission, introduces Kascade. Both teams record the referral.",
  },
  {
    who: "Kascade",
    actor: "ks",
    title: "Consultation",
    text: "Kascade consults, recommends a package or tailored scope, and presents its own quote.",
  },
  {
    who: "Client",
    actor: "client",
    title: "Client approves",
    text: "The client agrees the scope and terms directly with Kascade. Kascade handles production and approvals.",
  },
  {
    who: "Client",
    actor: "client",
    title: "Client pays",
    text: "The client pays Kascade under its project or retainer terms.",
  },
  {
    who: BRAND.partner,
    actor: "rc",
    title: "Real Coder earns",
    text: "Once eligible payments clear, Real Coder receives its agreed commission.",
  },
] as const;

const EXAMPLES: { id: ServiceId; label: string; note: string }[] = [
  { id: "basic", label: "Basic / Refresh", note: "one-off project" },
  { id: "professional", label: "Professional Branding", note: "one-off project" },
  { id: "reGrowth", label: "Real estate · Growth", note: "one paid month" },
];
const amountOf = (id: ServiceId) => {
  const s = SERVICES[id];
  return s.billing === "once" ? s.priceCents : (s.monthlyCents ?? 0);
};
const BPS = REFERRAL_TERMS.defaultFeeBps;
const LAST = STEPS.length - 1;

export default function ReferralFlow() {
  const frame = useRef<HTMLDivElement>(null);
  const inView = useInView(frame, 0.45);
  const [step, setStep] = useState(LAST);
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(false);
  const [example, setExample] = useState<ServiceId>("professional");

  // Play the sequence once, the first time the diagram is properly in view.
  useEffect(() => {
    if (!inView || played) return;
    setPlayed(true);
    if (prefersReducedMotion()) return;
    setStep(0);
    setPlaying(true);
  }, [inView, played]);
  useEffect(() => {
    if (!playing) return;
    if (step >= LAST) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setStep((s) => s + 1), 1500);
    return () => clearTimeout(timer);
  }, [playing, step]);

  const amount = amountOf(example);
  const commission = commissionOn(amount, BPS);
  const kascade = amount - commission;
  const paid = step >= 3;
  const split = step >= 4;
  const pick = (i: number) => {
    setPlaying(false);
    setStep(i);
  };

  return (
    <section id="how-it-works" className="panel tone-ink" data-group="referrals" aria-labelledby="flow-title">
      <div className="wrap">
        <div className="section-head" data-reveal>
          <div>
            <p className="index">
              <span>03</span>How a referral works
            </p>
            <h2 id="flow-title" className="section-title">
              Simple for the client. Transparent for both teams.
            </h2>
          </div>
          <p className="lead">
            A client-approved introduction, a clear handover, and commission
            that follows the client’s payment, never before it.
          </p>
        </div>
        <div className="flow" ref={frame} data-reveal style={{ ["--step" as string]: step }}>
          <ol className="flow-steps">
            {STEPS.map((s, i) => (
              <li key={s.title} data-state={i < step ? "done" : i === step ? "current" : "next"} data-actor={s.actor}>
                <button
                  type="button"
                  className="flow-step"
                  onClick={() => pick(i)}
                  aria-current={i === step ? "step" : undefined}
                >
                  <span className="flow-num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flow-who">{s.who}</span>
                  <span className="flow-title">{s.title}</span>
                  <span className="flow-text">{s.text}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="flow-track" aria-hidden="true">
            <span className="flow-progress" />
          </div>
          <p className="flow-parallel">
            <span aria-hidden="true" />
            Throughout, Real Coder continues its website, SEO/AEO and technical
            work, where relevant. Kascade never takes over that scope.
          </p>
        </div>
        <div className="flow-money" data-reveal>
          <div className="flow-money-head">
            <p className="flow-money-title">Where one payment goes</p>
            <div className="chip-select" role="group" aria-label="Example payment">
              {EXAMPLES.map((e) => (
                <button key={e.id} type="button" aria-pressed={example === e.id} onClick={() => setExample(e.id)}>
                  {e.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="text-button replay"
              onClick={() => {
                if (prefersReducedMotion()) return setStep(LAST);
                setStep(0);
                setPlaying(true);
              }}
            >
              Replay the sequence
            </button>
          </div>
          <div className="split" data-paid={paid} data-split={split} aria-live="polite">
            <p className="split-total">
              <span>Client pays Kascade · {EXAMPLES.find((e) => e.id === example)!.note}</span>
              <strong>{paid ? money(amount) : "Awaiting payment"}</strong>
            </p>
            <div className="split-bar" aria-hidden="true">
              <span className="split-ks" style={{ ["--share" as string]: `${(kascade / amount) * 100}%` }} />
              <span className="split-rc" style={{ ["--share" as string]: `${(commission / amount) * 100}%` }} />
            </div>
            <dl className="split-parts">
              <div className="part-ks">
                <dt>Kascade, after commission</dt>
                <dd>{split ? money(kascade) : "—"}</dd>
                <small>Before delivery and operating costs</small>
              </div>
              <div className="part-rc">
                <dt>Real Coder’s commission · {percentBps(BPS)}</dt>
                <dd data-testid="flow-commission">{split ? money(commission) : "—"}</dd>
                <small>Paid by Kascade from the cleared payment</small>
              </div>
            </dl>
          </div>
          <p className="fine">
            <Icon name="check" size={14} /> Proposed: commission is paid within{" "}
            {REFERRAL_TERMS.paymentDaysAfterMonthEnd} days after the end of the
            month in which eligible client funds clear, against a valid invoice.
            Hypothetical figures, ex GST.
          </p>
        </div>
      </div>
    </section>
  );
}
