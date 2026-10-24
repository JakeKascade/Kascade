import { BRAND } from "@/brand/brand";
import { REFERRAL_TERMS, SERVICES } from "@/data/catalog";
import { money, percentBps } from "@/lib/format";
import { Icon } from "../Primitives";

const entryPrice =
  SERVICES.basic.billing === "once" ? SERVICES.basic.priceCents : 0;

export function Hero() {
  return (
    <section id="partnership" className="panel panel-hero tone-ink" data-group="partnership">
      <div className="wrap hero">
        <div className="hero-copy" data-reveal>
          <p className="eyebrow">
            <span>{BRAND.studio}</span>
            <span aria-hidden="true">×</span>
            <span>{BRAND.partner}</span>
            <span className="eyebrow-rule" aria-hidden="true" />
            <span>Partnership proposal</span>
          </p>
          <h1>
            More value for your clients.{" "}
            <span className="h1-soft">More opportunity for your business.</span>
          </h1>
          <p className="lead">
            Real Coder’s websites and search expertise help businesses build a
            stronger digital presence. Kascade complements that work with brand
            identities, property campaign creative and ongoing design
            production. Together, we can make referrals more useful for clients
            and commercially worthwhile for both teams.
          </p>
          <a className="button button-light" href="#fit">
            Explore the proposal <Icon name="down" />
          </a>
        </div>
        <figure className="overlap" data-reveal aria-labelledby="overlap-caption">
          <svg viewBox="0 0 440 300" aria-hidden="true">
            <defs>
              <clipPath id="overlap-left">
                <circle cx="170" cy="150" r="120" />
              </clipPath>
            </defs>
            <circle className="overlap-shared" cx="270" cy="150" r="120" clipPath="url(#overlap-left)" />
            <circle className="overlap-ring overlap-ring-a" cx="170" cy="150" r="120" />
            <circle className="overlap-ring overlap-ring-b" cx="270" cy="150" r="120" />
          </svg>
          <div className="overlap-labels" aria-hidden="true">
            <span className="overlap-a">
              <strong>{BRAND.partner}</strong>
              Websites · Search
            </span>
            <span className="overlap-mid">Your clients</span>
            <span className="overlap-b">
              <strong>Kascade</strong>
              Brand · Creative
            </span>
          </div>
          <figcaption id="overlap-caption">
            {BRAND.positioning.join(" ")}
          </figcaption>
        </figure>
        <dl className="hero-terms" data-reveal>
          <div>
            <dt>{percentBps(REFERRAL_TERMS.defaultFeeBps)}</dt>
            <dd>Proposed referral fee on eligible, paid creative work</dd>
          </div>
          <div>
            <dt>From {money(entryPrice)}</dt>
            <dd>Accessible branding projects to introduce</dd>
          </div>
          <div>
            <dt>Recurring</dt>
            <dd>Property campaign and ongoing creative retainers</dd>
          </div>
        </dl>
        <p className="fine hero-note">
          Proposed commercial terms, subject to both parties’ agreement. All
          service prices exclude GST.
        </p>
      </div>
    </section>
  );
}

const RC_SERVICES = ["Custom websites", "SEO & AEO", "Hosting & site care", "Technical delivery"];
const KS_SERVICES = ["Brand identity", "Property campaign creative", "Ongoing design production"];

export function Complement() {
  return (
    <section id="fit" className="panel" data-group="partnership" aria-labelledby="fit-title">
      <div className="wrap">
        <div className="section-head" data-reveal>
          <div>
            <p className="index">
              <span>01</span>Where the services meet
            </p>
            <h2 id="fit-title" className="section-title">
              Built to complement, not compete.
            </h2>
          </div>
          <p className="lead">
            Your team builds the websites and helps clients get found. Ours
            develops the identity and creative they use to communicate
            consistently beyond the website.
          </p>
        </div>
        <figure className="meet" data-reveal aria-label="Real Coder and Kascade each deliver their own specialism to a shared client">
          <div className="meet-side meet-rc">
            <p className="meet-who">{BRAND.partner}</p>
            <ul>
              {RC_SERVICES.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div className="meet-centre" aria-hidden="true">
            <svg viewBox="0 0 200 120" preserveAspectRatio="none">
              <path className="meet-line meet-line-a" d="M0 60 H86" />
              <path className="meet-line meet-line-b" d="M114 60 H200" />
            </svg>
            <span className="meet-node">The client</span>
          </div>
          <div className="meet-side meet-ks">
            <p className="meet-who">{BRAND.studio}</p>
            <ul>
              {KS_SERVICES.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <figcaption className="sr-only">
            {BRAND.partner}: {RC_SERVICES.join(", ")}. {BRAND.studio}:{" "}
            {KS_SERVICES.join(", ")}.
          </figcaption>
        </figure>
        <ol className="advantages" data-reveal>
          <li>
            <h3>A more complete client offering</h3>
            <p>Brand, website, search and marketing creative that support each other.</p>
          </li>
          <li>
            <h3>Specialist delivery, no extra headcount</h3>
            <p>Introduce creative work without hiring or managing a production team.</p>
          </li>
          <li>
            <h3>An additional revenue stream</h3>
            <p>Eligible one-off projects and recurring retainers create commission.</p>
          </li>
        </ol>
        <p className="fine boundary" data-reveal>
          Real Coder remains the specialist for its web, SEO/AEO, hosting and
          technical services. Kascade remains responsible for its creative
          services. Neither takes over the other’s scope.
        </p>
      </div>
    </section>
  );
}
