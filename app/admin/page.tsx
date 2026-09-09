import { createServerSupabaseClient } from "@/lib/supabaseServer";
import type { Solicitud } from "@/components/admin/KanbanBoard";
import PortfolioTabs from "@/components/admin/PortfolioTabs";

export const dynamic = "force-dynamic";

type PortfolioRow = {
  id: string;
  titulo: string;
  descripcion: string;
  imagen_url: string;
  categoria: "regalo" | "prototipo";
  created_at: string;
};

/**
 * FETCH DE DATOS SEGURO — Server Component (Supabase-only, sin mongoose)
 * Hace SELECT * FROM solicitudes y portfolio con el cliente de Supabase para servidor (cookies).
 * Única base de datos: Supabase PostgreSQL.
 */
export default async function AdminPage() {
  let solicitudes: Solicitud[] = [];
  let portfolio: PortfolioRow[] = [];
  let errorMsg: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const [solicRes, portRes] = await Promise.all([
      supabase.from("solicitudes").select("*").order("created_at", { ascending: false }),
      supabase.from("portfolio").select("*").order("created_at", { ascending: false }),
    ]);

    if (solicRes.error) throw new Error(solicRes.error.message);

    solicitudes = (solicRes.data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row["id"] ?? ""),
      _id: String(row["id"] ?? ""),
      enlace_archivo: String(row["enlace_archivo"] ?? ""),
      estado: (row["estado"] as Solicitud["estado"]) ?? "Pendiente",
      precio_cotizado: (row["precio_cotizado"] as number | null) ?? null,
      tipo_pedido: (row["tipo_pedido"] as Solicitud["tipo_pedido"]) ?? "casual",
      metadata: (row["metadata"] as Record<string, unknown>) ?? {},
      telefono: (row["telefono"] as string | null) ?? ((row["metadata"] as Record<string, unknown> | undefined)?.["telefono"] as string | null) ?? null,
      nombre: (row["nombre"] as string | null) ?? ((row["metadata"] as Record<string, unknown> | undefined)?.["nombre"] as string | null) ?? ((row["metadata"] as Record<string, unknown> | undefined)?.["empresa"] as string | null) ?? null,
      created_at: (row["created_at"] as string) ?? undefined,
    }));

    if (portRes.error) {
      if (!portRes.error.message.includes("does not exist")) errorMsg = portRes.error.message;
      portfolio = [];
    } else {
      portfolio = (portRes.data ?? []) as PortfolioRow[];
    }
  } catch (e) {
    errorMsg = e instanceof Error ? e.message : String(e);
    solicitudes = [];
    portfolio = [];
  }

  return (
    <div className="min-h-screen bg-[#171717] text-zinc-200">
      <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">
              INVENTOV <span className="text-orange-500">·</span> Admin
            </h1>
            <p className="text-xs font-mono text-zinc-500">
              Panel Supabase · {solicitudes.length} solicitudes · {portfolio.length} proyectos
              <span className="ml-2 text-[11px] text-zinc-600">PostgreSQL</span>
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              const { createServerSupabaseClient } = await import("@/lib/supabaseServer");
              const supabase = await createServerSupabaseClient();
              await supabase.auth.signOut();
            }}
          >
            <button className="text-xs font-mono bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 px-4 py-2 rounded-full">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-8">
        {errorMsg && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3">
            Error Supabase: {errorMsg} — verifica env NEXT_PUBLIC_SUPABASE_URL / ANON_KEY y ejecuta supabase/*.sql
          </div>
        )}
        <PortfolioTabs solicitudes={solicitudes} portfolio={portfolio} />
      </main>
    </div>
  );
}
