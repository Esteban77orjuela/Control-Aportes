-- Migration 0010: Limpieza de pagos duplicados + índice único forzado
-- Contexto: durante el bug de edición (borrado RLS fallaba), algunos pagos
-- quedaron duplicados por (user, persona, mes, año), inflando totales.
-- La migración 0007 solo crea el índice único si NO hay duplicados previos;
-- esta migración los elimina (soft delete, conservando el más antiguo) y
-- crea el índice sin importar qué.
-- Idempotente: se puede ejecutar varias veces sin error.

-- =============================================
-- 1) Previsualización (comenta si no la quieres correr)
--    Muestra los duplicados que serán limpiados
-- =============================================
-- SELECT p.user_id, p.person_id, p.month, p.year, count(*) AS veces,
--        string_agg(to_char(p.created_at, 'YYYY-MM-DD HH24:MI'), ', ' ORDER BY p.created_at) AS fechas
-- FROM payments p
-- WHERE p.deleted_at IS NULL
-- GROUP BY p.user_id, p.person_id, p.month, p.year
-- HAVING count(*) > 1;

-- =============================================
-- 2) Soft delete de duplicados (conserva el más antiguo por created_at)
-- =============================================
UPDATE payments p
SET deleted_at = NOW()
WHERE p.deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM payments older
    WHERE older.user_id = p.user_id
      AND older.person_id = p.person_id
      AND older.month = p.month
      AND older.year = p.year
      AND older.deleted_at IS NULL
      AND (older.created_at < p.created_at
           OR (older.created_at IS NOT DISTINCT FROM p.created_at AND older.id < p.id))
  );

-- =============================================
-- 3) Índice único forzado (ya sin duplicados activos)
-- =============================================
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_person_month
ON payments(user_id, person_id, month, year)
WHERE deleted_at IS NULL;
