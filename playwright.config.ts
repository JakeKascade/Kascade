import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

// Use a locally installed Chromium where one exists (CI images, cloud sessions).
const executablePath =
  process.env.CHROMIUM_PATH ||
  ["/opt/pw-browsers/chromium", "/usr/bin/chromium"].find((p) => existsSync(p));

const chrome = devices["Desktop Chrome"];
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    launchOptions: { executablePath, args: ["--no-sandbox"] },
  },
  projects: [
    { name: "desktop-1440", use: { ...chrome, viewport: { width: 1440, height: 900 } } },
    { name: "laptop-1280", use: { ...chrome, viewport: { width: 1280, height: 800 } } },
    { name: "short-1280x620", use: { ...chrome, viewport: { width: 1280, height: 620 } } },
    { name: "tablet-768", use: { ...chrome, viewport: { width: 768, height: 1024 }, hasTouch: true } },
    { name: "phone-390", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
  ],
  webServer: {
    command: "npm run dev -- --port 3100",
    url: "http://127.0.0.1:3100/access",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
