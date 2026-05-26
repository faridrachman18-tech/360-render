import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/projects", "/viewer"];
const authRoutes = ["/login"];

function getSupabaseAuthConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be configured.");
  }

  return { supabaseUrl, supabasePublishableKey };
}

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function copyResponseState(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  from.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "set-cookie") {
      to.headers.set(key, value);
    }
  });

  return to;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { supabaseUrl, supabasePublishableKey } = getSupabaseAuthConfig();

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => supabaseResponse.headers.set(key, value));
      }
    }
  });

  const { data } = await supabase.auth.getClaims();

  const pathname = request.nextUrl.pathname;
  const isAuthenticated = Boolean(data?.claims.sub);
  const isProtectedRoute = matchesRoute(pathname, protectedRoutes);
  const isAuthRoute = matchesRoute(pathname, authRoutes);

  if (!isAuthenticated && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);

    return copyResponseState(supabaseResponse, NextResponse.redirect(redirectUrl));
  }

  if (isAuthenticated && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/projects";
    redirectUrl.search = "";

    return copyResponseState(supabaseResponse, NextResponse.redirect(redirectUrl));
  }

  return supabaseResponse;
}
