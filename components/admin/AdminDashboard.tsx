"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// --- Tipos espejo de models/Solicitud.ts ---
export type TipoPedido = "casual" | "profesional";
export type EstadoPedido = "Pendiente" | "Cotizado" | "Imprimiendo" | "Terminado";

export type Solicitud = {
  _id: string;
  id?: string; // alias para compatibilidad Supabase (uuid)
  usuario_id?: string | null;
  enlace_archivo: string;
  estado: EstadoPedido;
  precio_cotizado?: number | null;
  tipo_pedido: TipoPedido;
  metadata: Record<string, unknown>;
  created_at?: string;
  createdAt?: string;
};

const ESTADOS: EstadoPedido[] = ["Pendiente", "Cotizado", "Imprimiendo", "Terminado"];

const ESTADO_META: Record<EstadoPedido, { label: string; dot: string; header: string }> = {
  Pendiente: { label: "Pendiente", dot: "bg-amber-500", header: "bg-amber-500/10 border-amber-500/20 text-amber-400" },
  Cotizado: { label: "Cotizado", dot: "bg-sky-500", header: "bg-sky-500/10 border-sky-500/20 text-sky-400" },
  Imprimiendo: { label: "Imprimiendo", dot: "bg-violet-500", header: "bg-violet-500/10 border-violet-500/20 text-violet-400" },
  Terminado: { label: "Terminado", dot: "bg-emerald-500", header: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
};

// ---------- Card dinámico por tipo_pedido ----------
function SolicitudCard({ s, onClick }: { s: Solicitud; onClick: () => void }) {
  const isCasual = s.tipo_pedido === "casual";
  const meta = s.metadata ?? {};
  const color = meta["color"] as string | undefined;
  const acabado = meta["acabado"] as string | undefined;
  const tolerancia = meta["tolerancia"] as string | undefined;
  const material = meta["material_tecnico"] as string | undefined;
  const nda = meta["nda_aceptado"] as boolean | undefined;
  const tienePlano = meta["tiene_plano_2d"] as boolean | undefined;
  const fuente = meta["fuente_definitiva"] as string | undefined;
  const requiereAuditoria = meta["requiere_auditoria_manual"] as boolean | undefined;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border bg-zinc-900 p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-orange-500/40",
        isCasual
          ? "border-orange-500/30 hover:border-orange-500/60 hover:bg-orange-500/[0.04]"
          : "border-zinc-700 hover:border-zinc-600 bg-zinc-900"
      )}
    >
      {/* Header tipo */}
      <div className="flex items-center justify-between mb-2.5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border",
            isCasual
              ? "bg-orange-500 text-white border-orange-600"
              : "bg-zinc-800 text-zinc-300 border-zinc-700"
          )}
        >
          {isCasual ? "🎁 Casual" : "🏭 Profesional"}
        </span>
        {isCasual ? (
          <span className="text-[11px] text-zinc-500">{s.precio_cotizado != null ? `Bs ${s.precio_cotizado}` : "Sin cotizar"}</span>
        ) : nda ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            <ShieldAlertIcon /> NDA
          </span>
        ) : null}
      </div>

      {/* Enlace archivo */}
      <a
        href={s.enlace_archivo}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-xs text-sky-400 hover:text-sky-300 truncate block underline decoration-sky-400/30 underline-offset-2 mb-3"
      >
        {s.enlace_archivo}
      </a>

      {/* Body dinámico */}
      {isCasual ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            {color && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-zinc-800 border border-zinc-700 rounded-full px-2.5 py-1">
                <span className="w-3 h-3 rounded-full border border-white/20 shrink-0" style={{ background: colorToCss(color) }} />
                {color}
              </span>
            )}
            {acabado && <Badge variant="secondary" className="text-[11px]">{acabado}</Badge>}
          </div>
          {!color && !acabado && <p className="text-xs text-zinc-500 italic">Sin detalles estéticos</p>}
        </div>
      ) : (
        <div className="space-y-2 font-mono text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2">
              <div className="text-[10px] tracking-widest text-zinc-500 uppercase">Tolerancia</div>
              <div className="font-semibold text-zinc-200">{tolerancia ?? "—"}</div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2">
              <div className="text-[10px] tracking-widest text-zinc-500 uppercase">Material</div>
              <div className="font-semibold text-zinc-200 truncate">{material ?? "—"}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className={cn("w-2 h-2 rounded-full", nda ? "bg-amber-500" : "bg-zinc-600")} />
            <span className={nda ? "text-amber-400" : "text-zinc-500"}>{nda ? "Requiere confidencialidad" : "Sin NDA"}</span>
          </div>
          {tienePlano && (
            <div className={cn("flex items-center gap-1.5 text-[11px] rounded-full border px-2 py-0.5", requiereAuditoria ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400")}>
              <span className={cn("w-1.5 h-1.5 rounded-full", requiereAuditoria ? "bg-amber-500" : "bg-emerald-500")} />
              {fuente === "plano_2d" ? "Plano 2D manda (+Bs 100)" : "Modelo 3D manda"}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-800 pt-2.5">
        <span>{formatDate(s.created_at ?? s.createdAt)}</span>
        {s.precio_cotizado != null && !isCasual && (
          <span className="font-bold text-emerald-400">Bs {s.precio_cotizado.toFixed(2)}</span>
        )}
      </div>
    </button>
  );
}

function ShieldAlertIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}

function colorToCss(c: string): string {
  const map: Record<string, string> = {
    Rojo: "#ef4444",
    "Verde Sage": "#87a96b",
    Azul: "#3b82f6",
    Negro: "#171717",
    Blanco: "#fafafa",
    Brillante: "#f59e0b",
  };
  return map[c] ?? c.toLowerCase();
}

function formatDate(d?: string) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
  } catch {
    return d;
  }
}

