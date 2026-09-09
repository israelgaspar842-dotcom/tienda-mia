import { UploadCloud, Palette, Truck, Cpu, ShieldCheck, Zap } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: UploadCloud,
    title: "Envía tu archivo",
    desc: "Pega link de MakerWorld / Thingiverse o sube tu .STL / .3MF. Sin registro.",
  },
  {
    n: "02",
    icon: Palette,
    title: "Elige material",
    desc: "PLA, PETG, TPU. Vista previa del color y costo por gramo transparente.",
  },
  {
    n: "03",
    icon: Truck,
    title: "Recibe en casa",
    desc: "Cotización en <2h. Imprimimos en 48h y enviamos con seguimiento.",
  },
];

export function Features() {
  return (
    <section id="proceso" className="border-y border-slate-200 dark:border-slate-800 bg-transparent/50 dark:bg-zinc-950/50">
      <div className="mx-auto max-w-7xl px-6 py-16 space-y-12">
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-2xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
                  <s.icon className="h-5 w-5 text-orange-500" />
                </div>
                <span className="text-xs font-black tracking-widest text-slate-400 dark:text-slate-500">{s.n}</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">{s.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex gap-3">
            <Cpu className="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Tolerancia 0.2mm</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Calibración diaria, boquilla 0.4mm, altura 0.12-0.28mm.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Calidad garantizada</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Si no queda perfecto, reimprimimos sin costo.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Zap className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Cotización express</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Respuesta humana, no bot. Precio final sin sorpresas.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
