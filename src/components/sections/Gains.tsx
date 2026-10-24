import { BRAND } from "@/brand/brand";
import { Screen, tone } from "../Primitives";

const CIRCLES = [
  { name: BRAND.partner, text: "**10% commission** on every referral, without adding headcount." },
  { name: "Your clients", text: "**A brand, website and marketing** that finally work together." },
  { name: "Kascade", text: "**Clients who need design**, and a trusted partner for web and SEO." },
];

/** Three overlapping circles: one partnership, three winners. */
export default function Gains() {
  return (
    <Screen id="gains" title={tone("**What everyone** gains")}>
      <div className="gains">
        <ul className="circles" aria-hidden="true">
          {CIRCLES.map((c, i) => (
            <li key={c.name} data-centre={i === 1 || undefined}>
              <span>{c.name}</span>
            </li>
          ))}
        </ul>
        <dl className="gains-list">
          {CIRCLES.map((c) => (
            <div key={c.name}>
              <dt>{c.name}</dt>
              <dd>{tone(c.text)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Screen>
  );
}
