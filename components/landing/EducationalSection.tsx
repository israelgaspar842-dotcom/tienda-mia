import { Gift, Wrench, Cpu } from "lucide-react";

const items = [
  {
    icon: Gift,
    title: "Regalos personalizados",
    desc: "Figuras, llaveros y decoración única. Convierte una idea en un recuerdo tangible.",
    color: "bg-orange-500",
  },
  {
    icon: Wrench,
    title: "Repuestos difíciles",
    desc: "Piezas descatalogadas o rotas. Replica y alarga la vida de tus objetos.",
    color: "bg-slate-800 dark:bg-neutral-800",
  },
  {
    icon: Cpu,
    title: "Prototipos para ingeniería",
    desc: "Valida tu diseño con tolerancias de 0.2mm y NDA incluido.",
    color: "bg-emerald-600",
  },
];

export function EducationalSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 bg-transparent dark:bg-zinc-950">
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">¿Qué puedes hacer con Impresión 3D?</h2>
        <p className="text-sm text-slate-600 dark:text-neutral-400">Tres usos claros, sin tecnicismos. Elige tu caso y cotiza en 2 minutos.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((it) => (
          <div key={it.title} className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 text-center space-y-4 hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-1 transition-all">
            <div className={`mx-auto h-12 w-12 rounded-2xl ${it.color} flex items-center justify-center`}>
              <it.icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">{it.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{it.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
