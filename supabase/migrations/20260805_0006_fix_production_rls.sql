-- Migration 0006: Fix de políticas RLS en producción
-- Elimina las políticas heredadas y permisivas que:
--   1) Hacían visibles los registros soft-deleted (deleted_at) → "el mes no se pone rojo",
--      pagos borrados seguían sumando en dashboard/Excel.
--   2) Permitían a cualquier usuario autenticado leer/modificar datos de TODOS los usuarios (fuga de datos).
-- Idempotente: se puede ejecutar varias veces sin error.

DROP POLICY IF EXISTS "Todo para autenticados en payments" ON payments;
DROP POLICY IF EXISTS "Usuarios ven solo sus pagos" ON payments;

DROP POLICY IF EXISTS "Todo para autenticados en people" ON people;
DROP POLICY IF EXISTS "Usuarios ven solo sus personas" ON people;

DROP POLICY IF EXISTS "Todo para autenticados en youths" ON youths;

DROP POLICY IF EXISTS "Todo para autenticados en retreat_savings" ON retreat_savings;

DROP POLICY IF EXISTS "Todo para autenticados en audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Users manage own audit_logs" ON audit_logs;
CREATE POLICY "Users manage own audit_logs"
ON audit_logs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios ven solo sus bebidas" ON beverages;

DROP POLICY IF EXISTS "Usuarios ven solo sus ventas" ON beverage_sales;
DROP POLICY IF EXISTS "Users can delete their own beverage sales" ON beverage_sales;
DROP POLICY IF EXISTS "Users can insert their own beverage sales" ON beverage_sales;
DROP POLICY IF EXISTS "Users can view their own beverage sales" ON beverage_sales;
