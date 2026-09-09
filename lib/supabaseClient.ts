import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client para Client Components (login, kanban download)
 * Usa @supabase/ssr para que el proxy pueda refrescar la sesión.
 */
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