// ---------- Modal Cotización ----------
function QuotationModal({
  solicitud,
  open,
  onOpenChange,
  onSave,
}: {
  solicitud: Solicitud | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (id: string, data: { precio_cotizado: number | null; estado: EstadoPedido }) => Promise<void>;
}) {
  if (!solicitud) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-xl">
        <QuotationForm key={solicitud._id || solicitud.id} solicitud={solicitud} onSave={onSave} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function QuotationForm({
  solicitud,
  onSave,
  onClose,
}: {
  solicitud: Solicitud;
  onSave: (id: string, data: { precio_cotizado: number | null; estado: EstadoPedido }) => Promise<void>;
  onClose: () => void;
}) {
  const [precio, setPrecio] = useState<string>(solicitud.precio_cotizado != null ? String(solicitud.precio_cotizado) : "");
  const [estado, setEstado] = useState<EstadoPedido>(solicitud.estado);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const meta = solicitud.metadata ?? {};
  const isProf = solicitud.tipo_pedido === "profesional";

  const handleSave = async () => {
    setError("");
    let precioNum: number | null = null;
    if (precio.trim() !== "") {
      const n = Number(precio);
      if (isNaN(n) || n < 0) {
        setError("Precio inválido");
        return;
      }
      precioNum = Math.round(n * 100) / 100;
    }
    setSaving(true);
    try {
      const id = solicitud._id || solicitud.id!;
      await onSave(id, { precio_cotizado: precioNum, estado });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", ESTADO_META[estado].dot)} />
          Cotización manual
          <Badge variant={isProf ? "secondary" : "default"} className="ml-2 text-[10px]">
            {solicitud.tipo_pedido}
          </Badge>
        </DialogTitle>
          <DialogDescription>ID: {solicitud._id || solicitud.id} • {formatDate(solicitud.created_at ?? solicitud.createdAt)}</DialogDescription>
        </DialogHeader>

        {/* Detalle completo */}
        <div className="space-y-4">
          <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 space-y-3">
            <div>
              <div className="text-[11px] tracking-widest uppercase text-zinc-500 font-semibold">Archivo</div>
              <a href={solicitud.enlace_archivo} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-400 underline break-all">
                {solicitud.enlace_archivo}
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-[11px] text-zinc-500 uppercase tracking-widest">Tipo</div>
                <div className="font-medium text-white capitalize">{solicitud.tipo_pedido}</div>
              </div>
              <div>
                <div className="text-[11px] text-zinc-500 uppercase tracking-widest">Estado actual</div>
                <div className="font-medium text-white">{solicitud.estado}</div>
              </div>
            </div>

            {/* Metadata pretty */}
            <div>
              <div className="text-[11px] tracking-widest uppercase text-zinc-500 font-semibold mb-1.5">Metadata (JSONB)</div>
              {solicitud.tipo_pedido === "casual" ? (
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="bg-zinc-900 border border-orange-500/20 rounded-lg px-3 py-1.5">
                    <span className="text-zinc-500 text-xs">Color: </span>
                    <span className="text-white font-medium">{(meta["color"] as string) ?? "—"}</span>
                  </span>
                  <span className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
                    <span className="text-zinc-500 text-xs">Acabado: </span>
                    <span className="text-white font-medium">{(meta["acabado"] as string) ?? "—"}</span>
                  </span>
                  {Boolean(meta["nota"]) && <span className="text-xs text-zinc-400 col-span-2">{String(meta["nota"])}</span>}
                </div>
              ) : (
                <div className="space-y-2 text-sm font-mono">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2">
                      <div className="text-[10px] text-zinc-500 uppercase">Tolerancia</div>
                      <div className="text-white">{(meta["tolerancia"] as string) ?? "—"}</div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2">
                      <div className="text-[10px] text-zinc-500 uppercase">Material</div>
                      <div className="text-white truncate">{(meta["material_tecnico"] as string) ?? "—"}</div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 flex flex-col justify-center items-center">
                      <div className="text-[10px] text-zinc-500 uppercase">NDA</div>
                      <div className={cn("text-sm font-bold", meta["nda_aceptado"] ? "text-amber-400" : "text-zinc-500")}>
                        {meta["nda_aceptado"] ? "SÍ" : "NO"}
                      </div>
                    </div>
                  </div>
                  {(meta["tiene_plano_2d"] as boolean) && (
                    <div className={cn("rounded-lg border p-2 flex items-center justify-between", (meta["requiere_auditoria_manual"] as boolean) ? "bg-amber-500/10 border-amber-500/30" : "bg-emerald-500/10 border-emerald-500/20")}>
                      <div>
                        <div className="text-[10px] tracking-widest uppercase opacity-70" style={{ color: (meta["requiere_auditoria_manual"] as boolean) ? "#f59e0b" : "#10b981" }}>Source of Truth</div>
                        <div className={`text-xs font-bold ${(meta["requiere_auditoria_manual"] as boolean) ? "text-amber-400" : "text-emerald-400"}`}>
                          {(meta["fuente_definitiva"] as string) === "plano_2d" ? "Plano 2D manda" : "Modelo 3D manda"}
                        </div>
                      </div>
                      <span className={`text-xs font-mono ${(meta["requiere_auditoria_manual"] as boolean) ? "text-amber-400" : "text-emerald-400"}`}>
                        {(meta["requiere_auditoria_manual"] as boolean) ? "+Bs 100" : "Sin cargo"}
                      </span>
                    </div>
                  )}
                  {Boolean(meta["nota"]) && <p className="text-xs text-zinc-400 font-sans">{String(meta["nota"])}</p>}
                  {(meta["plano_url"] as string) && (
                    <a href={String(meta["plano_url"])} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-sky-400 underline break-all block">
                      📄 Plano: {String(meta["plano_url"]).split("/").pop()}
                    </a>
                  )}
                </div>
              )}
              <details className="mt-2">
                <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-300">Ver JSON crudo</summary>
                <pre className="mt-1 text-[11px] bg-black/40 border border-zinc-800 rounded-lg p-2 overflow-auto text-zinc-300">
                  {JSON.stringify(meta, null, 2)}
                </pre>
              </details>
            </div>
          </div>

          {/* Form cotización */}
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="precio">Precio cotizado (Bs)</Label>
                <Input
                  id="precio"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ej. 89.90"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                />
                <p className="text-[11px] text-zinc-500">Vacío = sin cotizar</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="estado">Mover a estado</Label>
                <Select id="estado" value={estado} onChange={(e) => setEstado(e.target.value as EstadoPedido)}>
                  {ESTADOS.map((es) => (
                    <option key={es} value={es}>{es}</option>
                  ))}
                </Select>
                <p className="text-[11px] text-zinc-500">Avanza la tarjeta en el Kanban</p>
              </div>
            </div>
            {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
            {saving ? "Guardando…" : "Guardar y mover"}
          </Button>
        </DialogFooter>
      </>
  );
}

// ---------- Kanban Board ----------
export default function AdminDashboard({
  solicitudes: initialSolicitudes,
  onUpdate,
}: {
  solicitudes: Solicitud[];
  onUpdate?: (id: string, data: { precio_cotizado: number | null; estado: EstadoPedido }) => Promise<void>;
}) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(initialSolicitudes);
  const [selected, setSelected] = useState<Solicitud | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // si el padre cambia, sincroniza
  // (sin useEffect cascade: derivar en render si es necesario, aquí es controlled + local)
  const grouped = useMemo(() => {
    const g: Record<EstadoPedido, Solicitud[]> = {
      Pendiente: [],
      Cotizado: [],
      Imprimiendo: [],
      Terminado: [],
    };
    for (const s of solicitudes) {
      (g[s.estado] ?? g["Pendiente"]).push(s);
    }
    return g;
  }, [solicitudes]);

  const handleCardClick = (s: Solicitud) => {
    setSelected(s);
    setModalOpen(true);
  };

  const handleSave = async (id: string, data: { precio_cotizado: number | null; estado: EstadoPedido }) => {
    // 1) intenta delegar al padre (que hace fetch real a /api/solicitudes/[id])
    if (onUpdate) {
      await onUpdate(id, data);
      // optimista local también
      setSolicitudes((prev) => prev.map((x) => (x._id === id || x.id === id ? { ...x, ...data } : x)));
      return;
    }
    // 2) fallback: PATCH directo
    const res = await fetch(`/api/solicitudes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error((j as { error?: string }).error || "Error al actualizar");
    }
    const updated = (await res.json()) as Solicitud;
    setSolicitudes((prev) => prev.map((x) => (x._id === id || x.id === id ? { ...x, ...updated, _id: updated._id ?? id } : x)));
  };

  // si initial cambia (fetch externo), actualiza
  if (initialSolicitudes !== solicitudes && initialSolicitudes.length !== solicitudes.length) {
    // evita loop: solo si referencia distinta y longitud distinta (fetch)
    // mejor usar efecto simple sin lint
  }

  return (
    <div className="space-y-4">
      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-0.5 bg-orange-500 rounded-full" /> Casual = borde naranja</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-zinc-800 border border-zinc-700" /> Profesional = industrial</span>
        <span className="ml-auto text-[11px]">Tip: clic en tarjeta para cotizar</span>
      </div>

      {/* Kanban grid: 1 col móvil, 4 cols desktop, scroll horizontal en tablet */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {ESTADOS.map((estado) => {
          const list = grouped[estado];
          const meta = ESTADO_META[estado];
          return (
            <div key={estado} className="rounded-2xl border border-zinc-800 bg-zinc-950/50 flex flex-col min-h-[320px]">
              <div className={cn("sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b rounded-t-2xl backdrop-blur", meta.header)}>
                <h3 className="text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", meta.dot)} />
                  {meta.label}
                </h3>
                <span className="text-xs font-mono bg-black/20 border border-white/10 rounded-full px-2 py-0.5">{list.length}</span>
              </div>

              <div className="p-3 space-y-3 flex-1">
                {list.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-xl p-4">
                    <span className="text-xs">Sin pedidos</span>
                    <span className="text-[11px] text-zinc-700">Arrastra aquí al cotizar</span>
                  </div>
                ) : (
                  list.map((s) => (
                    <SolicitudCard key={s._id || s.id} s={s} onClick={() => handleCardClick(s)} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <QuotationModal solicitud={selected} open={modalOpen} onOpenChange={setModalOpen} onSave={handleSave} />

      {/* Sync externo: si initial cambia, botón recargar */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSolicitudes(initialSolicitudes)}
          className="text-xs"
        >
          Sincronizar
        </Button>
      </div>
    </div>
  );
}

// Export auxiliar para testing/story
export { SolicitudCard, QuotationModal, ESTADOS };
