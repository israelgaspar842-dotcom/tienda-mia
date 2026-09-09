"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Link2, Palette, User, Gift, Sparkles, Check, Upload } from "lucide-react";
import { WizardShell } from "./WizardShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useSupabaseUpload } from "@/lib/useSupabaseUpload";
import { createClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toaster";

const STEPS = [
  { id: 1, label: "Tu modelo", icon: Link2 },
  { id: 2, label: "Color y estilo", icon: Palette },
  { id: 3, label: "Contacto", icon: User },
];

function isValidUrl(v: string) {
  if (!v.trim()) return false;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function CasualWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const uploader = useSupabaseUpload();

  // EXTRACCIÓN DE DATOS (Fetch): materiales casuales disponibles
  const [availableColors, setAvailableColors] = useState<{ id: string; nombre: string }[]>([]);
  const [loadingColors, setLoadingColors] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchColors() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from("materiales").select("id, nombre").eq("categoria", "casual").eq("estado", "Disponible").order("nombre", { ascending: true });
        if (error) throw error;
        if (!cancelled) {
          setAvailableColors((data ?? []) as { id: string; nombre: string }[]);
        }
      } catch {
        if (!cancelled) setAvailableColors([]);
      } finally {
        if (!cancelled) setLoadingColors(false);
      }
    }
    fetchColors();
    return () => {
      cancelled = true;
    };
  }, []);

  const [step, setStep] = useState(1);
  const [enlace, setEnlace] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [estiloColor, setEstiloColor] = useState<"single" | "multicolor">("single");
  const [color, setColor] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nota, setNota] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Selecciona primer color disponible automáticamente
  useEffect(() => {
    if (availableColors.length > 0 && !color) {
      setColor(availableColors[0].nombre);
    }
  }, [availableColors, color]);

  // Si se queda con menos de 2 colores, forzar single
  useEffect(() => {
    if (availableColors.length < 2 && estiloColor === "multicolor") {
      setEstiloColor("single");
    }
  }, [availableColors.length, estiloColor]);

  const selectedColor = color;

  const isEmailOptionalValid = (v: string) => v.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const paso1Ok = Boolean(file) || isValidUrl(enlace);
  const paso2Ok = Boolean(selectedColor);
  const paso3Ok = nombre.trim().length >= 2 && telefono.replace(/\D/g, "").length >= 8 && isEmailOptionalValid(email);
  const canGoNext = step === 1 ? paso1Ok : step === 2 ? paso2Ok : paso3Ok;

  const handleNext = () => {
    if (!canGoNext) return;
    setError("");
    setStep((s) => Math.min(3, s + 1));
  };
  const handlePrev = () => setStep((s) => Math.max(1, s - 1));

  /**
   * FLUJO CORRECTO FASE 2: Subir ANTES de insertar
   * 1. upload imagen a `casual-uploads` con crypto.randomUUID() (hook)
   * 2. obtener path (ej: casual-uploads/referencias/casual_<uuid>.jpg)
   * 3. INSERT en `solicitudes` con tipo_pedido='casual' y metadata JSONB
   */
  const handleSubmit = async () => {
    if (!paso1Ok || !paso2Ok || !paso3Ok) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      let enlaceArchivo = enlace.trim() || "";

      if (file) {
        const { path } = await uploader.upload(file, { bucket: "casual-uploads", prefix: "casual", maxSizeMB: 5 });
        enlaceArchivo = path;
      }

      if (!enlaceArchivo) throw new Error("Debes subir una imagen de referencia o pegar un enlace");

      const telefonoNorm = telefono.replace(/\s+/g, " ").trim();
      const emailNorm = email.trim() === "" ? null : email.trim();
      const nombreNorm = nombre.trim();
      const supabase = createClient();
      const { error: insertError } = await supabase.from("solicitudes").insert({
        enlace_archivo: enlaceArchivo,
        tipo_pedido: "casual",
        estado: "Pendiente",
        telefono: telefonoNorm || null,
        nombre: nombreNorm || null,
        metadata: {
          color: selectedColor,
          estiloColor,
          nota: nota.trim() || undefined,
          nombre: nombreNorm,
          ...(emailNorm ? { email: emailNorm } : {}),
          telefono: telefonoNorm,
        },
      });

      if (insertError) {
        const res = await fetch("/api/solicitudes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enlace_archivo: enlaceArchivo,
            tipo_pedido: "casual",
            telefono: telefonoNorm,
            nombre: nombreNorm,
            metadata: {
              color: selectedColor,
              estiloColor,
              nota: nota.trim() || undefined,
              nombre: nombreNorm,
              ...(emailNorm ? { email: emailNorm } : {}),
              telefono: telefonoNorm,
            },
          }),
        });
        if (!res.ok) throw new Error(insertError.message);
      }

      toast({ title: "¡Cotización enviada!", description: "Te responderemos en tu correo en menos de 2h.", variant: "success" });
      router.push("/cotizar/exito");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
      toast({ title: "Error al enviar", description: e instanceof Error ? e.message : "Intenta de nuevo", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WizardShell
      steps={STEPS}
      currentStep={step}
      onStepChange={setStep}
      variant="casual"
      canGoNext={canGoNext}
      onNext={handleNext}
      onPrev={handlePrev}
      onSubmit={handleSubmit}
      isSubmitting={submitting || uploader.isUploading}
      nextLabel="Siguiente"
      submitLabel={uploader.isUploading ? `Subiendo ${uploader.progress}%...` : "Enviar cotización"}
    >
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Gift className="h-5 w-5 text-orange-500" /> ¿Qué quieres imprimir?
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400">Sube una imagen de referencia o pega un link de tu modelo.</p>
          </div>

          <div className="space-y-3">
            <Label>Subir imagen de referencia *</Label>
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileRef.current?.click(); } }}
              onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault(); setIsDragging(false);
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) setFile(dropped);
              }}
              className={`w-full p-6 flex flex-col items-center gap-2 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${isDragging ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30' : file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30'}`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${file ? "bg-emerald-500 text-white" : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400"}`}>
                {file ? <Check className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{file ? file.name : "Haz clic para seleccionar imagen"}</span>
              <span className="text-xs text-slate-500 dark:text-zinc-400">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · se subirá como casual_${"uuid"}.jpg` : "O arrastra aquí · JPG, PNG, WEBP, GIF"}</span>
              {file && <span onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-xs text-red-400 underline">Quitar</span>}
            </div>
            {uploader.isUploading && (
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 transition-all" style={{ width: `${uploader.progress}%` }} />
              </div>
            )}
            {uploader.isUploading && <p className="text-xs text-orange-400">Subiendo a casual-uploads... {uploader.progress}%</p>}
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-700" />
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-bold tracking-widest uppercase">o</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-700" />
          </div>

          <div className="space-y-3">
            <Label>Enlace del Modelo (Opcional)</Label>
            <div className="relative">
              <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input value={enlace} onChange={(e) => setEnlace(e.target.value)} placeholder="https://makerworld.com/...  o  https://thingiverse.com/..." className="pl-10 h-12 rounded-2xl" />
            </div>
            {enlace && !isValidUrl(enlace) && <p className="text-xs text-amber-400">URL inválida</p>}
            {isValidUrl(enlace) && <p className="text-xs text-emerald-400 flex items-center gap-1"><Check className="h-3 w-3" /> Link válido</p>}
          </div>

          {!paso1Ok && <p className="text-xs text-slate-500 dark:text-zinc-500">* Sube una imagen o pega un enlace para continuar.</p>}
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Elige cómo se verá</h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400">Personaliza el estilo y el color de tu pieza según el inventario disponible.</p>
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-900 dark:text-white mb-3">ESTILO DE COLOR *</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEstiloColor("single")}
                className={`rounded-2xl border-2 p-4 text-left transition-all ${estiloColor === "single" ? "border-orange-500 bg-orange-500/10" : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-slate-300 dark:hover:border-zinc-600"}`}
              >
                <p className="text-sm font-bold text-slate-900 dark:text-white">Un solo color</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Siempre activa.</p>
                {estiloColor === "single" && <span className="mt-2 inline-flex text-[11px] font-bold text-orange-500">✓ Seleccionado</span>}
              </button>
              <button
                type="button"
                disabled={availableColors.length < 2}
                onClick={() => {
                  if (availableColors.length >= 2) setEstiloColor("multicolor");
                }}
                className={`rounded-2xl border-2 p-4 text-left transition-all ${estiloColor === "multicolor" ? "border-orange-500 bg-orange-500/10" : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-slate-300 dark:hover:border-zinc-600"} ${availableColors.length < 2 ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <p className="text-sm font-bold text-slate-900 dark:text-white">Multicolor (AMS)</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Varios colores en una pieza.</p>
                {estiloColor === "multicolor" && availableColors.length >= 2 && <span className="mt-2 inline-flex text-[11px] font-bold text-orange-500">✓ Seleccionado</span>}
              </button>
            </div>
            {availableColors.length < 2 && (
              <p className="mt-2 text-xs text-amber-500">Requiere al menos 2 colores en stock. Próximamente.</p>
            )}
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-900 dark:text-white mb-3">Color * {loadingColors && <span className="text-[11px] font-normal normal-case tracking-normal text-slate-500 dark:text-zinc-400">· Cargando materiales...</span>}</p>
            {loadingColors ? (
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
                    <div className="h-11 w-11 rounded-2xl bg-zinc-800 border border-zinc-700" />
                    <div className="h-3 w-12 rounded bg-zinc-800" />
                  </div>
                ))}
              </div>
            ) : availableColors.length === 0 ? (
              <p className="text-xs text-amber-400">No hay colores disponibles en este momento.</p>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                {availableColors.map((c) => (
                  <button key={c.id} type="button" onClick={() => setColor(c.nombre)} className="flex flex-col items-center gap-2">
                    <span
                      className={`h-11 w-11 rounded-2xl border-2 flex items-center justify-center text-xs font-bold transition-all ${selectedColor === c.nombre ? "border-orange-500 ring-2 ring-orange-500/30 scale-105 bg-orange-500 text-white" : "border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 hover:border-slate-300 dark:hover:border-zinc-600 text-slate-600 dark:text-zinc-300"}`}
                    >
                      {selectedColor === c.nombre ? <Check className="h-4 w-4" /> : c.nombre.charAt(0).toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-semibold text-center leading-tight ${selectedColor === c.nombre ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-zinc-400"}`}>{c.nombre}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">¿Dónde te enviamos la cotización?</h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400">WhatsApp es obligatorio — Email es opcional. Te escribimos en &lt;2h.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-xs font-bold tracking-widest uppercase text-zinc-300">Tu nombre *</span>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Camila" className="h-11 rounded-2xl" />
              {nombre && nombre.trim().length < 2 && <span className="text-xs text-amber-400">Mín. 2 caracteres</span>}
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold tracking-widest uppercase text-zinc-300">Email <span className="text-zinc-500 font-normal normal-case">(opcional)</span></span>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="camila@email.com (opcional)" type="email" className="h-11 rounded-2xl" />
              {email.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && <span className="text-xs text-amber-400">Email inválido — deja vacío si no quieres usarlo</span>}
              <span className="text-[11px] text-zinc-500">Opcional · WhatsApp es el contacto principal</span>
            </label>
          </div>
          <label className="space-y-2 block">
            <span className="text-xs font-bold tracking-widest uppercase text-zinc-300">Teléfono (WhatsApp) *</span>
            <Input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+591 73854684"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className="h-11 rounded-2xl"
              required
            />
            <span className="text-[11px] text-zinc-500">Lo usaremos para enviarte la cotización por WhatsApp. Ej: +591 73854684 · Sucre, Bolivia</span>
            {telefono && telefono.replace(/\D/g, "").length < 8 && <span className="text-xs text-amber-400 block">Teléfono inválido (mín. 8 dígitos)</span>}
          </label>
          <label className="space-y-2 block">
            <span className="text-xs font-bold tracking-widest uppercase text-zinc-300">¿Algo más? (opcional)</span>
            <Textarea value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej: Es para un regalo..." rows={3} className="rounded-2xl" />
          </label>
          <div className="rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-4 space-y-2">
            <p className="text-xs font-bold text-slate-900 dark:text-white">Resumen</p>
            <div className="text-xs text-slate-500 dark:text-zinc-400 space-y-1">
              <p>🔗 Modelo: <span className="text-slate-900 dark:text-white break-all">{file ? `${file.name} → se subirá a casual-uploads` : enlace || "—"}</span></p>
              <p>🎨 {estiloColor === "single" ? "Un solo color" : "Multicolor (AMS)"} · {selectedColor || "—"}</p>
              <p>📧 {nombre || "—"} — {email || "—"}</p>
              <p>📱 WhatsApp: <span className="text-slate-900 dark:text-white">{telefono || "—"}</span></p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">✓ Gratis · &lt;2h · WhatsApp primero</Badge>
          {!paso3Ok && <p className="text-xs text-zinc-500 text-right">Completa nombre y WhatsApp (8+ dígitos). Email es opcional.</p>}
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}
          {uploader.error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{uploader.error}</p>}
        </div>
      )}
    </WizardShell>
  );
}
