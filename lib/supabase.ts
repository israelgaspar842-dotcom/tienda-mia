import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase para Next.js (server/client).
 * Usa anon key para INSERT público en `pro-vault` (RLS: INSERT public, SELECT solo autenticados).
 * En server con SERVICE_ROLE hace bypass de RLS para admin.
 */
function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

export function getSupabaseUrl(): string | undefined {
  return getEnv("NEXT_PUBLIC_SUPABASE_URL") || getEnv("SUPABASE_URL");
}

export function getSupabaseAnonKey(): string | undefined {
  return getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") || getEnv("SUPABASE_ANON_KEY");
}

export function getSupabaseServiceKey(): string | undefined {
  return getEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && (getSupabaseAnonKey() || getSupabaseServiceKey()));
}

/**
 * Crea cliente Supabase. En Route Handlers usa service_role si está disponible (bypass RLS),
 * si no usa anon (respeta RLS: pro-vault permite INSERT público).
 */
export function createSupabaseClient(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceKey();
  const anonKey = getSupabaseAnonKey();
  const key = serviceKey || anonKey;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Cliente específico para browser (usa anon key, nunca service_role).
 */
export function createSupabaseBrowserClient(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) return null;
  return createClient(url, anonKey);
}
