-- Phase 2: Security hardening (non-destructive)
-- Objective: tighten RLS without deleting data or breaking schema compatibility.

-- 1) Remove known permissive policies detected in production
DROP POLICY IF EXISTS "Permitir todo a usuarios anónimos" ON people;
DROP POLICY IF EXISTS "Permitir todo a usuarios anónimos" ON payments;
DROP POLICY IF EXISTS "Allow all on beverages" ON beverages;
DROP POLICY IF EXISTS "Allow all on beverage_sales" ON beverage_sales;

-- 2) Ensure RLS is enabled on all active tables
ALTER TABLE IF EXISTS people ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS beverages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS beverage_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS youths ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS retreat_savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;

-- 3) Re-create canonical owner-based policies for core tables
DROP POLICY IF EXISTS "Users can manage their own people" ON people;
CREATE POLICY "Users can manage their own people"
ON people FOR ALL
USING (auth.uid() = user_id AND deleted_at IS NULL)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own payments" ON payments;
CREATE POLICY "Users can manage their own payments"
ON payments FOR ALL
USING (auth.uid() = user_id AND deleted_at IS NULL)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to manage your own beverages" ON beverages;
CREATE POLICY "Allow users to manage your own beverages"
ON beverages FOR ALL
USING (auth.uid() = user_id AND deleted_at IS NULL)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to manage your own beverage_sales" ON beverage_sales;
CREATE POLICY "Allow users to manage your own beverage_sales"
ON beverage_sales FOR ALL
USING (auth.uid() = user_id AND deleted_at IS NULL)
WITH CHECK (auth.uid() = user_id);

-- 4) Canonical policies for retreat module (if tables exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'youths'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users manage own youths" ON youths';
    EXECUTE '
      CREATE POLICY "Users manage own youths"
      ON youths FOR ALL
      USING (auth.uid() = user_id AND deleted_at IS NULL)
      WITH CHECK (auth.uid() = user_id)
    ';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'retreat_savings'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users manage own retreat_savings" ON retreat_savings';
    EXECUTE '
      CREATE POLICY "Users manage own retreat_savings"
      ON retreat_savings FOR ALL
      USING (auth.uid() = user_id AND deleted_at IS NULL)
      WITH CHECK (auth.uid() = user_id)
    ';
  END IF;
END $$;

-- 5) Restrictive read-only policy for audit logs (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'audit_logs'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users read own audit logs" ON audit_logs';
    EXECUTE '
      CREATE POLICY "Users read own audit logs"
      ON audit_logs FOR SELECT
      USING (auth.uid() = user_id)
    ';
  END IF;
END $$;

-- 6) Keep only one intended dashboard RPC signature
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_music_dashboard_stats'
      AND pg_get_function_identity_arguments(p.oid) = ''
  ) THEN
    DROP FUNCTION public.get_music_dashboard_stats();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION get_music_dashboard_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalMembers', (SELECT count(*) FROM people WHERE user_id = p_user_id AND deleted_at IS NULL),
        'totalTransactions', (SELECT count(*) FROM payments WHERE user_id = p_user_id AND deleted_at IS NULL),
        'totalAmount', (SELECT COALESCE(sum(amount), 0) FROM payments WHERE user_id = p_user_id AND deleted_at IS NULL),
        'peopleStats', (
            SELECT COALESCE(json_agg(p_stats), '[]'::json)
            FROM (
                SELECT
                    p.id,
                    p.name,
                    p.email,
                    p.phone,
                    COALESCE(sum(pay.amount), 0) as "totalContributed"
                FROM people p
                LEFT JOIN payments pay
                  ON p.id = pay.person_id
                 AND pay.user_id = p_user_id
                 AND pay.deleted_at IS NULL
                WHERE p.user_id = p_user_id
                  AND p.deleted_at IS NULL
                GROUP BY p.id
                ORDER BY "totalContributed" DESC
            ) p_stats
        )
    ) INTO result;

    RETURN result;
END;
$$;

-- 7) Add compatibility-safe indexes
CREATE INDEX IF NOT EXISTS idx_people_user_active ON people(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_user_active ON payments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_person_active ON payments(person_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_beverages_user_active ON beverages(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_beverage_sales_user_active ON beverage_sales(user_id) WHERE deleted_at IS NULL;
