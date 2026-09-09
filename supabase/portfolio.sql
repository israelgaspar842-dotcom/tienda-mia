-- ============================================
-- PORTFOLIO CMS LIGERO — Fase Expansión Admin
-- Tabla `portfolio` + bucket `portfolio-images` (PÚBLICO)
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ============================================

-- 1. Tabla portfolio
CREATE TABLE IF NOT EXISTS public.portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL CHECK (char_length(titulo) >= 2 AND char_length(titulo) <= 120),
  descripcion text NOT NULL CHECK (char_length(descripcion) >= 10 AND char_length(descripcion) <= 600),
  imagen_url text NOT NULL CHECK (char_length(imagen_url) >= 10),
  categoria text NOT NULL CHECK (categoria IN ('regalo','prototipo')),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.portfolio IS 'CMS ligero: proyectos físicos impresos. Categoria B2C=regalo, B2B=prototipo. Imagen en portfolio-images bucket.';
COMMENT ON COLUMN public.portfolio.categoria IS 'regalo (B2C) o prototipo (B2B)';
COMMENT ON COLUMN public.portfolio.imagen_url IS 'URL pública de Supabase Storage portfolio-images/...';

CREATE INDEX IF NOT EXISTS idx_portfolio_categoria ON public.portfolio (categoria);
CREATE INDEX IF NOT EXISTS idx_portfolio_created ON public.portfolio (created_at DESC);

-- 2. RLS
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;

-- Lectura pública (galería landing) — cualquiera puede ver
DROP POLICY IF EXISTS "portfolio_public_read" ON public.portfolio;
CREATE POLICY "portfolio_public_read" ON public.portfolio
  FOR SELECT USING (true);

-- Escritura solo admin (service_role bypass) o usuarios con is_admin/role=admin
DROP POLICY IF EXISTS "portfolio_admin_write" ON public.portfolio;
CREATE POLICY "portfolio_admin_write" ON public.portfolio
  FOR ALL USING (
    coalesce((auth.jwt() ->> 'is_admin')::boolean, false) = true
    OR (auth.jwt() ->> 'role') = 'admin'
  ) WITH CHECK (
    coalesce((auth.jwt() ->> 'is_admin')::boolean, false) = true
    OR (auth.jwt() ->> 'role') = 'admin'
  );
-- Nota: Next.js API con SUPABASE_SERVICE_ROLE_KEY hace bypass RLS, recomendado para /admin

-- 3. Bucket PÚBLICO portfolio-images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-images',
  'portfolio-images',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4. Storage Policies para portfolio-images (público)
DROP POLICY IF EXISTS "portfolio_images_public_read" ON storage.objects;
CREATE POLICY "portfolio_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'portfolio-images');

DROP POLICY IF EXISTS "portfolio_images_admin_insert" ON storage.objects;
CREATE POLICY "portfolio_images_admin_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'portfolio-images' AND (
      coalesce((auth.jwt() ->> 'is_admin')::boolean, false) = true
      OR (auth.jwt() ->> 'role') = 'admin'
      -- En dev con anon key + sin auth, permitir si usa service_role desde server:
      OR auth.role() = 'service_role'
    )
  );

-- Para permitir INSERT desde cliente anónimo vía anon key en dev (opcional, comentar en prod):
-- DROP POLICY IF EXISTS "portfolio_images_anyone_insert" ON storage.objects;
-- CREATE POLICY "portfolio_images_anyone_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id='portfolio-images');

DROP POLICY IF EXISTS "portfolio_images_admin_update" ON storage.objects;
CREATE POLICY "portfolio_images_admin_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'portfolio-images' AND (
    coalesce((auth.jwt() ->> 'is_admin')::boolean, false) = true OR (auth.jwt() ->> 'role')='admin' OR auth.role()='service_role'
  ));

DROP POLICY IF EXISTS "portfolio_images_admin_delete" ON storage.objects;
CREATE POLICY "portfolio_images_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'portfolio-images' AND (
    coalesce((auth.jwt() ->> 'is_admin')::boolean, false) = true OR (auth.jwt() ->> 'role')='admin' OR auth.role()='service_role'
  ));

-- 5. Datos de ejemplo (opcional)
INSERT INTO public.portfolio (titulo, descripcion, imagen_url, categoria) VALUES
  ('Macetero Voronoi Bio', 'Geometría orgánica sin soportes. 18cm alto. PLA Madera.', 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&q=80', 'regalo'),
  ('Carcasa Raspberry Pi 5', 'Tolerancias 0.2mm, ventilación activa. PETG Negro.', 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=600&q=80', 'prototipo')
ON CONFLICT DO NOTHING;

-- 6. Verificación
-- SELECT * FROM public.portfolio ORDER BY created_at DESC;
-- SELECT * FROM storage.buckets WHERE id='portfolio-images';
