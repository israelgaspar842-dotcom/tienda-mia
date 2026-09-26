"use client";

import { useState } from "react";
import Link from "next/link";
import { Hand, Box, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type TallaId = "S" | "M" | "L";

type Talla = {
  id: TallaId;
  icon: LucideIcon;
  talla: string;
  titulo: string;
  subtitulo: string;
  rango: string;
};

const TALLAS: Talla[] = [
  {
    id: "S",
    icon: Hand,
    talla: "Talla S",
    titulo: "Pequeño",
    subtitulo: "Cabe en un puño cerrado (ej. Llaveros, tokens)",
    rango: "Bs 30 - Bs 40",
  },
  {
    id: "M",
    icon: Box,
    talla: "Talla M",
    titulo: "Mediano",
    subtitulo: "Tamaño de una mano abierta (ej. Maceteros, figuras de acción)",
    rango: "Bs 75 - Bs 90",
  },
  {
    id: "L",
    icon: Package,
    talla: "Talla L",
    titulo: "Grande",
    subtitulo: "Requiere ambas manos (ej. Cascos, soportes de audífonos)",
    rango: "Bs 180 - Bs 220",
  },
];

export function EstimadorTallas({ compact = false }: { compact?: boolean }) {
  const [seleccionada, setSeleccionada] = useState<TallaId | null>(null);
  const activa = TALLAS.find((t) => t.id === seleccionada) ?? null;

  return (
    <section
      id="estimador-tallas"
      className={compact ? "w-full" : "mx-auto max-w-7xl px-6 py-16 bg-transparent dark:bg-zinc-950"}
    >
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          ¿De qué tamaño es tu pieza?
        </h2>
        <p className="text-sm text-slate-600 dark:text-neutral-400">
          Nuestro sistema de Tallas agrupa los modelos por tamaño. Elige tu referencia visual y obtén un estimado al instante.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TALLAS.map((t) => {
          const selected = seleccionada === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSeleccionada(t.id)}
              aria-pressed={selected}
              className={cn(
                "rounded-[24px] border-2 bg-white dark:bg-slate-900/50 p-6 text-center space-y-4 transition-all hover:-translate-y-1 cursor-pointer",
                selected
                  ? "border-orange-500 shadow-xl shadow-orange-500/10"
                  : "border-slate-200 dark:border-slate-800 hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/5"
              )}
            >
              <div
                className={cn(
                  "mx-auto h-12 w-12 rounded-2xl flex items-center justify-center transition-colors",
                  selected ? "bg-orange-500" : "bg-slate-800 dark:bg-neutral-800"
                )}
              >
                <t.icon className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold tracking-widest uppercase text-orange-500">{t.talla}</p>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">{t.titulo}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{t.subtitulo}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 max-w-2xl mx-auto">
        {activa ? (
          <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 dark:bg-orange-500/10 px-6 py-5 text-center space-y-2">
            <p className="text-lg md:text-xl font-black text-slate-900 dark:text-white">
              Estimado: {activa.rango} <span className="text-sm font-bold text-orange-500">· {activa.talla}</span>
            </p>
            <p className="text-xs text-neutral-500">
              * Los precios son rangos estimados. La resistencia (relleno) y los soportes ya están calculados para
              garantizar la máxima calidad. El precio final se confirmará al subir tu modelo.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 px-6 py-5 text-center">
            <p className="text-sm text-slate-500 dark:text-neutral-500">
              Selecciona una talla para ver tu rango de precio estimado.
            </p>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/cotizar/casual"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-8 py-3.5 shadow-lg shadow-orange-500/25 transition-colors"
          >
            Cotizar modelo exacto ➔
          </Link>
        </div>
      </div>
    </section>
  );
}
