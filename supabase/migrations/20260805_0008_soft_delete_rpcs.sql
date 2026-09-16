-- Migration 0008: Borrado lógico vía RPC (SECURITY DEFINER)
-- Motivo: los UPDATE de soft-delete desde la app dependen de políticas RLS de escritura
-- que en producción pueden rechazar la operación (error 42501 "new row violates
-- row-level security policy"). Estas funciones ejecutan con permisos del owner y
-- validan por dentro que la fila pertenezca a auth.uid(), por lo que el botón
-- "eliminar" funciona siempre y es inmune a cualquier configuración de políticas.
-- Idempotente: se puede ejecutar varias veces sin error.

-- =============================================
-- 1) Soft delete de un pago
-- =============================================
CREATE OR REPLACE FUNCTION soft_delete_payment(p_payment_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  UPDATE payments
  SET deleted_at = NOW()
  WHERE id = p_payment_id
    AND user_id = auth.uid()
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El pago no existe o no pertenece a tu cuenta';
  END IF;
END;
$$;

-- =============================================
-- 2) Soft delete de una persona y sus pagos (atómico)
-- =============================================
CREATE OR REPLACE FUNCTION soft_delete_person(p_person_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  UPDATE payments
  SET deleted_at = NOW()
  WHERE person_id = p_person_id
    AND user_id = auth.uid()
    AND deleted_at IS NULL;

  UPDATE people
  SET deleted_at = NOW()
  WHERE id = p_person_id
    AND user_id = auth.uid()
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El miembro no existe o no pertenece a tu cuenta';
  END IF;
END;
$$;

-- =============================================
-- 3) Soft delete de una bebida
-- =============================================
CREATE OR REPLACE FUNCTION soft_delete_beverage(p_beverage_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  UPDATE beverages
  SET deleted_at = NOW()
  WHERE id = p_beverage_id
    AND user_id = auth.uid()
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La bebida no existe o no pertenece a tu cuenta';
  END IF;
END;
$$;
