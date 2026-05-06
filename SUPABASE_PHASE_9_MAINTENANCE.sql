-- ====================================================================
-- FASE 9: OPTIMIZACIÓN CONTINUA Y MANTENIMIENTO TRIMESTRAL
-- Ejecutar en el SQL Editor de Supabase cada 3 meses
-- ====================================================================

-- 1. LIMPIEZA DE DATOS (DATA PURGING)
-- Actualmente usamos "Soft Delete" (deleted_at). Con el tiempo, esto engorda la base de datos.
-- Eliminamos físicamente los registros que llevan más de 90 días borrados para ahorrar costos de Storage en Supabase.

DELETE FROM youths 
WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '90 days';

DELETE FROM retreat_savings 
WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '90 days';

DELETE FROM payments 
WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '90 days';

DELETE FROM people 
WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '90 days';

-- 2. LIMPIEZA DE AUDITORÍA
-- Los logs de auditoría son pesados. Archivar o borrar los mayores a 1 año.
DELETE FROM audit_logs
WHERE created_at < NOW() - INTERVAL '1 year';

-- 3. MANTENIMIENTO DE ÍNDICES (Index Tuning)
-- Para mantener el rendimiento de lectura (Dashboard) al 100%, reindexamos las tablas principales.
-- En Postgres, REINDEX elimina la fragmentación y optimiza la lectura en disco.
REINDEX TABLE youths;
REINDEX TABLE retreat_savings;
REINDEX TABLE payments;
REINDEX TABLE audit_logs;

-- Nota: Supabase ejecuta VACUUM de forma automática periódicamente,
-- pero ejecutar REINDEX trimestralmente asegura que los nuevos cálculos RPC 
-- sigan devolviendo resultados en milisegundos a medida que la iglesia crece.
