"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, Shield, Cpu, Building2, Check, FileBox, Sliders, Ruler, FileText, AlertTriangle, Scale, Box, PenTool } from "lucide-react";
import { WizardShell } from "./WizardShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSupabaseUpload } from "@/lib/useSupabaseUpload";
import { createClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toaster";
import { useMateriales } from "@/lib/useMateriales";

const materialesFallback = [
  { id: "PLA", label: "PLA", desc: "Prototipos visuales, bajo costo", temp: "210°C" },
  { id: "PETG", label: "PETG", desc: "Resistencia química y exterior", temp: "240°C" },
  { id: "ABS", label: "ABS", desc: "Piezas mecánicas, alta temp", temp: "250°C" },
  { id: "TPU", label: "TPU 95A", desc: "Flexible / elastómero", temp: "230°C" },
  { id: "Nylon", label: "Nylon PA12", desc: "Alta resistencia mecánica", temp: "260°C" },
];

const materialMeta: Record<string, { desc: string; temp: string }> = {
  PLA: { desc: "Prototipos visuales, bajo costo", temp: "210°C" },
  PETG: { desc: "Resistencia química y exterior", temp: "240°C" },
  ABS: { desc: "Piezas mecánicas, alta temp", temp: "250°C" },
  "TPU 95A": { desc: "Flexible / elastómero", temp: "230°C" },
  TPU: { desc: "Flexible / elastómero", temp: "230°C" },
  "Nylon PA12": { desc: "Alta resistencia mecánica", temp: "260°C" },
  Nylon: { desc: "Alta resistencia mecánica", temp: "260°C" },
  ASA: { desc: "Exterior UV, alta temp", temp: "245°C" },
};
const densidades = ["20%", "50%", "100%"] as const;
const tolerancias = ["0.1mm", "0.2mm", "0.5mm"] as const;

const STEPS = [
  { id: 1, label: "Archivo + NDA", icon: FileBox },
  { id: 2, label: "Parámetros", icon: Sliders },
  { id: 3, label: "Empresa", icon: Building2 },
];

const ALLOWED_MODEL_EXT = [".stl", ".step", ".stp", ".3mf", ".obj"];
const ALLOWED_PDF_EXT = [".pdf"];
const ALLOWED_DISENO_EXT = [".pdf", ".jpg", ".jpeg", ".png"];
type FuenteDefinitiva = "modelo_3d" | "plano_2d";

function DropZone({
  title,
  subtitle,
  accept,
  file,
  required,
  onFile,
  onClear,
  icon: Icon,
  draggingLabel,
  isUploading,
  progress,
}: {
  title: string;
  subtitle: string;
  accept: string;
  file: File | null;
  required?: boolean;
  onFile: (f: File) => void;
  onClear: () => void;
  icon: React.ComponentType<{ className?: string }>;
  draggingLabel: string;
  isUploading?: boolean;
  progress?: number;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) onFile(f);
    },
    [onFile]
  );

  return (
    <div className="space-y-2">
      <Label className="font-mono text-xs tracking-widest uppercase flex items-center gap-2">
        {title} {required && <span className="text-red-400">*</span>}
        {!required && <span className="text-zinc-500 font-normal normal-case tracking-normal">(opcional)</span>}
      </Label>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); }}}
        className={`w-full rounded-2xl border-2 border-dashed p-6 md:p-8 text-center space-y-3 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/40 ${
          file ? "border-emerald-500/50 bg-emerald-500/5" : dragOver ? "border-orange-500 bg-orange-500/10" : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"
        }`}
      >
        <div className={`mx-auto h-12 w-12 rounded-2xl flex items-center justify-center ${file ? "bg-emerald-500 text-white" : dragOver ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-400"}`}>
          {file ? <Check className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
        </div>
        <div>
          <p className="text-sm font-bold text-white">{file ? file.name : dragOver ? draggingLabel : "Arrastra y suelta o haz clic para seleccionar"}</p>
          <p className="text-xs font-mono text-zinc-500 mt-1">{subtitle}</p>
        </div>
        {file && <p className="text-xs font-mono text-emerald-400">{(file.size / 1024 / 1024).toFixed(2)} MB · Listo</p>}
        {isUploading && (
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 transition-all" style={{ width: `${progress ?? 0}%` }} />
          </div>
        )}
        {file ? (
          <span onClick={(e) => { e.stopPropagation(); onClear(); }} className="inline-block text-xs font-mono text-red-400 underline hover:text-red-300">
            Quitar archivo
          </span>
        ) : (
          <p className="text-[11px] font-mono text-zinc-600">Máx 50MB (modelo) · 20MB (PDF/imagen)</p>
        )}
      </div>
    </div>
  );
}

