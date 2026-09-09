"use client";

import { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";

type HeroProject = {
  id: string;
  titulo: string;
  descripcion: string;
  imagen_url?: string | null;
};

export function HeroCarousel({ proyectos }: { proyectos: HeroProject[] }) {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    carouselRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    carouselRef.current?.scrollBy({ left: 300, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div ref={carouselRef} className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
        {proyectos.length > 0 ? (
          proyectos.map((p) => {
            const src = p.imagen_url || "";
            return (
              <div key={p.id} className="w-full shrink-0 snap-center relative aspect-video md:aspect-[4/3]">
                {src ? (
                  <Image
                    src={src}
                    alt={p.titulo}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    priority={false}
                  />
                ) : (
                  <div className="absolute inset-0 bg-slate-100 dark:bg-neutral-800 flex items-center justify-center">
                    <ImageIcon className="h-9 w-9 text-slate-400 dark:text-neutral-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                  <h3 className="text-white font-black text-sm md:text-lg leading-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] line-clamp-1">
                    {p.titulo}
                  </h3>
                  {p.descripcion ? (
                    <p className="text-white/80 text-xs md:text-sm leading-relaxed line-clamp-1 mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                      {p.descripcion}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })
        ) : (
          <div className="w-full shrink-0 snap-center relative aspect-video md:aspect-[4/3] bg-slate-100 dark:bg-neutral-800 flex flex-col items-center justify-center gap-4">
            <div className="h-20 w-20 rounded-2xl bg-slate-200 dark:bg-neutral-700/50 border border-slate-300 dark:border-neutral-700 flex items-center justify-center">
              <ImageIcon className="h-9 w-9 text-slate-400 dark:text-neutral-500" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs font-bold tracking-widest uppercase text-slate-500 dark:text-neutral-500">Sin destacados</p>
              <p className="text-[11px] text-slate-400 dark:text-neutral-600">Marca proyectos como destacados en Admin</p>
            </div>
          </div>
        )}
      </div>

      {/* Botones de navegación — ocultos en móvil, visibles en desktop */}
      <button
        onClick={scrollLeft}
        aria-label="Anterior"
        className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-2 bg-black/50 text-white p-2 rounded-full backdrop-blur-sm hover:bg-orange-500 transition-colors z-10 items-center justify-center"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={scrollRight}
        aria-label="Siguiente"
        className="hidden md:flex absolute top-1/2 -translate-y-1/2 right-2 bg-black/50 text-white p-2 rounded-full backdrop-blur-sm hover:bg-orange-500 transition-colors z-10 items-center justify-center"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
