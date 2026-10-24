import { BRAND } from "@/brand/brand";
import { Card, Screen, tone } from "../Primitives";

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
      title={tone("**Who** does **what**")}
      intro={tone("Real Coder keeps **all web, SEO and technical work**. Kascade **only does design**.")}
    >
      <div className="roles">
        {ROLES.map((r, i) => (
          <Card key={r.who} className={`role ${i === 1 ? "role-ks" : ""}`}>
            <h3>{r.who}</h3>
            <ul>
              {r.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </Screen>
  );
}
