import { test, expect, type Download, type Page } from "@playwright/test";
import { SERVICES } from "../../src/data/catalog";
import { money } from "../../src/lib/format";
import { commissionOn } from "../../src/lib/referral-model";
import { presetScenario, run } from "../../src/lib/scenario";

const DEV_CODE = "2026";
const desktopOnly = (name: string) => !name.startsWith("desktop");

/** Unlocks the access screen, opens the page and waits for hydration so input isn't lost. */
async function open(page: Page, hash = "") {
  const unlocked = await page.request.post("/api/access", { data: { code: DEV_CODE } });
  expect(unlocked.ok()).toBe(true);
  await page.goto(`/${hash}`);
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
}
async function readDownload(download: Download) {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}
const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test("the access screen guards the proposal and unlocks with the code", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Enter your access code" })).toBeVisible();
  await expect(page.locator("#calculator")).toHaveCount(0);
  await page.locator("#access-code").fill(DEV_CODE);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("More value for your clients", {
    timeout: 10_000,
  });
});

test("every panel renders responsively with the interim typeface and no runtime errors", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("More value for your clients");
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toMatch(/Geist/i);
  for (const id of [
    "partnership", "fit", "services", "branding", "real-estate", "creative-partner",
    "how-it-works", "calculator", "gains", "terms", "next",
  ])
    await expect(page.locator(`#${id}`)).toBeAttached();
  expect(await noHorizontalScroll(page)).toBe(true);
  // No leftover ELITA identity anywhere on the page.
  const text = await page.evaluate(() => `${document.title} ${document.body.innerText}`);
  expect(text).not.toMatch(/\b(ELITA|Unica77|Optician)\b/i);
  await page.screenshot({ path: `artifacts/${info.project.name}-full.png`, fullPage: true });
  await page.locator("#calculator").screenshot({ path: `artifacts/${info.project.name}-calculator.png` });
  expect(errors).toEqual([]);
});

test("package prices and commissions on the page come from the catalogue", async ({ page }) => {
  await open(page, "#branding");
  const pro = SERVICES.professional.billing === "once" ? SERVICES.professional.priceCents : 0;
  await expect(page.locator("#branding")).toContainText(money(pro));
  await expect(page.locator("#branding")).toContainText(`${money(commissionOn(pro, 1000))} once`);
  await expect(page.locator("#real-estate")).toContainText("$345 a month");
  await expect(page.locator("#real-estate")).toContainText("$4,140");
  await expect(page.locator("#creative-partner")).toContainText("Up to 42 creative hours");
});

test("the calculator, chart, table, header and exports all reconcile with the engine", async ({ page }, info) => {
  test.skip(desktopOnly(info.project.name), "interaction coverage runs once, at desktop size");
  await open(page, "#calculator");
  const first = run(presetScenario("first"));
  await expect(page.getByTestId("total-commission")).toHaveText(money(first.totals.totalCommission));
  await page.getByRole("button", { name: "An agency each quarter" }).first().click();
  const quarterly = run(presetScenario("quarterly"));
  await expect(page.getByTestId("total-commission")).toHaveText("$11,150");
  await expect(page.getByTestId("oneoff-commission")).toHaveText("$800");
  await expect(page.getByTestId("recurring-commission")).toHaveText("$10,350");
  await expect(page.getByTestId("run-rate")).toHaveText("$1,380");
  await expect(page.locator(".scenario-button")).toContainText(money(quarterly.totals.totalCommission));
  await page.getByRole("button", { name: "Month-by-month breakdown" }).click();
  await expect(page.getByTestId("table-total")).toHaveText("$11,150");
  const chart = page.getByRole("slider", { name: "Inspect a month of cumulative commission" });
  await chart.focus();
  await page.keyboard.press("Home");
  await expect(chart).toHaveAttribute("aria-valuetext", `Month 1: ${money(quarterly.months[0].totalCommission)} earned, ${money(quarterly.months[0].cumulativeCommission)} cumulative`);
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Scenario JSON" }).click();
  const exported = JSON.parse(await readDownload(await downloadEvent));
  expect(exported.results.totals.totalCommission).toBe(quarterly.totals.totalCommission);
  const csvEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Monthly CSV" }).click();
  expect(await readDownload(await csvEvent)).toMatch(/^total,.*,11150\.00,/m);
});

