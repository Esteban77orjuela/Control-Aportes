-- Migration 0012: Consolidación de tablas faltantes para reproducibilidad total
-- Contexto: `youths`, `retreat_savings` y `audit_logs` se usan desde 0004/0006/0009
-- y en el código, pero nunca tuvieron un CREATE TABLE versionado (se crearon a mano
-- en el proyecto de producción). Una instalación fresca aplicando 0001-0011 fallaba.
-- Esta migración las crea de forma idempotente y restaura su RLS + políticas
-- (en una BD fresca, 0004/0006 no pudieron crearlas porque las tablas no existían).
-- También agrega `payments.signature_path`, que el código usa pero 0001 no declara.
-- Idempotente: se puede ejecutar varias veces sin error y no altera una BD existente.

-- =============================================
-- 1) youths
-- =============================================
CREATE TABLE IF NOT EXISTS youths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  target_amount NUMERIC NOT NULL DEFAULT 0 CONSTRAINT target_non_negative CHECK (target_amount >= 0),
  birth_date DATE,
  milestones TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- 2) retreat_savings
-- =============================================
CREATE TABLE IF NOT EXISTS retreat_savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youth_id UUID REFERENCES youths(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CONSTRAINT amount_positive CHECK (amount >= 0),
  date TIMESTAMPTZ DEFAULT NOW(),
  signature_base64 TEXT,
  signature_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- 3) audit_logs
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4) payments.signature_path (usado por PaymentRepository/Storage)
-- =============================================
ALTER TABLE payments ADD COLUMN IF NOT EXISTS signature_path TEXT;

-- =============================================
-- 5) RLS + políticas (en BD fresca esto no quedó cubierto por 0004/0006)
-- =============================================
ALTER TABLE youths ENABLE ROW LEVEL SECURITY;
ALTER TABLE retreat_savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own youths" ON youths;
CREATE POLICY "Users manage own youths"
ON youths FOR ALL
USING (auth.uid() = user_id AND deleted_at IS NULL)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own retreat_savings" ON retreat_savings;
CREATE POLICY "Users manage own retreat_savings"
ON retreat_savings FOR ALL
USING (auth.uid() = user_id AND deleted_at IS NULL)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own audit_logs" ON audit_logs;
CREATE POLICY "Users manage own audit_logs"
ON audit_logs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 6) Índices de rendimiento (paridad con el resto de módulos)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_youths_user_active ON youths(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_retreat_savings_user_active ON retreat_savings(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_retreat_savings_youth_active ON retreat_savings(youth_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);