import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { randomBytes } from "node:crypto";

async function withServer(
  password: string | null,
  run: (base: string) => Promise<void>,
) {
  const port = password ? 3102 : 3101;
  const environment: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: "production",
    NEXT_TELEMETRY_DISABLED: "1",
  };
  delete environment.ELITA_ACCESS_PASSWORD;
  delete environment.ELITA_ACCESS_USER;
  if (password)
    Object.assign(environment, {
      ELITA_ACCESS_USER: "test-user",
      ELITA_ACCESS_PASSWORD: password,
    });
  const child = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      cwd: process.cwd(),
      env: environment,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let logs = "";
  child.stdout.on("data", (b) => {
    logs += b.toString();
  });
  child.stderr.on("data", (b) => {
    logs += b.toString();
  });
  const base = `http://127.0.0.1:${port}`;
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      if (child.exitCode !== null)
        throw new Error(`Production server exited: ${logs}`);
      try {
        await fetch(base);
        ready = true;
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    assert.ok(ready, "Production server must become reachable");
    await run(base);
  } finally {
    child.kill("SIGTERM");
    if (child.exitCode === null) await once(child, "exit");
  }
}
test("production fails closed without access configuration, including all brand assets", async () => {
  await withServer(null, async (base) => {
    for (const path of [
      "/",
      "/brand/elita-logo.png",
      "/brand/Unica77LLTT-Regular.ttf",
      "/_next/static/probe.js",
      "/does-not-exist",
    ]) {
      const res = await fetch(base + path);
      assert.equal(res.status, 503, path);
      assert.match(res.headers.get("cache-control") || "", /no-store/);
      assert.doesNotMatch(await res.text(), /100,000|Jake|partnership\./);
    }
  });
});
test("production requires authentication for HTML, RSC, scripts, image routes and fonts", async () => {
  const password = randomBytes(24).toString("base64url");
  await withServer(password, async (base) => {
    const auth = `Basic ${Buffer.from(`test-user:${password}`).toString("base64")}`;
    const deniedPaths = [
      "/",
      "/?__rsc=test",
      "/brand/elita-logo.png",
      "/brand/Unica77LLTT-Regular.ttf",
      "/_next/static/probe.js",
      "/_next/image?url=%2Fbrand%2Felita-logo.png&w=256&q=75",
    ];
    for (const path of deniedPaths) {
      const res = await fetch(base + path);
      assert.equal(res.status, 401, path);
      assert.match(res.headers.get("www-authenticate") || "", /Basic/);
      assert.match(res.headers.get("cache-control") || "", /no-store/);
    }
    const spoofed = await fetch(base, {
      headers: {
        "x-middleware-subrequest": "proxy:proxy:proxy:proxy:proxy",
        "x-nextjs-data": "1",
      },
    });
    assert.equal(spoofed.status, 401);
    const bad = await fetch(base, {
      headers: { Authorization: "Basic wrong" },
    });
    assert.equal(bad.status, 401);
    const html = await fetch(base, { headers: { Authorization: auth } });
    assert.equal(html.status, 200);
    assert.match(html.headers.get("cache-control") || "", /private/);
    assert.match(html.headers.get("x-robots-tag") || "", /noindex/);
    assert.equal(html.headers.get("x-frame-options"), "DENY");
    const text = await html.text();
    assert.match(text, /A potential/);
    assert.ok(
      !text.includes(password),
      "credentials must never be in the client document",
    );
    const asset = text.match(/src="([^" ]+\.js[^" ]*)"/);
    assert.ok(asset, "the protected production app must include a script");
    const scriptPath = asset[1].replaceAll("&amp;", "&");
    assert.equal((await fetch(base + scriptPath)).status, 401);
    assert.equal(
      (await fetch(base + scriptPath, { headers: { Authorization: auth } }))
        .status,
      200,
    );
    const font = await fetch(base + "/brand/Unica77LLTT-Regular.ttf", {
      headers: { Authorization: auth },
    });
    assert.equal(font.status, 200);
  });
});
