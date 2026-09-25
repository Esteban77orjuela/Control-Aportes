-- COPIA Y PEGA ESTE CÓDIGO EN EL "SQL EDITOR" DE SUPABASE
-- Esto creará las tablas necesarias profesionales

-- 1. Tabla de Miembros (Personas)
CREATE TABLE IF NOT EXISTS people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Implementación de Soft Delete
);

-- 2. Tabla de Aportes (Pagos)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CONSTRAINT amount_positive CHECK (amount > 0), -- Constraint de Integridad
  date TIMESTAMPTZ DEFAULT NOW(),
  month INTEGER NOT NULL CONSTRAINT valid_month CHECK (month >= 0 AND month <= 11),
  year INTEGER NOT NULL CONSTRAINT valid_year CHECK (year >= 2000),
  signature_base64 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Implementación de Soft Delete
);

-- 3. Habilitar Seguridad (RLS)
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad: Solo el dueño puede ver/gestionar, y NO se muestran los eliminados lógicamente
CREATE POLICY "Users can manage their own people" ON people FOR ALL USING (auth.uid() = user_id AND deleted_at IS NULL) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own payments" ON payments FOR ALL USING (auth.uid() = user_id AND deleted_at IS NULL) WITH CHECK (auth.uid() = user_id);
