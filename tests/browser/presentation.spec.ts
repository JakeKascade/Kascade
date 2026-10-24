import { test, expect, type Page } from "@playwright/test";
import { SERVICES } from "../../src/data/catalog";
import { PRICE_LISTS } from "../../src/data/pricing";
import { money } from "../../src/lib/format";
import { commissionOn } from "../../src/lib/referral-model";
import { countsScenario, run } from "../../src/lib/scenario";

const DEV_CODE = "2026";
const SCREENS = ["top", "roles", "gains", "branding", "real-estate", "ongoing", "referrals", "calculator", "terms", "next"];

/** Unlocks the access screen, opens the page and waits for hydration so input isn't lost. */
async function open(page: Page, hash = "") {
  const unlocked = await page.request.post("/api/access", { data: { code: DEV_CODE } });
  expect(unlocked.ok()).toBe(true);
  await page.goto(`/${hash}`);
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
}
const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test("the access screen guards the proposal and unlocks with the code", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Enter your access code" })).toBeVisible();
  await expect(page.locator("#calculator")).toHaveCount(0);
  await page.locator("#access-code").fill(DEV_CODE);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kascade Studio", { timeout: 10_000 });
});

test("every screen renders, dark, with one clear heading and no runtime errors", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toMatch(/Inter Tight/i);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(17, 19, 23)");
  for (const id of SCREENS) await expect(page.locator(`#${id}`)).toBeAttached();
  const headings = await page.locator("main h2").allTextContents();
  expect(headings).toEqual([
    "Who does what",
    "What everyone gains",
    "Branding & Identity",
    "Real Estate Campaign Retainers",
    "Ongoing Design Retainers",
    "How referrals work",
    "Calculate your earnings",
    "Terms",
    "Next steps",
  ]);
  // Two-tone headings: every heading has a white part; one typeface throughout.
  for (const h of await page.locator("main h1, main h2").all()) expect(await h.locator(".hi").count()).toBeGreaterThan(0);
  expect(await page.locator("main em").count()).toBe(0);
  await expect(page.locator("canvas.pixel-field")).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);
  const text = await page.evaluate(() => `${document.title} ${document.body.innerText}`);
  expect(text).not.toMatch(/\b(ELITA|Unica77|Optician)\b/i);
  await page.screenshot({ path: `artifacts/${info.project.name}-full.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test("every price list uses the same columns and catalogue figures", async ({ page }) => {
  await open(page);
  for (const list of PRICE_LISTS) {
    const table = page.getByTestId(`prices-${list.id}`);
    await expect(table.locator("tbody tr")).toHaveCount(list.rows.length);
    if ((page.viewportSize()?.width ?? 1000) > 640)
      await expect(table.locator("thead th")).toHaveText(["Package", "Price", "Real Coder earns"]);
    for (const row of list.rows)
      if (typeof row.price === "number")
        await expect(table).toContainText(money(commissionOn(row.price, 1000)));
  }
  await expect(page.getByTestId("prices-real-estate")).toContainText("$345");
});

test("the referral examples are fully visible and come from the model", async ({ page }) => {
  await open(page, "#referrals");
  const pro = SERVICES.professional.billing === "once" ? SERVICES.professional.priceCents : 0;
  await expect(page.getByTestId("example-professional")).toBeVisible();
  await expect(page.getByTestId("example-professional")).toHaveText(money(commissionOn(pro, 1000)));
  await expect(page.getByTestId("example-reGrowth")).toHaveText("$345 a month");
  await expect(page.locator("#referrals")).toContainText("$4,140 over the first 12 paid months");
});

test("the calculator adds up clients with the same engine", async ({ page }) => {
  await open(page, "#calculator");
  const calc = page.locator("#calculator");
  await expect(page.getByTestId("total")).toHaveText(money(run(countsScenario({ professional: 1, reGrowth: 1 })).totals.totalCommission));
  await calc.getByRole("button", { name: "More: Branding & Identity, Basic / Refresh: clients" }).click();
  await calc.getByRole("button", { name: "More: Ongoing Design Retainers, Embedded: clients" }).click();
  await calc.getByRole("button", { name: "Fewer: Real Estate Campaign Retainers, Growth: clients" }).click();
  const expected = run(countsScenario({ basic: 1, professional: 1, embedded: 1 })).totals;
  await expect(page.getByTestId("total")).toHaveText(money(expected.totalCommission));
  await expect(page.getByTestId("oneoff")).toHaveText("$660");
  await expect(page.getByTestId("monthly")).toHaveText("$420");
  await expect(calc.getByRole("button", { name: "Fewer: Real Estate Campaign Retainers, Growth: clients" })).toBeDisabled();
});

test("keyboard, reduced motion and print are usable", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  const toggle = page.locator("#real-estate").getByRole("button", { name: "What’s included" });
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("Photography and video", { exact: true })).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(page.getByText("Two consolidated feedback rounds on the selected direction")).toBeVisible();
  if (info.project.name.startsWith("desktop"))
    await page.pdf({ path: "artifacts/kascade-real-coder-print.pdf", format: "A4", printBackground: true });
});

test("touch targets are at least 44px and landscape phones don't scroll sideways", async ({ page }, info) => {
  test.skip(info.project.name !== "phone-390", "phone only");
  await open(page, "#calculator");
  const small = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("main button")]
      .filter((el) => el.offsetParent !== null)
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.height < 43.5).length,
  );
  expect(small).toBe(0);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(300);
  expect(await noHorizontalScroll(page)).toBe(true);
});