export function ProfesionalWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const uploaderModel = useSupabaseUpload();
  const uploaderPdf = useSupabaseUpload();
  const { materiales: materialesDinamicos, loading: loadingProfesional } = useMateriales("profesional");

  const materiales = materialesDinamicos.length > 0
    ? materialesDinamicos.map((m) => ({
        id: m.nombre,
        label: m.nombre,
        desc: materialMeta[m.nombre]?.desc ?? "Material técnico disponible",
        temp: materialMeta[m.nombre]?.temp ?? "—",
      }))
    : materialesFallback;

  const [step, setStep] = useState(1);
  const [serviceType, setServiceType] = useState<'impresion' | 'diseno'>('impresion');
  const [modelo3d, setModelo3d] = useState<File | null>(null);
  const [planoPdf, setPlanoPdf] = useState<File | null>(null);
  const [fuenteDefinitiva, setFuenteDefinitiva] = useState<FuenteDefinitiva>("modelo_3d");
  const [link, setLink] = useState("");
  const [nda, setNda] = useState(false);
  const [material, setMaterial] = useState("PETG");
  const [densidad, setDensidad] = useState("50%");
  const [tolerancia, setTolerancia] = useState("0.2mm");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nota, setNota] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Material efectivo: si llega el fetch dinámico y el material actual ya no existe, usa el primero de la lista
  const selectedMaterial = materiales.length > 0 && !materiales.some((m) => m.id === material) ? materiales[0].id : material;

  const isImpresion = serviceType === 'impresion';
  const isDiseno = serviceType === 'diseno';
  const hasPdf = planoPdf !== null;
  const fileOk = modelo3d !== null || link.trim().length > 8;
  // Validación dinámica por bifurcación
  const paso1Ok = isImpresion
    ? (fileOk && nda === true && (!hasPdf || (fuenteDefinitiva === "modelo_3d" || fuenteDefinitiva === "plano_2d")))
    : hasPdf; // diseno: plano/imagen obligatorio, sin NDA ni modelo
  const paso2Ok = Boolean(selectedMaterial && densidad && tolerancia);
  // Email opcional (Zod: z.string().email().optional().or(z.literal(''))) — solo WhatsApp obligatorio
  const isEmailOptionalValid = (v: string) => v.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const paso3Ok = empresa.trim().length >= 2 && telefono.trim().replace(/\D/g, "").length >= 8 && isEmailOptionalValid(email);
  const canGoNext = step === 1 ? paso1Ok : step === 2 ? paso2Ok : paso3Ok;

  const handleNext = () => {
    if (!canGoNext) return;
    setError("");
    setStep((s) => Math.min(3, s + 1));
  };
  const handlePrev = () => setStep((s) => Math.max(1, s - 1));

  const handleModeloFile = (f: File) => {
    const ext = "." + (f.name.split(".").pop()?.toLowerCase() ?? "");
    if (!ALLOWED_MODEL_EXT.includes(ext)) {
      setError(`Modelo: extensión ${ext} no permitida. Usa ${ALLOWED_MODEL_EXT.join(", ")}`);
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError("Modelo excede 50MB (límite lógico pro-vault)");
      return;
    }
    setError("");
    setModelo3d(f);
  };

  const handlePdfFile = (f: File) => {
    const ext = "." + (f.name.split(".").pop()?.toLowerCase() ?? "");
    // Bifurcación: validación dinámica
    if (isDiseno) {
      if (!ALLOWED_DISENO_EXT.includes(ext)) {
        setError(`Referencia: extensión ${ext} no permitida. Usa ${ALLOWED_DISENO_EXT.join(", ")} (JPG, PNG, PDF)`);
        return;
      }
      // validación mime esperada
      const allowedMime = ["image/jpeg", "image/png", "application/pdf"];
      if (f.type && !allowedMime.includes(f.type) && !f.type.startsWith("image/")) {
        // Permitir image/* genérico pero advertir si no es alguno de los tres principales
        // No bloqueamos duro si es image/xxx
      }
      if (f.size > 20 * 1024 * 1024) {
        setError("Archivo excede 20MB (límite para plano/imagen)");
        return;
      }
    } else {
      if (!ALLOWED_PDF_EXT.includes(ext)) {
        setError(`Plano: solo .pdf (recibido ${ext})`);
        return;
      }
      if (f.type && f.type !== "application/pdf") {
        setError("El plano debe ser PDF (application/pdf)");
        return;
      }
      if (f.size > 20 * 1024 * 1024) {
        setError("PDF excede 20MB (límite lógico)");
        return;
      }
    }
    setError("");
    setPlanoPdf(f);
  };

  /**
   * FLUJO FASE 2: Subida segura a `pro-vault` ANTES del INSERT
   * 1. upload modelo 3D (y plano si existe) a bucket PRIVADO pro-vault con nombre b2b_<uuid>.ext
   * 2. obtener rutas internas (pro-vault/modelos/b2b_...stl) — solo accesible con RLS + signedUrl
   * 3. INSERT en solicitudes con tipo_pedido='profesional' y metadata + rutas
   * BIFURCACIÓN: diseno => solo plano/imagen obligatorio, modelo_url = null, requiere_diseno = true
   */
  const handleSubmit = async () => {
    if (!paso1Ok || !paso2Ok || !paso3Ok) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      let enlaceArchivo = link.trim() || "";
      let modeloPath: string | null = null;
      let planoPath: string | null = null;

      // BIFURCACIÓN DE SUBIDA
      if (isImpresion) {
        // 1) SUBIDA SEGURA al bucket PRIVADO pro-vault (ofuscado) — Solo Impresión
        if (modelo3d) {
          const res = await uploaderModel.upload(modelo3d, { bucket: "pro-vault", prefix: "b2b", maxSizeMB: 50 });
          modeloPath = res.path; // ej: pro-vault/modelos/b2b_...stl
          enlaceArchivo = modeloPath;
        }
        if (planoPdf) {
          const resPdf = await uploaderPdf.upload(planoPdf, { bucket: "pro-vault", prefix: "b2b", maxSizeMB: 20 });
          planoPath = resPdf.path; // ej: pro-vault/planos/b2b_...pdf
        }
        if (!enlaceArchivo) throw new Error("Debes subir el Modelo 3D o pegar un link");
      } else {
        // Servicio de Diseño CAD: solo referencia (imagen/pdf) obligatoria
        if (!planoPdf) throw new Error("Debes subir fotos, planos o bocetos para el servicio de diseño CAD");
        const resPdf = await uploaderPdf.upload(planoPdf, { bucket: "pro-vault", prefix: "b2b", maxSizeMB: 20 });
        planoPath = resPdf.path; // ej: pro-vault/planos/b2b_...jpg o .pdf
        enlaceArchivo = planoPath;
        modeloPath = null; // explícitamente NULL permitido
        if (!enlaceArchivo) throw new Error("Debes subir la referencia para diseño");
      }

      const requiereAuditoria = isImpresion && hasPdf && fuenteDefinitiva === "plano_2d";
      const requiereDiseno = isDiseno;
      const emailNorm = email.trim() === "" ? null : email.trim(); // opcional: "" -> null para no romper esquema
      const nombreProfesional = empresa.trim(); // para columna `nombre` (empresa es el nombre del cliente B2B)
      const metadata: Record<string, unknown> = {
        requiere_diseno: requiereDiseno,
        tolerancia,
        nda_aceptado: isImpresion ? nda : false,
        material_tecnico: selectedMaterial,
        densidad_relleno: densidad,
        empresa: empresa.trim(),
        nombre: nombreProfesional,
        ...(emailNorm ? { email: emailNorm } : {}),
        telefono: telefono.trim(),
        nota: nota.trim() || undefined,
        tiene_plano_2d: isImpresion ? hasPdf : true,
        fuente_definitiva: isImpresion && hasPdf ? fuenteDefinitiva : undefined,
        requiere_auditoria_manual: requiereAuditoria,
        costo_auditoria: requiereAuditoria ? 100 : 0,
        responsabilidad: isDiseno ? "requiere_diseno_cad" : hasPdf ? (fuenteDefinitiva === "modelo_3d" ? "cliente_asume_modelo_3d" : "auditoria_manual_solicitada") : "solo_modelo_3d",
        modelo_url: modeloPath, // NULL permitido en modo diseno
        ...(planoPath ? { plano_url: planoPath } : {}),
      };

      // 2) INSERT con rutas internas (no URL pública, bucket privado) + telefono y nombre para wa.me y Kanban
      // ENVÍO SEGURO: email vacío se omite/null para no lanzar error de esquema
      const supabase = createClient();
      const { error: insertError } = await supabase.from("solicitudes").insert({
        enlace_archivo: enlaceArchivo,
        tipo_pedido: "profesional",
        estado: "Pendiente",
        telefono: telefono.trim() || null,
        nombre: nombreProfesional || null,
        metadata,
      });

      if (insertError) {
        // fallback dev sin tabla supabase
        const res = await fetch("/api/solicitudes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enlace_archivo: enlaceArchivo, tipo_pedido: "profesional", telefono: telefono.trim(), nombre: nombreProfesional, metadata }),
        });
        if (!res.ok) throw new Error(insertError.message);
      }

      toast({ title: "Solicitud profesional enviada", description: requiereDiseno ? "Solicitud de diseño CAD enviada. El costo de modelado se añadirá a tu cotización." : "Recibirás tu cotización en tu correo en menos de 4h.", variant: "success" });
      router.push("/cotizar/exito");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
      toast({ title: "Error al enviar", description: e instanceof Error ? e.message : "Intenta de nuevo", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const isUploading = uploaderModel.isUploading || uploaderPdf.isUploading;

  return (
    <WizardShell
      steps={STEPS}
      currentStep={step}
      onStepChange={setStep}
      variant="profesional"
      canGoNext={canGoNext && !isUploading}
      onNext={handleNext}
      onPrev={handlePrev}
      onSubmit={handleSubmit}
      isSubmitting={submitting || isUploading}
      nextLabel="Siguiente: Parámetros"
      submitLabel={isUploading ? `Subiendo a pro-vault ${Math.max(uploaderModel.progress, uploaderPdf.progress)}%...` : isDiseno ? "Solicitar cotización con diseño" : hasPdf && fuenteDefinitiva === "plano_2d" ? "Solicitar con auditoría (+Bs 100)" : "Solicitar cotización"}
    >
      {step === 1 && (
        <div className="space-y-6">
          {/* SELECTOR BIFURCACIÓN */}
          <div className="space-y-3">
            <p className="text-xs font-mono font-bold tracking-widest uppercase text-zinc-400">Tipo de servicio *</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setServiceType('impresion'); setError(""); }}
                className={`relative flex gap-3 rounded-2xl border-2 p-4 text-left transition-all ${isImpresion ? "border-orange-500 bg-orange-500/10" : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"}`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isImpresion ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-400"}`}>
                  <Box className="h-5 w-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <p className={`text-sm font-mono font-bold leading-tight ${isImpresion ? "text-white" : "text-zinc-300"}`}>Ya tengo mi archivo 3D (STL/STEP)</p>
                  <p className="text-xs text-zinc-500">Solo Impresión</p>
                </div>
                {isImpresion && <Check className="h-5 w-5 text-orange-500 shrink-0 mt-1" />}
              </button>
              <button
                type="button"
                onClick={() => { setServiceType('diseno'); setError(""); }}
                className={`relative flex gap-3 rounded-2xl border-2 p-4 text-left transition-all ${isDiseno ? "border-orange-500 bg-orange-500/10" : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"}`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isDiseno ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-400"}`}>
                  <PenTool className="h-5 w-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <p className={`text-sm font-mono font-bold leading-tight ${isDiseno ? "text-white" : "text-zinc-300"}`}>Necesito servicio de diseño 3D</p>
                  <p className="text-xs text-zinc-500">Modelado CAD</p>
                </div>
                {isDiseno && <Check className="h-5 w-5 text-orange-500 shrink-0 mt-1" />}
              </button>
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-mono font-bold tracking-tight text-white flex items-center gap-2">
                <Upload className="h-4 w-4 text-orange-500" /> 01 — CARGA SEGURA
              </h2>
              <p className="text-xs font-mono text-zinc-500">Tus archivos están protegidos y son confidenciales</p>
            </div>
            <span className="bg-orange-500/15 text-orange-500 border border-orange-500/20 font-mono text-[10px] px-2.5 py-1 rounded-full">ENCRYPTED</span>
          </div>

          {isImpresion && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex gap-3">
              <Shield className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-mono font-bold text-amber-400 tracking-widest uppercase">Acuerdo de Confidencialidad (NDA) — Obligatorio *</p>
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  Tus archivos son confidenciales y se usan solo para tu cotización. Eliminación automática en 30 días.
                </p>
                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input type="checkbox" checked={nda} onChange={(e) => setNda(e.target.checked)} className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-orange-500 accent-orange-500" />
                  <span className="text-xs font-mono text-zinc-300">Acepto el Acuerdo de Confidencialidad (NDA) *</span>
                </label>
                {!nda && <p className="text-xs font-mono text-amber-400">Debes aceptar el NDA para enviar.</p>}
              </div>
            </div>
          )}

          {isImpresion ? (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <DropZone
                  title="Modelo 3D"
                  subtitle="STL, STEP, 3MF, OBJ"
                  accept=".stl,.step,.stp,.3mf,.obj"
                  file={modelo3d}
                  required
                  onFile={handleModeloFile}
                  onClear={() => setModelo3d(null)}
                  icon={FileBox}
                  draggingLabel="Suelta el Modelo 3D aquí"
                  isUploading={uploaderModel.isUploading}
                  progress={uploaderModel.progress}
                />
                <DropZone
                  title="Plano Técnico (PDF)"
                  subtitle="PDF 2D — cotas, tolerancias (opcional)"
                  accept=".pdf,application/pdf"
                  file={planoPdf}
                  onFile={handlePdfFile}
                  onClear={() => setPlanoPdf(null)}
                  icon={FileText}
                  draggingLabel="Suelta el PDF aquí"
                  isUploading={uploaderPdf.isUploading}
                  progress={uploaderPdf.progress}
                />
              </div>
              <p className="text-xs font-mono text-zinc-500">Formatos: STL, STEP, 3MF, OBJ y PDF · Hasta 50MB (modelo) · 20MB (PDF)</p>

              {!modelo3d && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-zinc-700" />
                    <span className="text-xs font-mono text-zinc-500 tracking-widest uppercase">o link privado</span>
                    <div className="h-px flex-1 bg-zinc-700" />
                  </div>
                  <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://drive.google.com/...  o  https://tu-cdn.com/modelo.step" className="h-11 rounded-xl font-mono text-sm" />
                </>
              )}

              {hasPdf && (
                <div className="rounded-2xl border-2 border-amber-500/40 bg-amber-500/5 p-5 space-y-4 animate-in fade-in">
                  <div className="flex gap-3">
                    <Scale className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-mono font-bold text-amber-400">En caso de discrepancia, ¿cuál archivo manda?</p>
                      <p className="text-xs font-mono text-zinc-500">Elige la referencia definitiva para tu pieza</p>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <label className={`flex gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${fuenteDefinitiva === "modelo_3d" ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"}`}>
                      <input type="radio" name="fuente_definitiva" value="modelo_3d" checked={fuenteDefinitiva === "modelo_3d"} onChange={() => setFuenteDefinitiva("modelo_3d")} className="mt-1 h-4 w-4 accent-emerald-500" />
                      <div className="flex-1 space-y-1">
                        <p className={`text-sm font-mono font-bold ${fuenteDefinitiva === "modelo_3d" ? "text-emerald-400" : "text-zinc-300"}`}>El Modelo 3D manda (Imprimir tal cual)</p>
                        <p className="text-xs text-zinc-500">PDF referencia · Sin costo extra</p>
                      </div>
                      {fuenteDefinitiva === "modelo_3d" && <Check className="h-5 w-5 text-emerald-500 shrink-0" />}
                    </label>
                    <label className={`flex gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${fuenteDefinitiva === "plano_2d" ? "border-amber-500 bg-amber-500/10" : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"}`}>
                      <input type="radio" name="fuente_definitiva" value="plano_2d" checked={fuenteDefinitiva === "plano_2d"} onChange={() => setFuenteDefinitiva("plano_2d")} className="mt-1 h-4 w-4 accent-amber-500" />
                      <div className="flex-1 space-y-1">
                        <p className={`text-sm font-mono font-bold ${fuenteDefinitiva === "plano_2d" ? "text-amber-400" : "text-zinc-300"}`}>El Plano 2D manda (Requiere auditoría manual — +Bs 100)</p>
                        <p className="text-xs text-zinc-500">Auditamos STL vs PDF · +Bs 100</p>
                      </div>
                      {fuenteDefinitiva === "plano_2d" && <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />}
                    </label>
                  </div>
                </div>
              )}

              {!fileOk && <p className="text-xs font-mono text-amber-400">Sube el Modelo 3D o pega un link para continuar.</p>}
            </>
          ) : (
            <>
              <DropZone
                title="Plano Técnico / Referencia CAD"
                subtitle="Sube fotos de la pieza a replicar, planos o bocetos a mano con medidas."
                accept="image/jpeg, image/png, application/pdf,.jpg,.jpeg,.png,.pdf"
                file={planoPdf}
                required
                onFile={handlePdfFile}
                onClear={() => setPlanoPdf(null)}
                icon={PenTool}
                draggingLabel="Suelta tus fotos/planos aquí"
                isUploading={uploaderPdf.isUploading}
                progress={uploaderPdf.progress}
              />
              <p className="text-xs font-mono text-zinc-400">Formatos: JPG, PNG, PDF · Máx 20MB · Fotos nítidas con medidas facilitan el modelado</p>
              <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
                <p className="text-xs font-mono text-orange-200/90 leading-relaxed">
                  <span className="font-bold text-orange-400">Aviso:</span> El servicio de modelado CAD tiene un costo por hora de ingeniería que se añadirá a tu cotización.
                </p>
              </div>
              {!hasPdf && <p className="text-xs font-mono text-amber-400">Sube fotos, planos o bocetos para continuar con el servicio de diseño.</p>}
            </>
          )}

          {(uploaderModel.error || uploaderPdf.error) && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{uploaderModel.error || uploaderPdf.error}</p>}
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-lg font-mono font-bold tracking-tight text-white flex items-center gap-2">
            <Cpu className="h-4 w-4 text-orange-500" /> 02 — PARÁMETROS TÉCNICOS
          </h2>
          <div className="space-y-3">
            <p className="text-xs font-mono font-bold tracking-widest uppercase text-zinc-400">
              Material técnico * {loadingProfesional && <span className="text-[11px] font-normal normal-case tracking-normal text-zinc-500">· Cargando materiales...</span>}
            </p>
            {loadingProfesional ? (
              <div className="grid md:grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 flex items-center justify-between animate-pulse">
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-zinc-800 rounded" />
                      <div className="h-3 w-32 bg-zinc-800 rounded" />
                    </div>
                    <div className="h-6 w-12 bg-zinc-800 rounded-full" />
                  </div>
                ))}
              </div>
            ) : materiales.length === 0 ? (
              <p className="text-xs text-amber-400">No hay materiales disponibles en este momento.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-2">
                {materiales.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMaterial(m.id)}
                    className={`text-left rounded-xl border p-3 flex items-center justify-between transition-all ${selectedMaterial === m.id ? "border-orange-500 bg-orange-500/10" : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"}`}
                  >
                    <div>
                      <p className={`text-sm font-mono font-bold ${selectedMaterial === m.id ? "text-white" : "text-zinc-300"}`}>{m.label}</p>
                      <p className="text-xs text-zinc-500">{m.desc}</p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-600 border border-zinc-700 rounded-full px-2 py-1">{m.temp}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-xs font-mono font-bold tracking-widest uppercase text-zinc-400 flex items-center gap-2">
                <Sliders className="h-3 w-3" /> Densidad relleno *
              </p>
              <div className="grid grid-cols-3 gap-2">
                {densidades.map((d) => (
                  <button key={d} type="button" onClick={() => setDensidad(d)} className={`h-11 rounded-xl border text-sm font-mono font-bold transition-colors ${densidad === d ? "bg-white text-zinc-900 border-white" : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-600"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-mono font-bold tracking-widest uppercase text-zinc-400 flex items-center gap-2">
                <Ruler className="h-3 w-3" /> Tolerancia *
              </p>
              <div className="grid grid-cols-3 gap-2">
                {tolerancias.map((t) => (
                  <button key={t} type="button" onClick={() => setTolerancia(t)} className={`h-11 rounded-xl border text-sm font-mono font-bold transition-colors ${tolerancia === t ? "bg-white text-zinc-900 border-white" : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-600"}`}>
                    ±{t}
                  </button>
                ))}
              </div>
              {tolerancia === "0.5mm" && <p className="text-[11px] font-mono text-amber-400">±0.5mm tolerancia amplia.</p>}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-lg font-mono font-bold tracking-tight text-white flex items-center gap-2">
            <Building2 className="h-4 w-4 text-orange-500" /> 03 — DATOS EMPRESA
          </h2>
          <p className="text-xs font-mono text-zinc-500">WhatsApp obligatorio · Email opcional · Empresa para factura</p>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="text-xs font-mono tracking-widest uppercase text-zinc-400">Empresa *</span>
              <Input value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Ingeniería SpA" className="h-11 rounded-xl font-mono" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-mono tracking-widest uppercase text-zinc-400">Email <span className="text-zinc-500 font-normal">(opcional)</span></span>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="proyectos@empresa.cl (opcional)" type="email" className="h-11 rounded-xl font-mono" />
              {email.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && <span className="text-xs font-mono text-amber-400">Email inválido — deja vacío si no quieres usarlo</span>}
              <span className="text-[11px] font-mono text-zinc-600">Opcional · WhatsApp es el contacto principal</span>
            </label>
          </div>
          <label className="space-y-1.5 block">
            <span className="text-xs font-mono tracking-widest uppercase text-zinc-400">Teléfono / WhatsApp *</span>
            <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+591 73854684" className="h-11 rounded-xl font-mono" />
          </label>
          <label className="space-y-1.5 block">
            <span className="text-xs font-mono tracking-widest uppercase text-zinc-400">Nota técnica (opcional)</span>
            <Textarea value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej: Requiere insertos M3..." rows={3} className="rounded-xl font-mono" />
          </label>
          <div className="rounded-xl bg-zinc-900 border border-zinc-700 p-4 space-y-2 font-mono text-xs">
            <p className="font-bold text-zinc-300 tracking-widest uppercase">Resumen</p>
            <p className="text-zinc-500">Servicio: <span className="text-orange-400">{isDiseno ? "Diseño CAD + Impresión" : "Solo Impresión"}</span></p>
            {isImpresion ? (
              <>
                <p className="text-zinc-500">Archivo: <span className="text-zinc-200 break-all">{modelo3d ? `${modelo3d.name} → pro-vault` : link || "—"}</span></p>
                {hasPdf && <p className="text-zinc-500">Plano: <span className="text-zinc-200 break-all">{planoPdf!.name} → pro-vault</span></p>}
                <p className="text-zinc-500">NDA: <span className="text-emerald-400">{nda ? "Aceptado ✓" : "Pendiente"}</span></p>
              </>
            ) : (
              <>
                <p className="text-zinc-500">Referencia diseño: <span className="text-zinc-200 break-all">{planoPdf ? `${planoPdf.name} → pro-vault (requiere_diseno)` : "—"}</span></p>
                <p className="text-amber-400">+ Costo hora ingeniería CAD se añadirá</p>
              </>
            )}
          </div>
          {!paso3Ok && <p className="text-xs font-mono text-zinc-500 text-right">Completa empresa y WhatsApp (8+ dígitos). Email es opcional.</p>}
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}
        </div>
      )}
    </WizardShell>
  );
}
