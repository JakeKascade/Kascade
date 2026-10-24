# Financial model v1.0

## Units, horizon and ownership

Inputs use AUD dollars, decimal rates and whole days. All financial outputs use integer AUD cents. Display values round to whole dollars; exports retain cents. The year contains 365 days. Model months use `[31,28,31,30,31,30,31,31,30,31,30,31]` days, beginning on model day 1, without asserting an actual calendar start date. A partial final month receives the same monthly ceiling as a full month; unused demand expires each month.

The cost-basis purchasing fund is always:

```
fund = cash + outstanding purchase cost
     = original principal + Jake retained profit + ELITA retained profit
```

Withdrawn ELITA profits leave the fund exactly once. Unsettled margin and the availability fee never enter the trading fund. Borrowing is prohibited.

## Daily order of operations

1. Settle every purchase due today, returning purchase cost and recognising its purchase-day margin only now.
2. Round each realised profit to cents. Allocate 25% to Jake, rounded to cents; ELITA receives the remainder. Withdraw half of ELITA's allocation, rounded to cents; ELITA retains the remainder. This preserves every cent without double counting.
3. Recalculate the fund and target utilisation. With taper enabled, subtract 5 percentage points for each A$100,000 of growth above the original contribution. This is a continuous slope, with a 50% floor. A deliberately lower starting setting stays at that lower setting rather than being raised to 50%.
4. With conservative conditions selected, new purchases after the term midpoint earn 80% of the selected margin, and target utilisation falls an additional 10 percentage points. Existing purchases retain their agreed model margin and settlement date. The extra stress reduction can take utilisation below the taper floor.
5. Calculate today's deployment as the non-negative minimum of available cash, target deployed cost less outstanding cost, target deployed cost divided by settlement days, and unused monthly purchasing demand. Round deployment down to cents. Each purchase settles independently exactly `settlementDays` later.
6. Record end-of-day cash, committed cost, retained balances, withdrawals and fund. The day-zero record contains only original capital.

The `target deployed cost / settlementDays` daily replenishment limit spreads initial deployment across one settlement interval. The first purchase is on day 1, so the first 15-day settlement is day 16. There is no artificial day-one staggered trading book. Daily tranches represent divisible purchase-cost dollars, not an asserted number or average price of watches. There is no multiplier for higher watch prices.

When target utilisation falls, existing purchases are allowed to settle; the engine does not sell or cancel them to force immediate compliance. New deployments remain constrained by target headroom and cash.

## Demand versus capacity

Without a demand limit, every day assumes sufficient qualifying opportunities for the daily budget: a hypothetical capacity case. A monthly demand ceiling limits purchase cost, not sale revenue. Purchases may stop early in a month after exhausting the ceiling; it resets at the next model month. Cash can remain idle.

The viability table's first volume column comes from a companion run with only the demand ceiling removed. It is the actual volume that the same engine funds in that capacity case. The next column contains actual funded volume from the constrained model. Both are monthly flows; end-period fund, committed cost and cash are balances. Recycling can make a monthly flow larger than the fund balance. Available utilisation headroom is disclosed separately from all available cash.

## Fee, exit and wind-down

The fee is `round(original capital in cents × 0.04 × termDays / 365)`. It is due from ELITA separately from trading profit at termination or scheduled maturity. Fee accrual is A$986.30 at day 90, A$1,972.60 at day 180 and A$4,000.00 at day 365 for A$100,000 committed capital. The payout tables aggregate the fee obligation and subsequent capital distributions; these totals are not a promise that every component is paid on one day. The daily ledger tracks trading-fund cash, with the fee accounted for separately in the payout reconciliation. Actual payment dates and any external fee funding must be agreed.

Selecting 90 or 180 days models an election to stop new funding on that day. Purchases funded on or before that day continue to their independent settlement dates. The annual selection stops at day 365. Final balances and payouts assume all those purchases settle at their modelled margins, up to one settlement interval later. Fee accrual stops at the selected term; extra wind-down fee days are not assumed. Formal terms must resolve actual notice requirements, failed settlements, valuation of open positions and fee accrual during any extended wind-down.

```
Jake final payout = original capital + accumulated 25% trading allocation + fee
Jake total profit = accumulated trading allocation + fee

ELITA final lump sum = retained 75%-allocation profits − fee
ELITA total net profit = periodic withdrawals + final lump sum
```

Negative ELITA final proceeds represent an external payment required from ELITA. This is never paid by reducing Jake's original principal inside the model. All payouts assume ELITA can perform its obligations; that is not a guarantee of collection or legal security.

## Manual reconciliation — default 15-day case

Day 1 funds A$4,666.66. Through day 15, A$69,999.90 is committed and no profit is realised. On day 16, the first purchase settles:

- Trading profit: A$4,666.66 × 7%, rounded = **A$326.67**.
- Jake retained allocation = **A$81.67**.
- ELITA allocation = **A$245.00**, split into **A$122.50 withdrawn** and **A$122.50 retained**.
- Fund becomes A$100,000 + A$81.67 + A$122.50 = **A$100,204.17** before that day's purchase moves cash into committed cost.

At day 365, the fund is **A$196,523.93**, comprising **A$69,849.90 cash + A$126,674.03 outstanding cost**. Those outstanding purchases are not treated as settled cash or as immediate payouts.

After the last existing purchase settles on day 380:

```
Original capital                         A$100,000.00
Jake retained trading profit              A$40,827.16
ELITA retained trading profit             A$61,238.70
Final purchasing-fund cash               A$202,065.86

Jake final payout (including A$4,000 fee) A$144,827.16
ELITA final lump sum (after fee)          A$57,238.70
Combined final payouts                   A$202,065.86

ELITA periodic withdrawals                A$61,240.59
Final cash + withdrawals                 A$263,306.45
Original capital + all trading profit    A$263,306.45
```

The small difference between ELITA retained and withdrawn balances comes from cent rounding at each independent settlement. The financial tests reproduce the first-settlement hand calculation and reconcile the full ledger, including every purchase's cash availability, allocation and settlement date.

## Limitations

These are fixed-delay, fixed-margin illustrations with a defined optional stress, not forecasts. The model omits discrete whole-watch constraints, actual customer pipelines, stochastic delays, defaults, trading losses, overheads, tax and FX changes. It contains no current customer, watch, deal or pipeline data. ELITA's proposed loss responsibility is a contractual discussion point, not collateral or risk elimination.
