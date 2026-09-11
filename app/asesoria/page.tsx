import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import {
  Cpu,
  CircuitBoard,
  Box,
  MessageCircle,
  ArrowRight,
  Layers,
  Zap,
  Wrench,
} from "lucide-react";

const especialidades = [
  {
    icon: Cpu,
    title: "Arduino / Microcontroladores",
    desc: "Programación de Arduino, ESP32, Raspberry Pi. Sensores, actuadores y lógica de control para prototipos funcionales.",
  },
  {
    icon: CircuitBoard,
    title: "Diseño Electrónico",
    desc: "Diseño de PCB, selección de componentes, integración de circuitos y resolución de problemas eléctricos.",
  },
  {
    icon: Box,
    title: "Modelado CAD Funcional",
    desc: "Piezas diseñadas para encajar, ensamblar y funcionar. Tolerancias reales, no solo apariencia visual.",
  },
];

const procesos = [
  {
    icon: MessageCircle,
    title: "Cuéntanos tu proyecto",
    desc: "Describe tu idea, el problema que resuelve y en qué etapa te encuentras.",
  },
  {
    icon: Wrench,
    title: "Diagnóstico técnico",
    desc: "Analizamos factibilidad, componentes necesarios y roadmap de desarrollo.",
  },
  {
    icon: Zap,
    title: "Co-desarrollo",
    desc: "Trabajamos contigo paso a paso: desde el código hasta la pieza física.",
  },
];

export const metadata = {
  title: "Asesoría Técnica y Co-Desarrollo — INVENTOV",
  description:
    "Asesoría técnica en robótica, electrónica y diseño CAD. Desde proyectos académicos hasta prototipos funcionales.",
};

export default function AsesoriaPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen flex flex-col">
        {/* Hero */}
        <section className="relative overflow-hidden bg-transparent dark:bg-zinc-950">
          <div className="absolute inset-0 -z-10">
            <div className="absolute -top-32 -right-32 h-[600px] w-[600px] rounded-full bg-orange-500/10 blur-[120px]" />
            <div className="absolute top-40 -left-32 h-[500px] w-[500px] rounded-full bg-orange-500/5 blur-[120px]" />
          </div>

          <div className="mx-auto max-w-4xl px-6 py-20 md:py-28 text-center space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-bold tracking-widest uppercase text-orange-500">
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              Asesoría Técnica
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-black tracking-tighter leading-[0.95] text-slate-900 dark:text-white">
              Asesoría Técnica y{" "}
              <span className="text-orange-500">Co-Desarrollo</span>
            </h1>

            <p className="text-slate-600 dark:text-neutral-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Desde proyectos académicos hasta prototipos funcionales. Te
              ayudamos a integrar electrónica, programación y diseño CAD.
            </p>

            <div className="pt-2">
              <a
                href="https://wa.me/59173854684?text=Hola%20INVENTOV,%20busco%20asesoría%20técnica.%20Mi%20proyecto%20consiste%20en:%20[DESCRIBE_AQUÍ]%20y%20actualmente%20se%20encuentra%20en%20fase%20de:%20[IDEA/DESARROLLO]"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-7 py-3.5 shadow-lg shadow-orange-500/20 transition-all hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5"
              >
                <MessageCircle className="h-4 w-4" />
                Contactar por WhatsApp
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 pt-6 text-xs">
              <span className="flex items-center gap-2 text-slate-600 dark:text-neutral-500">
                <Layers className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                Robótica
              </span>
              <span className="hidden sm:block h-3 w-px bg-slate-200 dark:bg-neutral-800" />
              <span className="flex items-center gap-2 text-slate-600 dark:text-neutral-500">
                <Cpu className="h-4 w-4 text-orange-500" />
                Electrónica
              </span>
              <span className="hidden sm:block h-3 w-px bg-slate-200 dark:bg-neutral-800" />
              <span className="flex items-center gap-2 text-slate-600 dark:text-neutral-500">
                <Box className="h-4 w-4 text-slate-400 dark:text-neutral-500" />
                CAD Funcional
              </span>
            </div>
          </div>
        </section>

        {/* Especialidades */}
        <section className="border-y border-slate-200 dark:border-slate-800 bg-transparent/50 dark:bg-zinc-950/50">
          <div className="mx-auto max-w-5xl px-6 py-16 space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                ¿En qué podemos ayudarte?
              </h2>
              <p className="text-sm text-slate-600 dark:text-neutral-400 max-w-lg mx-auto">
                Tres áreas de especialización para llevar tu proyecto del concepto
                a la realidad.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {especialidades.map((e) => (
                <div
                  key={e.title}
                  className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 space-y-4"
                >
                  <div className="h-11 w-11 rounded-2xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
                    <e.icon className="h-5 w-5 text-orange-500" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {e.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {e.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="bg-transparent dark:bg-zinc-950">
          <div className="mx-auto max-w-5xl px-6 py-16 space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Cómo funciona
              </h2>
              <p className="text-sm text-slate-600 dark:text-neutral-400 max-w-md mx-auto">
                Un proceso simple para que te enfoques en tu proyecto y nosotros
                en la técnica.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {procesos.map((p, i) => (
                <div
                  key={p.title}
                  className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-2xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
                      <p.icon className="h-5 w-5 text-orange-500" />
                    </div>
                    <span className="text-xs font-black tracking-widest text-slate-400 dark:text-slate-500">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {p.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="border-y border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-neutral-900/50">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center space-y-6">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              ¿Listo para materializar tu proyecto?
            </h2>
            <p className="text-sm text-slate-600 dark:text-neutral-400 max-w-md mx-auto">
              Cuéntanos tu idea y te diremos qué necesitas para hacerla realidad.
            </p>
            <a
              href="https://wa.me/59173854684?text=Hola%20INVENTOV,%20busco%20asesoría%20técnica.%20Mi%20proyecto%20consiste%20en:%20[DESCRIBE_AQUÍ]%20y%20actualmente%20se%20encuentra%20en%20fase%20de:%20[IDEA/DESARROLLO]"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-7 py-3.5 shadow-lg shadow-orange-500/20 transition-all hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5"
            >
              <MessageCircle className="h-4 w-4" />
              Empezar conversación
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
