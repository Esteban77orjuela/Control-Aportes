-- ====================================================================
-- FASE 5: DATOS Y CÁLCULO FINANCIERO (Enterprise Grade)
-- Ejecuta este script en el SQL Editor de Supabase
-- ====================================================================

-- 1. CÁLCULO DE DASHBOARD EN EL SERVIDOR (RPC)
-- Eliminamos el cálculo en el cliente para ahorrar memoria y red,
-- delegando la suma de NUMERIC al motor de Postgres para precisión perfecta.

CREATE OR REPLACE FUNCTION get_retreat_dashboard_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
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
$$;

-- 2. ALMACENAMIENTO DE FIRMAS (STORAGE)
-- Preparación de la base de datos para migrar de Base64 (texto pesado) a URLs ligeras

-- Añadir columnas para almacenar la ruta en el Storage
ALTER TABLE retreat_savings ADD COLUMN IF NOT EXISTS signature_path TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS signature_path TEXT;

-- (Opcional, manual) Creación del bucket 'signatures'
-- Esto debe hacerse desde la interfaz de Supabase (Storage -> Create Bucket 'signatures')
-- Asegúrate de que las políticas RLS del bucket permitan SELECT e INSERT al usuario autenticado.

-- Ejemplo de políticas RLS para el bucket 'signatures' (requiere ejecutar como superusuario de DB si se hace por script):
-- CREATE POLICY "Users can upload signatures" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'signatures' AND auth.uid() = owner);
-- CREATE POLICY "Users can read own signatures" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'signatures' AND auth.uid() = owner);
