"use client";

import { useState, useEffect } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { createClient } from "@/lib/supabaseClient";
import { Badge } from "@/components/ui/badge";
import { Layers, Sparkles } from "lucide-react";
import { ExpandableDescription } from "./ExpandableDescription";

// Referencia especificación: slides={proyecto.galeria.map((url) => ({ src: url }))}

type PortfolioRow = {
  id: string;
  titulo: string;
  descripcion: string;
  imagen_url: string;
  galeria?: string[] | null;
  categoria: "regalo" | "prototipo";
  created_at: string;
};

export function PortfolioGrid() {
  const [items, setItems] = useState<PortfolioRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  const [currentGallery, setCurrentGallery] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function fetchPortfolio() {
      try {
        const supabase = createClient();
        const { data, error: qError } = await supabase
          .from("portfolio")
          .select("*")
          .order("created_at", { ascending: false });
        if (qError) throw qError;
        if (!cancelled) {
          setItems((data ?? []) as PortfolioRow[]);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error cargando portfolio");
          setItems([]);
        }
      }
    }
    fetchPortfolio();
    return () => {
      cancelled = true;
    };
  }, []);

  // Estado vacío elegante
  if (items.length === 0) {
    return (
      <section id="portfolio" className="mx-auto max-w-7xl px-6 py-16 space-y-8 bg-transparent dark:bg-zinc-950">
        <div className="space-y-3">
          <Badge variant="outline" className="rounded-full border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 bg-white dark:bg-neutral-800">
            <Layers className="h-3 w-3 mr-1.5" /> Portfolio
          </Badge>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white">Trabajos recientes</h2>
          <p className="text-slate-600 dark:text-neutral-400 max-w-xl text-sm leading-relaxed">Piezas reales impresas en nuestro taller.</p>
        </div>
        <div className="rounded-[24px] border border-dashed border-slate-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-12 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-slate-400 dark:text-neutral-500" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-slate-900 dark:text-white">Nuevos proyectos próximamente...</p>
            <p className="text-sm text-slate-600 dark:text-neutral-500 max-w-md mx-auto">
              Estamos preparando nuestra galería de trabajos reales. Muy pronto verás aquí las piezas entregadas a clientes B2C y B2B.
            </p>
          </div>
          {error && <p className="text-xs font-mono text-amber-500/70">({error})</p>}
        </div>
        <Lightbox
          open={isOpen}
          close={() => setIsOpen(false)}
          slides={currentGallery.length > 0 ? currentGallery.map((url) => ({ src: url })) : [{ src: currentImage }]}
        />
      </section>
    );
  }

  return (
    <section id="portfolio" className="mx-auto max-w-7xl px-6 py-16 space-y-8 bg-transparent dark:bg-zinc-950">
      <div className="space-y-3">
        <Badge variant="outline" className="rounded-full border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 bg-white dark:bg-neutral-800">
          <Layers className="h-3 w-3 mr-1.5" /> Portfolio
          <span className="ml-2 text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            {items.length} proyectos
          </span>
        </Badge>
        <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white">Trabajos recientes</h2>
        <p className="text-slate-600 dark:text-neutral-400 max-w-xl text-sm leading-relaxed">
          Proyectos reales entregados a clientes de Sucre y toda Bolivia.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {items.map((proyecto) => (
          <article
            key={proyecto.id}
            className="group relative rounded-[24px] overflow-hidden border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1"
          >
            <div className="relative h-56 overflow-hidden bg-slate-100 dark:bg-neutral-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proyecto.imagen_url}
                alt={proyecto.titulo}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 cursor-pointer"
                loading="lazy"
                onClick={() => {
                  const galeria = proyecto.galeria && proyecto.galeria.length > 0 ? proyecto.galeria : [proyecto.imagen_url];
                  setCurrentGallery(galeria);
                  setCurrentImage(proyecto.imagen_url);
                  setIsOpen(true);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 dark:from-neutral-900 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-3 left-3">
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                    proyecto.categoria === "regalo"
                      ? "bg-orange-500 text-white border-orange-600"
                      : "bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-200"
                  }`}
                >
                  {proyecto.categoria === "regalo" ? "Regalo" : "Prototipo"}
                </span>
              </div>
              {proyecto.galeria && proyecto.galeria.length > 1 && (
                <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                  1 / {proyecto.galeria.length}
                </span>
              )}
            </div>
            <div className="p-5 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white leading-tight line-clamp-1 group-hover:text-orange-500 transition-colors">{proyecto.titulo}</h3>
              <ExpandableDescription text={proyecto.descripcion} />
            </div>
          </article>
        ))}
      </div>
      <Lightbox
        open={isOpen}
        close={() => setIsOpen(false)}
        slides={currentGallery.length > 0 ? currentGallery.map((url) => ({ src: url })) : [{ src: currentImage }]}
      />
    </section>
  );
}
