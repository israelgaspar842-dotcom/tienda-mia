"use client";

import { useState } from "react";
import Link from "next/link";
import { Box, Layers, Scissors, Wrench, ChevronRight } from "lucide-react";
import { ModalExploradorOverlay } from "@/components/ui/ModalExplorador";

const categories = [
  {
    href: "/cotizar/casual?material=pla",
    icon: Box,
    title: "Impresión en PLA",
    desc: "Económico, biodegradable, ideal para figuras y decoración",
  },
  {
    href: "/cotizar/casual?material=petg",
    icon: Layers,
    title: "Prototipado PETG",
    desc: "Resistente, duradero, para piezas funcionales y mecánicas",
  },
  {
    accion: "modal" as const,
    icon: Scissors,
    title: "Explorador de Modelos",
    desc: "Busca en MakerWorld, Thingiverse y Printables. Encuentra millones de diseños listos para imprimir.",
  },
  {
    href: "/asesoria",
    icon: Wrench,
    title: "Asesoría Técnica",
    desc: "Diseño 3D, optimización, selección de materiales y NDA",
  },
];

export function CategoriesStrip() {
  const [modalAbierta, setModalAbierta] = useState(false);

  return (
    <section id="como-funciona" className="bg-white dark:bg-neutral-950 border-y border-neutral-200 dark:border-neutral-900">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const contenido = (
              <>
                <div className="h-11 w-11 rounded-xl bg-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <cat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-neutral-900 dark:text-white group-hover:text-orange-500 transition-colors">{cat.title}</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-500 leading-relaxed">{cat.desc}</p>
                </div>
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 text-orange-500">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </>
            );

            if (cat.accion === "modal") {
              return (
                <button
                  key={cat.title}
                  type="button"
                  onClick={() => setModalAbierta(true)}
                  aria-haspopup="dialog"
                  aria-label="Abrir explorador de modelos 3D"
                  className="group relative flex flex-col items-start gap-4 p-6 rounded-2xl bg-white border border-orange-500/50 hover:border-orange-500 hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-900/50 transition-all duration-300 cursor-pointer"
                >
                  {contenido}
                </button>
              );
            }

            return (
              <Link
                key={cat.title}
                href={cat.href}
                className="group relative flex flex-col items-start gap-4 p-6 rounded-2xl bg-white border border-neutral-200 hover:border-orange-500 hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-800 dark:hover:bg-neutral-900/50 transition-all duration-300"
              >
                {contenido}
              </Link>
            );
          })}
        </div>
      </div>

      <ModalExploradorOverlay abierto={modalAbierta} cerrar={() => setModalAbierta(false)} />
    </section>
  );
}