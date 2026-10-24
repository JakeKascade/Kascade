import { BRAND } from "@/brand/brand";
import DotIcon, { type DotIconName } from "../DotIcon";
import { Card, Screen, tone } from "../Primitives";

const ROLES: { who: string; items: { label: string; icon: DotIconName; note?: string }[] }[] = [
  {
    who: BRAND.partner,
    items: [
      { label: "Websites", icon: "website" },
      { label: "SEO & AEO", icon: "search" },
      { label: "PPC", icon: "ads", note: "where applicable" },
    ],
  },
  {
    who: BRAND.studio,
    items: [
      { label: "Branding & identity", icon: "brand" },
      { label: "Real estate campaign retainers", icon: "house" },
      { label: "Ongoing design retainers", icon: "ongoing" },
    ],
  },
];

export function Roles() {
  return (
    <Screen
      id="roles"
      centered
      title={tone("**Who** does **what**")}
      intro={tone("Real Coder keeps **websites, search and paid ads**. Kascade **only does design**.")}
    >
      <div className="roles">
        {ROLES.map((r) => (
          <Card key={r.who} className="role">
            <h3>{r.who}</h3>
            <ul>
              {r.items.map((item) => (
                <li key={item.label}>
                  <DotIcon name={item.icon} />
                  <span>
                    {item.label}
                    {item.note && <small> ({item.note})</small>}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </Screen>
  );
}
