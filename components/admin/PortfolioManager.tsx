"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Upload, Trash2, Image as ImageIcon, Sparkles, Gift, Cog, Loader2, X, Pencil } from "lucide-react";
import EditProjectModal from "./EditProjectModal";

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

export default function PortfolioManager({ initialItems }: { initialItems: PortfolioRow[] }) {
  const [items, setItems] = useState<PortfolioRow[]>(() =>
    initialItems.map((row) => ({
      ...row,
      es_destacado: Boolean((row as unknown as Record<string, unknown>)["es_destacado"]),
    }))
  );
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState<"regalo" | "prototipo">("regalo");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<PortfolioRow | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Limpieza de object URLs al desmontar o cambiar previews
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    // Limita visual y lógicamente a máximo 3 archivos
    const limited = selected.slice(0, 3);
    if (selected.length > 3) {
      setError("Máximo 3 imágenes permitidas");
    } else {
      setError("");
    }
    // Revoca previews anteriores
    previews.forEach((url) => URL.revokeObjectURL(url));
    // Filtra solo tipos permitidos
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const filtered = limited.filter((f) => validTypes.includes(f.type));
    if (filtered.length !== limited.length) {
      setError("Solo se permiten JPG, PNG y WEBP");
    }
    setFiles(filtered);
    // Muestra miniaturas temporales (usando URL.createObjectURL)
    const newPreviews = filtered.map((f) => URL.createObjectURL(f));
    setPreviews(newPreviews);
    // Reset input value para permitir re-seleccionar mismos archivos
    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const removedPreview = previews[index];
    if (removedPreview) URL.revokeObjectURL(removedPreview);
    setFiles(newFiles);
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const refresh = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("portfolio")
      .select("id, titulo, descripcion, imagen_url, galeria, categoria, created_at, es_destacado")
      .order("created_at", { ascending: false });
    if (data)
      setItems(
        (data as PortfolioRow[]).map((row) => ({
          ...row,
          es_destacado: Boolean((row as unknown as Record<string, unknown>)["es_destacado"]),
        }))
      );
  };

  const toggleDestacado = async (id: string, estadoActual: boolean) => {
    if (togglingId) return;
    setTogglingId(id);
    setError("");
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("portfolio")
        .update({ es_destacado: !estadoActual })
        .eq("id", id);
      if (updateError) throw new Error(updateError.message);
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, es_destacado: !estadoActual } : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar destacado");
    } finally {
      setTogglingId(null);
    }
  };

  const handleEdit = (p: PortfolioRow) => {
    setEditingProject(p);
    setIsEditOpen(true);
  };
  const handleEditClose = () => {
    setIsEditOpen(false);
    setEditingProject(null);
  };
  const handleEditSaved = (updated: PortfolioRow) => {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!titulo.trim() || titulo.length < 2) return setError("Título mínimo 2 caracteres");
    if (!descripcion.trim() || descripcion.length < 10) return setError("Descripción mínimo 10 caracteres");
    if (files.length === 0) return setError("Debes subir al menos una fotografía (máx. 3)");
    if (files.length > 3) return setError("Máximo 3 imágenes permitidas");

    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) return setError(`Imagen ${f.name} excede 5MB`);
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return setError(`Formato no permitido: ${f.name}. Solo JPG/PNG/WEBP`);
    }

    setUploading(true);
    setProgress(10);
    const supabase = createClient();

    // Para rollback en caso de fallo en INSERT
    const uploadedPaths: string[] = [];
    try {
      const interval = setInterval(() => setProgress((p) => Math.min(90, p + 15)), 300);

      // LÓGICA DE SUBIDA (Storage): iterar sobre array de archivos seleccionados
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `portfolio_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
        const path = `proyectos/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage.from("portfolio-images").upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });

        if (uploadError) throw new Error(uploadError.message);
        uploadedPaths.push(uploadData.path);
        const { data: pub } = supabase.storage.from("portfolio-images").getPublicUrl(uploadData.path);
        uploadedUrls.push(pub.publicUrl);
      }

      clearInterval(interval);
      setProgress(100);

      if (uploadedUrls.length === 0) throw new Error("No se pudo subir ninguna imagen");

      // LÓGICA DE BASE DE DATOS (Doble Escritura)
      const { data: inserted, error: insertError } = await supabase
        .from("portfolio")
        .insert({
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          imagen_url: uploadedUrls[0],
          galeria: uploadedUrls,
          es_destacado: false,
          categoria,
        })
        .select()
        .single();

      if (insertError) {
        // fallback: borra archivos subidos para no dejar huérfanos
        if (uploadedPaths.length > 0) {
          await supabase.storage.from("portfolio-images").remove(uploadedPaths);
        }
        throw new Error(insertError.message);
      }

      setSuccess("Proyecto publicado ✓");
      setTitulo("");
      setDescripcion("");
      setCategoria("regalo");
      previews.forEach((url) => URL.revokeObjectURL(url));
      setFiles([]);
      setPreviews([]);
      setProgress(0);
      const normalized = {
        ...(inserted as PortfolioRow),
        es_destacado: Boolean((inserted as unknown as Record<string, unknown>)["es_destacado"]),
      } as PortfolioRow;
      setItems((prev) => [normalized, ...prev]);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
      // Si hubo subidas parciales y no se insertó, intenta limpiar
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

  const handleDelete = async (id: string, imagen_url: string, galeria?: string[] | null) => {
    if (!confirm("¿Eliminar este proyecto? Se borrarán las imágenes del bucket.")) return;
    const supabase = createClient();
    const urlsToDelete: string[] = [];
    if (galeria && galeria.length > 0) urlsToDelete.push(...galeria);
    else if (imagen_url) urlsToDelete.push(imagen_url);

    const paths: string[] = [];
    for (const urlStr of urlsToDelete) {
      try {
        const url = new URL(urlStr);
        const marker = "/portfolio-images/";
        const idx = url.pathname.indexOf(marker);
        if (idx !== -1) paths.push(url.pathname.slice(idx + marker.length));
      } catch {
        // ignora urls inválidas
      }
    }

    const { error } = await supabase.from("portfolio").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    if (paths.length > 0) await supabase.storage.from("portfolio-images").remove(paths);
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="rounded-[24px] border border-zinc-800 bg-zinc-900 p-6 md:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-orange-500 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-black text-white leading-none">Nuevo proyecto</h3>
            <p className="text-xs text-zinc-500">Se publica al instante en la landing · sin tocar código</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="space-y-1.5">
            <span className="text-xs font-bold tracking-widest uppercase text-zinc-300">Título *</span>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Soporte Voronoi para macetero"
              maxLength={120}
              className="w-full h-11 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
              required
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-bold tracking-widest uppercase text-zinc-300">Categoría *</span>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as "regalo" | "prototipo")}
              className="w-full h-11 px-4 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-orange-500"
              required
            >
              <option value="regalo">B2C — Regalo (casual)</option>
              <option value="prototipo">B2B — Prototipo (técnico)</option>
            </select>
            <span className="text-[11px] text-zinc-600 flex items-center gap-1">
              {categoria === "regalo" ? <Gift className="h-3 w-3" /> : <Cog className="h-3 w-3" />}
              {categoria === "regalo" ? "Se muestra como Figura/Decoración" : "Se muestra como Prototipo/Funcional"}
            </span>
          </label>
        </div>

        <label className="space-y-1.5 block">
          <span className="text-xs font-bold tracking-widest uppercase text-zinc-300">Descripción *</span>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Breve descripción de la pieza, material y uso (10-600 caracteres)"
            maxLength={600}
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 resize-none"
            required
          />
          <span className="text-[11px] text-zinc-600">{descripcion.length}/600</span>
        </label>

        <div className="space-y-2">
          <span className="text-xs font-bold tracking-widest uppercase text-zinc-300">Fotografías * (máx. 3)</span>
          <label className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-950 p-6 cursor-pointer hover:border-zinc-600 transition-colors">
            <input type="file" multiple accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleFileChange} />
            {previews.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 w-full">
                {previews.map((src, idx) => (
                  <div key={idx} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`preview ${idx + 1}`} className="h-32 w-full rounded-xl object-cover border border-zinc-800" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveFile(idx);
                      }}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:bg-red-500 hover:text-white hover:border-red-500 flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">{idx + 1}/3</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-zinc-600" />
              </div>
            )}
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <Upload className="h-4 w-4" /> {files.length > 0 ? `${files.length}/3 imágenes seleccionadas` : "Haz clic para subir fotografías"}
            </span>
            <span className="text-xs text-zinc-500">JPG, PNG, WEBP · máx 5MB por imagen · máximo 3</span>
            {files.length > 0 && (
              <span className="text-[11px] text-emerald-400">
                {files.map((f) => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`).join(" · ")}
              </span>
            )}
          </label>
          {previews.length > 0 && (
            <p className="text-[11px] text-zinc-500">{previews.length}/3 imágenes · la primera será la portada (imagen_url)</p>
          )}
          {uploading && (
            <div className="space-y-1">
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-orange-400">Subiendo {files.length} imagen(es) a portfolio-images... {progress}%</p>
            </div>
          )}
        </div>

        {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3">{error}</div>}
        {success && <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3">{success}</div>}

        <button
          type="submit"
          disabled={uploading}
          className="w-full h-11 rounded-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
        >
          {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : "Publicar proyecto"}
        </button>
        <p className="text-[11px] text-zinc-500 text-center">Tus proyectos se publican al instante en la galería</p>
      </form>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white">Mis Proyectos ({items.length})</h3>
          <button onClick={refresh} className="text-xs bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-full">
            ↻ Refrescar
          </button>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-10 text-center text-zinc-500 text-sm">
            Aún no hay proyectos. Publica el primero arriba.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((p) => (
              <article key={p.id} className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 flex flex-col">
                <div className="relative h-48 bg-zinc-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.imagen_url} alt={p.titulo} className="w-full h-full object-cover" loading="lazy" />
                  <span className={`absolute top-3 left-3 text-[10px] font-black px-2.5 py-1 rounded-full border ${p.categoria === "regalo" ? "bg-orange-500 text-white border-orange-600" : "bg-zinc-800 text-zinc-300 border-zinc-700"}`}>
                    {p.categoria === "regalo" ? "Regalo" : "Prototipo"}
                  </span>
                  {p.galeria && p.galeria.length > 1 && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full bg-black/60 text-white border border-white/20">
                      +{p.galeria.length} fotos
                    </span>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <h4 className="font-bold text-white leading-tight line-clamp-1">{p.titulo}</h4>
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed flex-1">{p.descripcion}</p>
                  <div className="flex items-center justify-between pt-3 mt-1 border-t border-zinc-800">
                    <span
                      className={`text-[11px] font-bold tracking-widest uppercase flex items-center gap-1.5 ${p.es_destacado ? "text-orange-400" : "text-zinc-500"}`}
                    >
                      <Sparkles className="h-3 w-3" /> Destacado
                    </span>
                    <button
                      role="switch"
                      aria-checked={!!p.es_destacado}
                      aria-label={`Alternar destacado para ${p.titulo}`}
                      disabled={togglingId === p.id}
                      onClick={() => toggleDestacado(p.id, !!p.es_destacado)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed ${
                        p.es_destacado ? "bg-orange-500" : "bg-zinc-700"
                      } ${togglingId === p.id ? "opacity-60" : ""}`}
                      title={p.es_destacado ? "Quitar destacado" : "Marcar como destacado"}
                    >
                      {togglingId === p.id ? (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-3 w-3 animate-spin text-white" />
                        </span>
                      ) : null}
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          p.es_destacado ? "translate-x-5" : "translate-x-0"
                        } ${togglingId === p.id ? "opacity-0" : ""}`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono text-zinc-600">{new Date(p.created_at).toLocaleDateString("es-CL")}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(p)}
                        className="h-8 w-8 rounded-full bg-zinc-950 border border-zinc-800 hover:bg-orange-500/10 hover:border-orange-500/20 hover:text-orange-400 text-zinc-500 flex items-center justify-center"
                        title="Editar"
                        aria-label={`Editar ${p.titulo}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.imagen_url, p.galeria)}
                        className="h-8 w-8 rounded-full bg-zinc-950 border border-zinc-800 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-zinc-500 flex items-center justify-center"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <EditProjectModal project={editingProject} open={isEditOpen} onClose={handleEditClose} onSaved={handleEditSaved} />
    </div>
  );
}
