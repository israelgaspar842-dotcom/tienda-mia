-- ============================================
-- FASE 3: Esquema híbrido para `solicitudes`
-- Patrón: columnas rígidas universales + JSONB flexible
-- Evita columnas vacías (sparse) entre B2C y B2B
-- ============================================

-- 1. ENUM de estados (Kanban 4 columnas)
DO $$ BEGIN
  CREATE TYPE estado_pedido AS ENUM ('Pendiente', 'Cotizado', 'Imprimiendo', 'Terminado');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. ENUM para discriminador de tipo
DO $$ BEGIN
  CREATE TYPE tipo_pedido AS ENUM ('casual', 'profesional');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. Tabla principal
CREATE TABLE IF NOT EXISTS public.solicitudes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  enlace_archivo text NOT NULL CHECK (char_length(enlace_archivo) > 0),
  estado estado_pedido NOT NULL DEFAULT 'Pendiente',
  precio_cotizado numeric(10,2) CHECK (precio_cotizado IS NULL OR precio_cotizado >= 0),
  tipo_pedido tipo_pedido NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  telefono text CHECK (telefono IS NULL OR char_length(telefono) >= 8),
  nombre text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Fase 3: asegurar columna telefono para wa.me (migración idempotente si tabla ya existe)
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS telefono text CHECK (telefono IS NULL OR char_length(telefono) >= 8);
CREATE INDEX IF NOT EXISTS idx_solicitudes_telefono ON public.solicitudes (telefono);
-- Columna `nombre` (cliente B2C o empresa para B2B) — el código la usa en INSERT
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS nombre text;
CREATE INDEX IF NOT EXISTS idx_solicitudes_nombre ON public.solicitudes (nombre);

-- Comentarios de documentación
COMMENT ON TABLE public.solicitudes IS 'Pedidos B2C (casual) y B2B (profesional) en una sola tabla. Columnas rígidas + JSONB evita sparse columns.';
COMMENT ON COLUMN public.solicitudes.metadata IS
  'Flexible por tipo_pedido. Si casual: {color, acabado}. Si profesional: {tolerancia, nda_aceptado, material_tecnico}';

-- 4. Validación de metadata según tipo_pedido (constraint híbrida)
-- Permite evolución sin alterar esquema; valida forma básica
ALTER TABLE public.solicitudes DROP CONSTRAINT IF EXISTS chk_metadata_por_tipo;
ALTER TABLE public.solicitudes ADD CONSTRAINT chk_metadata_por_tipo CHECK (
  (
    tipo_pedido = 'casual' AND (
      metadata ? 'color' OR metadata ? 'acabado' OR jsonb_typeof(metadata) = 'object'
    )
  ) OR (
    tipo_pedido = 'profesional' AND (
      metadata ? 'tolerancia' OR metadata ? 'material_tecnico' OR metadata ? 'nda_aceptado' OR jsonb_typeof(metadata) = 'object'
    )
  )
);

