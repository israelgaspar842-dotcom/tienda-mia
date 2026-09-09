-- ============================================
-- SUPABASE STORAGE: Buckets reales usados por el código
--   casual-uploads     → rutas /casual, público (imágenes)
--   pro-vault          → rutas /profesional, PRIVADO (modelos 3D y planos PDF)
--   portfolio-images   → CMS admin (definido en portfolio.sql)
-- Ejecutar en Supabase SQL Editor (Dashboard > SQL)
-- ============================================

-- 1. Crear buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('casual-uploads', 'casual-uploads', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']::text[]),
  ('pro-vault', 'pro-vault', false, 52428800, ARRAY['application/octet-stream','model/stl','model/step','image/svg+xml','application/vnd.ms-pkix-crl','application/vnd.ms-pki.stl','application/sla','application/pdf','model/x.stl-binary','model/x.stl-ascii']::text[])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Notas:
-- - casual-uploads: público temporal para previews/imágenes de la ruta casual.
-- - pro-vault: PRIVADO para STL/STEP/STP/3MF/OBJ y PDFs 2D de la ruta profesional.
--   Solo INSERT público (el wizard sube ANTES de guardar en DB). Lectura solo admin/logueados.

-- 2. Políticas para `casual-uploads` (público: cualquiera sube/lee, admin borra)
DROP POLICY IF EXISTS "casual_uploads_public_read" ON storage.objects;
CREATE POLICY "casual_uploads_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'casual-uploads');

DROP POLICY IF EXISTS "casual_uploads_public_insert" ON storage.objects;
CREATE POLICY "casual_uploads_public_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'casual-uploads');

DROP POLICY IF EXISTS "casual_uploads_admin_update" ON storage.objects;
CREATE POLICY "casual_uploads_admin_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'casual-uploads' AND (
    (auth.jwt() ->> 'role') = 'admin'
    OR COALESCE((auth.jwt() ->> 'is_admin')::boolean, false) = true
    OR auth.role() = 'service_role'
  ));

DROP POLICY IF EXISTS "casual_uploads_admin_delete" ON storage.objects;
CREATE POLICY "casual_uploads_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'casual-uploads' AND (
    (auth.jwt() ->> 'role') = 'admin'
    OR COALESCE((auth.jwt() ->> 'is_admin')::boolean, false) = true
    OR auth.role() = 'service_role'
  ));

-- 3. Políticas para `pro-vault` (PRIVADO)
-- INSERT público: el formulario profesional (no autenticado) sube modelo/PDF antes del INSERT
DROP POLICY IF EXISTS "pro_vault_public_insert" ON storage.objects;
CREATE POLICY "pro_vault_public_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'pro-vault');

-- SELECT solo autenticados (admin o dueño). El path NO incluye user_id (ofuscado b2b_<uuid>),
-- por lo que el acceso es vía role admin / service_role o el propio dueño si se loguea.
DROP POLICY IF EXISTS "pro_vault_owner_or_admin_read" ON storage.objects;
CREATE POLICY "pro_vault_owner_or_admin_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'pro-vault' AND (
      auth.uid() IS NOT NULL
      AND (
        (auth.jwt() ->> 'role') = 'admin'
        OR COALESCE((auth.jwt() ->> 'is_admin')::boolean, false) = true
      )
      OR auth.role() = 'service_role'
    )
  );

DROP POLICY IF EXISTS "pro_vault_admin_update" ON storage.objects;
CREATE POLICY "pro_vault_admin_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'pro-vault' AND (
    (auth.jwt() ->> 'role') = 'admin'
    OR COALESCE((auth.jwt() ->> 'is_admin')::boolean, false) = true
    OR auth.role() = 'service_role'
  ));

DROP POLICY IF EXISTS "pro_vault_admin_delete" ON storage.objects;
CREATE POLICY "pro_vault_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'pro-vault' AND (
    (auth.jwt() ->> 'role') = 'admin'
    OR COALESCE((auth.jwt() ->> 'is_admin')::boolean, false) = true
    OR auth.role() = 'service_role'
  ));

-- 4. Uso desde Next.js (supabase-js)
--   Casual:  supabase.storage.from('casual-uploads').upload(`referencias/${uuid}.jpg`, ...)
--   Pro:     supabase.storage.from('pro-vault').upload(`modelos/b2b_${uuid}.stl`, ...)
--            supabase.storage.from('pro-vault').upload(`planos/b2b_${uuid}.pdf`, ...)
--   Firmada para admin (válida 1h):
--            supabase.storage.from('pro-vault').createSignedUrl(path, 3600)

-- 5. Limpieza automática (opcional): expira casual-uploads > 7 días vía cron/pg_cron
-- SELECT cron.schedule('purge-casual-uploads','0 3 * * *', $$ DELETE FROM storage.objects WHERE bucket_id='casual-uploads' AND created_at < now() - interval '7 days' $$);

-- 6. Verificación
-- SELECT * FROM storage.buckets WHERE id IN ('casual-uploads','pro-vault','portfolio-images');
-- SELECT policyname, cmd FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND (policyname ILIKE '%casual%' OR policyname ILIKE '%pro_vault%' OR policyname ILIKE '%portfolio%');