import Link from "next/link";
import Image from "next/image";
import { Gift, Cog, ShieldCheck, Clock3, Layers, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

async function HeroImage() {
  let url: string | null = null;
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.from("portfolio").select("imagen_url").order("created_at", { ascending: false }).limit(1).single();
    url = (data as { imagen_url?: string } | null)?.imagen_url ?? null;
  } catch {}
  if (url) {
    return <Image src={url} alt="Proyecto destacado INVENTOV" fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 40vw" />;
  }
  // Fallback placeholder solo si no hay imagen en Supabase
  return (
    <div className="absolute inset-0 bg-slate-100 dark:bg-neutral-800 flex flex-col items-center justify-center gap-4">
      <div className="h-20 w-20 rounded-2xl bg-slate-200 dark:bg-neutral-700/50 border border-slate-300 dark:border-neutral-700 flex items-center justify-center">
        <ImageIcon className="h-9 w-9 text-slate-400 dark:text-neutral-500" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-xs font-bold tracking-widest uppercase text-slate-500 dark:text-neutral-500">Macro textura 3D</p>
        <p className="text-[11px] text-slate-400 dark:text-neutral-600">Placeholder — foto capas 0.2mm</p>
      </div>
      <div className="absolute inset-x-6 bottom-6 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-neutral-700 to-transparent opacity-60" />
      <div className="absolute inset-x-6 bottom-10 h-px bg-gradient-to-r from-transparent via-slate-300/60 dark:via-neutral-700/60 to-transparent opacity-40" />
    </div>
  );
}

export async function Hero() {
  return (
    <section className="relative overflow-hidden bg-transparent dark:bg-zinc-950">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-32 -right-32 h-[600px] w-[600px] rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute top-40 -left-32 h-[500px] w-[500px] rounded-full bg-orange-500/5 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10 md:py-16">
        <div className="grid lg:grid-cols-[1.45fr_1fr] gap-8 lg:gap-10 items-center">
          <div className="order-1 lg:order-2 relative">
            <div className="relative">
              <div className="absolute inset-0 rounded-[28px] bg-orange-500/20 blur-2xl translate-y-3 translate-x-1" />
              <div className="relative rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden aspect-[4/3] lg:aspect-[4/3.2]">
                <HeroImage />
                <div className="absolute inset-0 rounded-[28px] border border-white/[0.04] pointer-events-none" />
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] text-slate-500 dark:text-neutral-500 font-medium">Capas 0.2mm • Relleno 20% • PLA naranja INVENTOV</p>
          </div>

          <div className="order-2 lg:order-1 space-y-6">
            <Badge variant="secondary" className="gap-2 py-1.5 px-3 rounded-full bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300">
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              Taller local • Entrega 48-72h
            </Badge>

            <h1 className="text-4xl md:text-[3.25rem] font-black tracking-tighter leading-[0.9] text-slate-900 dark:text-white">
              Materializar ideas
              <br />
              <span className="text-orange-500">con precisión.</span>
            </h1>

            <p className="text-slate-600 dark:text-neutral-400 text-base md:text-lg max-w-xl leading-relaxed">Elige tu camino. Mismo taller, misma calidad — flujo adaptado a tu perfil.</p>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <Link
                href="/cotizar/casual"
                className="group relative flex flex-col justify-between p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 dark:bg-zinc-900/50 dark:border-zinc-800 dark:shadow-none dark:hover:border-neutral-700"
              >
                <span className="absolute top-3 right-3 text-[10px] font-black tracking-widest uppercase bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20 px-2 py-1 rounded-full">Ideal regalos</span>
                <div className="h-11 w-11 rounded-2xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20">
                  <Gift className="h-5 w-5 text-white" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-[15px] font-black tracking-tight text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors">Imprimir una idea o regalo</h3>
                  <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">Figuras y decoración. Pega tu link y elige color. Sin jerga.</p>
                </div>
                <span className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  Cotizar mi regalo
                  <span className="h-6 w-6 rounded-full bg-slate-200 dark:bg-neutral-700 text-slate-700 dark:text-neutral-200 flex items-center justify-center text-[11px] group-hover:bg-orange-500 group-hover:text-white transition-colors">→</span>
                </span>
              </Link>

              <Link
                href="/cotizar/profesional"
                className="group relative flex flex-col justify-between p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 dark:bg-zinc-900/50 dark:border-zinc-800 dark:shadow-none dark:hover:border-neutral-700"
              >
                <span className="absolute top-3 right-3 text-[10px] font-black tracking-widest uppercase bg-slate-200 dark:bg-neutral-700 text-slate-700 dark:text-neutral-300 border border-slate-300 dark:border-neutral-600 px-2 py-1 rounded-full">NDA incluido</span>
                <div className="h-11 w-11 rounded-2xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 flex items-center justify-center">
                  <Cog className="h-5 w-5 text-slate-700 dark:text-neutral-300" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-[15px] font-black tracking-tight text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors">Prototipado e Ingeniería</h3>
                  <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">Piezas funcionales, tolerancias y confidencialidad.</p>
                </div>
                <span className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  Cotizar prototipo
                  <span className="h-6 w-6 rounded-full bg-slate-200 dark:bg-neutral-700 border border-slate-300 dark:border-neutral-600 text-slate-700 dark:text-neutral-200 flex items-center justify-center text-[11px] group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-colors">→</span>
                </span>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 pt-2 text-xs">
              <span className="flex items-center gap-2 text-slate-600 dark:text-neutral-500">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Garantía reimpresión
              </span>
              <span className="hidden sm:block h-3 w-px bg-slate-200 dark:bg-neutral-800" />
              <span className="flex items-center gap-2 text-slate-600 dark:text-neutral-500">
                <Clock3 className="h-4 w-4 text-orange-500" /> Cotización &lt; 2h
              </span>
              <span className="hidden sm:block h-3 w-px bg-slate-200 dark:bg-neutral-800" />
              <span className="flex items-center gap-2 text-slate-600 dark:text-neutral-500">
                <Layers className="h-4 w-4 text-slate-400 dark:text-neutral-500" /> Brillante / Mate / Resistente
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-y border-slate-200 dark:border-neutral-800 bg-slate-100/50 dark:bg-neutral-900/50">
        <div className="mx-auto max-w-7xl px-6 py-3 flex flex-wrap gap-6 items-center justify-between text-xs text-slate-500 dark:text-neutral-500">
          <span className="font-semibold tracking-widest uppercase">Compatible con</span>
          <div className="flex gap-6 font-bold tracking-wide">
            <span>MakerWorld</span>
            <span className="text-slate-300 dark:text-neutral-700">•</span>
            <span>Thingiverse</span>
            <span className="text-slate-300 dark:text-neutral-700">•</span>
            <span>Printables</span>
            <span className="text-slate-300 dark:text-neutral-700">•</span>
            <span>Cults3D</span>
          </div>
          <span className="text-slate-400 dark:text-neutral-600">+1.200 piezas entregadas</span>
        </div>
      </div>
    </section>
  );
}
