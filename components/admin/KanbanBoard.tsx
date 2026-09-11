"use client";

import { useState, useMemo } from "react";
import { Gift, Cog, Download, DollarSign, Check, MessageCircle, Printer, CheckCircle2, Archive, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

// Tipos alineados con supabase/solicitudes.sql y models/Solicitud.ts
export type TipoPedido = "casual" | "profesional";
export type EstadoPedido = "Pendiente" | "Cotizado" | "Imprimiendo" | "Terminado";

export type Solicitud = {
  id: string;
  _id?: string;
  usuario_id?: string | null;
  enlace_archivo: string;
  estado: EstadoPedido;
  precio_cotizado?: number | null;
  tipo_pedido: TipoPedido;
  metadata: Record<string, unknown>;
  telefono?: string | null; // columna dedicada Fase 3 wa.me
  nombre?: string | null; // columna TEXT nueva — nombre del cliente
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

function formatDate(d?: string) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
  } catch {
    return d;
  }
}

function getId(s: Solicitud) {
  return s.id || s._id || "";
}

function extractBucketPath(stored: string): { bucket: string; path: string } {
  // stored puede ser "pro-vault/modelos/b2b_xxx.stl" o "pro-vault/planos/b2b_xxx.pdf" o "/uploads/..." (fallback local)
  // Para Supabase necesitamos bucket y path interno.
  if (stored.startsWith("pro-vault/")) {
    const withoutPrefix = stored.replace(/^pro-vault\//, "");
    return { bucket: "pro-vault", path: withoutPrefix };
  }
  if (stored.startsWith("casual-uploads/")) {
    return { bucket: "casual-uploads", path: stored.replace(/^casual-uploads\//, "") };
  }
  // fallback: si es URL local o https, no es descargable via signedUrl
  return { bucket: "pro-vault", path: stored };
}

function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return null;
  // Bolivia: 8 dígitos sin país, asume 591 (Sucre)
  if (digits.length === 8) return `591${digits}`;
  if (digits.length === 9 && digits.startsWith("591")) return digits;
  if (digits.length >= 11 && digits.startsWith("591")) return digits;
  if (digits.length >= 10) return digits;
  return `591${digits}`;
}

function getTelefono(s: Solicitud): string | null {
  const meta = s.metadata ?? {};
  const raw = (s.telefono as string | undefined) || (meta["telefono"] as string | undefined) || (meta["whatsapp"] as string | undefined) || (meta["telefonoWhatsapp"] as string | undefined);
  return normalizePhone(raw);
}

function buildWhatsAppLink(s: Solicitud): { href: string | null; message: string } {
  const telefono = getTelefono(s);
  const precio = s.precio_cotizado != null ? Number(s.precio_cotizado).toFixed(2) : null;
  if (!telefono || !precio) return { href: null, message: "" };

  const meta = s.metadata ?? {};
  const isCasual = s.tipo_pedido === "casual";
  const caracteristicas = isCasual
    ? `Color ${(meta["color"] as string) ?? "—"}, Acabado ${(meta["acabado"] as string) ?? "—"}`
    : `Tolerancia ${(meta["tolerancia"] as string) ?? "—"}, Material ${(meta["material_tecnico"] as string) ?? "—"}`;

  const texto = `¡Hola! Soy de *INVENTOV Sucre*. 👋\nHe revisado tu solicitud de impresión 3D y el modelo está listo para fabricarse.\n\nDetalles de tu pieza:\n🔹 *Material:* ${(meta["material_tecnico"] as string) ?? (meta["material"] as string) ?? "—"}\n🔹 *Color:* ${(meta["color"] as string) ?? "—"}\n🔹 *Acabado:* ${(meta["acabado"] as string) ?? "—"}\n\nEl costo total de producción es de *Bs ${precio}*.\n\n¿Te envío los datos de pago por este medio para meter tu pieza a la máquina hoy mismo? ⚙️`;
  const href = `https://wa.me/${telefono}?text=${encodeURIComponent(texto)}`;
  return { href, message: texto };
}

// ---------- SolicitudCard ----------
function SolicitudCard({
  solicitud,
  onCotizar,
  onDownload,
  onTransition,
}: {
  solicitud: Solicitud;
  onCotizar: (id: string, precio: number) => Promise<void>;
  onDownload: (s: Solicitud) => Promise<void>;
  onTransition: (id: string, nextEstado: EstadoPedido) => Promise<void>;
}) {
  const meta = solicitud.metadata ?? {};
  const isCasual = solicitud.tipo_pedido === "casual";
  const nombreCliente = (solicitud.nombre as string | undefined) || (meta["nombre"] as string | undefined) || (meta["empresa"] as string | undefined) || "—";
  const [precioInput, setPrecioInput] = useState(solicitud.precio_cotizado != null ? String(solicitud.precio_cotizado) : "");
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [transitioning, setTransitioning] = useState<EstadoPedido | null>(null);
  const [msg, setMsg] = useState("");

  // Genera URL pública real para casual-uploads (evita 404 por ruta relativa)
  const displayHref = useMemo(() => {
    const raw = solicitud.enlace_archivo ?? "";
    if (!raw) return "#";
    // Si ya es http(s) (link externo MakerWorld, etc.), usar tal cual
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    // Si es ruta de Storage con prefijo bucket (casual-uploads/referencias/..., pro-vault/...)
    // Para casual-uploads usar getPublicUrl
    if (raw.startsWith("casual-uploads/")) {
      const { path } = extractBucketPath(raw);
      try {
        const supabase = createClient();
        const { data } = supabase.storage.from("casual-uploads").getPublicUrl(path);
        return data.publicUrl || raw;
      } catch {
        return raw;
      }
    }
    // Para pro-vault no usar getPublicUrl (privado), pero mostramos placeholder; descarga usa createSignedUrl
    if (raw.startsWith("pro-vault/")) return "#"; // no link directo, usar botón Descargar
    // Fallback local /uploads
    return raw;
  }, [solicitud.enlace_archivo]);

  const handleGuardar = async () => {
    const n = Number(precioInput);
    if (isNaN(n) || n < 0) {
      setMsg("Precio inválido");
      return;
    }
    setSaving(true);
    setMsg("");
    try {
      await onCotizar(getId(solicitud), Math.round(n * 100) / 100);
      setMsg("✓ Guardado");
      setTimeout(() => setMsg(""), 2000);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await onDownload(solicitud);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error descarga");
    } finally {
      setDownloading(false);
    }
  };

  const handleTransition = async (next: EstadoPedido) => {
    setTransitioning(next);
    setMsg("");
    try {
      await onTransition(getId(solicitud), next);
      setMsg(`✓ Movido a ${next}`);
      setTimeout(() => setMsg(""), 2000);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error al mover");
    } finally {
      setTransitioning(null);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-zinc-900 p-4 shadow-sm flex flex-col gap-3",
        isCasual ? "border-orange-500/30 hover:border-orange-500/50" : "border-zinc-700 hover:border-zinc-600 border-l-4 border-l-zinc-600"
      )}
    >
      {/* Header tipo */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border",
            isCasual ? "bg-orange-500 text-white border-orange-600" : "bg-zinc-800 text-zinc-300 border-zinc-700"
          )}
        >
          {isCasual ? <Gift className="h-3 w-3" /> : <Cog className="h-3 w-3" />}
          {isCasual ? "Casual" : "Profesional"}
        </span>
        <span className="text-[11px] text-zinc-500">{formatDate(solicitud.created_at ?? solicitud.createdAt)}</span>
      </div>

      {/* Nombre del cliente — nueva columna `nombre` */}
      <div className="flex items-center gap-1.5 text-xs">
        <span className="h-5 w-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300">
          {nombreCliente !== "—" ? nombreCliente.charAt(0).toUpperCase() : "?"}
        </span>
        <span className="text-zinc-400">Cliente:</span>
        <span className="text-white font-medium truncate">{nombreCliente}</span>
        {solicitud.telefono && <span className="text-zinc-600 font-mono text-[11px] truncate">· {solicitud.telefono}</span>}
      </div>

      {/* Enlace — usa URL pública real para casual-uploads */}
      {solicitud.enlace_archivo?.startsWith("pro-vault/") ? (
        <span className="text-xs text-zinc-500 italic truncate block" title={solicitud.enlace_archivo}>
          🔒 {solicitud.enlace_archivo} · usar Descargar
        </span>
      ) : (
        <a
          href={displayHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-sky-400 hover:text-sky-300 truncate block underline decoration-sky-400/30 underline-offset-2"
          title={displayHref}
        >
          {displayHref}
        </a>
      )}

      {/* Body condicional */}
      {isCasual ? (
        <div className="rounded-xl bg-zinc-950 border border-orange-500/20 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ background: (meta["color"] as string) || "#f97316" }} />
            <span className="text-zinc-400">Color:</span>
            <span className="text-white font-medium">{(meta["color"] as string) ?? "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400">Acabado:</span>
            <span className="text-white font-medium">{(meta["acabado"] as string) ?? "—"}</span>
          </div>
          {Boolean(meta["nota"]) && <p className="text-xs text-zinc-500 italic">&ldquo;{String(meta["nota"])}&rdquo;</p>}
        </div>
      ) : (
        <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 space-y-2 font-mono text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-2">
              <div className="text-[10px] tracking-widest text-zinc-500 uppercase">Tolerancia</div>
              <div className="font-semibold text-zinc-200">{(meta["tolerancia"] as string) ?? (meta["tolerancia_dimensional"] as string) ?? "—"}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-2">
              <div className="text-[10px] tracking-widest text-zinc-500 uppercase">Material</div>
              <div className="font-semibold text-zinc-200 truncate">{(meta["material_tecnico"] as string) ?? (meta["materialTecnico"] as string) ?? "—"}</div>
            </div>
          </div>
          {Boolean(meta["densidad_relleno"]) && (
            <div className="text-[11px] text-zinc-500">
              Relleno: <span className="text-zinc-300">{String(meta["densidad_relleno"])}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className={cn("w-2 h-2 rounded-full", meta["nda_aceptado"] ? "bg-amber-500" : "bg-zinc-600")} />
            <span className={meta["nda_aceptado"] ? "text-amber-400" : "text-zinc-500"}>
              {meta["nda_aceptado"] ? "NDA firmado" : "Sin NDA"}
            </span>
          </div>
          {Boolean(meta["tiene_plano_2d"]) && (
            <div
              className={cn(
                "flex items-center gap-1.5 text-[11px] rounded-full border px-2 py-0.5 w-fit",
                meta["requiere_auditoria_manual"] ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", meta["requiere_auditoria_manual"] ? "bg-amber-500" : "bg-emerald-500")} />
              {meta["fuente_definitiva"] === "plano_2d" ? "Plano 2D manda (+Bs 100)" : "Modelo 3D manda"}
            </div>
          )}
        </div>
      )}

      {/* Precio cotizado actual */}
      {solicitud.precio_cotizado != null && (
        <div className="text-xs text-emerald-400 font-bold">Cotizado: Bs {Number(solicitud.precio_cotizado).toFixed(2)}</div>
      )}

      {/* Acciones admin: Input precio + Guardar Cotización */}
      <div className="border-t border-zinc-800 pt-3 space-y-2">
        <label className="text-[11px] font-bold tracking-widest uppercase text-zinc-400 flex items-center gap-1">
          <DollarSign className="h-3 w-3" /> Ingresar Precio (Bs)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            suppressHydrationWarning
            min="0"
            step="0.01"
            placeholder="Ej. 89.90"
            value={precioInput}
            onChange={(e) => setPrecioInput(e.target.value)}
            className="flex-1 h-9 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
          />
          <button
            onClick={handleGuardar}
            disabled={saving || !precioInput}
            className="h-9 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5"
          >
            {saving ? "..." : <><Check className="h-3 w-3" /> Guardar Cotización</>}
          </button>
        </div>
        <p className="text-[11px] text-zinc-600">Al guardar, el estado pasa a <b className="text-sky-400">Cotizado</b> y la tarjeta se mueve.</p>
        {msg && <p className="text-xs text-zinc-400">{msg}</p>}
      </div>

      {/* Botón descarga solo profesional */}
      {!isCasual && (
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 border border-zinc-700 text-white text-xs font-bold flex items-center justify-center gap-2"
        >
          <Download className="h-4 w-4" />
          {downloading ? "Generando link..." : "Descargar Archivos STL/PDF"}
        </button>
      )}
      {!isCasual && <p className="text-[11px] text-zinc-600 font-mono text-center">Link temporal 60s · requiere sesión admin</p>}

      {/* Fase 3: Notificar por WhatsApp — solo cuando está Cotizado */}
      {solicitud.estado === "Cotizado" &&
        (() => {
          const tel = getTelefono(solicitud);
          const { href } = buildWhatsAppLink(solicitud);
          const hasPrecio = solicitud.precio_cotizado != null;
          const disabled = !href || !tel || !hasPrecio;
          const caracteristicas = solicitud.tipo_pedido === "casual"
            ? `${(meta["color"] as string) ?? "—"}/${(meta["acabado"] as string) ?? "—"}`
            : `${(meta["tolerancia"] as string) ?? "—"}`;
          return (
            <div className="space-y-1.5">
              <a
                href={href ?? undefined}
                target={href ? "_blank" : undefined}
                rel={href ? "noopener noreferrer" : undefined}
                aria-disabled={disabled}
                onClick={(e) => {
                  if (disabled) e.preventDefault();
                }}
                className={`w-full h-10 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors border ${
                  disabled
                    ? "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"
                    : "bg-[#25D366] hover:bg-[#1ebe5d] border-[#25D366] text-white shadow-lg shadow-[#25D366]/20"
                }`}
                title={disabled ? (!tel ? "Sin teléfono del cliente" : !hasPrecio ? "Falta precio" : "") : `Abrir WhatsApp a ${tel}`}
              >
                <MessageCircle className="h-4 w-4" />
                Notificar por WhatsApp
              </a>
              {disabled ? (
                <p className="text-[11px] text-amber-400 text-center">{!tel ? "Falta teléfono (wa.me)" : !hasPrecio ? "Falta precio cotizado" : ""}</p>
              ) : (
                <p className="text-[11px] text-zinc-500 text-center font-mono">
                  wa.me/{tel} · Bs {Number(solicitud.precio_cotizado).toFixed(2)} · {caracteristicas} · abre WhatsApp con mensaje codificado
                </p>
              )}
            </div>
          );
        })()}

      {/* TRANSICIONES DE ESTADO — botones dependientes del estado actual */}
      {solicitud.estado === "Cotizado" && (
        <button
          onClick={() => handleTransition("Imprimiendo")}
          disabled={!!transitioning}
          className="w-full h-10 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-2 border border-violet-700 shadow-lg shadow-violet-600/20"
        >
          {transitioning === "Imprimiendo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
          Empezar a Imprimir
        </button>
      )}
      {solicitud.estado === "Imprimiendo" && (
        <button
          onClick={() => handleTransition("Terminado")}
          disabled={!!transitioning}
          className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-2 border border-emerald-700 shadow-lg shadow-emerald-600/20"
        >
          {transitioning === "Terminado" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Finalizar Pieza
        </button>
      )}
      {solicitud.estado === "Terminado" && (
        <button
          disabled
          className="w-full h-9 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-bold flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
          title="Pieza terminada — opcional archivar fuera del tablero"
        >
          <Archive className="h-4 w-4" /> Archivado / Entregado ✓
        </button>
      )}
      {solicitud.estado === "Terminado" && (
        <p className="text-[11px] text-zinc-600 text-center font-mono">Puedes ocultar esta tarjeta manualmente</p>
      )}
    </div>
  );
}

// ---------- KanbanBoard ----------
export default function KanbanBoard({ initialSolicitudes }: { initialSolicitudes: Solicitud[] }) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(initialSolicitudes);

  const grouped = useMemo(() => {
    const g: Record<EstadoPedido, Solicitud[]> = {
      Pendiente: [],
      Cotizado: [],
      Imprimiendo: [],
      Terminado: [],
    };
    for (const s of solicitudes) {
      const est = (s.estado as EstadoPedido) || "Pendiente";
      if (ESTADOS.includes(est)) g[est].push(s);
      else g["Pendiente"].push(s);
    }
    return g;
  }, [solicitudes]);

  const handleCotizar = async (id: string, precio: number) => {
    const supabase = createClient();
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { data, error } = await supabase
        .from("solicitudes")
        .update({ precio_cotizado: precio, estado: "Cotizado" })
        .eq("id", id)
        .select()
        .single();
      if (!error && data) {
        // Refresco local inmediato — tarjeta salta a columna Cotizado
        setSolicitudes((prev) => prev.map((s) => (getId(s) === id ? ({ ...s, precio_cotizado: precio, estado: "Cotizado" } as Solicitud) : s)));
        return;
      }
      if (error) console.warn("Supabase update fallo, fallback API:", error.message);
    }
    const res = await fetch(`/api/solicitudes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ precio_cotizado: precio, estado: "Cotizado" }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error((j as { error?: string }).error || "Error al guardar cotización");
    }
    setSolicitudes((prev) => prev.map((s) => (getId(s) === id ? { ...s, precio_cotizado: precio, estado: "Cotizado" } : s)));
  };

  // Transición genérica de estado (Cotizado → Imprimiendo → Terminado) con refresco instantáneo
  const handleTransition = async (id: string, nextEstado: EstadoPedido) => {
    const supabase = createClient();
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { data, error } = await supabase.from("solicitudes").update({ estado: nextEstado }).eq("id", id).select().single();
      if (!error && data) {
        setSolicitudes((prev) => prev.map((s) => (getId(s) === id ? ({ ...s, estado: nextEstado } as Solicitud) : s)));
        return;
      }
      if (error) console.warn("Supabase transition fallo, fallback API:", error.message);
    }
    const res = await fetch(`/api/solicitudes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nextEstado }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error((j as { error?: string }).error || `Error al mover a ${nextEstado}`);
    }
    const updated = await res.json().catch(() => null);
    // Mutación local optimista — mueve visualmente al instante a la columna correcta
    setSolicitudes((prev) => prev.map((s) => (getId(s) === id ? ({ ...s, ...(updated ?? {}), estado: nextEstado } as Solicitud) : s)));
  };

  const handleDownload = async (s: Solicitud) => {
    const meta = s.metadata ?? {};
    // Rutas guardadas en DB: enlace_archivo = "pro-vault/modelos/b2b_...stl", metadata.plano_url = "pro-vault/planos/b2b_...pdf"
    const rutas: string[] = [];
    if (s.enlace_archivo) rutas.push(s.enlace_archivo);
    const plano = (meta["plano_url"] as string) || (meta["planoUrl"] as string) || (meta["plano_path"] as string);
    if (plano && !rutas.includes(plano)) rutas.push(plano);
    // También soporta metadata.modelo_url
    const modeloAlt = (meta["modelo_url"] as string) || (meta["modelo_path"] as string);
    if (modeloAlt && !rutas.includes(modeloAlt)) rutas.unshift(modeloAlt);

    if (rutas.length === 0) throw new Error("No hay archivos para descargar");

    const supabase = createClient();

    for (const ruta of rutas) {
      // Si es URL http o /uploads local, descargar directo (fallback dev)
      if (ruta.startsWith("http") || ruta.startsWith("/uploads")) {
        window.open(ruta, "_blank");
        continue;
      }

      const { bucket, path } = extractBucketPath(ruta);
      // createSignedUrl 60s — solo funciona con sesión admin activa (RLS SELECT solo autenticados)
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
      if (error) throw new Error(`No se pudo generar link para ${path}: ${error.message}`);
      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-orange-500 rounded-full" /> Casual = borde naranja + regalo
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-zinc-800 border border-zinc-700" /> Profesional = gris industrial + engranaje
        </span>
        <span className="ml-auto text-[11px] font-mono">Total: {solicitudes.length} solicitudes</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {ESTADOS.map((estado) => {
          const list = grouped[estado];
          const meta = ESTADO_META[estado];
          return (
            <div key={estado} className="rounded-2xl border border-zinc-800 bg-zinc-950/50 flex flex-col min-h-[380px]">
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
                    <span className="text-xs">Vacío</span>
                    <span className="text-[11px] text-zinc-700">Sin solicitudes</span>
                  </div>
                ) : (
                  list.map((s) => (
                    <SolicitudCard
                      key={getId(s) || String(s.created_at ?? Math.random())}
                      solicitud={s}
                      onCotizar={handleCotizar}
                      onDownload={handleDownload}
                      onTransition={handleTransition}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { ESTADOS };
