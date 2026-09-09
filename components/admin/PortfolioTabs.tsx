"use client";

import { useState } from "react";
import KanbanBoard, { type Solicitud } from "@/components/admin/KanbanBoard";
import PortfolioManager from "@/components/admin/PortfolioManager";
import { LayoutDashboard, FolderKanban } from "lucide-react";

type PortfolioRow = {
  id: string;
  titulo: string;
  descripcion: string;
  imagen_url: string;
  categoria: "regalo" | "prototipo";
  created_at: string;
  es_destacado: boolean;
};

export default function PortfolioTabs({
  solicitudes,
  portfolio,
}: {
  solicitudes: Solicitud[];
  portfolio: PortfolioRow[];
}) {
  const [tab, setTab] = useState<"kanban" | "portfolio">("kanban");

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setTab("kanban")}
          className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border transition-colors ${
            tab === "kanban"
              ? "bg-orange-500 text-white border-orange-500 shadow shadow-orange-500/20"
              : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
          }`}
        >
          <FolderKanban className="h-4 w-4" /> Kanban
        </button>
        <button
          onClick={() => setTab("portfolio")}
          className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border transition-colors ${
            tab === "portfolio"
              ? "bg-orange-500 text-white border-orange-500 shadow shadow-orange-500/20"
              : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" /> Mis Proyectos
          <span className="bg-white/20 text-white text-[11px] px-2 py-0.5 rounded-full">{portfolio.length}</span>
        </button>
      </div>

      {tab === "kanban" ? <KanbanBoard initialSolicitudes={solicitudes} /> : <PortfolioManager initialItems={portfolio} />}
    </div>
  );
}
