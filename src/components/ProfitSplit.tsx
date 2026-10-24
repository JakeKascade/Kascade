import { allocation, money, TERMS } from "@/lib/model";

/** A$10,000 of net trading profit, allocated by the model's own rules. */
const EXAMPLE_PROFIT = 1_000_000;

/** Follows one sale's profit: where each share goes, and what stays in the fund. */
export default function ProfitSplit({ principal }: { principal: number }) {
  const split = allocation(EXAMPLE_PROFIT);
  const kept = split.jake + split.retained;
  const pct = (part: number, whole: number) => `${(part / whole) * 100}%`;
  return (
    <figure
      className="split"
      aria-label={`What happens to ${money(EXAMPLE_PROFIT)} of net trading profit`}
    >
      <div className="split-head">
        <p>
          Net trading profit from one sale{" "}
          <span className="tag">Hypothetical</span>
        </p>
        <strong>{money(EXAMPLE_PROFIT)}</strong>
      </div>
      <div className="split-lanes">
        <section className="lane" aria-labelledby="lane-jake">
          <p className="lane-who" id="lane-jake">
            Jake <span>{TERMS.jakeShare * 100}%</span>
          </p>
          <strong className="lane-amount">{money(split.jake)}</strong>
          <div className="lane-bar" aria-hidden="true">
            <span className="lane-in" style={{ width: "100%" }} />
          </div>
          <dl className="lane-parts">
            <div>
              <dt>
                <i className="key-in" aria-hidden="true" />
                <span className="legend-long">All reinvested</span>
                <span className="legend-short">Reinvested</span>
              </dt>
              <dd>{money(split.jake)}</dd>
            </div>
          </dl>
          <p className="lane-note">
            All of it stays in, alongside the original {money(principal)}.
          </p>
        </section>
        <section className="lane" aria-labelledby="lane-elita">
          <p className="lane-who" id="lane-elita">
            ELITA <span>{TERMS.elitaShare * 100}%</span>
          </p>
          <strong className="lane-amount">{money(split.elita)}</strong>
          <div className="lane-bar" aria-hidden="true">
            <span
              className="lane-in"
              style={{ width: pct(split.retained, split.elita) }}
            />
            <span
              className="lane-out"
              style={{ width: pct(split.withdrawn, split.elita) }}
            />
          </div>
          <dl className="lane-parts">
            <div>
              <dt>
                <i className="key-in" aria-hidden="true" />
                <span className="legend-long">Half reinvested</span>
                <span className="legend-short">Reinvested</span>
              </dt>
              <dd>{money(split.retained)}</dd>
            </div>
            <div>
              <dt>
                <i className="key-out" aria-hidden="true" />
                <span className="legend-long">Half as cash</span>
                <span className="legend-short">Cash</span>
              </dt>
              <dd>{money(split.withdrawn)}</dd>
            </div>
          </dl>
        </section>
      </div>
      <dl className="split-result">
        <div>
          <dt>Back into the fund</dt>
          <dd>{money(kept)}</dd>
          <small>plus the original purchase cost</small>
        </div>
        <div>
          <dt>Cash to ELITA</dt>
          <dd className="is-out">{money(split.withdrawn)}</dd>
          <small>for business cash flow</small>
        </div>
      </dl>
    </figure>
  );
}
