import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";

test("production presentation asks only for the shared access code and retains noindex headers", async () => {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: "production",
    NEXT_TELEMETRY_DISABLED: "1",
  };
  delete env.ELITA_ACCESS_PASSWORD;
  delete env.ELITA_ACCESS_USER;
  delete env.ELITA_ACCESS_CODE;
  const port = 3101;
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: process.cwd(), env, stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  child.stdout.on("data", b => { logs += b.toString(); });
  child.stderr.on("data", b => { logs += b.toString(); });
  const base = `http://127.0.0.1:${port}`;
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      if (child.exitCode !== null) throw new Error(`Production server exited: ${logs}`);
      try { await fetch(base); ready = true; break; } catch { await new Promise(resolve => setTimeout(resolve, 100)); }
    }
    assert.ok(ready, "Production server must start");
    const gate = await fetch(base);
    assert.equal(gate.status, 200);
    assert.equal(gate.headers.get("www-authenticate"), null);
    assert.match(gate.headers.get("x-robots-tag") || "", /noindex/);
    assert.equal(gate.headers.get("x-frame-options"), "DENY");
    const gateHtml = await gate.text();
    assert.match(gateHtml, /Enter your access code/);
    assert.doesNotMatch(gateHtml, /A purchasing fund/i, "proposal must not be sent before the code");
    const post = (code: string) =>
      fetch(base + "/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
    assert.equal((await post("0000")).status, 401);
    const unlocked = await post("1991");
    assert.equal(unlocked.status, 200);
    const cookie = unlocked.headers.get("set-cookie") || "";
    assert.match(cookie, /elita_access=[0-9a-f]{64}/);
    assert.match(cookie, /HttpOnly/i);
    assert.doesNotMatch(cookie, /=1991/);
    // Repeated wrong codes from one address lock it out, even for the right
    // code, while other addresses are unaffected.
    const from = (address: string, code: string) =>
      fetch(base + "/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": address },
        body: JSON.stringify({ code }),
      });
    for (let i = 0; i < 5; i++) assert.equal((await from("203.0.113.9", "0000")).status, 401);
    assert.equal((await from("203.0.113.9", "1991")).status, 429);
    assert.equal((await from("203.0.113.10", "1991")).status, 200);
    const home = await fetch(base, { headers: { cookie: cookie.split(";")[0] } });
    assert.equal(home.status, 200);
    assert.match(await home.text(), /A purchasing fund/i);
    const logo = await fetch(base + "/brand/elita-logo.png");
    assert.equal(logo.status, 200);
    for (const path of ["/brand/elita-logo-white.png", "/brand/Unica77LLTT-Regular.ttf", "/brand/Unica77LLTT-Light.ttf", "/brand/Optician-Sans.otf"]) {
      const res = await fetch(base + path);
      assert.equal(res.status, 200, path + " must load approved ELITA brand fonts");
    }
  } finally {
    child.kill("SIGTERM");
    if (child.exitCode === null) await once(child, "exit");
  }
});
