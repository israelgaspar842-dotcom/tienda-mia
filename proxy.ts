import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * CAPA 1 — Proxy/Middleware de Seguridad INVENTOV (Next 16: proxy.ts)
 * Usa @supabase/ssr para interceptar /admin/*.
 * Si no hay sesión Supabase activa -> redirect a /login
 * Fallback a HMAC legacy (admin_session) si Supabase no configurado (dev).
 */

const SESSION_COOKIE = "admin_session";

async function sign(value: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyLegacySession(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const user = (process.env.ADMIN_USERNAME || "admin").trim();
  const pass = (process.env.ADMIN_PASSWORD || "admin123").trim();
  const secret = (process.env.AUTH_SECRET || "dev-secret-change-in-production").trim();
  const expected = await sign(`${user}:${pass}`, secret);
  const a = new TextEncoder().encode(value);
  const b = new TextEncoder().encode(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/login" || pathname === "/admin/login";

  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // --- Fallback legacy si Supabase no configurado (dev local sin env) ---
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isAdminRoute && !isLoginRoute) {
      const ok = await verifyLegacySession(request.cookies.get(SESSION_COOKIE)?.value);
      if (!ok) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
    return supabaseResponse;
  }

  // --- Supabase SSR ---
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // /admin/* sin sesión -> /login
  if (isAdminRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // /login con sesión -> /admin
  if (pathname === "/login" && user) {
    const next = request.nextUrl.searchParams.get("next") || "/admin";
    return NextResponse.redirect(new URL(next, request.url));
  }

  // Compat: /admin/login legacy
  if (pathname === "/admin/login" && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.searchParams.get("from") || "/admin");
    return NextResponse.redirect(loginUrl);
  }
  if (pathname === "/admin/login" && user) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
