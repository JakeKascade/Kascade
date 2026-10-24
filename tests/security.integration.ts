import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";

const CODE = "4826";

/** Starts the production build; resolves once it answers. */
async function start(port: number, env: NodeJS.ProcessEnv) {
  const child = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)],
    { cwd: process.cwd(), env, stdio: ["ignore", "pipe", "pipe"] },
  );
  let logs = "";
  child.stdout.on("data", (b) => (logs += b.toString()));
  child.stderr.on("data", (b) => (logs += b.toString()));
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 150; i++) {
    if (child.exitCode !== null) throw new Error(`Production server exited: ${logs}`);
    try {
      await fetch(base + "/access");
      return { child, base, logs: () => logs };
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error("Production server did not start");
}
async function stop(child: ReturnType<typeof spawn>) {
  child.kill("SIGTERM");
  if (child.exitCode === null) await once(child, "exit");
}
const baseEnv = (): NodeJS.ProcessEnv => {
  const env: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1" };
  delete env.KASCADE_ACCESS_CODE;
  return env;
};
const post = (base: string, code: string, address?: string) =>
  fetch(base + "/api/access", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(address ? { "x-forwarded-for": address } : {}) },
    body: JSON.stringify({ code }),
  });

test("production asks for the access code, never sends the proposal before it, and keeps noindex headers", async () => {
  const { child, base, logs } = await start(3101, { ...baseEnv(), KASCADE_ACCESS_CODE: CODE });
  try {
    const gate = await fetch(base);
    assert.equal(gate.status, 200);
    assert.match(gate.headers.get("x-robots-tag") || "", /noindex/);
    assert.equal(gate.headers.get("x-frame-options"), "DENY");
    const gateHtml = await gate.text();
    assert.match(gateHtml, /Enter your access code/);
    assert.doesNotMatch(gateHtml, /id="calculator"/, "proposal must not be sent before the code");
    assert.doesNotMatch(gateHtml, new RegExp(CODE), "the code itself never reaches the browser");
    // The logo is public, so it shows on the access screen.
    const logo = await fetch(base + "/brand/kascade-logo-white.svg");
    assert.equal(logo.status, 200);
    assert.match(logo.headers.get("content-type") || "", /svg/);
    assert.equal((await post(base, "0000")).status, 401);
    assert.equal((await post(base, "2026")).status, 401, "the development code doesn't work in production");
    const unlocked = await post(base, CODE);
    assert.equal(unlocked.status, 200);
    const cookie = unlocked.headers.get("set-cookie") || "";
    assert.match(cookie, /kascade_proposal_access=[0-9a-f]{64}/);
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /Secure/i);
    assert.doesNotMatch(cookie, new RegExp(`=${CODE}`));
    // Repeated wrong codes from one address lock it out, even for the right
    // code, while other addresses are unaffected.
    for (let i = 0; i < 5; i++) assert.equal((await post(base, "0000", "203.0.113.9")).status, 401);
    assert.equal((await post(base, CODE, "203.0.113.9")).status, 429);
    assert.equal((await post(base, CODE, "203.0.113.10")).status, 200);
    const session = { cookie: cookie.split(";")[0] };
    // Locked, the bare address shows the code screen without naming any proposal.
    const bare = await fetch(base, { redirect: "manual" });
    assert.equal(bare.status, 200);
    assert.doesNotMatch(await bare.text(), /real-coder/i);
    // Unlocked, it forwards to the proposal's own path.
    const forward = await fetch(base, { headers: session, redirect: "manual" });
    assert.equal(forward.status, 307);
    assert.match(forward.headers.get("location") || "", /\/real-coder$/);
    const home = await fetch(base + "/real-coder", { headers: session });
    assert.equal(home.status, 200);
    const html = await home.text();
    assert.match(html, /id="calculator"/);
    assert.doesNotMatch(html, /ELITA/i);
    assert.doesNotMatch(logs(), new RegExp(CODE), "the code is never logged");
  } finally {
    await stop(child);
  }
});

test("production with no configured code fails closed", async () => {
  const { child, base } = await start(3102, baseEnv());
  try {
    assert.match(await (await fetch(base)).text(), /Enter your access code/);
    assert.match(await (await fetch(base + "/real-coder")).text(), /Enter your access code/);
    assert.equal((await post(base, "2026")).status, 401);
    assert.equal((await post(base, "")).status, 401);
  } finally {
    await stop(child);
  }
});
