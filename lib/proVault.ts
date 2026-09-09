import path from "path";
import { createSupabaseClient, isSupabaseConfigured } from "./supabase";
import { saveModelFile as saveModelLocal, savePdfFile as savePdfLocal } from "./fileStorage";

/**
 * Genera nombre ofuscado: b2b_<uuid>.<ext> en lugar del nombre original.
 * Ej: pieza_secreta.stl -> b2b_550e8400-e29b-41d4-a716-446655440000.stl
 */
export function obfuscatedFileName(originalName: string, prefix = "b2b"): string {
  const ext = path.extname(originalName).toLowerCase() || "";
  // crypto.randomUUID disponible en Node 19+ y browsers modernos (Next.js runtime)
  const uuid = crypto.randomUUID();
  return `${prefix}_${uuid}${ext}`;
}

type UploadResult = {
  /** path dentro del bucket, ej: b2b_550e8400...stl — guardar esto en solicitudes.enlace_archivo / metadata */
  path: string;
  /** fullPath / id devuelto por Supabase */
  fullPath: string;
  /** URL pública si bucket es público, null si privado (usar createSignedUrl) */
  publicUrl: string | null;
};

/**
 * Sube un archivo al bucket `pro-vault` (privado, RLS: INSERT público, SELECT solo autenticados).
 * Usa nombre ofuscado b2b_<uuid>.<ext> — nunca el nombre original.
 * Retorna el path que debe guardarse en DB (solicitudes.enlace_archivo / metadata.plano_url).
 *
 * Si Supabase no está configurado (falta env), hace fallback a almacenamiento local
 * (`public/uploads/...`) para no romper dev.
 */
export async function uploadToProVault(file: File, opts?: { prefix?: string }): Promise<UploadResult> {
  const MAX_MODEL = 50 * 1024 * 1024;
  const MAX_PDF = 20 * 1024 * 1024;
  const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
  const limit = isPdf ? MAX_PDF : MAX_MODEL;
  if (file.size > limit) throw new Error(`Archivo excede ${limit / 1024 / 1024}MB`);

  // Validación extensiones
  const ext = path.extname(file.name).toLowerCase();
  const allowedModel = [".stl", ".step", ".stp", ".3mf", ".obj"];
  const allowedPdf = [".pdf"];
  if (isPdf ? !allowedPdf.includes(ext) : !allowedModel.includes(ext)) {
    throw new Error(`Extensión no permitida ${ext}`);
  }

  // Si no hay Supabase configurado → fallback local (dev)
  if (!isSupabaseConfigured()) {
    const localPath = isPdf ? await savePdfLocal(file) : await saveModelLocal(file);
    // localPath ya es ofuscado, pero forzamos prefijo b2b_ si no lo tiene
    return { path: localPath, fullPath: localPath, publicUrl: localPath };
  }

  const supabase = createSupabaseClient();
  if (!supabase) throw new Error("Supabase no configurado");

  const obfuscated = obfuscatedFileName(file.name, opts?.prefix ?? "b2b");
  // Opcional: organizar por tipo en subcarpetas, manteniendo ofuscación
  const bucketPath = isPdf ? `planos/${obfuscated}` : `modelos/${obfuscated}`;

  const { data, error } = await supabase.storage
    .from("pro-vault")
    .upload(bucketPath, file, {
      contentType: file.type || (isPdf ? "application/pdf" : "application/octet-stream"),
      upsert: false,
      cacheControl: "3600",
    });

  if (error) {
    // Mensajes comunes: Duplicate, RLS violation
    throw new Error(`Error Supabase Storage (pro-vault): ${error.message}`);
  }

  const fullPath = data.path; // ej: modelos/b2b_...stl
  // Bucket privado → no hay publicUrl directo; generar signedUrl solo si se necesita para admin.
  // Para guardar en DB guardamos `pro-vault/${fullPath}` o solo `fullPath` según convención.
  // Aquí guardamos `pro-vault/${fullPath}` para que enlace_archivo sea trazable, o solo fullPath.
  // Usamos formato `pro-vault/${fullPath}` y además intentamos publicUrl (será null en privado).
  let publicUrl: string | null = null;
  try {
    const { data: pub } = supabase.storage.from("pro-vault").getPublicUrl(fullPath);
    // Si bucket es privado, pub.publicUrl existe pero no será accesible sin auth; igual lo retornamos
    publicUrl = pub.publicUrl || null;
  } catch {
    publicUrl = null;
  }

  return { path: fullPath, fullPath, publicUrl };
}

/**
 * Helper para formulario profesional dual: sube modelo 3D (obligatorio) y plano PDF (opcional)
 * y retorna rutas ofuscadas listas para guardar en `solicitudes`.
 *
 * Uso en Route Handler:
 * ```ts
 * const { modeloPath, planoPath } = await uploadProfesionalFiles({ modelo3d, planoPdf });
 * // guardar en DB:
 * enlace_archivo = `pro-vault/${modeloPath}` // Source of Truth principal
 * metadata = { modelo_url: `pro-vault/${modeloPath}`, plano_url: planoPath ? `pro-vault/${planoPath}` : undefined, ... }
 * ```
 */
export async function uploadProfesionalFiles(opts: {
  modelo3d?: File | null;
  planoPdf?: File | null;
}): Promise<{ modeloPath: string | null; planoPath: string | null; modeloResult: UploadResult | null; planoResult: UploadResult | null }> {
  let modeloResult: UploadResult | null = null;
  let planoResult: UploadResult | null = null;

  if (opts.modelo3d && opts.modelo3d.size > 0) {
    modeloResult = await uploadToProVault(opts.modelo3d);
  }
  if (opts.planoPdf && opts.planoPdf.size > 0) {
    planoResult = await uploadToProVault(opts.planoPdf);
  }

  return {
    modeloPath: modeloResult?.path ?? null,
    planoPath: planoResult?.path ?? null,
    modeloResult,
    planoResult,
  };
}

/**
 * Genera URL firmada temporal para `pro-vault` (solo admin / autenticados).
 * Útil para que admin descargue el archivo privado desde el Kanban.
 */
export async function createProVaultSignedUrl(bucketPath: string, expiresIn = 3600): Promise<string | null> {
  const supabase = createSupabaseClient();
  if (!supabase) return null;
  // bucketPath debe ser sin prefijo bucket, ej: modelos/b2b_...stl
  const cleanPath = bucketPath.replace(/^pro-vault\//, "");
  const { data, error } = await supabase.storage.from("pro-vault").createSignedUrl(cleanPath, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
