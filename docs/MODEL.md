# Referral model — methodology (v1.0)

`src/lib/referral-model.ts` is a pure function: `simulate(input) → { months, totals, assumptions }`. No dates, randomness or I/O. Every figure on the page — price lists, worked examples and the calculator — comes from the catalogue and this engine, so they always reconcile.

## Units and sources

- All money is **integer AUD cents, excluding GST**. No floating-point totals.
- Prices, allowances, the 10% rate (`1000` basis points) and the proposed 12-paid-month cap come only from `src/data/catalog.ts`.
- Time is **model months 1…H** (12 by default; 24 in the labelled extended view). They are not calendar months.

## Inputs

| Record | Meaning |
|---|---|
| `OneOffDeal` | One signed branding project: service, attached strategy fee (or 0), agreed value, and **receipts** `{ month, amountCents }`. Negative receipts are refunds or credits. |
| `RetainerCohort` | Whole clients on the same retainer: service, number of clients, start month, monthly fee per client (including an explicitly selected agency add-on), and the exact **paid months**. |
| `SimulationInput` | Horizon, fee in basis points, retainer cap in paid months (`null` = commission while active, for comparison only), deals and cohorts. |

The calculator’s lines (`ReferralLine`) translate into these: a branding line with *n* projects becomes *n* deals; a retainer line becomes one cohort paying every month from its start (or for a chosen number of months).

## Rules

1. **Signed and paid, not leads.** Inputs are paid projects and active, paying retainer clients. There is no conversion funnel and no fractional client.
2. **Commission on receipts only.** `commission = round(receipt × bps ÷ 10,000)` for each receipt, half away from zero, to the cent. Invoiced-but-unpaid value earns nothing; a deposit and a balance each earn once.
3. **Strategy attaches to its project.** It adds to that deal’s value and receipts; it is never a second deal and never applies to retainers.
4. **Agency add-on only when selected**, and only on real estate retainers.
5. **10+ listing retainers need an entered agreed fee.** Without one the line is excluded and flagged; nothing is extrapolated from the published tiers.
6. **Recurring commission applies to each client’s first 12 paid months** (proposed). After that the client may keep paying — those receipts count as client payments and Kascade revenue, but earn no commission.
7. **Unpaid, late or cancelled months earn nothing.** No churn is assumed unless a shorter stay is entered.
8. **Year-one totals add actual paid months.** They are never the month-12 run rate × 12.
9. **Payments after the horizon aren’t counted** (e.g. a balance due in month 13) and are disclosed.

## Outputs

Per month: projects paying, new retainer clients, paying retainers, commissionable retainers, one-off and retainer receipts, eligible receipts, one-off / recurring / total commission, cumulative figures, and **Kascade after referral = client receipts − commission**.

That last figure is **revenue before Kascade’s delivery, staff and operating costs. It is never profit.** The UI labels it “Kascade revenue after commission, before expenses”.

Totals add the end-of-horizon recurring run rate, paid and commissioned client-months, project and client counts, and receipts falling after the horizon.

## Reconciliation

For every month: `clientReceipts = totalCommission + kascadeAfterReferral` and `totalCommission = oneOff + recurring`. `reconciles(output)` checks this, and the tests run it across several scenarios and settings.

## Worked examples (all in `tests/referral-model.test.ts`)

| Case | Result |
|---|---|
| Basic $2,000 paid in full | $200 commission; Kascade $1,800 before costs |
| Professional $4,000 + Strategy $5,000 | $900 on $9,000 |
| One paid month of Boutique / Growth / Volume | $195 / $345 / $495 |
| One Growth retainer, months 1–12 | $4,140 |
| Growth retainers starting months 1, 4, 7, 10 | 30 paid client-months · $10,350 · month-12 run rate $1,380 (not $16,560) |
| …plus two paid Professional projects | $11,150 |
| Boutique paid months 1–3 and 6 only | $195 in those four months, $0 otherwise |
| $2,000 paid, then $500 refunded | +$200, then −$50 → $150 |
| Growth retainer over a 24-month view | $4,140 — commission stops after 12 paid months while the client keeps paying |

## The calculator on the page

The calculator asks only how many clients of each fixed-price package Real Coder might refer. It assumes every client signs and pays in month 1 and that monthly clients pay for all 12 months, then runs the same engine (`countsScenario` in `src/lib/scenario.ts`). The headline is total commission over 12 months; beneath it are one-off commission and the monthly figure. These assumptions are stated under the result.

## Limitations

No tax, GST treatment, payment timing within a month, invoice terms, pauses with resumption rules, upgrades/downgrades, or retrospective leads — those terms are still to be agreed (see `PACKAGES.md`). Commission is shown in the month the client pays; the proposed payout to Real Coder is within 14 days after that month ends.
