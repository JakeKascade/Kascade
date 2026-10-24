/** Display helpers. Inputs are integer AUD cents; screens round to whole dollars. */
const whole = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
});
const exact = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 2,
});

export const money = (cents: number) => whole.format(Math.round(cents) / 100);
export const preciseMoney = (cents: number) => exact.format(cents / 100);

/** $4k, $11.2k, $1.2m — for chart axes only. */
export function compactMoney(cents: number) {
  const dollars = cents / 100;
  if (Math.abs(dollars) >= 1_000_000)
    return `$${(dollars / 1_000_000).toLocaleString("en-AU", { maximumFractionDigits: 1 })}m`;
  if (Math.abs(dollars) >= 1000)
    return `$${(dollars / 1000).toLocaleString("en-AU", { maximumFractionDigits: 1 })}k`;
  return `$${Math.round(dollars)}`;
}
export const percentBps = (bps: number) =>
  `${(bps / 100).toLocaleString("en-AU", { maximumFractionDigits: 2 })}%`;

export const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;
