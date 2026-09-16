-- Migration 0009: Validación de propietario en RPCs de dashboard
-- Hallazgo de auditoría: get_music_dashboard_stats y get_retreat_dashboard_stats
-- son SECURITY DEFINER y aceptaban p_user_id sin verificar auth.uid().
-- Cualquier usuario autenticado podía leer datos de otra cuenta.
-- Idempotente: se puede ejecutar varias veces sin error.

-- =============================================
-- 1) get_music_dashboard_stats con validación
-- =============================================
CREATE OR REPLACE FUNCTION get_music_dashboard_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    IF auth.uid() IS DISTINCT FROM p_user_id THEN
        RAISE EXCEPTION 'Acceso denegado';
    END IF;

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

-- =============================================
-- 2) get_retreat_dashboard_stats con validación
--    (solo si la función existe; en DB fresca puede no estar)
-- =============================================
DO $$
DECLARE
  exists_func BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_retreat_dashboard_stats'
  ) INTO exists_func;

  IF exists_func THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION get_retreat_dashboard_stats(p_user_id UUID)
      RETURNS JSON
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $body$
      DECLARE
          result JSON;
      BEGIN
          IF auth.uid() IS DISTINCT FROM p_user_id THEN
              RAISE EXCEPTION 'Acceso denegado';
          END IF;

          SELECT json_build_object(
              'totalYouths', (SELECT count(*) FROM youths WHERE user_id = p_user_id AND deleted_at IS NULL),
              'totalTarget', (SELECT COALESCE(sum(target_amount), 0) FROM youths WHERE user_id = p_user_id AND deleted_at IS NULL),
              'totalSavings', (SELECT COALESCE(sum(amount), 0) FROM retreat_savings WHERE user_id = p_user_id AND deleted_at IS NULL),
              'youthsWithProgress', (
                  SELECT COALESCE(json_agg(y_stats), '[]'::json)
                  FROM (
                      SELECT
                          y.id,
                          y.name,
                          y.phone,
                          y.target_amount AS "targetAmount",
                          y.birth_date AS "birthDate",
                          y.milestones,
                          y.gender,
                          COALESCE(sum(rs.amount), 0) AS "totalSaved",
                          CASE
                              WHEN y.target_amount > 0 THEN
                                  LEAST((COALESCE(sum(rs.amount), 0) / y.target_amount) * 100, 100)
                              ELSE 0
                          END AS "progressPercentage"
                      FROM youths y
                      LEFT JOIN retreat_savings rs ON y.id = rs.youth_id AND rs.user_id = p_user_id AND rs.deleted_at IS NULL
                      WHERE y.user_id = p_user_id AND y.deleted_at IS NULL
                      GROUP BY y.id
                      ORDER BY "progressPercentage" DESC, "totalSaved" DESC
                  ) y_stats
              )
          ) INTO result;

          RETURN result;
      END;
      $body$
    $fn$;
  END IF;
END;
$$;
