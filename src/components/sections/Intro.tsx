import { BRAND } from "@/brand/brand";
import { Screen } from "../Primitives";

export function Hero() {
  return (
    <section id="top" className="screen screen-hero" aria-labelledby="hero-title">
      <div className="wrap">
        <p className="eyebrow">Partnership proposal · {BRAND.dated}</p>
        <h1 id="hero-title">
          {BRAND.studio} <span aria-hidden="true">×</span>
          <span className="sr-only">and</span> {BRAND.partner}
        </h1>
        <p className="hero-line">
          You introduce clients who need design. We do the work. You earn 10%
          of what they pay.
        </p>
      </div>
    </section>
  );
}

const ROLES = [
  {
    who: BRAND.partner,
    items: ["Websites", "SEO & AEO", "Hosting & site care", "Technical work"],
  },
  {
    who: BRAND.studio,
    items: ["Branding & identity", "Real estate campaign retainers", "Ongoing design retainers"],
  },
];

export function Roles() {
  return (
    <Screen
      id="roles"
      eyebrow="Overview"
      title="Who does what"
      intro="Real Coder keeps all web, SEO and technical work. Kascade only does design."
    >
      <div className="roles">
        {ROLES.map((r) => (
          <div key={r.who} className="role">
            <h3>{r.who}</h3>
            <ul>
              {r.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Screen>
  );
}
