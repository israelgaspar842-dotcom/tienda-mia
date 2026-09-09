import Link from "next/link";
import { ArrowRight, Gift, Cog } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaBanner() {
  return (
    <section id="cotizar" className="mx-auto max-w-7xl px-6 py-16 bg-transparent dark:bg-zinc-950">
      <div className="relative overflow-hidden rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-8 md:p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-orange-600/5" />
        <div className="relative space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900 dark:text-white">¿Listo para materializar?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Elige tu flujo. Cotización en menos de 2h.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <Link href="/cotizar/casual">
              <Button size="lg" className="w-full justify-between gap-2 rounded-2xl">
                <span className="flex items-center gap-2">
                  <Gift className="h-4 w-4" /> Imprimir idea o regalo
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/cotizar/profesional">
              <Button
                size="lg"
                variant="secondary"
                className="w-full justify-between gap-2 rounded-2xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <span className="flex items-center gap-2">
                  <Cog className="h-4 w-4" /> Prototipado e Ingeniería
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