-- 5. Trigger updated_at automático
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_solicitudes_updated_at ON public.solicitudes;
CREATE TRIGGER trg_solicitudes_updated_at
  BEFORE UPDATE ON public.solicitudes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 6. Índices
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON public.solicitudes (estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_tipo ON public.solicitudes (tipo_pedido);
CREATE INDEX IF NOT EXISTS idx_solicitudes_created ON public.solicitudes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_solicitudes_usuario ON public.solicitudes (usuario_id);
-- GIN para consultas dentro del JSONB (ej: material_tecnico = 'ABS')
CREATE INDEX IF NOT EXISTS idx_solicitudes_metadata_gin ON public.solicitudes USING gin (metadata);
-- Parcial: solo profesionales con NDA
CREATE INDEX IF NOT EXISTS idx_solicitudes_nda ON public.solicitudes ((metadata->>'nda_aceptado'))
  WHERE tipo_pedido = 'profesional' AND (metadata->>'nda_aceptado')::boolean = true;

-- 7. RLS
ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;

-- Usuarios: ver sus propias solicitudes
DROP POLICY IF EXISTS "users_select_own" ON public.solicitudes;
CREATE POLICY "users_select_own" ON public.solicitudes
  FOR SELECT USING (auth.uid() = usuario_id);

-- Anónimos (formulario público /cotizar): solo crear solicitudes nuevas,
-- siempre 'Pendiente' y sin cotizar. No pueden leer ni editar nada.
DROP POLICY IF EXISTS "public_insert_form" ON public.solicitudes;
CREATE POLICY "public_insert_form" ON public.solicitudes
  FOR INSERT WITH CHECK (
    auth.uid() IS NULL
    AND usuario_id IS NULL
    AND estado = 'Pendiente'
    AND precio_cotizado IS NULL
  );

-- Usuarios logueados: crear propias solicitudes
DROP POLICY IF EXISTS "users_insert_own" ON public.solicitudes;
CREATE POLICY "users_insert_own" ON public.solicitudes
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Admin: acceso total (ajusta el role/claim según tu Auth)
-- Opción A: si usas custom claim `is_admin` en JWT
DROP POLICY IF EXISTS "admin_all" ON public.solicitudes;
CREATE POLICY "admin_all" ON public.solicitudes
  FOR ALL USING (
    coalesce((auth.jwt() ->> 'is_admin')::boolean, false) = true
    OR auth.jwt() ->> 'role' = 'admin'
  ) WITH CHECK (
    coalesce((auth.jwt() ->> 'is_admin')::boolean, false) = true
    OR auth.jwt() ->> 'role' = 'admin'
  );

-- Opción B alternativa (si usas Service Role desde Next.js API, RLS se bypassea con service_role key)

-- 8. Ejemplo: migrar desde tabla previa (si existía con columnas sparse)
-- Descomenta si vienes de: color, acabado, tolerancia, nda_aceptado, material_tecnico como columnas
-- ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS color text;
-- UPDATE public.solicitudes SET metadata = jsonb_strip_nulls(jsonb_build_object(
--   'color', color,
--   'acabado', acabado,
--   'tolerancia', tolerancia,
--   'nda_aceptado', nda_aceptado,
--   'material_tecnico', material_tecnico
-- )) WHERE metadata = '{}'::jsonb;
-- ALTER TABLE public.solicitudes DROP COLUMN IF EXISTS color, DROP COLUMN IF EXISTS acabado, DROP COLUMN IF EXISTS tolerancia, DROP COLUMN IF EXISTS nda_aceptado, DROP COLUMN IF EXISTS material_tecnico;

-- 9. Datos de ejemplo para probar el Kanban
INSERT INTO public.solicitudes (usuario_id, enlace_archivo, estado, tipo_pedido, metadata, precio_cotizado) VALUES
  (null, 'https://cdn.example.com/stl/llavero-corazon.stl', 'Pendiente', 'casual',
   '{"color":"Rojo","acabado":"Brillante","nota":"Regalo aniversario"}'::jsonb, null),
  (null, 'https://cdn.example.com/stl/soporte-motor-v4.stl', 'Pendiente', 'profesional',
   '{"tolerancia":"0.2mm","nda_aceptado":true,"material_tecnico":"ABS","nota":"Prototipo funcional"}'::jsonb, null),
  (null, 'https://cdn.example.com/stl/maceta-geometrica.stl', 'Cotizado', 'casual',
   '{"color":"Verde Sage","acabado":"Mate"}'::jsonb, 45.00),
  (null, 'https://cdn.example.com/stl/carcasa-pcb.stl', 'Imprimiendo', 'profesional',
   '{"tolerancia":"0.1mm","nda_aceptado":false,"material_tecnico":"PETG"}'::jsonb, 120.50)
ON CONFLICT DO NOTHING;

-- ============================================
-- CONSULTAS ÚTILES PARA Next.js / API
-- ============================================
-- Tablero Kanban (todas agrupadas por estado):
-- SELECT * FROM solicitudes ORDER BY created_at DESC;

-- Solo B2C estéticos:
-- SELECT id, metadata->>'color' as color, metadata->>'acabado' as acabado FROM solicitudes WHERE tipo_pedido='casual';

-- Solo B2B con NDA:
-- SELECT * FROM solicitudes WHERE tipo_pedido='profesional' AND (metadata->>'nda_aceptado')::boolean = true;

-- Actualizar cotización (lo que hace el modal admin):
-- UPDATE solicitudes SET precio_cotizado = 89.90, estado = 'Cotizado' WHERE id = '...';

-- Búsqueda por material:
-- SELECT * FROM solicitudes WHERE metadata @> '{"material_tecnico":"ABS"}';
