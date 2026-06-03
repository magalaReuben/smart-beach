import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeToken } from "./lib/utils";
import { Role } from "./constants/type";

const managePaths = ["/manage"];
const guestPaths = ["/guest"];
const privatePaths = [...managePaths, ...guestPaths];
const unAuthPaths = ["/login"];

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  if (privatePaths.some((path) => pathname.startsWith(path) && !refreshToken)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("clearTokens", "true");
    return NextResponse.redirect(url);
  }

  //truong hop da dang nhap
  if (refreshToken) {
    const role = decodeToken(refreshToken)?.role;
    //1. If a logged-in user lands on /login, send them to their dashboard instead of root
    if (unAuthPaths.some((path) => pathname.startsWith(path))) {
      const dashboardPath = role === Role.Guest ? "/guest" : "/manage";
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }

    //2. accessToken expired or missing for private routes
    if (
      privatePaths.some((path) => pathname.startsWith(path) && !accessToken)
    ) {
      const url = new URL("/refresh-token", request.url);
      url.searchParams.set("refreshToken", refreshToken as string);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    //3. invalid role access should redirect to the root dashboard
    if (
      (role === Role.Guest &&
        managePaths.some((path) => pathname.startsWith(path))) ||
      (role !== Role.Guest &&
        guestPaths.some((path) => pathname.startsWith(path)))
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/login", "/manage/:path*", "/guest/:path*"],
};
