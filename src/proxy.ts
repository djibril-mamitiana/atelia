import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { canAccessAdmin } from "@/lib/auth/roles";

// Route protection. Runs before rendering — keeps CUSTOMER accounts out of
// /admin entirely and gates /compte behind a session, without trusting
// anything the browser claims about its own role.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isAccountRoute = pathname.startsWith("/compte");
  if (!isAdminRoute && !isAccountRoute) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const secret = process.env.NEXTAUTH_SECRET;

  const redirectToLogin = () => {
    const url = new URL("/connexion", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  };

  if (!token || !secret) return redirectToLogin();

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const role = payload.role as string | undefined;

    if (isAdminRoute && !canAccessAdmin(role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  } catch {
    return redirectToLogin();
  }
}

export const config = {
  matcher: ["/admin/:path*", "/compte/:path*"],
};
