import { NextResponse } from "next/server";

export function middleware(request: { cookies: { get: (arg0: string) => { (): any; new(): any; value: any; }; }; nextUrl: { pathname: string; }; url: string | URL | undefined; }) {
  const token = request.cookies.get("token")?.value;

  if (request.nextUrl.pathname.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (request.nextUrl.pathname.startsWith("/profile") && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*"],
};