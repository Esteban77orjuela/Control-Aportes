# Changelog

## [1.2.1] — 2026-09-24
### Seguridad y observabilidad
- `ErrorBoundary` de clase que registra errores no capturados en Sentry sin romper la interfaz (integrado en `AppProviders`)
- Migración `0013`: registro por invitación (`signup_allowlist`) con trigger sobre `auth.users`
- Migración `0014`: bucket `signatures` idempotente con subida solo para usuarios autenticados
- `docs/SEGURIDAD.md` y `docs/DECISIONES_TECNICAS.md` (D08, D09) actualizados

### Calidad
- 8 pruebas nuevas sobre la capa de datos y la sincronización offline (`PaymentRepository`, `PeopleRepository`, `offlineSync`); total **68 tests en 9 suites**

### Despliegue
- `netlify.toml` + job `deploy-netlify` en CI: publica la PWA en Netlify al hacer push a main (se omite si no hay credenciales configuradas)

### Mantenimiento
- Keep-alive de Supabase migrado a `cron-job.org` (cada 3 horas): deja de depender del cron de GitHub y de la tarea local
- Eliminado `keep-supabase-active.yml`; receta completa en `docs/KEEP_ALIVE.md`

## [1.2.0] — 2026-09-16
### Migración completa a PWA web-only
- Eliminada la capa de APK nativo (EAS, `android/`, `ios/`, expo-updates): la aplicación ahora se distribuye como PWA instalable desde el navegador
- Ruteo y layouts migrados a Expo Router web (`app/`); `screens/` y navegadores antiguos eliminados
- Service Worker con Workbox (`public/sw.js`) con precache automático: funciona offline una vez instalada
- `providers.tsx` movido fuera de `app/` a `src/providers/AppProviders.tsx` (evita la ruta fantasma de expo-router)
- Registro del service worker en producción (`src/pwa/registerSW.ts`)

### Fiabilidad
- Cola offline con IDs de cliente idempotentes (`PeopleRepository` y `PaymentRepository` ahora reutilizan el mismo ID en el insert y en el encolado; corregida la fuga de UUID vacío en el reintento de personas)
- Corrección del módulo Retiro: el detalle y la edición de un joven usan el mismo parámetro (`id`) al navegar
- ESLint en `src/` con 0 errores y 0 warnings; tipado eliminado de todos los `any` del dominio
- Dependencias sin uso eliminadas (`workbox-window`, `idb`, `@types/uuid`)
- Migración nueva `20260916_0012_consolidate_missing_tables.sql`: crea de forma idempotente `youths`, `retreat_savings`, `audit_logs` (RLS + políticas + índices) y añade `payments.signature_path`
- `20260805_0006_fix_production_rls.sql` blindado con guards para permitir instalaciones limpias

### CI/CD
- Workflow unificado "PWA CI": audit (aviso), lint, typecheck, 60 tests y build completo de la PWA en cada push
- `actions/checkout` y `actions/setup-node` actualizados a v5
- Dockerfile y .dockerignore eliminados (ya no aplican a una PWA web)

## [1.1.0] — 2026-07-27
### EAS Update (actualizaciones OTA)
- Instalado `expo-updates`
- Canales configurados en `eas.json`: development, preview, production
- `appVersionSource: remote` para versionado automático
- URL de updates y runtimeVersion en `app.json`
- Workflow de deploy actualizado: puede publicar updates OTA o compilar APK

### Dependencias
- Instalado `react-native-gesture-handler` (peer dependency requerida por @react-navigation/stack)
- Deduplicadas dependencias con `npm dedupe` (expo-constants)
- Expo Doctor: 18/18 checks pasando

## [1.0.7] — 2026-07-27
### Estado Anual interactivo
- Click en mes rojo (no pagado): abre registro de pago con persona y mes precargados
- Click en mes verde (pagado): permite eliminar el pago de ese mes (soft delete)
- `PaymentRepository.delete()` con soft delete
- Hook `useDeletePayment`
- `NewPayment` acepta params opcionales (personId, month, year) y bloquea la fecha

## [1.0.6] — 2026-07-27
### Resiliencia offline
- Cache local de lectura (`src/utils/localCache.ts`) — guarda datos en AsyncStorage con TTL
- Hook de monitoreo de conexión (`src/hooks/useConnectionStatus.ts`) — verifica red + Supabase cada 30s
- Barra de alerta roja/verde (`src/components/ConnectionBanner.tsx`) — visible cuando Supabase falla
- Integración del banner en AuthScreen y app principal

## [1.0.5] — 2026-07-06
### Infraestructura y documentación
- Dockerfile para entorno de desarrollo
- .dockerignore para builds optimizados
- README actualizado con toda la información del proyecto
- Plan de desarrollo completado (13 fases)
- Documento de seguridad (docs/SEGURIDAD.md)

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
