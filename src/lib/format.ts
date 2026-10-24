/** Display helpers. Inputs are integer AUD cents; screens round to whole dollars. */
const whole = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
});

export const money = (cents: number) => whole.format(Math.round(cents) / 100);
