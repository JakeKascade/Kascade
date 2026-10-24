import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  accessCode,
  accessToken,
  sameToken,
} from "@/lib/access";

// After five wrong codes from one address in ten minutes, every attempt from
// it is refused until the window passes. Held in memory, so it's a brake on
// scripted guessing rather than a guarantee. The address comes from the
// hosting proxy; direct local requests carry none and aren't limited.
const LIMIT = 5;
const WINDOW = 10 * 60 * 1000;
const failures = new Map<string, { count: number; since: number }>();

function attempts(address: string, now: number) {
  for (const [key, entry] of failures)
    if (now - entry.since > WINDOW) failures.delete(key);
  return failures.get(address);
}

export async function POST(request: Request) {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0].trim();
  const now = Date.now();
  const record = address ? attempts(address, now) : undefined;
  if (record && record.count >= LIMIT)
    return NextResponse.json({ ok: false, locked: true }, { status: 429 });

  const body = (await request.json().catch(() => null)) as {
    code?: unknown;
  } | null;
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const expected = await accessToken(accessCode());
  const given = await accessToken(code);
  if (!sameToken(given, expected)) {
    if (address)
      failures.set(address, {
        count: (record?.count ?? 0) + 1,
        since: record?.since ?? now,
      });
    // A short pause makes guessing the code slow.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (address) failures.delete(address);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  });
  return response;
}
