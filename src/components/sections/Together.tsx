"use client";
import { useState } from "react";
import { BRAND } from "@/brand/brand";
import { REFERRAL_TERMS } from "@/data/catalog";
import { percentBps } from "@/lib/format";
import { Icon, Proposed, TabPanel, Tabs } from "../Primitives";

const RATE = percentBps(REFERRAL_TERMS.defaultFeeBps);
const CAP = REFERRAL_TERMS.proposedMaxPaidRetainerMonths;

export function Gains() {
  return (
    <section id="gains" className="panel" data-group="together" aria-labelledby="gains-title">
      <div className="wrap">
        <div className="section-head" data-reveal>
          <div>
            <p className="index">
              <span>04</span>What everyone gains
            </p>
            <h2 id="gains-title" className="section-title">
              A better-connected offering.
            </h2>
          </div>
          <p className="lead">
            The partnership works when it’s genuinely useful to the client
            first. The commercial return follows from that.
          </p>
        </div>
        <div className="gains" data-reveal>
          <article>
            <p className="gains-who">For {BRAND.partner}</p>
            <ul>
              <li>A clear referral pathway for clients who need more than a website.</li>
              <li>Added support for clients, without adding headcount.</li>
              <li>Potential project and recurring commission revenue.</li>
            </ul>
          </article>
          <article className="gains-client">
            <p className="gains-who">For your clients</p>
            <ul>
              <li>Specialist creative and specialist digital delivery.</li>
              <li>Coordinated, but each kept distinct and accountable.</li>
              <li>A brand, website and marketing that work together.</li>
            </ul>
          </article>
          <article>
            <p className="gains-who">For Kascade</p>
            <ul>
              <li>Introductions to businesses with relevant branding or ongoing creative needs.</li>
              <li>A reciprocal pathway to Real Coder for SEO, web and technical work.</li>
            </ul>
          </article>
        </div>
        <figure className="reciprocal" data-reveal aria-label="Referrals can flow both ways">
          <span className="reciprocal-node">{BRAND.partner}</span>
          <span className="reciprocal-lanes" aria-hidden="true">
            <span className="lane-out">
              <i />
              Branding, campaign and creative needs
            </span>
            <span className="lane-back">
              <i />
              Web, SEO/AEO and technical needs
            </span>
          </span>
          <span className="reciprocal-node">Kascade</span>
          <figcaption className="fine">
            Referrals can flow both ways. Terms for referrals from Kascade to Real
            Coder would be confirmed alongside this agreement.
          </figcaption>
        </figure>
        <ul className="unchanged" data-reveal aria-label="What stays the same">
          <li>No referral quotas</li>
          <li>No exclusivity</li>
          <li>No reciprocal volume commitments</li>
          <li>Each team keeps its own clients and scope</li>
        </ul>
      </div>
    </section>
  );
}

type TermsTab = "commission" | "introductions" | "scope" | "review";
const TABS: { id: TermsTab; label: string }[] = [
  { id: "commission", label: "Commission & payment" },
  { id: "introductions", label: "Introductions" },
  { id: "scope", label: "Scope" },
  { id: "review", label: "Pilot & review" },
];

