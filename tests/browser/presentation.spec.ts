import { test, expect } from "@playwright/test";
import { DEFAULTS, money, simulate } from "../../src/lib/model";

test("presentation is responsive, uses safe system typography and has no runtime errors", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A potential",
  );
  await expect(page.locator("body")).toHaveCSS(
    "font-family",
    '"Helvetica Neue", Arial, sans-serif',
  );
  const logo = page.locator(".brand img");
  expect(await logo.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(
    2048,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  for (const id of [
    "structure",
    "simulator",
    "earnings",
    "benefits",
    "viability",
  ])
    await expect(page.locator(`#${id}`)).toBeVisible();
  await page.screenshot({
    path: `artifacts/${info.project.name}-full.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("controls recalculate the chart, payouts, term and demand-derived table", async ({
  page,
}) => {
  await page.goto("/");
  const original = simulate({ ...DEFAULTS });
  await expect(page.getByTestId("fund-value")).toHaveText(
    money(original.atTerm.fund),
  );
  await expect(page.getByTestId("jake-payout")).toHaveText(
    money(original.payout.jakeFinalPayout),
  );
  await page.locator("#capital").fill("150000");
  const changed = simulate({ ...DEFAULTS, initialCapital: 150_000 });
  await expect(page.getByTestId("fund-value")).toHaveText(
    money(changed.atTerm.fund),
  );
  await expect(page.getByTestId("jake-payout")).toHaveText(
    money(changed.payout.jakeFinalPayout),
  );
  await page.getByRole("button", { name: "90 days", exact: true }).click();
  await expect(page.getByText("Fund at day 90", { exact: true })).toBeVisible();
  await page
    .getByText("Advanced assumptions", { exact: false })
    .first()
    .click();
  await page.getByLabel("Limit actual purchasing demand").check();
  await page.getByLabel("Monthly purchase-cost ceiling (AUD)").fill("0");
  const idle = simulate({
    ...DEFAULTS,
    initialCapital: 150_000,
    termDays: 90,
    monthlyDemand: 0,
  });
  await expect(page.getByTestId("fund-value")).toHaveText(
    money(idle.atTerm.fund),
  );
  await expect(page.getByTestId("elita-payout")).toHaveText(
    money(idle.payout.elitaFinalPayout),
  );
  await page.getByLabel("Inspect period").selectOption("3");
  await expect(
    page.getByTestId("viability-table").locator("caption"),
  ).toContainText("Month 3");
  await page.getByRole("button", { name: /Reset/ }).click();
  await expect(page.getByTestId("fund-value")).toHaveText(
    money(original.atTerm.fund),
  );
  await expect(page.locator("#capital")).toHaveValue("100000");
});
test("scenario inspection, sensitivity and downloadable results stay consistent", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "10 days", exact: true }).click();
  await expect(page.getByTestId("jake-payout")).toHaveText(
    money(simulate({ ...DEFAULTS, settlementDays: 10 }).payout.jakeFinalPayout),
  );
  await page.locator("#inspect-day").fill("15");
  await expect(page.getByTestId("fund-value")).toHaveText(
    money(simulate({ ...DEFAULTS, settlementDays: 10 }).daily[15].fund),
  );
  await page.locator(".advanced summary").click();
  await page.getByLabel("Conservative second half", { exact: false }).check();
  await expect(page.locator(".stress-comparison")).toBeVisible();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Model JSON" }).click();
  const download = await downloadEvent;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const exported = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  const selected = exported.scenarios.find(
    (s: { settlementDays: number }) => s.settlementDays === 15,
  );
  await expect(page.getByTestId("jake-payout")).toHaveText(
    money(selected.payout.jakeFinalPayout),
  );
  expect(exported.assumptions.conditions).toBe("conservative");
  expect(exported.scenarios).toHaveLength(3);
});
test("keyboard controls, reduced motion and print layout are usable", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to the simulator" }),
  ).toBeFocused();
  await page.locator("#settlement").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#settlement")).toHaveValue("16");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".export-toolbar")).toBeHidden();
  await expect(
    page.getByText("01 / Settle, then deploy", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".print-assumptions")).toBeVisible();
  if (info.project.name === "desktop")
    await page.pdf({
      path: "artifacts/ELITA-browser-test-print.pdf",
      format: "A4",
      printBackground: true,
    });
});

test("upper input bounds remain reconciled and fit the narrow presentation", async ({
  page,
}, info) => {
  if (info.project.name === "mobile")
    await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await page.locator("#capital").fill("250000");
  await page.locator("#settlement").fill("10");
  await page.locator("#utilisation").fill("85");
  await page.locator("#margin").fill("100");
  await page.locator(".advanced summary").click();
  await page
    .getByLabel("Reduce utilisation as the fund grows", { exact: false })
    .uncheck();
  const s = simulate({
    ...DEFAULTS,
    initialCapital: 250_000,
    settlementDays: 10,
    utilisation: 0.85,
    margin: 0.1,
    taper: false,
  });
  await expect(page.getByTestId("jake-payout")).toHaveText(
    money(s.payout.jakeFinalPayout),
  );
  await expect(page.getByTestId("elita-payout")).toHaveText(
    money(s.payout.elitaFinalPayout),
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
});
