# AUDITORÍA TÉCNICA — CONTROL DE APORTES

> **Actualización (2026-09-16):** desde esta auditoría la aplicación dejó de ser un
> APK y se migró a **PWA web-only** (ver `docs/DECISIONES_TECNICAS.md` y
> `CHANGELOG.md` [1.2.0]). Se creó `.git` y el historial ahora vive en GitHub
> (`Esteban77orjuela/Control-Aportes`). El módulo Retiro corrigió la navegación
> (`id` vs `youthId`) y la cola offline es idempotente. El esquema de `youths`,
> `retreat_savings` y `audit_logs` está versionado en
> `20260916_0012_consolidate_missing_tables.sql`. Algunas secciones de este informe
> (APK, docker, expo-updates) quedaron obsoletas y se mantienen solo como historial.

**Fecha:** 14/09/2026 · **Base:** código en `C:\Programacion\Cuotas2\Control-Aportes-main` (verificado archivo por archivo).
**Nota:** No existe carpeta `.git` local → no hay historial de commits comprobable. Los datos de versión vienen de `CHANGELOG.md` y nombres de migraciones.

## 1. IDENTIDAD DEL PROYECTO

| Dato | Hallazgo verificable |
|---|---|
| **Nombre** | "Control de Aportes" / "Control Aportes". Paquete npm `pagos_cuotas` (`package.json`), slug EAS `control-aportes`, bundle `com.estebanorjuela.controlaportes` (`app.json`). |
| **Qué problema resuelve** | Digitaliza la gestión financiera de una congregación: llevar quién aportó cada mes y cuánto, controlar venta de bebidas (stock, costos, ganancias) y administrar ahorros de jóvenes para un retiro. Reemplaza planillas de papel y Excel (`docs/VISION_PRODUCTO.md`). |
| **Para quién** | Tesoreros/administradores y líderes juveniles de la congregación **"Restauración Poder y Vida"** (nombre en README, Home, dashboard y footer). |
| **Contexto de uso** | Herramienta interna sin monetización. Convive como APK Android y PWA web sobre el mismo backend Supabase. |
| **Evidencia de uso real** | Parcial: README declara "Desarrollado para Restauración Poder y Vida", hay logo de la iglesia (`assets/church-logo.png`), versículo en el dashboard, proyecto EAS id `d601242c-15fd-44b0-9b8b-828b8e15398f`, y workflow para "mantener viva" la BD. **Nº real de usuarios: No comprobado**. |
| **Necesidad originaria** | Registro manual de aportes con firma de autorización, más la contingencia de perder el teléfono/datos. La evolución (nube + migración local→cloud + cola offline) refleja que lo primero fue local-only. |

## 2. USUARIOS Y FLUJO REAL

- **Un solo rol funcional**: el código NO implementa roles ni perfiles (ni siquiera "miembro"). Todo usuario autenticado puede hacer todo. `docs/VISION_PRODUCTO.md` habla de 3 perfiles (tesorero, líder juvenil, miembro consultor), pero eso **no existe en el código** — es aspiracional.
- **Registro abierto**: `signUp` con email+contraseña está habilitado para cualquiera (`app/(auth)/login.tsx`) con confirmación por correo (revisa `confirmed_at`).

**Flujo principal** (todo en expo-router):
1. Login/registro por email y contraseña → `(auth)/login.tsx`.
2. `(app)/index.tsx`: Home con 3 tarjetas de módulo + aviso de operaciones offline pendientes + logout.
3. **Música** → dashboard (stats, ranking, pendientes del mes, exportar Excel) → detalle de miembro (estado anual 12 meses) → registrar aporte con firma → WhatsApp de confirmación. Registrar miembro nuevo.
4. **Bebidas** → inventario + ventas (descuenta stock) → agregar producto / reabastecer.
5. **Retiro 2026** → dashboard (progreso por joven) → registrar joven / abono con firma.
6. Cierre de sesión.

## 3. FUNCIONALIDADES (las que existen en el código)

**Principales**
- CRUD de miembros con **soft delete** (`PeopleRepository`, `music/register|edit|[id]`).
- Registro/edición de aportes mensuales **con firma digital** (`music/new.tsx`, `SignaturePad.tsx` en web; subida a Supabase Storage con fallback a `signature_base64`).
- Dashboard Música con stats en vivo desde RPC `get_music_dashboard_stats` (`music/index.tsx`).
- Estado anual por miembro (12 meses verde=pagado/rojo=pendiente), clic abre registro/eliminado (`music/[id].tsx`).
- **Módulo Bebidas**: inventario, venta atómica y descontar stock vía RPC `sell_beverage`, abastecer (`update_beverage_stock`), reiniciar contabilidad (`beverages/*`).
- **Módulo Retiro 2026**: jóvenes con meta, edad, cumpleaños, género; abonos con firma; progreso (RPC `get_retreat_dashboard_stats`).

