import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CasualWizard } from "@/components/cotizar/CasualWizard";

export default function CotizarCasualPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <header className="border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <span className="text-[11px] font-black tracking-[0.2em] text-slate-900 dark:text-white">
            INVENTOV <span className="text-orange-500">·</span> <span className="text-slate-500 dark:text-zinc-400 font-semibold">Casual</span>
          </span>
          <span className="text-xs text-slate-500 dark:text-zinc-400">Paso a paso • 2 min</span>
        </div>
      </header>
      <main className="px-6 py-8 bg-transparent">
        <div className="mx-auto max-w-3xl text-center mb-8 space-y-2">
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900 dark:text-white">Imprime tu idea o regalo</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Amigable, visual, sin jerga. Solo link, color y listo.</p>
        </div>
        <CasualWizard />
      </main>
    </div>
  );
}
