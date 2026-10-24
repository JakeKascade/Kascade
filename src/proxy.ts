import { NextRequest, NextResponse } from "next/server";
import { authorised } from "./lib/access";

// Gate every request, including bundled scripts and licensed brand assets.
export function proxy(request: NextRequest) {
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(
    request.nextUrl.hostname,
  );
  const localDevelopment =
    process.env.NODE_ENV === "development" && loopback && !process.env.VERCEL;
  const password = process.env.ELITA_ACCESS_PASSWORD;
  if (!password && localDevelopment) return NextResponse.next();
  if (!password)
    return new NextResponse(
      "Private presentation. Access has not been configured.",
      {
        status: 503,
        headers: {
          "Cache-Control": "private, no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      },
    );
  if (
    !authorised(
      request.headers.get("authorization"),
      process.env.ELITA_ACCESS_USER || "elita",
      password,
    )
  ) {
    return new NextResponse("Private & confidential. Authorised access only.", {
      status: 401,
      headers: {
        "WWW-Authenticate":
          'Basic realm="ELITA Private Presentation", charset="UTF-8"',
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: "/:path*" };
