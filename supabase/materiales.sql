-- ============================================
-- Inventario Híbrido — tabla `materiales`
-- Ya creada según Fase 2, este archivo asegura esquema + RLS + seed
-- ============================================

CREATE TABLE IF NOT EXISTS public.materiales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL CHECK (char_length(nombre) >= 2),
  categoria text NOT NULL CHECK (categoria IN ('casual','profesional')),
  estado text NOT NULL CHECK (estado IN ('Disponible','Agotado')) DEFAULT 'Disponible',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para filtros del wizard
CREATE INDEX IF NOT EXISTS idx_materiales_categoria_estado ON public.materiales (categoria, estado);
CREATE INDEX IF NOT EXISTS idx_materiales_estado ON public.materiales (estado);

ALTER TABLE public.materiales ENABLE ROW LEVEL SECURITY;

-- Lectura pública (formularios no autenticados necesitan ver Disponible)
DROP POLICY IF EXISTS "materiales_public_read" ON public.materiales;
CREATE POLICY "materiales_public_read" ON public.materiales
  FOR SELECT USING (estado = 'Disponible');

-- Escritura solo admin/service_role
DROP POLICY IF EXISTS "materiales_admin_all" ON public.materiales;
CREATE POLICY "materiales_admin_all" ON public.materiales
  FOR ALL USING (
    coalesce((auth.jwt() ->> 'is_admin')::boolean, false) = true
    OR (auth.jwt() ->> 'role') = 'admin'
    OR auth.role() = 'service_role'
  ) WITH CHECK (
    coalesce((auth.jwt() ->> 'is_admin')::boolean, false) = true
    OR (auth.jwt() ->> 'role') = 'admin'
    OR auth.role() = 'service_role'
  );

-- Seed mínimo para probar fetch dinámico
INSERT INTO public.materiales (nombre, categoria, estado) VALUES
  ('Blanco Nube', 'casual', 'Disponible'),
  ('Negro Noche', 'casual', 'Disponible'),
  ('Rojo Cereza', 'casual', 'Disponible'),
  ('Verde Lima', 'casual', 'Disponible'),
  ('Violeta', 'casual', 'Disponible'),
  ('Rosa Pastel', 'casual', 'Agotado'),
  ('PLA', 'profesional', 'Disponible'),
  ('PETG', 'profesional', 'Disponible'),
  ('ABS', 'profesional', 'Disponible'),
  ('TPU 95A', 'profesional', 'Disponible'),
  ('Nylon PA12', 'profesional', 'Disponible'),
  ('ASA', 'profesional', 'Agotado')
ON CONFLICT DO NOTHING;
