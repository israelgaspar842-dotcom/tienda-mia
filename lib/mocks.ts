// Mocks Fase 1 — portfolioMocks eliminados (Fase Landing Limpia)
// La galería "Trabajos recientes" ahora hace SELECT * FROM portfolio ORDER BY created_at DESC directamente en Supabase.
// Este archivo solo conserva tipos y materiales de referencia para inventario (no usado en portfolio).

export type PortfolioItem = {
  id: string;
  titulo: string;
  descripcion: string;
  imagen_url: string;
  categoria: "Figura" | "Funcional" | "Decoración" | "Prototipo";
  material: string;
};

export type MaterialMock = {
  id: string;
  tipo: "PLA" | "PETG" | "TPU" | "ABS";
  color: string;
  hex: string;
  precio_venta_por_gramo: number;
};

export const materialesMocks: MaterialMock[] = [
  { id: "m1", tipo: "PLA", color: "Negro Carbón", hex: "#18181b", precio_venta_por_gramo: 0.18 },
  { id: "m2", tipo: "PLA", color: "Blanco Hueso", hex: "#fafaf9", precio_venta_por_gramo: 0.18 },
  { id: "m3", tipo: "PLA", color: "Violeta Forja", hex: "#7c3aed", precio_venta_por_gramo: 0.2 },
  { id: "m4", tipo: "PETG", color: "Translúcido", hex: "#a5b4fc", precio_venta_por_gramo: 0.24 },
  { id: "m5", tipo: "PETG", color: "Rojo Racing", hex: "#dc2626", precio_venta_por_gramo: 0.24 },
];
