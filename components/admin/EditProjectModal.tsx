"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Upload, Image as ImageIcon, Loader2, X } from "lucide-react";

type PortfolioRow = {
  id: string;
  titulo: string;
  descripcion: string;
  imagen_url: string;
  galeria?: string[] | null;
  categoria: "regalo" | "prototipo";
  created_at: string;
  es_destacado: boolean;
};

type Props = {
  project: PortfolioRow | null;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: PortfolioRow) => void;
};

export default function EditProjectModal({ project, open, onClose, onSaved }: Props) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  // Spec: const [currentGallery, setCurrentGallery] = useState(proyecto.galeria)
  const [currentGallery, setCurrentGallery] = useState<string[]>(project?.galeria ?? []);

  // Pre-llenado con datos actuales
  useEffect(() => {
    if (project && open) {
      setTitulo(project.titulo);
      setDescripcion(project.descripcion);
      // Espec: const [currentGallery, setCurrentGallery] = useState(proyecto.galeria)
      setCurrentGallery(project.galeria && project.galeria.length > 0 ? project.galeria : project.imagen_url ? [project.imagen_url] : []);
      setImagesToDelete([]);
      setFiles([]);
      previews.forEach((u) => URL.revokeObjectURL(u));
      setPreviews([]);
      setError("");
      setProgress(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, open]);

  useEffect(() => {
    return () => {
      previews.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previews]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const existingCount = currentGallery.length;
    const remaining = Math.max(0, 3 - existingCount);
    const limited = selected.slice(0, remaining);
    if (selected.length > remaining) {
      setError(`Máximo 3 imágenes en total. Ya tienes ${existingCount}, puedes añadir ${remaining} más.`);
    } else {
      setError("");
    }
    previews.forEach((u) => URL.revokeObjectURL(u));
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const filtered = limited.filter((f) => validTypes.includes(f.type));
    setFiles(filtered);
    const newPreviews = filtered.map((f) => URL.createObjectURL(f));
    setPreviews(newPreviews);
    e.target.value = "";
  };

  const handleRemoveFile = (idx: number) => {
    const removed = previews[idx];
    if (removed) URL.revokeObjectURL(removed);
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveExisting = (url: string) => {
    setCurrentGallery((prev) => prev.filter((u) => u !== url));
    setImagesToDelete((prev) => [...prev, url]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setError("");
    if (!titulo.trim() || titulo.length < 2) return setError("Título mínimo 2 caracteres");
    if (!descripcion.trim() || descripcion.length < 10) return setError("Descripción mínimo 10 caracteres");

    setUploading(true);
    setProgress(10);
    const supabase = createClient();
    const uploadedPaths: string[] = [];
    try {
      // LÓGICA DE GUARDADO (Destrucción y Actualización): procesa eliminaciones físicas antes de actualizar
      for (const url of imagesToDelete) {
        // EXTRAER RUTA: Supabase Storage necesita la ruta final, extrae nombre archivo via .split('/').pop()
        // Spec exact: url.split('/').pop()
        const nombreDelArchivo = url.split('/').pop() ?? "";
        if (nombreDelArchivo) {
          // Spec exact: await supabase.storage.from('portfolio-images').remove([nombreDelArchivo])
          await supabase.storage.from('portfolio-images').remove([nombreDelArchivo]);
          // Además borra con prefijo proyectos/ para evitar huérfanos cuando el archivo está en carpeta
          await supabase.storage.from('portfolio-images').remove([`proyectos/${nombreDelArchivo}`]);
        }
      }
      setProgress(30);

      // a) Si hay fotos nuevas, súbelas a Supabase Storage y obtén sus URLs
      const uploadedUrls: string[] = [];
      if (files.length > 0) {
        for (const f of files) {
          if (f.size > 5 * 1024 * 1024) throw new Error(`Imagen ${f.name} excede 5MB`);
          if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) throw new Error(`Formato no permitido: ${f.name}`);
        }
        for (const file of files) {
          const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
          const fileName = `portfolio_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
          const path = `proyectos/${fileName}`;
          const { data: uploadData, error: uploadError } = await supabase.storage.from("portfolio-images").upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });
          if (uploadError) throw new Error(uploadError.message);
          uploadedPaths.push(uploadData.path);
          const { data: pub } = supabase.storage.from("portfolio-images").getPublicUrl(uploadData.path);
          uploadedUrls.push(pub.publicUrl);
        }
      }

      // b) Concatena las nuevas URLs al arreglo galeria existente (currentGallery ya sin eliminadas)
      const newGaleria = [...currentGallery, ...uploadedUrls].slice(0, 3);

      setProgress(60);

      // c) Ejecuta el UPDATE portfolio SET titulo = X, descripcion = Y, galeria = Z WHERE id = ID
      // ACTUALIZAR TABLA: guardando el arreglo currentGallery (ya filtrado) + nuevas fotos
      const { data: updated, error: updateError } = await supabase
        .from("portfolio")
        .update({ titulo: titulo.trim(), descripcion: descripcion.trim(), galeria: newGaleria })
        .eq("id", project.id)
        .select()
        .single();

      if (updateError) throw new Error(updateError.message);

      setProgress(100);
      const normalized = {
        ...(updated as PortfolioRow),
        es_destacado: Boolean((updated as unknown as Record<string, unknown>)["es_destacado"]),
      } as PortfolioRow;

      // REFRESCO: Actualiza la lista en la interfaz tras guardar
      onSaved(normalized);
      onClose();
      previews.forEach((u) => URL.revokeObjectURL(u));
      setFiles([]);
      setPreviews([]);
      setImagesToDelete([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar proyecto");
      if (uploadedPaths.length > 0) {
        try {
          await supabase.storage.from("portfolio-images").remove(uploadedPaths);
        } catch {}
      }
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent onClose={onClose} className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar proyecto</DialogTitle>
          <DialogDescription>Actualiza título, descripción y gestiona la galería. Elimina fotos huérfanas y añade nuevas.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5">
          <label className="space-y-1.5 block">
            <span className="text-xs font-bold tracking-widest uppercase text-zinc-300">Título *</span>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={120}
              className="w-full h-11 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-orange-500"
              required
            />
          </label>

          <label className="space-y-1.5 block">
            <span className="text-xs font-bold tracking-widest uppercase text-zinc-300">Descripción *</span>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={600}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-orange-500 resize-none"
              required
            />
            <span className="text-[11px] text-zinc-600">{descripcion.length}/600</span>
          </label>

          <div className="space-y-2">
            <span className="text-xs font-bold tracking-widest uppercase text-zinc-300">Galería actual</span>
            <p className="text-[11px] text-zinc-500">Galería actual: {currentGallery.length} / 3 · Puedes añadir hasta {Math.max(0, 3 - currentGallery.length)} más</p>
            {currentGallery.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {currentGallery.map((url, i) => (
                  <div key={i} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`galeria ${i}`} className="h-20 w-full object-cover rounded-lg border border-zinc-800" />
                    <button
                      type="button"
                      onClick={() => handleRemoveExisting(url)}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white border border-red-600 flex items-center justify-center shadow-md"
                      title="Eliminar foto"
                      aria-label={`Eliminar foto ${i + 1}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-600 italic">Sin fotos — añade al menos una para guardar.</p>
            )}

            <span className="text-xs font-bold tracking-widest uppercase text-zinc-300 pt-2 block">Añadir fotos extra (opcional)</span>
            <label className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-950 p-4 cursor-pointer hover:border-zinc-600 transition-colors">
              <input type="file" multiple accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleFileChange} />
              {previews.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 w-full">
                  {previews.map((src, idx) => (
                    <div key={idx} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`preview ${idx + 1}`} className="h-24 w-full rounded-xl object-cover border border-zinc-800" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleRemoveFile(idx);
                        }}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:bg-red-500 hover:text-white flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-zinc-600" />
                </div>
              )}
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="h-4 w-4" /> {files.length > 0 ? `${files.length} fotos nuevas` : "Añadir fotos extra"}
              </span>
              <span className="text-xs text-zinc-500">JPG, PNG, WEBP · máx 5MB</span>
            </label>
            {uploading && (
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
            {imagesToDelete.length > 0 && <p className="text-[11px] text-amber-400">{imagesToDelete.length} foto(s) marcada(s) para eliminar al guardar (eliminación en diferido).</p>}
          </div>

          {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3">{error}</div>}

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} disabled={uploading} className="h-10 px-5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-bold hover:bg-zinc-700 disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={uploading} className="h-10 px-6 rounded-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-bold flex items-center gap-2">
              {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : "Guardar cambios"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