**Secundarias / administrativas**
- Detección de duplicados por nombre/teléfono al registrar (normalización con acentos y dígitos).
- Badge "Duplicado" en pagos repetidos mes/año.
- Ocultar/mostrar saldo (Eye/EyeOff).
- Exportación a Excel vía SheetJS (`src/utils/export.ts`) con descarga web (Blob) o share nativo.
- Sincronización manual de cola offline desde Home.
- Botón WhatsApp al registrar un aporte (`music/new.tsx`).
- Buscador en dashboards de retiro.
- Registro en `audit_logs` para altas/ediciones de jóvenes y abonos (`AuditRepository`, usado por `RetreatService`).

**Autenticación/seguridad**
- Supabase Auth (email/contraseña, JWT), guardias de ruta por layout, RLS por `user_id`, RPC `SECURITY DEFINER` con validación de `auth.uid()`, soft-delete en todas las tablas.

**Reportes/datos**
- 2 RPC de agregación en BD; lista de pendientes del mes; ranking de aportes; exportación Excel; historical de pagos con firma.

**Otras**
- Offline: cola de operaciones + resync automático por NetInfo; migración de datos locales→nube; banner de conexión.
- PWA: `manifest.json` con shortcuts, service worker con precaché (workbox), background-sync (incompleto, ver §10).

## 4. STACK TECNOLÓGICO

| Tecnología | Para qué se usa |
|---|---|
| **TypeScript 5.9** (strict) | Todo el código app/src. |
| **React 19 + React Native 0.81.5 + Expo SDK 54** | Base del frontend multi-plataforma (Android, iOS, web). |
| **expo-router 6** | Navegación por archivos (rutas `app/`), layouts, deep links. |
| **React Navigation 7** (nativa `@react-navigation/*`) | Solo en `App.tsx` legacy (NO usado por expo-router). |
| **TanStack Query 5** | Estado de servidor: caching (`staleTime` 5m), invalidación, mutations. |
| **Supabase (Postgres + Auth + Storage + PostgREST/RPC)** | Backend/API/BBDD/almacenamiento de firmas. |
| **AsyncStorage** | Cola offline legacy + cache local TTL + migración de datos. |
| **Dexie/IndexedDB** (`src/pwa/`) | Capa offline de la PWA (paralela, sin unificar con la anterior). |
| **react-native-web + workbox** | PWA web, service worker, precaché. |
| **SheetJS (xlsx)** | Exportación a Excel. |
| **react-native-signature-canvas + signature_pad** | Firmas (legacy native y web), el activo usa `signature_pad` en canvas. |
| **lucide-react / lucide-react-native** | Iconografía. |
| **Sentry** | En `package.json`, `metro.config.js` y plugin de `app.json`; **el `Sentry.init` vive solo en `App.tsx` (no usado por expo-router)** → runtime probablemente inactivo. |
| **recharts / react-native-chart-kit** | Declaradas pero **sin uso real** en pantallas activas. |
| **Jest + jest-expo + ts-jest** | 6 suites de tests de lógica pura. |
| **ESLint, Prettier, Husky + lint-staged** | Calidad de código; hook `pre-commit` ejecuta lint-staged. |
| **EAS (Build/Update)** | Compilación de APK/AAB y actualizaciones OTA (`eas.json`, workflow `deploy.yml`). |
| **GitHub Actions** | 4 workflows: CI (lint+test+audit), Deploy (EAS), Keep-alive Supabase, Security-scan semanal. |
| **Dockerfile** | Contenedor de desarrollo (documentado, no verificado en uso). |
| **Despliegue web** | `dist/` exportado + workbox; Netlify mencionado por el propietario (**desde el repo no se comprueba**). |

## 5. ARQUITECTURA

- **Capas** (influencia "Clean Architecture" declarada en README, implementada de forma laxa):
  - Presentación: rutas expo-router `app/(app)/*` (activas) + `src/screens/*` (legacy muerto).
  - Estado/controladores: `src/hooks/` (TanStack Query) y `src/application/useCases/` (contenido mínimo: `dashboard/getDashboardStats`, `exportDashboardExcel`).
  - Lógica de negocio: `src/services/RetreatService.ts` (validación + subida de firma + guardado + auditoría).
  - Datos: `src/data/repositories/*` (patrón Repository sobre Supabase). `src/utils/storage.ts` re-exporta los repos.
