import { test, expect, type Download, type Page } from "@playwright/test";
import { allocation, DEFAULTS, money, simulate } from "../../src/lib/model";

/** Unlocks the confidential screen, opens the page and waits until React has
 * hydrated, so input isn't lost. */
async function open(page: Page) {
  const unlocked = await page.request.post("/api/access", {
    data: { code: process.env.ELITA_ACCESS_CODE || "1991" },
  });
  expect(unlocked.ok()).toBe(true);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
}

async function readDownload(download: Download) {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

test("presentation is responsive, uses supplied fonts and has no runtime errors", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A purchasing fund",
  );
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(
      () =>
        document.fonts.check("16px Unica") &&
        document.fonts.check("11px Optician"),
    ),
  ).toBe(true);
  const logo = page.locator(".brand img");
  expect(await logo.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(
    2048,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  for (const id of ["proposal", "numbers", "gains", "viability"])
    await expect(page.locator(`#${id}`)).toBeVisible();
  await page.screenshot({
    path: `artifacts/${info.project.name}-full.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("capital is fixed and the sale example comes from the allocation rules", async ({
  page,
}) => {
  await open(page);
  await expect(page.locator("#capital")).toHaveCount(0);
  await expect(page.locator(".fixed-capital strong")).toHaveText(
    money(DEFAULTS.initialCapital * 100),
  );
  const split = allocation(1_000_000);
  const example = page.locator(".split");
  for (const cents of [
    split.jake,
    split.elita,
    split.withdrawn,
    split.jake + split.retained,
  ])
    await expect(example).toContainText(money(cents));
});

test("controls recalculate the graph, outcomes, payouts and monthly viability", async ({
  page,
}) => {
  await open(page);
  const original = simulate({ ...DEFAULTS });
  await expect(page.getByTestId("fund-value")).toHaveText(
    money(original.atTerm.fund),
  );
  await expect(page.getByTestId("elita-profit")).toHaveText(
    money(original.payout.elitaNetProfit),
  );
  await expect(page.getByTestId("jake-profit")).toHaveText(
    money(original.payout.jakeTotalProfit),
  );
  await expect(page.getByTestId("jake-payout")).toHaveText(
    money(original.payout.jakeFinalPayout),
  );
  await page.locator("#settlement").fill("10");
  await page.locator("#utilisation").fill("60");
  await page.locator("#margin").fill("60");
  const changed = simulate({
    ...DEFAULTS,
    settlementDays: 10,
    utilisation: 0.6,
    margin: 0.06,
  });
  await expect(page.getByTestId("fund-value")).toHaveText(
    money(changed.atTerm.fund),
  );
  await expect(page.getByTestId("elita-profit")).toHaveText(
    money(changed.payout.elitaNetProfit),
  );
  await expect(page.locator(".chart-legend")).toContainText("10 days");
  await page.getByRole("button", { name: "90 days", exact: true }).click();
  await expect(
    page.getByText("Combined fund at 90 days", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Advanced assumptions" }).click();
  await page.getByLabel("Limit actual purchasing demand").check();
  await page.getByLabel("Monthly purchase-cost ceiling (AUD)").fill("0");
  const idle = simulate({
    ...DEFAULTS,
    settlementDays: 10,
    utilisation: 0.6,
    margin: 0.06,
    termDays: 90,
    monthlyDemand: 0,
  });
  await expect(page.getByTestId("fund-value")).toHaveText(
    money(idle.atTerm.fund),
  );
  await expect(page.getByTestId("elita-payout")).toHaveText(
    money(Math.abs(idle.payout.elitaFinalPayout)),
  );
  await expect(page.getByText("Fee top-up due from ELITA")).toBeVisible();
  await page.getByRole("button", { name: /^Month 3/ }).click();
  await expect(page.getByTestId("month-detail")).toContainText("Month 3");
  await page.getByRole("button", { name: "Reset assumptions" }).click();
  await expect(page.getByTestId("fund-value")).toHaveText(
    money(original.atTerm.fund),
  );
  await expect(page.locator("#settlement")).toHaveValue("15");
});

test("graph inspection, sensitivity and downloadable results stay consistent", async ({
  page,
}) => {
  await open(page);
  const chart = page.getByRole("slider", {
    name: "Inspect a day on the fund graph",
  });
  await chart.focus();
  await chart.press("Home");
  for (let i = 0; i < 15; i++) await chart.press("ArrowRight");
  await expect(page.getByTestId("inspect-fund")).toHaveText(
    money(simulate({ ...DEFAULTS }).daily[15].fund),
  );
  await page.getByRole("button", { name: "Advanced assumptions" }).click();
  await page.getByLabel("Conservative second half", { exact: false }).check();
  await expect(page.locator(".stress-comparison")).toBeVisible();
  const jsonEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Model JSON" }).click();
  const exported = JSON.parse(await readDownload(await jsonEvent));
  const selected = exported.scenarios.find(
    (s: { settlementDays: number }) => s.settlementDays === 15,
  );
  await expect(page.getByTestId("jake-payout")).toHaveText(
    money(selected.payout.jakeFinalPayout),
  );
  expect(exported.assumptions.conditions).toBe("conservative");
  expect(exported.assumptions.initialCapital).toBe(100_000);
  expect(exported.scenarios).toHaveLength(3);
  const csvEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Daily CSV" }).click();
  const csv = await readDownload(await csvEvent);
  expect(csv.split("\n")[0]).toContain("scenario_days,day,phase,fund_AUD");
  await expect(page.locator(".export-status")).toContainText("CSV downloaded");
});

test("terms, keyboard controls, reduced motion and print layout are usable", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to the numbers" }),
  ).toBeFocused();
  await page.locator("#settlement").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#settlement")).toHaveValue("16");
  await page.getByRole("button", { name: "Advanced assumptions" }).click();
  await page.getByRole("button", { name: "How the model works" }).click();
  await expect(page.locator("#terms-title")).toBeInViewport();
  // Below desktop width the terms show one column at a time.
  if (info.project.name !== "desktop")
    await expect(
      page.getByRole("button", { name: "The model", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  for (const text of [
    "Either of us could elect to end it at 90 or 180 days.",
    "The arrangement isn’t secured.",
    "Independent legal and tax review",
  ])
    await expect(page.locator("#terms")).toContainText(text);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".exports")).toBeHidden();
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
  await open(page);
  await page.locator("#settlement").fill("10");
  await page.locator("#utilisation").fill("85");
  await page.locator("#margin").fill("100");
  await page.getByRole("button", { name: "Advanced assumptions" }).click();
  await page
    .getByLabel("Reduce utilisation as the fund grows", { exact: false })
    .uncheck();
  const s = simulate({
    ...DEFAULTS,
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

test("sections snap into place and the calculator fits one screen", async ({
  page,
}, info) => {
  await open(page);
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollSnapType,
    ),
  ).toContain("mandatory");
  const tops = await page.evaluate(() =>
    [...document.querySelectorAll(".panel")].map(
      (p) => (p as HTMLElement).offsetTop - 64,
    ),
  );
  if (info.project.name === "desktop") {
    await page.keyboard.press("PageDown");
    await expect
      .poll(() => page.evaluate(() => Math.round(window.scrollY)))
      .toBeGreaterThanOrEqual(tops[1] - 2);
    expect(
      Math.abs((await page.evaluate(() => window.scrollY)) - tops[1]),
    ).toBeLessThanOrEqual(2);
  }
  await page.getByRole("link", { name: "Skip to the numbers" }).focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(800);
  // Profits, graph and every dial are visible together without scrolling.
  const viewport = page.viewportSize()!;
  for (const selector of [
    '[data-testid="elita-profit"]',
    '[data-testid="jake-profit"]',
    ".chart-frame",
    "#settlement",
    "#utilisation",
    "#margin",
    ".segmented",
  ]) {
    const box = (await page.locator(selector).boundingBox())!;
    expect(box.y, selector).toBeGreaterThanOrEqual(64 - 1);
    expect(box.y + box.height, selector).toBeLessThanOrEqual(
      viewport.height + 1,
    );
  }
});

test("each dial explains itself, with a tap-to-open note where space is tight", async ({
  page,
}, info) => {
  await open(page);
  await expect(page.locator('label[for="utilisation"]')).toHaveText(
    "Average capital utilisation",
  );
  const button = page.getByRole("button", {
    name: "About Average capital utilisation",
  });
  if (info.project.name !== "mobile") {
    await expect(page.locator("#utilisation-help")).toBeVisible();
    return;
  }
  await page.locator("#numbers").scrollIntoViewIfNeeded();
  await expect(button).toBeVisible();
  await button.click();
  await expect(page.locator("#utilisation-info")).toBeVisible();
  await expect(page.locator("#utilisation-info")).toContainText("On average");
  await page.keyboard.press("Escape");
  await expect(page.locator("#utilisation-info")).toBeHidden();
});

test("the confidential screen keeps the proposal back until the code is entered", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const html = await (await page.request.get("/")).text();
  expect(html).toContain("Enter your access code");
  expect(html).not.toContain("A purchasing fund");
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Enter your access code",
  );
  const field = page.getByLabel(/Access code/);
  await field.fill("1234");
  await expect(page.locator("#access-status")).toContainText("isn’t right");
  await expect(field).toHaveValue("");
  await field.fill(process.env.ELITA_ACCESS_CODE || "1991");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A purchasing fund",
  );
  expect(errors).toEqual([]);
});

test("partner panels match in height and the month view steps on until picked", async ({
  page,
}, info) => {
  await open(page);
  await expect(page.getByTestId("volume-table")).toContainText(
    "Average settlement time",
  );
  if (info.project.name === "desktop") {
    const heights = await page
      .locator(".party")
      .evaluateAll((els) =>
        els.map((el) => Math.round(el.getBoundingClientRect().height)),
      );
    expect(heights[0]).toBe(heights[1]);
  } else {
    await expect(page.locator(".party-tabs")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^ELITA/ }).first(),
    ).toHaveAttribute("aria-pressed", "true");
  }
  await page.locator("#viability .month-bars").scrollIntoViewIfNeeded();
  await page.mouse.move(1, 1);
  const name = page.locator(".month-name");
  await expect(name).toContainText("Month 2", { timeout: 6000 });
  await page.getByRole("button", { name: /^Month 5/ }).click();
  await page.waitForTimeout(2500);
  await expect(name).toContainText("Month 5");
});

test("the arrangement section names three advantages and leads into the calculator", async ({
  page,
}) => {
  await open(page);
  const items = page.locator(".advantages li");
  await expect(items).toHaveCount(3);
  for (const title of [
    "Less friction, faster execution",
    "Clear visibility of purchasing capacity",
    "Independent deals running concurrently",
  ])
    await expect(page.getByRole("heading", { name: title })).toBeAttached();
  await expect(page.locator(".evolve-head .lead")).toHaveCount(0);
  await expect(page.locator(".evolve-takeaway")).toContainText(
    "Less friction. Greater visibility. More flexibility.",
  );
  await expect(page.locator(".evolve-takeaway")).toContainText(
    "All subject to real demand, available capital, agreed operating controls and transaction performance.",
  );
  const order = await page.evaluate(() => {
    const panels = [...document.querySelectorAll(".panel")];
    const evolve = panels.findIndex((p) => p.querySelector(".evolve"));
    return [evolve, panels.findIndex((p) => p.id === "numbers")];
  });
  expect(order[1]).toBe(order[0] + 1);
});

test("the header scenario panel changes every figure on the page", async ({
  page,
}) => {
  await open(page);
  const button = page.locator(".scenario-button");
  // Phones get a plain "Edit scenario" button; wider screens show the figures.
  const phone = test.info().project.name === "mobile";
  await expect(button.locator(".scenario-edit")).toBeVisible({
    visible: phone,
  });
  await expect(button.locator(".scenario-summary")).toBeVisible({
    visible: !phone,
  });
  await expect(button).toHaveAttribute(
    "aria-label",
    /15 days · 70% · 7% · 12 mo\. /,
  );
  await button.click();
  const dialog = page.getByRole("dialog", { name: "Scenario" });
  await expect(dialog).toBeVisible();
  await dialog.locator("#s-margin").fill("90");
  await dialog.locator("#s-settlement").fill("20");
  const s = simulate({ ...DEFAULTS, margin: 0.09, settlementDays: 20 });
  await expect(page.getByTestId("elita-profit")).toHaveText(
    money(s.payout.elitaNetProfit),
  );
  await expect(page.getByTestId("jake-payout")).toHaveText(
    money(s.payout.jakeFinalPayout),
  );
  await expect(page.locator("#margin")).toHaveValue("90");
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(dialog).toBeHidden();
  await expect(button).toHaveAttribute(
    "aria-label",
    /20 days · 70% · 9% · 12 mo, adjusted/,
  );
  // The later panels say they reflect an adjusted scenario, and reopen it.
  const notes = page.locator(".adjusted-note");
  await expect(notes).toHaveCount(2);
  await expect(page.locator("#viability .adjusted-note")).toContainText(
    "Scenario adjusted20 days · 70% · 9% · 12 mo",
  );
  await page.locator("#gains .adjusted-note").click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Reset to the proposal" }).click();
  await expect(page.getByTestId("fund-value")).toHaveText(
    money(simulate({ ...DEFAULTS }).atTerm.fund),
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(notes).toHaveCount(0);
  await expect(page.locator(".split-head .tag")).toHaveText("Hypothetical");
});
