# Scripts SQL legados (archivo)

Estos scripts preceden a las migraciones versionadas y fueron **reemplazados por
`supabase/migrations/` (0001–0014)**. Se conservan en archivo por trazabilidad, pero
no deben aplicarse en entornos nuevos: el esquema canónico vive exclusivamente en el
directorio `supabase/migrations/`.

- `SUPABASE_SETUP.sql` — esquema inicial de Aportes
- `SUPABASE_BEVERAGES.sql` — módulo de Bebidas
- `SUPABASE_OPTIMIZATIONS.sql` — optimizaciones y arreglos de seguridad tempranos
- `SUPABASE_PHASE_5_FINANCE.sql` — fase 5 de datos financieros
- `SUPABASE_PHASE_9_MAINTENANCE.sql` — fase 9 de optimización