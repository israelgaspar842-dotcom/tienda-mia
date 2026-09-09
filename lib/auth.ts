import { createHmac, timingSafeEqual } from "crypto";

function getEnv(name: string, fallback: string): string {
  const v = process.env[name];
  return (v && v.trim() ? v.trim() : fallback);
}

const ADMIN_USERNAME = getEnv("ADMIN_USERNAME", "admin");
const ADMIN_PASSWORD = getEnv("ADMIN_PASSWORD", "admin123");
const AUTH_SECRET = getEnv("AUTH_SECRET", "dev-secret-change-in-production");

if (process.env.NODE_ENV === "production" && AUTH_SECRET === "dev-secret-change-in-production") {
  console.warn("[auth] ADVERTENCIA: AUTH_SECRET usa valor por defecto inseguro. Define uno en producción.");
}

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 horas

function sign(value: string): string {
  return createHmac("sha256", AUTH_SECRET).update(value).digest("hex");
}

export function createSessionValue(): string {
  // valor = HMAC(username + ":" + password)
  return sign(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`);
}

export function verifySession(value: string | undefined): boolean {
  if (!value) return false;
  const expected = createSessionValue();
  const a = Buffer.from(value, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function verifyCredentials(username: string, password: string): boolean {
  return username.trim() === ADMIN_USERNAME && password.trim() === ADMIN_PASSWORD;
}

export function isAuthenticatedFromCookie(cookieValue: string | undefined): boolean {
  return verifySession(cookieValue);
}

export async function requireAuth(): Promise<boolean> {
  // Usado en Route Handlers / Server Components: lee cookies del request actual
  const { cookies } = await import("next/headers");
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}
