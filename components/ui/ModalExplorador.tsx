"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { X, ExternalLink, Search, Link2, ArrowLeftRight } from "lucide-react";

type Plataforma = {
  nombre: string;
  url: string;
};

const PLATAFORMAS: Plataforma[] = [
  { nombre: "MakerWorld", url: "https://makerworld.com" },
  { nombre: "Thingiverse", url: "https://www.thingiverse.com" },
  { nombre: "Printables", url: "https://www.printables.com" },
  { nombre: "Cults3D", url: "https://cults3d.com" },
];

export function ModalExplorador() {
  const [abierto, setAbierto] = useState(false);
  const [plataformaActiva, setPlataformaActiva] = useState<Plataforma>(PLATAFORMAS[0]);

  const abrir = (p?: Plataforma) => {
    if (p) setPlataformaActiva(p);
    else setPlataformaActiva(PLATAFORMAS[0]);
    setAbierto(true);
  };
  const cerrar = () => setAbierto(false);

  // Bloqueo scroll + ESC
  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = "hidden";
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") cerrar();
      };
      window.addEventListener("keydown", onKey);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", onKey);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [abierto]);

  // Permite apertura externa desde CompatibleBanner (Hero)
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<Plataforma | undefined>;
      if (ce.detail) setPlataformaActiva(ce.detail);
      else setPlataformaActiva(PLATAFORMAS[0]);
      setAbierto(true);
    };
    window.addEventListener("abrir-explorador", handler as EventListener);
    return () => window.removeEventListener("abrir-explorador", handler as EventListener);
  }, []);

  return (
    <>
      {/* === TRIGGER / BARRA DE LOGOS - Visible en la Home === */}
      <section
        id="explorador"
        className="border-y border-slate-200 dark:border-zinc-800 bg-slate-100/60 dark:bg-zinc-900/60 backdrop-blur-sm"
      >
        <div className="mx-auto max-w-7xl px-6 py-4">
          {/* Desktop */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="font-semibold tracking-widest uppercase text-slate-500 dark:text-zinc-500">
                ¿Sin archivo? Explora catálogos
              </span>
              <span className="hidden sm:inline h-3 w-px bg-slate-300 dark:bg-zinc-700" />
              <div className="flex flex-wrap gap-1.5">
                {PLATAFORMAS.map((p) => (
                  <button
                    key={p.nombre}
                    onClick={() => abrir(p)}
                    className="rounded-full border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold tracking-wide text-slate-700 dark:text-zinc-300 hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors cursor-pointer"
                    aria-label={`Explorar ${p.nombre} - abre modal instructivo`}
                  >
                    {p.nombre}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden lg:inline text-[11px] text-slate-400 dark:text-zinc-500">
                El iframe fallará por CSP — te explicamos cómo hacerlo
              </span>
              <button
                onClick={() => abrir()}
                className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-colors cursor-pointer"
              >
                <Search className="h-3.5 w-3.5" />
                Explorar modelos 3D
              </button>
            </div>
          </div>

          {/* Hint mobile */}
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500 dark:text-zinc-500 md:hidden">
            Toca cualquier plataforma. Te mostramos 4 pasos antes de abrir la pestaña externa.
          </p>
        </div>
      </section>

      {/* === MODAL DE INTERCEPCIÓN === */}
      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          aria-modal="true"
          role="dialog"
          aria-labelledby="modal-explorador-title"
        >
          {/* Fondo oscuro translúcido + backdrop-blur */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
            onClick={cerrar}
            aria-hidden="true"
          />

          {/* Tarjeta central */}
          <div className="relative z-10 w-full max-w-[480px] rounded-[24px] border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl animate-in zoom-in-95 overflow-hidden">
            {/* Header decorativo */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

            <button
              onClick={cerrar}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-7 md:p-8 space-y-6">
              {/* Icon + Título */}
              <div className="space-y-3 pr-6">
                <div className="h-11 w-11 rounded-2xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <h2
                  id="modal-explorador-title"
                  className="text-[22px] font-black tracking-tight leading-none text-slate-900 dark:text-white"
                >
                  Encuentra tu modelo ideal
                </h2>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
                  Las vistas previas directas están bloqueadas por seguridad (CSP). Usa el flujo en
                  pestaña externa — es más rápido y seguro.
                </p>
              </div>

              {/* Pasos instructivos - limpio con 🔹 */}
              <div className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 p-5 space-y-3">
                <p className="text-[11px] font-black tracking-widest uppercase text-slate-400 dark:text-zinc-500">
                  Cómo funciona — 4 pasos
                </p>
                <ol className="space-y-2.5 text-sm leading-relaxed text-slate-700 dark:text-zinc-300">
                  <li className="flex gap-2.5">
                    <span className="shrink-0 select-none">🔹</span>
                    <span>
                      <span className="font-bold text-slate-900 dark:text-white">1.</span> Abre el
                      catálogo global en la nueva pestaña.
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="shrink-0 select-none">🔹</span>
                    <span>
                      <span className="font-bold text-slate-900 dark:text-white">2.</span> Elige el
                      diseño que más te guste.
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="shrink-0 select-none">🔹</span>
                    <span className="flex items-start gap-1.5">
                      <span>
                        <span className="font-bold text-slate-900 dark:text-white">3.</span> Copia el
                        enlace (URL) de la página.
                      </span>
                      <Link2 className="h-3.5 w-3.5 mt-0.5 text-slate-400 shrink-0" />
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="shrink-0 select-none">🔹</span>
                    <span className="flex items-start gap-1.5">
                      <span>
                        <span className="font-bold text-slate-900 dark:text-white">4.</span> Regresa a
                        esta pestaña para cotizar tu impresión.
                      </span>
                      <ArrowLeftRight className="h-3.5 w-3.5 mt-0.5 text-slate-400 shrink-0" />
                    </span>
                  </li>
                </ol>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-4 mt-8">
                {/* Botón puente al cotizador */}
                <Link
                  href="/cotizar/casual"
                  onClick={cerrar}
                  className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-gray-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-full transition-colors text-center"
                >
                  Ya tengo mi enlace ➔
                </Link>

                {/* Botón principal externo */}
                <a
                  href="https://makerworld.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-full transition-colors text-center"
                >
                  Abrir MakerWorld ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ModalExplorador;
