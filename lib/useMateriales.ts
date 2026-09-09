"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export type MaterialRow = {
  id: string;
  nombre: string;
  categoria: "casual" | "profesional";
  estado: "Disponible" | "Agotado";
};

export function useMateriales(categoria: "casual" | "profesional") {
  const [materiales, setMateriales] = useState<MaterialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchMateriales() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("materiales")
          .select("id, nombre, categoria, estado")
          .eq("categoria", categoria)
          .eq("estado", "Disponible")
          .order("nombre", { ascending: true });
        if (error) throw error;
        if (!cancelled) setMateriales((data ?? []) as MaterialRow[]);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error cargando materiales");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchMateriales();
    return () => {
      cancelled = true;
    };
  }, [categoria]);

  return { materiales, loading, error };
}
