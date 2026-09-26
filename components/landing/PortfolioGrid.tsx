import Link from "next/link";
import { ChevronRight, Tag, Sparkles, ExternalLink } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";

type PortfolioRow = {
  id: string;
  titulo: string;
  descripcion: string;
  imagen_url: string;
  galeria?: string[] | null;
  categoria: "regalo" | "prototipo";
  created_at: string;
};

// Fetch en Server Component — lógica movida desde el antiguo Hero (imágenes destacadas)
async function fetchCatalogo(): Promise<{ items: PortfolioRow[]; error: string | null }> {
  try {
    const supabase = createSupabaseClient();
    if (!supabase) return { items: [], error: "Supabase no configurado" };
    const { data, error: qError } = await supabase
      .from("portfolio")
      .select("*")
      .order("es_destacado", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20);
    if (qError) throw qError;
    return { items: (data ?? []) as PortfolioRow[], error: null };
  } catch (e) {
    return { items: [], error: e instanceof Error ? e.message : "Error cargando catálogo" };
  }
}

export async function PortfolioGrid() {
  const { items, error } = await fetchCatalogo();

  if (items.length === 0) {
    return (
      <section id="portfolio" className="mx-auto max-w-7xl px-6 py-16 bg-white dark:bg-neutral-950">
        <div className="space-y-4 mb-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 dark:text-orange-400 text-sm font-medium">
            <Sparkles className="h-3 w-3" /> Catálogo de Inspiración
          </span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-neutral-900 dark:text-white">Modelos listos para cotizar</h2>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-xl text-sm leading-relaxed">Selecciona un modelo y solicita tu cotización al instante.</p>
        </div>
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center space-y-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center dark:bg-neutral-900 dark:border-neutral-800">
            <Sparkles className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-neutral-900 dark:text-white">Catálogo en preparación</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-500 max-w-md mx-auto">
              Estamos curando una selección de modelos listos para imprimir. Vuelve pronto para ver la galería completa.
            </p>
          </div>
          {error && <p className="text-xs font-mono text-amber-600/70 dark:text-amber-500/70">({error})</p>}
        </div>
      </section>
    );
  }

  return (
    <section id="portfolio" className="mx-auto max-w-7xl px-6 py-16 bg-white dark:bg-neutral-950">
      <div className="space-y-4 mb-10">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 dark:text-orange-400 text-sm font-medium">
          <Sparkles className="h-3 w-3" /> Catálogo de Inspiración
          <span className="ml-2 text-[11px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            {items.length} modelos
          </span>
        </span>
        <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-neutral-900 dark:text-white">Modelos listos para cotizar</h2>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-xl text-sm leading-relaxed">Selecciona un modelo y solicita tu cotización al instante.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map((proyecto) => (
          <article
            key={proyecto.id}
            className="group relative rounded-2xl overflow-hidden border border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:shadow-orange-500/5 transition-all duration-300 hover:-translate-y-1 dark:border-neutral-900 dark:bg-neutral-950 dark:hover:border-neutral-800"
          >
            <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proyecto.imagen_url}
                alt={proyecto.titulo}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-3 left-3">
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                  proyecto.categoria === "regalo"
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30"
                }`}>
                  {proyecto.categoria === "regalo" ? "Regalo" : "Prototipo"}
                </span>
              </div>
              {proyecto.galeria && proyecto.galeria.length > 1 && (
                <span className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                  {proyecto.galeria.length} vistas
                </span>
              )}
            </div>
            <div className="p-4 space-y-3">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-200 leading-tight line-clamp-1 group-hover:text-orange-500 transition-colors text-sm">
                {proyecto.titulo}
              </h3>
              <div className="h-px bg-neutral-200 dark:bg-neutral-900" />
              <Link
                href={`/cotizar/${proyecto.categoria === "regalo" ? "casual" : "profesional"}?modelo=${encodeURIComponent(proyecto.titulo)}`}
                className="group w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-orange-500/30 text-orange-600 dark:text-orange-400 text-sm font-medium hover:bg-orange-500 hover:text-white hover:border-orange-500 hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] transition-all duration-300"
              >
                <Tag className="h-4 w-4" />
                Cotizar este modelo
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-neutral-200 text-neutral-600 hover:text-orange-600 font-medium hover:border-orange-500 hover:bg-neutral-50 transition-all duration-300 dark:border-neutral-800 dark:text-neutral-400 dark:hover:text-orange-400 dark:hover:bg-neutral-900/50"
        >
          Ver todo el catálogo
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
