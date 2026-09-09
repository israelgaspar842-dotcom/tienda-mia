"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Upload, Trash2, Image as ImageIcon, Sparkles, Gift, Cog, Loader2 } from "lucide-react";

type PortfolioRow = {
  id: string;
  titulo: string;
  descripcion: string;
  imagen_url: string;
  categoria: "regalo" | "prototipo";
  created_at: string;
};

export default function PortfolioManager({ initialItems }: { initialItems: PortfolioRow[] }) {
  const [items, setItems] = useState<PortfolioRow[]>(initialItems);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState<"regalo" | "prototipo">("regalo");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0] ?? null;
    if (preview) URL.revokeObjectURL(preview);
    setFile(nextFile);
    setPreview(nextFile ? URL.createObjectURL(nextFile) : null);
  };

  const refresh = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("portfolio").select("*").order("created_at", { ascending: false });
    if (data) setItems(data as PortfolioRow[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!titulo.trim() || titulo.length < 2) return setError("Título mínimo 2 caracteres");
    if (!descripcion.trim() || descripcion.length < 10) return setError("Descripción mínimo 10 caracteres");
    if (!file) return setError("Debes subir una fotografía");

    if (file.size > 5 * 1024 * 1024) return setError("Imagen máximo 5MB");
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) return setError("Solo JPG/PNG/WEBP/GIF");

    setUploading(true);
    setProgress(10);
    const supabase = createClient();

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `portfolio_${crypto.randomUUID()}.${ext}`;
      const path = `proyectos/${fileName}`;

      // Simula progreso (Supabase storage no expone onProgress)
      const interval = setInterval(() => setProgress((p) => Math.min(90, p + 15)), 300);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("portfolio-images")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });

      clearInterval(interval);
      setProgress(100);

      if (uploadError) throw new Error(uploadError.message);

      const { data: pub } = supabase.storage.from("portfolio-images").getPublicUrl(uploadData.path);
      const imagen_url = pub.publicUrl;

      // INSERT en tabla portfolio
      const { data: inserted, error: insertError } = await supabase
        .from("portfolio")
        .insert({ titulo: titulo.trim(), descripcion: descripcion.trim(), imagen_url, categoria })
        .select()
        .single();

      if (insertError) {
        // fallback dev sin RLS: intenta borrar archivo subido para no dejar huérfano
        await supabase.storage.from("portfolio-images").remove([uploadData.path]);
        throw new Error(insertError.message);
      }

      setSuccess("Proyecto publicado ✓");
      setTitulo("");
      setDescripcion("");
      setCategoria("regalo");
      setFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      setProgress(0);
      // Optimista: prepend
      setItems((prev) => [inserted as PortfolioRow, ...prev]);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
      // Fallback si Supabase no configurado localmente: intenta API mock
      if (err instanceof Error && err.message.includes("Supabase")) {
        // no-op, ya mostrado
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, imagen_url: string) => {
    if (!confirm("¿Eliminar este proyecto? Se borrará la imagen del bucket.")) return;
    const supabase = createClient();
    // Extrae path del URL público: https://xxx.supabase.co/storage/v1/object/public/portfolio-images/proyectos/xxx.jpg -> proyectos/xxx.jpg
    let path: string | null = null;
    try {
      const url = new URL(imagen_url);
      const marker = "/portfolio-images/";
      const idx = url.pathname.indexOf(marker);
      if (idx !== -1) path = url.pathname.slice(idx + marker.length);
    } catch {
      path = null;
    }

    const { error } = await supabase.from("portfolio").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    if (path) await supabase.storage.from("portfolio-images").remove([path]);
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Formulario */}
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
          <span className="text-xs font-bold tracking-widest uppercase text-zinc-300">Fotografía *</span>
          <label className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-950 p-6 cursor-pointer hover:border-zinc-600 transition-colors">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="preview" className="h-40 w-auto rounded-xl object-cover border border-zinc-800" />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-zinc-600" />
              </div>
            )}
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <Upload className="h-4 w-4" /> {file ? file.name : "Haz clic para subir fotografía"}
            </span>
            <span className="text-xs text-zinc-500">JPG, PNG, WEBP o GIF · máx 5MB</span>
            {file && <span className="text-[11px] text-emerald-400">{(file.size / 1024 / 1024).toFixed(2)} MB · {file.type}</span>}
          </label>
          {uploading && (
            <div className="space-y-1">
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-orange-400">Subiendo a portfolio-images... {progress}%</p>
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

      {/* Listado */}
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
                </div>
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <h4 className="font-bold text-white leading-tight line-clamp-1">{p.titulo}</h4>
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed flex-1">{p.descripcion}</p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] font-mono text-zinc-600">{new Date(p.created_at).toLocaleDateString("es-CL")}</span>
                    <button
                      onClick={() => handleDelete(p.id, p.imagen_url)}
                      className="h-8 w-8 rounded-full bg-zinc-950 border border-zinc-800 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-zinc-500 flex items-center justify-center"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
