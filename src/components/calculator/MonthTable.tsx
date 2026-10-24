import { money } from "@/lib/format";
import type { SimulationOutput } from "@/lib/referral-model";

export default function MonthTable({ output }: { output: SimulationOutput }) {
  const { months, totals } = output;
  return (
    <div className="table-scroll">
      <table className="data-table" data-testid="month-table">
        <caption>
          Month by month · AUD excluding GST, rounded to the dollar · exact
          cents in the exports
        </caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">New clients</th>
            <th scope="col">Paying retainers</th>
            <th scope="col">Client payments</th>
            <th scope="col">One-off commission</th>
            <th scope="col">Recurring commission</th>
            <th scope="col">Real Coder total</th>
            <th scope="col">Cumulative</th>
            <th scope="col">Kascade after commission¹</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.month}>
              <th scope="row">{m.month}</th>
              <td>{m.newRetainerClients + m.projectsPaying || "—"}</td>
              <td>{m.activePaidRetainers || "—"}</td>
              <td>{money(m.clientReceipts)}</td>
              <td>{money(m.oneOffCommission)}</td>
              <td>{money(m.recurringCommission)}</td>
              <td className="strong">{money(m.totalCommission)}</td>
              <td>{money(m.cumulativeCommission)}</td>
              <td>{money(m.kascadeAfterReferral)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td />
            <td>{totals.paidClientMonths} client-months</td>
            <td>{money(totals.clientReceipts)}</td>
            <td>{money(totals.oneOffCommission)}</td>
            <td>{money(totals.recurringCommission)}</td>
            <td className="strong" data-testid="table-total">
              {money(totals.totalCommission)}
            </td>
            <td />
            <td>{money(totals.kascadeAfterReferral)}</td>
          </tr>
        </tfoot>
      </table>
      <p className="fine">
        New clients counts branding projects with a payment that month and
        retainer clients in their first paid month. ¹ Client payments less
        Real Coder’s commission, before Kascade’s delivery, staff and
        operating costs. Not profit.
        {totals.receiptsAfterHorizon > 0 &&
          ` ${money(totals.receiptsAfterHorizon)} of project payments fall after month ${months.length} and are not counted.`}
      </p>
    </div>
  );
}
