import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { canAccessAdmin } from "@/lib/auth/roles";

// Route protection + i18n. Runs before rendering — keeps CUSTOMER accounts
// out of /admin entirely and gates /compte behind a session, without
// trusting anything the browser claims about its own role. Also resolves
// the storefront locale (/admin stays unlocalized, French-only).
const intlMiddleware = createMiddleware(routing);

const LOCALE_PREFIX = new RegExp(`^/(${routing.locales.join("|")})(?=/|$)`);

function stripLocale(pathname: string): string {
  return pathname.replace(LOCALE_PREFIX, "") || "/";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isAccountRoute = !isAdminRoute && stripLocale(pathname).startsWith("/compte");

  if (isAdminRoute || isAccountRoute) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const secret = process.env.NEXTAUTH_SECRET;

    const redirectToLogin = () => {
      const localeMatch = pathname.match(LOCALE_PREFIX);
      const loginPath = localeMatch ? `${localeMatch[0]}/connexion` : "/connexion";
      const url = new URL(loginPath, request.url);
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
    } catch {
      return redirectToLogin();
    }

    // /admin isn't part of the localized route tree — no i18n middleware to run.
    if (isAdminRoute) return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  // Everything except API routes, Next internals and files with an extension
  // (static assets) — i18n needs to see every storefront path, not just the
  // previously-listed protected ones.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
