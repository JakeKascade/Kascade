import { test } from "node:test";
import assert from "node:assert/strict";
import { authorised } from "../src/lib/access";
const basic = (value: string) =>
  `Basic ${Buffer.from(value).toString("base64")}`;
test("access requires exact server-side credentials and never accepts an empty password", () => {
  assert.equal(
    authorised(basic("elita:test-only-pass"), "elita", "test-only-pass"),
    true,
  );
  assert.equal(
    authorised(basic("elita:wrong"), "elita", "test-only-pass"),
    false,
  );
  assert.equal(
    authorised(basic("other:test-only-pass"), "elita", "test-only-pass"),
    false,
  );
  assert.equal(authorised(null, "elita", "test-only-pass"), false);
  assert.equal(
    authorised("Bearer something", "elita", "test-only-pass"),
    false,
  );
  assert.equal(authorised("Basic !invalid", "elita", "test-only-pass"), false);
  assert.equal(authorised(basic("elita:"), "elita", ""), false);
  assert.equal(
    authorised(basic("elita:pass:with:colons"), "elita", "pass:with:colons"),
    true,
  );
});
