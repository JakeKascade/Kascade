import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  accessCode,
  accessToken,
  sameToken,
} from "@/lib/access";

// Without a valid access cookie, every page shows the access-code screen
// instead, so the proposal itself is never sent.
export async function proxy(request: NextRequest) {
  const code = accessCode();
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (code && token && sameToken(token, await accessToken(code)))
    return NextResponse.next();
  return NextResponse.rewrite(new URL("/access", request.url));
}

export const config = {
  matcher: [
    "/((?!access|api/access|_next/static|_next/image|brand/|favicon.ico|icon.svg|robots.txt).*)",
  ],
};
