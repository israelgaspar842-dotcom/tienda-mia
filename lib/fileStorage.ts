// lib/fileStorage.ts
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB imágenes
const MAX_MODEL_SIZE = 50 * 1024 * 1024; // 50MB modelos 3D
const MAX_PDF_SIZE = 20 * 1024 * 1024; // 20MB planos PDF
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const ALLOWED_MODEL_EXTS = [".stl", ".step", ".stp", ".3mf", ".obj"];
const ALLOWED_PDF_EXTS = [".pdf"];

/**
 * Guarda una imagen en public/uploads y retorna la URL relativa.
 */
export async function saveImage(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("La imagen excede el tamaño máximo de 5MB");
  }
  if (file.type && !ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Tipo de imagen no permitido. Usa JPEG, PNG, WEBP o GIF");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const rawExt = path.extname(file.name).toLowerCase();
  const fileExtension = ALLOWED_EXTENSIONS.includes(rawExt) ? rawExt : ".jpg";
  const fileName = `${Date.now()}-${randomUUID()}${fileExtension}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, fileName);

  await writeFile(filePath, buffer);
  return `/uploads/${fileName}`;
}

/**
 * Guarda archivo 3D (STL/STEP/3MF/OBJ) en public/uploads/models y retorna URL relativa.
 */
export async function saveModelFile(file: File): Promise<string> {
  if (file.size > MAX_MODEL_SIZE) {
    throw new Error("El archivo excede 50MB");
  }
  const rawExt = path.extname(file.name).toLowerCase();
  if (!ALLOWED_MODEL_EXTS.includes(rawExt)) {
    throw new Error(`Extensión no permitida ${rawExt}. Usa ${ALLOWED_MODEL_EXTS.join(", ")}`);
  }
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const safeExt = rawExt;
  const fileName = `model-${Date.now()}-${randomUUID()}${safeExt}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "models");
  await mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, fileName);
  await writeFile(filePath, buffer);
  return `/uploads/models/${fileName}`;
}

/**
 * Guarda plano técnico PDF 2D en public/uploads/planos (privado en prod → Supabase Storage `modelos-privados`)
 */
export async function savePdfFile(file: File): Promise<string> {
  if (file.size > MAX_PDF_SIZE) {
    throw new Error("El PDF excede 20MB");
  }
  const rawExt = path.extname(file.name).toLowerCase();
  if (!ALLOWED_PDF_EXTS.includes(rawExt)) {
    throw new Error(`Extensión no permitida ${rawExt}. Solo .pdf`);
  }
  // Validación MIME opcional (navegadores reportan application/pdf)
  if (file.type && file.type !== "application/pdf") {
    throw new Error("El archivo debe ser PDF (application/pdf)");
  }
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileName = `plano-${Date.now()}-${randomUUID()}.pdf`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "planos");
  await mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, fileName);
  await writeFile(filePath, buffer);
  return `/uploads/planos/${fileName}`;
}

/**
 * Elimina la imagen del disco local dada su URL relativa.
 */
export async function deleteImage(imageUrl?: string) {
  if (!imageUrl || !imageUrl.includes("uploads/")) return;

  try {
    // Extraer únicamente el nombre del archivo sin importar el formato de barra
    // Sanitiza contra path traversal
    const fileName = imageUrl.split("/").pop();
    if (!fileName || fileName.includes("..") || fileName.includes("\\")) return;

    const filePath = path.join(process.cwd(), "public", "uploads", fileName);
    // Evita que filePath escape del directorio uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!filePath.startsWith(uploadDir)) return;

    await unlink(filePath);
    console.log(`Imagen eliminada correctamente: ${fileName}`);
  } catch (error: unknown) {
    // ENOENT = archivo ya no existe, no es error crítico
    if (error instanceof Error && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }
    console.warn(`No se pudo eliminar el archivo previo (${imageUrl}):`, error);
  }
}
