-- COPIA Y PEGA ESTE CÓDIGO EN EL "SQL EDITOR" DE SUPABASE
-- Esto creará las tablas necesarias profesionales

-- 1. Tabla de Miembros (Personas)
CREATE TABLE IF NOT EXISTS people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Aportes (Pagos)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  month INTEGER NOT NULL, -- 0-11
  year INTEGER NOT NULL,
  signature_base64 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar Seguridad (RLS) - Por ahora permitimos todo para desarrollo
-- En fase de producción esto se debe configurar con políticas de usuario
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo a usuarios anonimos" ON people FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios anonimos" ON payments FOR ALL USING (true) WITH CHECK (true);