- **Comunicación** frontend↔backend: cliente → Supabase PostgREST (REST) y RPC SQL; firmas → Supabase Storage. No hay backend propio.
- **Flujo de datos**: Queries → repos → Supabase; mutaciones → servicios/validaciones → repos → Supabase; invalidación de caché en `onSuccess`.
- **Persistencia**: Supabase (fuente de verdad), AsyncStorage (cola offline + migración), IndexedDB/Dexie (PWA).
- **Autenticación**: sesión Supabase (JWT) escuchada en `providers.tsx` y `useAuth`; guardias por layout.

**Hallazgo arquitectónico clave**: hay **dos sistemas offline en paralelo** (`offlineSync.ts` con AsyncStorage, y `pwa/db.ts`+`pwa/sync.ts` con Dexie). Los repositorios usan el primero; `providers.tsx` sincroniza el segundo. No están unificados, y el `sync` del service worker hace POST a `/api/sync` que **no existe**.

## 6. BASE DE DATOS Y MODELO DE DATOS

- **Tablas versionadas** (en migraciones): `people`, `payments` (0001); `beverages`, `beverage_sales` (0002).
- **Tablas SIN `CREATE TABLE` en el repo**: `youths`, `retreat_savings`, `audit_logs` — se usan en consultas/RPC/perfil de columnas pero su definición **no está versionada** (creadas fuera del control del repo). Riesgo de reproducibilidad.
- **Relaciones**: `people` 1:N `payments` (por `person_id`); `youths` 1:N `retreat_savings` (`youth_id`); `beverages` 1:N `beverage_sales`; todas con `user_id` (multi-tenant por usuario).
- **Reglas**: soft-delete vía `deleted_at` (filtrado en casi todas las queries), índice único parcial `uq_payments_person_month` (evita 2 pagos activos por usuario+persona+mes+año, migración 0007) y limpieza de duplicados previos (0008/0010).
- **RPCs usados por el código (9, verificados)**: `get_music_dashboard_stats`, `get_retreat_dashboard_stats`, `sell_beverage`, `update_beverage_stock`, `soft_delete_person`, `soft_delete_payment`, `soft_delete_beverage`, `soft_delete_youth`, `soft_delete_retreat_saving` + `keep_alive` (keep-alive).

## 7. SEGURIDAD

**Implementada (verificada)**
- RLS habilitada en todas las tablas; políticas `auth.uid() = user_id AND deleted_at IS NULL` (migración 0004/0006).
- RPC `SECURITY DEFINER` con validación interna de `auth.uid()` (0007/0008/0009) → el borrado soft funciona aunque RLS de UPDATE bloquee.
- Sesión JWT gestionada por `@supabase/supabase-js`; guardias en layouts (redirigen a `/login` sin sesión).
- Validaciones de formulario en cliente (`validators.ts`, `money.ts`).
- Firmas en Supabase Storage (paths) con `signature_base64` solo de respaldo.
- `npm audit` en CI + workflow semanal; Dependabot configurado como intención.
- Soft-delete (no eliminar físico) en todas las entidades.

**Debilidades detectadas (sin modificar)**
- **Claves hardcodeadas**: anon key + URL de Supabase en `src/lib/supabase.ts:6-8` y `public/sw.js:12` (usadas como fallback; sin `.env` el build siempre las usa).
- **Registro abierto** (`signUp` público): cualquiera puede crear una cuenta y ver "su propia" BD vacía; no hay allowlist de usuarios.
- **Sentry probablemente inactivo**: el `Sentry.init` está en `App.tsx`, que no es el entry de expo-router (`main: "expo-router/entry"`). La observabilidad declarada no está conectada al runtime activo.
- **Errores tragados**: varios repos devuelven `[]`/valores vacíos en `catch` (fallo silencioso).
- Pendientes documentados (`docs/SEGURIDAD.md`): MFA, rate limiting, monitoreo de logins fallidos.
- `audit_logs` registra operaciones críticas de jóvenes/abonos, pero su política/schema no está versionado.

## 8. EXPERIENCIA REAL DE DESARROLLO (trabajo de ingeniería efectivo)

