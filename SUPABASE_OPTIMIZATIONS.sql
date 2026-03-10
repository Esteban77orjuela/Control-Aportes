-- =============================================
-- OPTIMIZACIONES Y ARREGLOS DE SEGURIDAD
-- Ejecuta esto en Supabase > SQL Editor
-- =============================================

-- 1. FUNCIÓN PARA ACTUALIZACIÓN ATÓMICA DE STOCK
-- (Previene errores si 2 personas venden al mismo milisegundo)
CREATE OR REPLACE FUNCTION update_beverage_stock(p_id UUID, p_quantity INTEGER, p_new_cost_price NUMERIC DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_new_cost_price IS NOT NULL THEN
        UPDATE beverages
        SET stock = stock + p_quantity,
            cost_price = p_new_cost_price
        WHERE id = p_id;
    ELSE
        UPDATE beverages
        SET stock = stock + p_quantity
        WHERE id = p_id;
    END IF;
END;
$$;

-- 2. FUNCIÓN PARA ESTADÍSTICAS DEL DASHBOARD DE MÚSICA
-- Esto permite que Supabase haga el trabajo pesado de sumar y contar.
CREATE OR REPLACE FUNCTION get_music_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalMembers', (SELECT count(*) FROM people),
        'totalTransactions', (SELECT count(*) FROM payments),
        'totalAmount', (SELECT COALESCE(sum(amount), 0) FROM payments),
        'peopleStats', (
            SELECT json_agg(p_stats)
            FROM (
                SELECT 
                    p.id, 
                    p.name, 
                    p.email, 
                    p.phone, 
                    COALESCE(sum(pay.amount), 0) as "totalContributed"
                FROM people p
                LEFT JOIN payments pay ON p.id = pay.person_id
                GROUP BY p.id
                ORDER BY "totalContributed" DESC
            ) p_stats
        )
    ) INTO result;
    
    RETURN result;
END;
$$;
