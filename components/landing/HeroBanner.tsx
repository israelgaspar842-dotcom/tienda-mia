import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Cpu, Shield } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";
import DepthCarousel from "@/components/DepthCarousel";

type Destacado = {
  id: string;
  titulo: string;
  imagen_url: string | null;
};

async function fetchDestacados(): Promise<Destacado[]> {
  try {
    const supabase = createSupabaseClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("portfolio")
      .select("id, titulo, imagen_url")
      .eq("es_destacado", true)
      .order("created_at", { ascending: false })
      .limit(8);
    if (error) throw error;
    return (data ?? []) as Destacado[];
  } catch {
    return [];
  }
}

export async function HeroBanner() {
  const destacados = await fetchDestacados();

  return (
    <section className="relative overflow-hidden bg-white dark:bg-neutral-950 w-full">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100 via-white to-white dark:from-neutral-900/50 dark:via-neutral-950 dark:to-neutral-950" />
        <div className="absolute top-1/4 left-1/3 h-[500px] w-[500px] rounded-full bg-orange-500/8 blur-[160px]" />
        <div className="absolute bottom-1/3 right-1/4 h-[400px] w-[400px] rounded-full bg-orange-500/5 blur-[130px]" />
      </div>

      <section className="relative w-full pt-20 pb-12 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div className="flex flex-col gap-6 order-2 md:order-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 dark:text-orange-400 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Nuevo: Catálogo de modelos listos para cotizar
          </div>

          <h1 className="text-5xl font-extrabold text-neutral-900 dark:text-white leading-tight">
            Manufactura 3D y{" "}
            <span className="text-orange-500 text-6xl block mt-2">Mecatrónica</span>
          </h1>

          <p className="text-neutral-600 dark:text-gray-400 text-lg leading-relaxed max-w-md">
            Desde prototipos funcionales hasta series cortas. Impresión FDM profesional, corte y grabado láser, y asesoría técnica para tus proyectos de ingeniería.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link
              href="/cotizar/casual"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-orange-500 text-white font-semibold text-lg hover:bg-orange-600 hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-all duration-300"
            >
              Cotizar Proyecto
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/#portfolio"
              className="px-6 py-3 rounded-lg font-medium transition-colors border border-neutral-300 bg-transparent text-neutral-900 hover:bg-neutral-100 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800"
            >
              Explorar Catálogo
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-6 md:gap-8 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 bg-white border border-neutral-200 shadow-sm rounded-xl p-4 dark:bg-neutral-900 dark:border-neutral-800">
              <div className="h-10 w-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center dark:bg-neutral-900 dark:border-neutral-800">
                <Cpu className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="font-semibold text-neutral-900 dark:text-white">Tolerancia ±0.2mm</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-500">Calibración diaria</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white border border-neutral-200 shadow-sm rounded-xl p-4 dark:bg-neutral-900 dark:border-neutral-800">
              <div className="h-10 w-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center dark:bg-neutral-900 dark:border-neutral-800">
                <Shield className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="font-semibold text-neutral-900 dark:text-white">Garantía de calidad</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-500">Reimpresión sin costo</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white border border-neutral-200 shadow-sm rounded-xl p-4 dark:bg-neutral-900 dark:border-neutral-800">
              <div className="h-10 w-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center dark:bg-neutral-900 dark:border-neutral-800">
                <Sparkles className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="font-semibold text-neutral-900 dark:text-white">Entrega 48-72h</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-500">Envío a todo Bolivia</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative w-full min-h-[300px] md:min-h-[500px] order-1 md:order-2 overflow-hidden bg-white bg-transparent shadow-xl border border-neutral-200 rounded-2xl">
          {/* Renderiza el carrusel solo si hay proyectos destacados */}
          {destacados && destacados.length > 0 ? (
            <div style={{ height: "500px", position: "relative" }} className="w-full">
              <DepthCarousel
                items={destacados
                  .filter((item) => item.imagen_url)
                  .map((item) => ({ image: item.imagen_url as string, alt: item.titulo }))}
              />
            </div>
          ) : (
            <>
              <Image
                src="/demo.png"
                alt="Render 3D"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="w-full h-full object-cover absolute inset-0"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />
              <div className="absolute bottom-6 left-6 px-4 py-2 rounded-xl bg-neutral-900/90 backdrop-blur border border-neutral-800">
                <p className="text-orange-400 text-xs font-bold uppercase tracking-wider">Render 3D</p>
                <p className="text-white text-sm font-semibold line-clamp-1">Brazo Robótico</p>
              </div>
            </>
          )}
        </div>
      </section>
    </section>
  );
}