- **Migración local→nube** con deduplicación inteligente (normalización de acentos/mayúsculas, teléfono con últimos 10 dígitos), mapeo de IDs y **borrado estricto solo si no hubo errores** (`storage.ts`).
- **Cola offline con idempotencia**: maneja error `23505` como éxito en reintentos; reintenta firmas base64 subiendo a Storage primero (`offlineSync.ts`, `pwa/sync.ts`).
- **RPC atómicos e idempotentes**: `sell_beverage` con `ON CONFLICT DO NOTHING` y rollback de la venta si el stock no alcanza (0007).
- **Corrección de duplicados en producción**: índice único parcial + migración de limpieza (0007/0010).
- **Resolución de bugs reales** (esta sesión y anteriores): `Alert.alert` era no-op en web → creado `WebAlertProvider` con modal funcional; bug de parámetros `id` vs `personId` en `music/[id]`; modales rotos por `onTouchStart` en overlay → patrón `Pressable` + `onStartShouldSetResponder`.
- **Offline-first**: banner de conexión (NetInfo + ping Supabase cada 30s), cache TTL (`localCache.ts`).
- **Compatibilidad multi-plataforma**: ramas web en export (Blob), firma web (`signature_pad`), `<input type="date">` vs picker nativo.
- **Mitigación de limitación del plan free** de Supabase con `keep_alive()` (workflow 2×/semana).

## 9. CALIDAD DEL PROYECTO (evaluación honesta)

- **Organización**: buena separación repos/hooks/services/utils; pero con **dead code significativo** (`App.tsx`, `index.ts`, 16 pantallas en `src/screens/` que nadie importa, dependencias muertas como `recharts`, `react-native-chart-kit`, `@react-navigation/*`).
- **Mantenibilidad**: TS strict + `typecheck` OK; ESLint/Prettier/Husky configurados; pero hay **duplicación** (2 sistemas offline, 2 `syncOfflineOperations`, `guessGender` duplicado) y un script roto (`pwa:generate-icons` apunta a un archivo que no existe).
- **Testing**: 6 suites / 53 tests (según CHANGELOG) sobre lógica pura (validators, money, uuid, export, RetreatService). **Sin** tests de repositorios, hooks ni UI.
- **Documentación**: rica (README, CHANGELOG, VISION, SEGURIDAD, PLAN, REPORTE_AUDITORIA) pero con **discrepancias** (SEGURIDAD.md afirma "sin secretos hardcodeados"; el `REPORTE_AUDITORIA.md` de 11/02/2026 puntúa 2/10 describiendo un estado pre-nube que ya no corresponde al código actual).
- **Seguridad**: RLS + RPC definers sólidos; contrarrestado por claves en el bundle y registro abierto.
- **Escalabilidad**: multi-tenant por `user_id`, índices, agregación en servidor; sin paginación ni estrategia para volúmenes grandes (reconocido en PLAN).
- **UX**: diseño visual cuidado (tarjetas, temas, feedback con mensajes); pero con **bugs que rompen UX real**: `retreat/[id].tsx` y `retreat/edit.tsx` leen `youthId` mientras la ruta expone `id` (pantalla "no encontrado") — mismo bug que ya se corrigió en música; y la firma **no funciona en Android/iOS** en las rutas activas (solo web).

## 10. ESTADO ACTUAL

- **Terminado**: Música completo; Bebidas completo; Retiro (dashboard, registro, abono); autenticación + RLS; exportación Excel; cola offline; PWA build; documentación principal.
- **Parcial / con bugs**: detalle y edición de joven (bug `youthId`); firma en native; background-sync (`/api/sync` inexistente); Sentry runtime; migración `0011` (retiro soft-delete RPC) **no está confirmado si se aplicó** a producción; regeneración de iconos PWA.
- **Pendiente de publicar**: la versión web en Netlify — según indicación del propietario, la versión pública seguía siendo anterior al último build (no verificable desde el repo).
- **Parece abandonado/inactivo**: toda la capa legacy (`App.tsx`, `src/screens/*`, `@react-navigation/*`) y `REPORTE_AUDITORIA.md` (desactualizado).
- **En producción/uso real**: No comprobable desde el código; solo hay indicios (proyecto EAS, keep-alive, README con congregación).

## 11. EVIDENCIA PROFESIONAL (qué mostrar a un recruiter)

