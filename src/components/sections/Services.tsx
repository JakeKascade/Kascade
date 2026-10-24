import {
  AGENCY_ADD_ON,
  CREATIVE_IDS,
  CREATIVE_SCOPE,
  REAL_ESTATE_IDS,
  REAL_ESTATE_SCOPE,
  REFERRAL_TERMS,
  SERVICES,
  STRATEGY_ADD_ON,
  type RetainerService,
  type ServiceId,
} from "@/data/catalog";
import { money, percentBps } from "@/lib/format";
import { commissionOn, retainerCommissionOver } from "@/lib/referral-model";
import { Disclosure, Icon, Proposed } from "../Primitives";

const BPS = REFERRAL_TERMS.defaultFeeBps;
const MONTHS = REFERRAL_TERMS.proposedMaxPaidRetainerMonths;
const RATE = percentBps(BPS);
const once = (id: "basic" | "professional") => {
  const s = SERVICES[id];
  return s.billing === "once" ? s.priceCents : 0;
};
const retainer = (id: ServiceId) => SERVICES[id] as RetainerService;
const monthly = (id: ServiceId) => retainer(id).monthlyCents ?? 0;

function List({ items }: { items: readonly string[] }) {
  return (
    <ul className="tick-list">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

/** "Real Coder earns" line shown with every package, from the model's own rounding. */
function Earns({ children }: { children: React.ReactNode }) {
  return (
    <p className="earns">
      <span className="earns-label">Real Coder’s {RATE}</span>
      <span className="earns-value">{children}</span>
    </p>
  );
}

const OFFERS = [
  {
    href: "#branding",
    number: "A",
    name: "Branding & Identity",
    billing: "One-off projects",
    from: `From ${money(once("basic"))}`,
    earns: `From ${money(commissionOn(once("basic"), BPS))} per project`,
    signals: [
      "About to brief a new website, with a dated or DIY logo",
      "Launching a new business, service or location",
      "A look that’s inconsistent across touchpoints",
    ],
  },
  {
    href: "#real-estate",
    number: "B",
    name: "Real Estate Campaign Creative",
    billing: "Monthly retainers",
    from: `From ${money(monthly("boutique"))} a month`,
    earns: `From ${money(commissionOn(monthly("boutique"), BPS))} a month`,
    signals: [
      "An independent agency without an in-house designer",
      "Juggling separate suppliers for signboards, print and social",
      "Listing campaigns that don’t look like one agency",
    ],
  },
  {
    href: "#creative-partner",
    number: "C",
    name: "Ongoing Creative Partnership",
    billing: "Monthly retainers",
    from: `From ${money(monthly("essential"))} a month`,
    earns: `From ${money(commissionOn(monthly("essential"), BPS))} a month`,
    signals: [
      "A business outside real estate with regular campaigns",
      "A marketing lead stretched for design capacity",
      "Needs consistency more than a one-off project",
    ],
  },
] as const;

export function ServicesIndex() {
  return (
    <section id="services" className="panel tone-alt" data-group="services" aria-labelledby="services-title">
      <div className="wrap">
        <div className="section-head" data-reveal>
          <div>
            <p className="index">
              <span>02</span>What Kascade offers
            </p>
            <h2 id="services-title" className="section-title">
              Three ways to help the clients you already have.
            </h2>
          </div>
          <p className="lead">
            Each offer has a clear starting point and a defined scope, so it’s
            easy to recognise who might benefit, and simple to introduce.
          </p>
        </div>
        <ol className="offers" data-reveal>
          {OFFERS.map((o) => (
            <li key={o.href} className="offer module">
              <p className="offer-top">
                <span className="offer-letter">{o.number}</span>
                <span>{o.billing}</span>
              </p>
              <h3>{o.name}</h3>
              <p className="offer-for">Think of clients who are…</p>
              <ul className="offer-signals">
                {o.signals.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <div className="offer-foot">
                <p className="offer-from">{o.from}</p>
                <p className="offer-earns">
                  Real Coder’s {RATE}: {o.earns}
                </p>
                <a className="offer-link" href={o.href}>
                  See the packages <Icon name="arrow" size={16} />
                </a>
              </div>
            </li>
          ))}
        </ol>
        <p className="fine" data-reveal>
          Indicative service pricing, AUD excluding GST. Final scope is always
          confirmed in writing with the client.
        </p>
      </div>
    </section>
  );
}

const COMPARE: [string, string, string][] = [
  ["Discovery", "Brief and focused", "Full discovery and briefing"],
  ["Identity directions", "A refinement, or one direction", "Two directions, one developed"],
  ["Logo", "Primary and secondary variations", "A full logo system and variations"],
  ["Colour and type", "Core palette and typography", "Plus supporting graphic language"],
  ["Guidance", "Concise brand usage sheet", "Expanded brand guidelines"],
  ["Applications", "—", "An agreed small set, e.g. cards, signature, social"],
  ["Final files", "Essential digital and print exports", "Editable brand asset package"],
  ["Feedback", "Two consolidated rounds", "Two consolidated rounds"],
];

export function Branding() {
  const basic = once("basic"),
    pro = once("professional");
  return (
    <section id="branding" className="panel" data-group="services" aria-labelledby="branding-title">
      <div className="wrap">
        <div className="section-head" data-reveal>
          <div>
            <p className="index">
              <span>02 · A</span>Branding & Identity
            </p>
            <h2 id="branding-title" className="section-title">
              A professional brand, at the right level.
            </h2>
          </div>
          <p className="lead">
            From a focused refresh to a complete visual identity, there’s a
            clear entry point for businesses at different stages. And a new
            brand is often the natural moment for a new website.
          </p>
        </div>
        <div className="brand-compare module" data-reveal>
          <div className="table-scroll">
            <table className="compare-table">
              <caption className="sr-only">Basic / Refresh compared with Professional Branding</caption>
              <thead>
                <tr>
                  <td />
                  {(["basic", "professional"] as const).map((id) => (
                    <th scope="col" key={id}>
                      <span className="pkg-name">{SERVICES[id].name}</span>
                      <span className="pkg-price">
                        {money(once(id))} <small>+ GST</small>
                      </span>
                      <span className="pkg-summary">{SERVICES[id].summary}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([row, a, b]) => (
                  <tr key={row}>
                    <th scope="row">{row}</th>
                    <td>{a}</td>
                    <td>{b}</td>
                  </tr>
                ))}
                <tr className="earns-row">
                  <th scope="row">Real Coder’s {RATE}</th>
                  <td>{money(commissionOn(basic, BPS))} once</td>
                  <td>{money(commissionOn(pro, BPS))} once</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        {/* Phones: the same comparison, one package at a time. */}
        <div className="compare-cards" data-reveal>
          {(["basic", "professional"] as const).map((id, col) => (
            <article key={id} className="module" aria-labelledby={`card-${id}`}>
              <h3 id={`card-${id}`} className="pkg-name">
                {SERVICES[id].name}
              </h3>
              <p className="pkg-price">
                {money(once(id))} <small>+ GST</small>
              </p>
              <p className="pkg-summary">{SERVICES[id].summary}</p>
              <dl>
                {COMPARE.filter((row) => row[col + 1] !== "—").map((row) => (
                  <div key={row[0]}>
                    <dt>{row[0]}</dt>
                    <dd>{row[col + 1]}</dd>
                  </div>
                ))}
              </dl>
              <Earns>{money(commissionOn(once(id), BPS))} once</Earns>
            </article>
          ))}
        </div>
        <div className="addon module" data-reveal>
          <div className="addon-head">
            <p className="addon-tag">Optional add-on</p>
            <h3>{STRATEGY_ADD_ON.name}</h3>
            <p className="pkg-price">
              +{money(STRATEGY_ADD_ON.minCents)}–{money(STRATEGY_ADD_ON.maxCents)} <small>+ GST, by scope</small>
            </p>
          </div>
          <p className="addon-body">
            {STRATEGY_ADD_ON.summary} Professional Branding with strategy is
            illustratively {money(pro + STRATEGY_ADD_ON.minCents)}–
            {money(pro + STRATEGY_ADD_ON.maxCents)}.
          </p>
          <Earns>
            +{money(commissionOn(STRATEGY_ADD_ON.minCents, BPS))}–
            {money(commissionOn(STRATEGY_ADD_ON.maxCents, BPS))} on the
            strategy fee
          </Earns>
        </div>
        <Disclosure label="Full inclusions and exclusions" className="details" >
          <div className="details-grid">
            {(["basic", "professional"] as const).map((id) => (
              <div key={id}>
                <h4>{SERVICES[id].name}</h4>
                <p className="fine">{SERVICES[id].fits}</p>
                <List items={SERVICES[id].included} />
                <p className="details-label">Not included</p>
                <List items={SERVICES[id].excluded} />
              </div>
            ))}
            <div>
              <h4>{STRATEGY_ADD_ON.name}</h4>
              <p className="fine">
                For businesses that need commercial clarity before or alongside
                designing a brand. Scope-dependent.
              </p>
              <List items={STRATEGY_ADD_ON.included} />
            </div>
          </div>
          <p className="fine">
            Professional Branding is a more comprehensive identity service, not
            a refresh with extras. Timelines are confirmed after scoping. Final
            scope is confirmed in writing after discovery.
          </p>
        </Disclosure>
      </div>
    </section>
  );
}

export function RealEstate() {
  return (
    <section id="real-estate" className="panel tone-alt" data-group="services" aria-labelledby="re-title">
      <div className="wrap">
        <div className="section-head" data-reveal>
          <div>
            <p className="index">
              <span>02 · B</span>Real Estate Campaign Creative
            </p>
            <h2 id="re-title" className="section-title">
              Every listing. Every campaign. One creative partner.
            </h2>
          </div>
          <p className="lead">
            Consistent campaign design shouldn’t need an internal designer or a
            handful of disconnected suppliers. Kascade produces the standard
            artwork an agency needs, from launch through to sale, under one
            coordinated visual system.
          </p>
        </div>
        <figure className="lifecycle" data-reveal aria-labelledby="lifecycle-caption">
          <ol>
            {REAL_ESTATE_SCOPE.stages.map((stage, i) => (
              <li key={stage.name} style={{ ["--i" as string]: i }}>
                <span className="stage-dot" aria-hidden="true" />
                <p className="stage-name">{stage.name}</p>
                <p className="stage-items">{stage.items.join(" · ")}</p>
              </li>
            ))}
          </ol>
          <figcaption id="lifecycle-caption">
            <strong>One listing, counted once.</strong> A new listing campaign
            counts when Kascade accepts its complete brief. Every standard stage
            after that, for the same property, is included.
          </figcaption>
        </figure>
        <div className="tiers" data-reveal>
          {REAL_ESTATE_IDS.map((id) => {
            const s = retainer(id);
            const fee = s.monthlyCents!;
            return (
              <article key={id} className="tier module" aria-labelledby={`tier-${id}`}>
                <p className="tier-dots" aria-hidden="true">
                  {Array.from({ length: s.listingsPerMonth! }, (_, i) => (
                    <i key={i} />
                  ))}
                </p>
                <h3 id={`tier-${id}`}>{s.name}</h3>
                <p className="tier-volume">Up to {s.listingsPerMonth} new listings a month</p>
                <p className="pkg-price">
                  {money(fee)} <small>/ month + GST</small>
                </p>
                <p className="fine">
                  {money(fee / s.listingsPerMonth!)} per listing when fully used
                </p>
                <Earns>
                  {money(commissionOn(fee, BPS))} a month
                  <small>
                    up to {money(retainerCommissionOver(fee, MONTHS, BPS))} over
                    the first {MONTHS} paid months
                  </small>
                </Earns>
              </article>
            );
          })}
          <article className="tier tier-tailored module" aria-labelledby="tier-custom">
            <h3 id="tier-custom">10+ listings</h3>
            <p className="tier-volume">Higher-volume agencies</p>
            <p className="pkg-price">Tailored</p>
            <p className="fine">Agreed by scope. Commission is calculated on the agreed fee.</p>
          </article>
        </div>
        <div className="addon module" data-reveal>
          <div className="addon-head">
            <p className="addon-tag">Optional add-on for agencies</p>
            <h3>{AGENCY_ADD_ON.name}</h3>
            <p className="pkg-price">
              +{money(AGENCY_ADD_ON.monthlyCents)} <small>/ month + GST</small> <Proposed>Provisional</Proposed>
            </p>
          </div>
          <p className="addon-body">
            {AGENCY_ADD_ON.summary} Kept separate, rather than quietly bundled
            into a listing allowance.
          </p>
          <Earns>+{money(commissionOn(AGENCY_ADD_ON.monthlyCents, BPS))} a month, when selected</Earns>
        </div>
        <Disclosure label="What’s included, production conditions and exclusions" className="details">
          <div className="details-grid">
            <div>
              <h4>Included in every tier</h4>
              <List items={REAL_ESTATE_SCOPE.included} />
            </div>
            <div>
              <h4>Standard production conditions</h4>
              <p className="fine">Confirmed during onboarding.</p>
              <List items={REAL_ESTATE_SCOPE.conditions} />
            </div>
            <div>
              <h4>Excluded, or quoted separately</h4>
              <List items={REAL_ESTATE_SCOPE.excluded} />
              <h4>Agency add-on examples</h4>
              <List items={AGENCY_ADD_ON.examples} />
            </div>
          </div>
          <p className="fine">
            {REAL_ESTATE_SCOPE.definition} {REAL_ESTATE_SCOPE.term} Work beyond
            the included scope is always approved before it starts, never
            silently charged. Larger embedded agency marketing engagements are
            scoped separately.
          </p>
        </Disclosure>
      </div>
    </section>
  );
}

export function CreativePartner() {
  const maxHours = Math.max(...CREATIVE_IDS.map((id) => retainer(id).capacityHours!));
  return (
    <section id="creative-partner" className="panel" data-group="services" aria-labelledby="cp-title">
      <div className="wrap">
        <div className="section-head" data-reveal>
          <div>
            <p className="index">
              <span>02 · C</span>Kascade Creative Partner
            </p>
            <h2 id="cp-title" className="section-title">
              Creative capacity for clients who need more than a one-off project.
            </h2>
          </div>
          <p className="lead">
            For businesses outside real estate, Kascade can be a dependable
            ongoing design partner for campaigns, brand collateral and regular
            marketing production, within an agreed monthly capacity.
          </p>
        </div>
        <div className="capacity" data-reveal>
          {CREATIVE_IDS.map((id) => {
            const s = retainer(id);
            const fee = s.monthlyCents!;
            return (
              <article key={id} className="capacity-row" aria-labelledby={`cap-${id}`}>
                <div className="capacity-name">
                  <h3 id={`cap-${id}`}>{s.name}</h3>
                  <p className="fine">{s.fits}</p>
                </div>
                <div className="capacity-bar">
                  <span
                    className="capacity-fill"
                    style={{ ["--w" as string]: `${(s.capacityHours! / maxHours) * 100}%` }}
                    aria-hidden="true"
                  />
                  <span className="capacity-hours">Up to {s.capacityHours} creative hours a month</span>
                </div>
                <p className="pkg-price">
                  {money(fee)} <small>/ month + GST</small>
                </p>
                <Earns>
                  {money(commissionOn(fee, BPS))} a month
                  <small>up to {money(retainerCommissionOver(fee, MONTHS, BPS))} over {MONTHS} paid months</small>
                </Earns>
              </article>
            );
          })}
        </div>
        <div className="chips" data-reveal>
          <p className="chips-label">Within the agreed capacity</p>
          <ul>
            {CREATIVE_SCOPE.services.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <Disclosure label="How it works, and what’s not included" className="details">
          <div className="details-grid details-grid-2">
            <div>
              <h4>How the partnership runs</h4>
              <List items={CREATIVE_SCOPE.mechanics} />
            </div>
            <div>
              <h4>Not included</h4>
              <List items={CREATIVE_SCOPE.excluded} />
            </div>
          </div>
          <p className="fine">
            Capacity caps are proposed. Clients who need substantial,
            cross-channel production and strategic marketing support can be
            offered a bespoke Embedded Marketing Partnership, scoped separately.
          </p>
        </Disclosure>
      </div>
    </section>
  );
}
