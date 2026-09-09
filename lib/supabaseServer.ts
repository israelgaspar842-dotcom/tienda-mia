import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server client para Server Components / Route Handlers / Server Actions
 * Lee y setea cookies correctamente en App Router.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component sin permiso de set — ignorar si se llama desde fetch
        }
      },
    },
  });
}