test("editing referrals recalculates, and 10+ retainers wait for an agreed fee", async ({ page }, info) => {
  test.skip(desktopOnly(info.project.name), "interaction coverage runs once, at desktop size");
  await open(page, "#calculator");
  const calc = page.locator("#calculator");
  // Turn the branding line into Basic + strategy: $200 + $500 instead of $400.
  const brandLine = calc.locator(".line").nth(1);
  await brandLine.locator("select").first().selectOption("basic");
  await brandLine.getByLabel("+ Brand Strategy & Positioning").check();
  await expect(page.getByTestId("oneoff-commission")).toHaveText("$700");
  await brandLine.getByRole("button", { name: /^More:/ }).click();
  await expect(page.getByTestId("oneoff-commission")).toHaveText("$1,400");
  // Add a 10+ agency: nothing counts until a fee is entered.
  await calc.getByRole("button", { name: "Add a referral" }).click();
  const custom = calc.locator(".line").nth(2);
  await custom.locator("select").first().selectOption("reCustom");
  await expect(custom).toContainText("Enter the agreed monthly fee");
  await expect(page.getByTestId("recurring-commission")).toHaveText("$4,140");
  await custom.getByLabel("Agreed monthly fee (AUD, ex GST)").fill("6000");
  await expect(page.getByTestId("recurring-commission")).toHaveText("$11,340");
  await custom.getByRole("button", { name: /^Remove referral/ }).click();
  await expect(page.getByTestId("recurring-commission")).toHaveText("$4,140");
  // Negotiation settings are labelled when they differ from the proposal.
  await calc.getByRole("button", { name: "Negotiation and modelling settings" }).click();
  await calc.getByRole("button", { name: /24 months/ }).click();
  await expect(calc.locator(".negotiation-badge")).toContainText("24-month view");
  await expect(page.getByTestId("recurring-commission")).toHaveText("$4,140");
  await calc.getByRole("button", { name: "Reset to the proposed terms" }).click();
  await expect(calc.locator(".negotiation-badge")).toHaveCount(0);
});

test("the header scenario drawer edits the same scenario and keeps it when closed", async ({ page }) => {
  await open(page);
  await page.locator(".scenario-button").click();
  const drawer = page.getByRole("dialog", { name: "Referral scenario" });
  await expect(drawer).toBeVisible();
  await drawer.getByRole("button", { name: "A broader mix" }).click();
  const mix = money(run(presetScenario("mix")).totals.totalCommission);
  await expect(drawer.getByTestId("drawer-total")).toHaveText(mix);
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(page.locator(".scenario-button")).toBeFocused();
  await expect(page.getByTestId("total-commission")).toHaveText(mix);
  await page.locator(".scenario-button").click();
  await expect(drawer.getByRole("button", { name: "A broader mix" })).toHaveAttribute("aria-pressed", "true");
  await drawer.getByRole("button", { name: "Done" }).click();
  await expect(drawer).toBeHidden();
  expect(await noHorizontalScroll(page)).toBe(true);
});

test("the referral flow's payment split comes from the model", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "#how-it-works");
  const flow = page.locator("#how-it-works");
  await expect(flow.getByTestId("flow-commission")).toHaveText("$400");
  await flow.getByRole("button", { name: "Real estate · Growth" }).click();
  const growth = SERVICES.reGrowth.billing === "monthly" ? SERVICES.reGrowth.monthlyCents! : 0;
  await expect(flow.getByTestId("flow-commission")).toHaveText(money(commissionOn(growth, 1000)));
  await flow.getByRole("button", { name: /Client pays/ }).click();
  await expect(flow.getByTestId("flow-commission")).toHaveText("—");
});

test("keyboard, reduced motion and print are all usable", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to the calculator" })).toBeFocused();
  const tab = page.getByRole("tab", { name: "Commission & payment" });
  await tab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Introductions" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toContainText("protected for 6 months");
  // Reduced motion: nothing is left hidden waiting for an animation.
  expect(await page.evaluate(() => document.documentElement.classList.contains("motion"))).toBe(false);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".scenario-button")).toBeHidden();
  await expect(page.getByText("Excluded, or quoted separately")).toBeVisible();
  await expect(page.getByText("A registered introduction is protected", { exact: false })).toBeVisible();
  await expect(page.locator("#terms").getByText("Paid within 14 days", { exact: false })).toBeVisible();
  if (info.project.name.startsWith("desktop"))
    await page.pdf({ path: "artifacts/kascade-real-coder-print.pdf", format: "A4", printBackground: true });
});

test("touch targets are at least 44px and landscape phones don't scroll sideways", async ({ page }, info) => {
  test.skip(info.project.name !== "phone-390", "phone only");
  await open(page, "#calculator");
  const small = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("#calculator button, #calculator select, .scenario-button")]
      .filter((el) => el.offsetParent !== null)
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.height < 43.5 || r.width < 43.5).length,
  );
  expect(small).toBe(0);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(300);
  expect(await noHorizontalScroll(page)).toBe(true);
});
