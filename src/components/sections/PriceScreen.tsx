import { RATE_BPS, type PriceList, type PriceRow } from "@/data/pricing";
import { money } from "@/lib/format";
import { commissionOn } from "@/lib/referral-model";
import { Disclosure, Screen, emphasise } from "../Primitives";

const per = (billing: PriceRow["billing"]) => (billing === "once" ? "one-off" : "per month");

function price(row: PriceRow) {
  const plus = row.addOn ? "+" : "";
  if (row.price === "quoted") return "Quoted";
  if (Array.isArray(row.price)) return `${plus}${money(row.price[0])}–${money(row.price[1])}`;
  return `${plus}${money(row.price)}`;
}
function earns(row: PriceRow) {
  const plus = row.addOn ? "+" : "";
  if (row.price === "quoted") return "10%";
  if (Array.isArray(row.price))
    return `${plus}${money(commissionOn(row.price[0], RATE_BPS))}–${money(commissionOn(row.price[1], RATE_BPS))}`;
  return `${plus}${money(commissionOn(row.price, RATE_BPS))}`;
}

/** The same price list for every service: package, what it is, price, Real Coder's 10%. */
export default function PriceScreen({ list }: { list: PriceList }) {
  return (
    <Screen id={list.id} tone="raised" dots={list.id === "branding"} title={emphasise(list.title, list.emphasis)} intro={list.intro}>
      <table className="prices" data-testid={`prices-${list.id}`}>
        <caption className="sr-only">
          {list.title} prices and Real Coder’s commission, AUD excluding GST
        </caption>
        <thead>
          <tr>
            <th scope="col">Package</th>
            <th scope="col">
              Price<span className="th-unit">, {list.billing === "once" ? "one-off" : "per month"}</span>
            </th>
            <th scope="col">Real Coder earns</th>
          </tr>
        </thead>
        <tbody>
          {list.rows.map((row) => (
            <tr key={row.key} data-addon={row.addOn || undefined}>
              <th scope="row">
                <span className="row-name">
                  {row.name}
                  {row.addOn && <span className="tag">Add-on</span>}
                </span>
                <span className="row-detail">{row.detail}</span>
              </th>
              <td>
                <span className="amount">{price(row)}</span>
                <span className="unit">{row.price === "quoted" ? "by volume" : per(row.billing)}</span>
              </td>
              <td className="earn">
                <span className="amount">{earns(row)}</span>
                <span className="unit">
                  {row.price === "quoted" ? "of the agreed fee" : row.billing === "once" ? "once" : "per month"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="price-foot">
        <p className="fine">
          {list.note && <>{list.note} </>}
          Prices exclude GST.{" "}
          {list.billing === "monthly"
            ? "Real Coder earns 10% of every monthly payment, for as long as the client stays."
            : "Real Coder earns 10% of the project fee, once it’s paid."}
        </p>
        <Disclosure label="What’s included">
          <div className="included">
            {list.included.map((g) => (
              <div key={g.heading}>
                <h3>{g.heading}</h3>
                <ul>
                  {g.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Disclosure>
      </div>
    </Screen>
  );
}
