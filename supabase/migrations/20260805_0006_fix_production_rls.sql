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

-- Guard: en una BD fresca estas tablas aún no existen (se crean en la migración
-- 0012). Sin este guard, `DROP POLICY ... ON youth` lanzaría un error de
-- "relation does not exist" y abortaría toda la secuencia de migraciones.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'youths') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Todo para autenticados en youths" ON youths';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'retreat_savings') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Todo para autenticados en retreat_savings" ON retreat_savings';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Todo para autenticados en audit_logs" ON audit_logs';
    EXECUTE 'DROP POLICY IF EXISTS "Users manage own audit_logs" ON audit_logs';
    EXECUTE '
      CREATE POLICY "Users manage own audit_logs"
      ON audit_logs FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id)
    ';
  END IF;
END $$;

DROP POLICY IF EXISTS "Usuarios ven solo sus bebidas" ON beverages;

DROP POLICY IF EXISTS "Usuarios ven solo sus ventas" ON beverage_sales;
DROP POLICY IF EXISTS "Users can delete their own beverage sales" ON beverage_sales;
DROP POLICY IF EXISTS "Users can insert their own beverage sales" ON beverage_sales;
DROP POLICY IF EXISTS "Users can view their own beverage sales" ON beverage_sales;
