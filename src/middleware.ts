import { NextResponse, type NextRequest } from "next/server";

// Fast, optimistic check at the edge: no cookie → straight to /login.
// The real check (session exists in Redis) happens in the page via getCurrentUser().
export function middleware(req: NextRequest) {
  if (!req.cookies.has("sid")) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
