# Changelog

## [1.0.4] — 2026-07-06
### Observabilidad
- Integración de Sentry para monitoreo de errores en producción
- Configuración de `sentry-expo` en app.json
- Inicialización de Sentry en App.tsx
- Variables de entorno para DSN

## [1.0.3] — 2026-07-06
### Seguridad
- Auditoría `npm audit` agregada al CI (cada push)
- Workflow semanal de escaneo de seguridad (`security-scan.yml`)
- Documento de seguridad (`docs/SEGURIDAD.md`)

### CI/CD
- Pipeline de deploy con EAS Build (`deploy.yml`) — manual o por tags
- Actualización de plan de desarrollo

## [1.0.2] — 2026-07-06
### Añadido
- Tests unitarios para `validators.ts` (YouthValidator, SavingValidator) — 12 tests
- Tests unitarios para `money.ts` (roundMoney, parseMoneyInput) — 12 tests
- Tests unitarios para `uuid.ts` (generateUUID) — 3 tests
- Tests unitarios para `export.ts` (getMonthName) — 4 tests
- Tests adicionales para `RetreatService` (guessGender, calculateAge, isBirthdayThisWeek) — 12 tests
- Export de `getMonthName` en `export.ts` para permitir testing
- Tests de integración para `RetreatService` con mocks (registerYouth, addSaving, updateYouth) — 10 tests
- Cobertura total: 53 tests, 6 suites

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
