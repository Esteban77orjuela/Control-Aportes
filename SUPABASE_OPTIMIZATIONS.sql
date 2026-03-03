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
