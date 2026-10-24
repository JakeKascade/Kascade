import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";

test("production presentation opens without a username or password and retains noindex headers", async () => {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: "production",
    NEXT_TELEMETRY_DISABLED: "1",
  };
  delete env.ELITA_ACCESS_PASSWORD;
  delete env.ELITA_ACCESS_USER;
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
    const home = await fetch(base);
    assert.equal(home.status, 200);
    assert.equal(home.headers.get("www-authenticate"), null);
    assert.match(home.headers.get("x-robots-tag") || "", /noindex/);
    assert.equal(home.headers.get("x-frame-options"), "DENY");
    assert.match(await home.text(), /A potential/i);
    const logo = await fetch(base + "/brand/elita-logo.png");
    assert.equal(logo.status, 200);
    for (const path of ["/brand/Unica77LLTT-Regular.ttf", "/brand/Unica77LLTT-Light.ttf", "/brand/Optician-Sans.otf"]) {
      const res = await fetch(base + path);
      assert.equal(res.status, 404, path + " must not expose unlicensed font binaries");
    }
  } finally {
    child.kill("SIGTERM");
    if (child.exitCode === null) await once(child, "exit");
  }
});
