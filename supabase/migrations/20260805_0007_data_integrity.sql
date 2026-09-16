-- Migration 0007: Integridad matemática y atómica
-- 1) Índice único: impide en el SERVIDOR que existan 2 pagos del mismo (user, persona, mes, año).
--    Se crea SOLO si no hay duplicados previos (guarda para no fallar sobre datos sucios).
-- 2) RPC sell_beverage: venta + descuento de stock en UNA transacción e idempotente
--    (reintentos no descuentan el stock dos veces).
-- 3) update_beverage_stock: ahora valida que la bebida pertenezca al usuario autenticado.
-- Idempotente: se puede ejecutar varias veces sin error.

-- =============================================
-- 1) Índice único de pagos por (user, persona, mes, año)
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM payments
    WHERE deleted_at IS NULL
    GROUP BY user_id, person_id, month, year
    HAVING count(*) > 1
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_person_month
    ON payments(user_id, person_id, month, year)
    WHERE deleted_at IS NULL;
  END IF;
END $$;

-- =============================================
-- 2) Venta de bebidas atómica e idempotente
-- =============================================
CREATE OR REPLACE FUNCTION sell_beverage(
  p_sale_id UUID,
  p_beverage_id UUID,
  p_beverage_name TEXT,
  p_quantity INTEGER,
  p_unit_price NUMERIC,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted UUID;
BEGIN
  -- Solo el dueño de la operación puede ejecutarla
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;

  -- La bebida debe existir y pertenecer al usuario
  IF NOT EXISTS (
    SELECT 1 FROM beverages
    WHERE id = p_beverage_id AND user_id = p_user_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Bebida no encontrada o sin permisos';
  END IF;

  -- Idempotencia: si la venta ya se registró (reintento), no se vuelve a descontar stock
  INSERT INTO beverage_sales (id, beverage_id, beverage_name, quantity, unit_price, total, user_id)
  VALUES (p_sale_id, p_beverage_id, p_beverage_name, p_quantity, p_unit_price, p_quantity * p_unit_price, p_user_id)
  ON CONFLICT (id) DO NOTHING
  RETURNING id INTO inserted;

  IF inserted IS NOT NULL THEN
    UPDATE beverages
    SET stock = stock - p_quantity
    WHERE id = p_beverage_id AND user_id = p_user_id AND deleted_at IS NULL AND stock >= p_quantity;

    IF NOT FOUND THEN
      -- Sin stock suficiente: revertir la venta para no dejar dinero registrado sin inventario
      DELETE FROM beverage_sales WHERE id = p_sale_id;
      RAISE EXCEPTION 'Stock insuficiente';
    END IF;
  END IF;
END;
$$;

-- =============================================
-- 3) Actualización de stock con validación de propietario
-- =============================================
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
    WHERE id = p_id AND user_id = auth.uid() AND deleted_at IS NULL;
  ELSE
    UPDATE beverages
    SET stock = stock + p_quantity
    WHERE id = p_id AND user_id = auth.uid() AND deleted_at IS NULL;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bebida no encontrada o sin permisos';
  END IF;
END;
$$;
