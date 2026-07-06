# Changelog

## [1.0.2] — 2026-07-06
### Añadido
- Tests unitarios para `validators.ts` (YouthValidator, SavingValidator) — 12 tests
- Tests unitarios para `money.ts` (roundMoney, parseMoneyInput) — 12 tests
- Cobertura total: 27 tests, 3 suites

## [1.0.1] — 2026-07-06
### Añadido
- Función RPC `keep_alive()` en Supabase para evitar pausa por inactividad
- Workflow de GitHub Actions que ejecuta keep-alive lunes y jueves
- Documento de visión del producto (`docs/VISION_PRODUCTO.md`)
- Plan de desarrollo profesional (`docs/PLAN_DESARROLLO.md`)
- Este changelog (`CHANGELOG.md`)

## [1.0.0] — MVP Funcional
### Añadido
- Módulo de miembros (CRUD con soft delete)
- Módulo de pagos (registro con firma digital)
- Módulo de bebidas (inventario, ventas, ganancias)
- Módulo de retiros juveniles (ahorros)
- Dashboard con estadísticas
- Exportación a Excel
- Sincronización offline
- Autenticación con Supabase
- RLS en todas las tablas
- Migraciones SQL versionadas
- CI con GitHub Actions
- Husky + ESLint + Prettier
