import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const publicRoutes = ["/login", "/register", "/onboarding", "/auth/callback"];

const protectedRoutes = [
  "/dashboard",
  "/customers",
  "/products",
  "/inventory",
  "/quotes",
  "/subscriptions",
  "/sales",
  "/purchases",
  "/settings",
];

function matchesRoute(pathname: string, routes: readonly string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const intlResponse = intlMiddleware(request);

  const locale = pathname.split("/")[1] || routing.defaultLocale;

  const pathnameWithoutLocale = pathname.replace(/^\/(en|es)/, "") || "/";

  const isPublic = matchesRoute(pathnameWithoutLocale, publicRoutes);
  const isProtected = matchesRoute(pathnameWithoutLocale, protectedRoutes);

  if (!isPublic && !isProtected) return intlResponse;

  const { supabaseResponse, user } = await createClient(request);

  supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
    intlResponse.cookies.set(name, value);
  });

  if (isProtected && !user) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