export function Terms() {
  const [tab, setTab] = useState<TermsTab>("commission");
  return (
    <section id="terms" className="panel tone-alt" data-group="together" aria-labelledby="terms-title">
      <div className="wrap">
        <div className="section-head" data-reveal>
          <div>
            <p className="index">
              <span>04 · Terms</span>Partnership details
            </p>
            <h2 id="terms-title" className="section-title">
              Clear expectations. Better working relationships.
            </h2>
          </div>
          <p className="lead">
            Our proposed terms, in plain language. Everything here is open to
            discussion and subject to a written agreement between us.
          </p>
        </div>
        <div className="terms" data-reveal>
          <Tabs label="Partnership terms" idPrefix="terms" tabs={TABS} value={tab} onChange={setTab} />
          <div className="terms-panels module">
            <TabPanel idPrefix="terms" id="commission" active={tab === "commission"}>
              <h3 className="print-only">Commission & payment</h3>
              <ul className="term-list">
                <li>
                  <strong>{RATE} on eligible branding and design project fees</strong>{" "}
                  actually collected, excluding GST and pass-through expenses.
                </li>
                <li>
                  <strong>
                    {RATE} on eligible referred creative retainers, for the first {CAP} paid months
                  </strong>{" "}
                  of each retainer. <Proposed />
                </li>
                <li>Commission accrues only on money clients have paid. Refunds, credits and write-offs reduce the eligible amount.</li>
                <li>
                  Paid within {REFERRAL_TERMS.paymentDaysAfterMonthEnd} days after the end of the month in which eligible funds clear, subject to reconciliation and a valid invoice. <Proposed />
                </li>
                <li>Partner invoicing and GST follow normal tax requirements.</li>
              </ul>
            </TabPanel>
            <TabPanel idPrefix="terms" id="introductions" active={tab === "introductions"}>
              <h3 className="print-only">Introductions</h3>
              <ul className="term-list">
                <li>Every referral is approved by the client and recorded by both teams.</li>
                <li>
                  A registered introduction is protected for {REFERRAL_TERMS.registrationProtectionMonths} months. <Proposed />
                </li>
                <li>Existing active opportunities and duplicate referrals are excluded, unless we both agree otherwise.</li>
                <li>No mandatory quotas, reciprocal volume commitments or exclusivity.</li>
                <li>Each business owns its own service delivery and client relationship, and keeps its existing scope.</li>
              </ul>
            </TabPanel>
            <TabPanel idPrefix="terms" id="scope" active={tab === "scope"}>
              <h3 className="print-only">Scope</h3>
              <ul className="term-list">
                <li>Commission applies only to separately agreed, eligible Kascade work.</li>
                <li>No automatic commission on third-party disbursements, or reimbursable print or media spend.</li>
                <li>Technical services delivered by Real Coder sit outside this arrangement, as do unrelated future scopes unless agreed.</li>
                <li>Kascade scopes and quotes its own work; final scope is confirmed in writing with the client.</li>
                <li>Confidentiality, and any optional partner promotion, to be agreed together.</li>
              </ul>
            </TabPanel>
            <TabPanel idPrefix="terms" id="review" active={tab === "review"}>
              <h3 className="print-only">Pilot & review</h3>
              <ul className="term-list">
                <li>
                  A {REFERRAL_TERMS.pilotDays}-day operational pilot, alongside clients’ own three-month minimum engagements. <Proposed />
                </li>
                <li>At the end of the pilot, we review referral quality, conversion, communication and production capacity together.</li>
                <li>Periodic commercial reviews after that.</li>
              </ul>
            </TabPanel>
          </div>
        </div>
        <div className="open-points" data-reveal>
          <h3>To agree together</h3>
          <ul>
            <li>
              <strong>The retainer commission period.</strong> Your proposal offers
              Kascade ongoing commission on active SEO retainers. We’ve proposed
              the first {CAP} paid months for creative retainers, and would rather
              discuss the difference openly than gloss over it.
            </li>
            <li>
              <strong>Changes to an engagement.</strong> How upgrades, project
              variations, pauses, cancellations and reactivations are treated.
            </li>
            <li>
              <strong>Recording referrals.</strong> How introductions are
              registered, and how earlier or retrospective leads are handled.
            </li>
          </ul>
          <p className="fine">
            Working proposal only. Terms are subject to a written agreement
            between Kascade Studio and Real Coder. This summary is not legal
            advice.
          </p>
        </div>
      </div>
    </section>
  );
}

const NEXT = [
  { title: "Align", text: "Agree the packages and referral terms." },
  { title: "Record", text: "Settle how introductions are registered." },
  { title: "Trial", text: "Try the process with a few suitable clients." },
  { title: "Review", text: `Look at what we’ve learned after ${REFERRAL_TERMS.pilotDays} days.` },
];

export function NextSteps({ onPrint }: { onPrint: () => void }) {
  return (
    <section id="next" className="panel panel-last tone-ink" data-group="together" aria-labelledby="next-title">
      <div className="wrap">
        <div className="closing" data-reveal>
          <p className="index">
            <span>04 · Next steps</span>Where we go from here
          </p>
          <h2 id="next-title" className="closing-title">
            Let’s make it easier for good clients to work with the right people.
          </h2>
          <p className="lead">
            A straightforward partnership between two specialist teams, built
            around services we already deliver and an easy way to identify,
            introduce and support the right opportunities.
          </p>
        </div>
        <ol className="next" data-reveal>
          {NEXT.map((n, i) => (
            <li key={n.title}>
              <span className="next-num">{String(i + 1).padStart(2, "0")}</span>
              <h3>{n.title}</h3>
              <p>{n.text}</p>
            </li>
          ))}
        </ol>
        <div className="closing-actions" data-reveal>
          <button type="button" className="button button-light" onClick={onPrint}>
            <Icon name="print" size={16} /> Print or save as PDF
          </button>
          <a className="text-button" href="#calculator">
            Return to the calculator
          </a>
        </div>
      </div>
    </section>
  );
}
