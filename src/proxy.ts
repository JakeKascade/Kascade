import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  PROPOSAL_HEADER,
  accessCode,
  accessToken,
  sameToken,
} from "@/lib/access";

// Without a valid access cookie, every page shows the access-code screen
// instead, so the proposal itself is never sent. The screen is told which
// proposal was asked for, so only that link shows the partner; the bare
// address names no one.
export async function proxy(request: NextRequest) {
  const code = accessCode();
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (code && token && sameToken(token, await accessToken(code)))
    return NextResponse.next();
  const headers = new Headers(request.headers);
  headers.delete(PROPOSAL_HEADER);
  if (/^\/real-coder(\/|$)/.test(request.nextUrl.pathname)) headers.set(PROPOSAL_HEADER, "real-coder");
  return NextResponse.rewrite(new URL("/access", request.url), { request: { headers } });
}

export const config = {
  matcher: [
    "/((?!access|api/access|_next/static|_next/image|brand/|favicon.ico|icon.svg|robots.txt).*)",
  ],
};
