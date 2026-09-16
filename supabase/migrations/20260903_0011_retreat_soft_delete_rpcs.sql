-- Migration 0011: Soft delete del módulo Retiro vía RPC (SECURITY DEFINER)
-- Motivo: deleteYouth y deleteRetreatSaving usaban UPDATE directo, que depende
-- de las políticas RLS de escritura en `youths` y `retreat_savings`. Si RLS
-- bloquea el UPDATE (error 42501), el botón "eliminar" falla. Con SECURITY
-- DEFINER el borrado funciona siempre y es inmune a la configuración de
-- políticas, igual que en Música (soft_delete_person/payment) y Bebidas.
-- Idempotente: se puede ejecutar varias veces sin error.

-- =============================================
-- 1) Soft delete de un abono de retiro
-- =============================================
CREATE OR REPLACE FUNCTION soft_delete_retreat_saving(p_saving_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  UPDATE retreat_savings
  SET deleted_at = NOW()
  WHERE id = p_saving_id
    AND user_id = auth.uid()
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El abono no existe o no pertenece a tu cuenta';
  END IF;
END;
$$;

-- =============================================
-- 2) Soft delete de un joven y sus abonos (atómico)
-- =============================================
CREATE OR REPLACE FUNCTION soft_delete_youth(p_youth_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  UPDATE retreat_savings
  SET deleted_at = NOW()
  WHERE youth_id = p_youth_id
    AND user_id = auth.uid()
    AND deleted_at IS NULL;

  UPDATE youths
  SET deleted_at = NOW()
  WHERE id = p_youth_id
    AND user_id = auth.uid()
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El joven no existe o no pertenece a tu cuenta';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION soft_delete_retreat_saving(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_youth(UUID) TO anon, authenticated;