- **Problema real y cliente real**: gestión de finanzas de una congregación (entidad nombrada), necesidad de reemplazar papel/Excel.
- **Evolución real**: de almacenamiento local a nube con migración de datos y deduplicación; de MVP a seguridad RLS + RPC definers + soft-delete.
- **Decisiones técnicas documentadas**: migraciones SQL versionadas (001→011), liberación de bugs de paridad (PWA vs APK), offline-first, RPC atómicos, keep-alive de un plan free.
- **CI/CD + calidad**: 4 workflows de GitHub Actions, Husky/eslint/prettier, 53 tests.
- **Multi-plataforma**: código compartido RN/Expo → Android/iOS/Web/PWA con ramas por plataforma.
- **Incidencias solucionadas**: duplicados de pagos, RLS bloqueando borrado, `Alert` muerto en web, enrutado de detalle.
- **Despliegue/mantenimiento**: EAS Update OTA + PWA (Netlify) + workflow de keep-alive.

**Importante para el portafolio**: equilibra narrar estas fortalezas con la honestidad de que hay dead-code, software sin tests de UI y bugs vigentes.

## 12. HISTORIA DEL PROYECTO

**Sin `.git` local → historial de commits imposible de consultar.** Lo que sí es comprobable:
- **CHANGELOG** da una evolución clara: `1.0.0` MVP (local) → `1.0.1` keep-alive + visión → `1.0.2` tests (53) → `1.0.3` seguridad y CI/CD → `1.0.4` Sentry → `1.0.5` Docker/README/plan → `1.0.6` resiliencia offline (cache, banner, monitoreo) → `1.0.7` estado anual interactivo + soft-delete de pagos → `1.1.0` EAS Update OTA.
- **Migraciones** (mar-2026 a sep-2026) revelan la misma curva: esquema → bebidas → optimización → hardening → keep-alive → fix RLS prod → integridad → RPCs soft-delete → auth en RPC → limpieza duplicados → retiro.
- **`REPORTE_AUDITORIA.md` (11-02-2026)** es la fotografía previa a la nube; el código actual lo contradice (ya hay backend/auth/CI/tests).

## 13. INFORMACIÓN QUE NO SE PUDO COMPROBAR

1. ¿Cuántas personas usan la app hoy (admin + líderes + miembros)?
2. ¿Desde cuándo está en uso real? ¿Se usó primero offline-local y luego se migró a la nube?
3. ¿Qué problema existía antes (planillas, quién las llevaba, qué se perdía)?
4. ¿Quién solicitó el sistema (tesorero, pastor, líder juvenil)?
5. ¿El formulario/Auth de registro: hay allowlist real de cuentas, o cualquiera puede registrarse en producción?
6. ¿Qué mejoras surgieron de feedback real de usuarios? ¿Qué pedían?
7. ¿Qué incidencias resolviste en producción (datos duplicados, pérdida de firma, RLS)? Sí se ve en migraciones; confirma cuáles ocurrieron de verdad.
8. ¿Dónde está desplegada cada versión (APK vía Expo/EAS, PWA en Netlify `lovely-lily-7cc5f5`)? ¿La versión pública de la PWA está al día?
9. ¿Se aplicó la migración `0011` a la BBDD de producción?
10. ¿Mantenimiento periódico real: keep-alive funcionando, copias de seguridad, monitoreo de logins?
11. ¿Sentry captura errores de la app actual, o quedó inactiva al migrar a expo-router?
12. ¿Cuántos miembros/pagos/jóvenes hay registrados HOY (conteo puntual)? (No declararlo en el CV.)

## 14. RESUMEN EJECUTIVO

Control de Aportes es una app financiera real para la congregación "Restauración Poder y Vida": gestiona aportes mensuales con firma digital, venta de bebidas e inventario, y ahorros para retiro juvenil. Técnicamente demuestra un trayecto completo de junior: React Native/Expo SDK 54 + TypeScript estricto, expo-router, TanStack Query, Supabase (Postgres + Auth + Storage + RPC SQL con RLS y SECURITY DEFINER), exportación Excel, sincronización offline con cola y migración de datos con deduplicación, PWA con service worker, y CI/CD con GitHub Actions + EAS + testing (53 tests). Lo más valioso para el perfil es la **evidencia de evolución y resolución de problemas reales**: migración local→nube, arreglo de duplicados, bugs de paridad web/APK, y RLS que bloqueaba borrados. Como contraparte honesta, incluye dead-code legacy, firma no funcional en Android en las rutas activas, dos sistemas offline sin unificar y un bug vigente en el detalle de retiro — integridad que, bien presentada, refuerza más que resta credibilidad como desarrollador Junior Full Stack.