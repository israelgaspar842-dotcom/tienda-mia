"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";

type Bucket = "casual-uploads" | "pro-vault";

type UploadOptions = {
  bucket: Bucket;
  /** prefijo para ofuscación, por defecto b2b o casual */
  prefix?: string;
  /** max MB lógico, si no se pasa usa límites por bucket */
  maxSizeMB?: number;
};

type UploadState = {
  isUploading: boolean;
  progress: number; // 0-100
  error: string | null;
  path: string | null; // ej: casual-uploads/xxx.jpg o pro-vault/modelos/b2b_...stl (incluye bucket)
  publicUrl: string | null;
};

/**
 * Hook para subir archivos a Supabase Storage ANTES del INSERT en `solicitudes`.
 * - Genera nombre único con crypto.randomUUID() (evita colisiones, ofusca pieza_secreta.stl -> b2b_xxx.stl)
 * - Gestiona isUploading / progress / error
 * - Soporta ambos buckets: casual-uploads (público) y pro-vault (privado)
 *
 * Uso:
 * const { upload, isUploading, progress } = useSupabaseUpload();
 * const { path } = await upload(file, { bucket: "casual-uploads" });
 * // luego: supabase.from("solicitudes").insert({ enlace_archivo: path, tipo_pedido, metadata })
 */
export function useSupabaseUpload() {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    path: null,
    publicUrl: null,
  });

  const upload = useCallback(
    async (file: File, opts: UploadOptions): Promise<{ path: string; publicUrl: string | null; fileName: string }> => {
      const supabase = createClient();
      const bucket = opts.bucket;
      const isProVault = bucket === "pro-vault";

      // Límites lógicos — pro-vault: 20MB para PDF/imágenes diseño, 50MB para modelos 3D
      const extLower = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
      const isProVaultImageOrPdf = [".pdf", ".jpg", ".jpeg", ".png"].includes(extLower);
      const defaultMax = isProVault ? (isProVaultImageOrPdf ? 20 : 50) : 5; // casual: imágenes 5MB
      const maxMB = opts.maxSizeMB ?? defaultMax;
      if (file.size > maxMB * 1024 * 1024) {
        throw new Error(`Archivo excede ${maxMB}MB (recibido ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      }

      // Validación extensiones
      const ext = extLower;
      if (isProVault) {
        const allowedPro = [".stl", ".step", ".stp", ".3mf", ".obj", ".pdf", ".jpg", ".jpeg", ".png"];
        if (!allowedPro.includes(ext)) throw new Error(`Extensión ${ext} no permitida para pro-vault`);
      } else {
        const allowedImg = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
        if (!allowedImg.includes(ext)) throw new Error(`Solo imágenes JPG/PNG/WEBP/GIF (recibido ${ext})`);
      }

      const prefix = opts.prefix ?? (isProVault ? "b2b" : "casual");
      const uuid = crypto.randomUUID();
      const fileName = `${prefix}_${uuid}${ext}`;
      const isPlanoExt = [".pdf", ".jpg", ".jpeg", ".png"].includes(ext);
      const folder = isProVault ? (isPlanoExt ? "planos" : "modelos") : "referencias";
      const storagePath = `${folder}/${fileName}`; // sin bucket

      setState({ isUploading: true, progress: 10, error: null, path: null, publicUrl: null });

      // Simula progreso (Supabase storage-js no expone onProgress real)
      const interval = setInterval(() => {
        setState((s) => ({ ...s, progress: Math.min(90, s.progress + 12) }));
      }, 250);

      try {
        const { data, error } = await supabase.storage.from(bucket).upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        });

        clearInterval(interval);

        if (error) throw new Error(error.message);

        setState((s) => ({ ...s, progress: 100 }));

        const fullPath = `${bucket}/${data.path}`; // ej: pro-vault/modelos/b2b_...stl — guardar en enlace_archivo
        let publicUrl: string | null = null;
        if (!isProVault) {
          // casual-uploads es público: obtener URL pública inmediata
          const { data: pub } = supabase.storage.from(bucket).getPublicUrl(data.path);
          publicUrl = pub.publicUrl;
        }

        const resultPath = fullPath;
        setState({ isUploading: false, progress: 100, error: null, path: resultPath, publicUrl });

        return { path: resultPath, publicUrl, fileName };
      } catch (e) {
        clearInterval(interval);
        const msg = e instanceof Error ? e.message : "Error al subir";
        setState({ isUploading: false, progress: 0, error: msg, path: null, publicUrl: null });
        throw e;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ isUploading: false, progress: 0, error: null, path: null, publicUrl: null });
  }, []);

  return {
    upload,
    reset,
    ...state,
  };
}
