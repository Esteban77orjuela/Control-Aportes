# Decisiones Técnicas — Control de Aportes

Registro de decisiones de arquitectura (ADR) del proyecto. Cada entrada documenta
el contexto, la decisión, las alternativas consideradas y la consecuencia. Es la
bitácora que explica por qué el código es como es.

## D01 — PWA web-only en vez de APK nativo

**Contexto.** El proyecto nació como app móvil (APK con Expo/EAS) y evolución hacia
estado local en AsyncStorage con riesgo de pérdida de datos si el teléfono se perdía
o dañaba. La congregación usa celulares variados, incluidos Android sin Play Store
disponible; distribuir APKs requería EAS Build manual y consentir instalaciones
externas.

**Decisión.** Distribuir la aplicación como **PWA instalable** (`expo export` para
web + Workbox). El servidor (Supabase) es la fuente de verdad y el dispositivo
guarda una cola de escrituras offline. Se eliminó toda la capa nativa (EAS, carpetas
`android/`/`ios/`, expo-updates).

**Alternativas.** Mantener APK + EAS (costo de release manual, instalación externa);
PWA + APK en paralelo (duplica el mantenimiento).

**Consecuencia.** Un solo código y un solo artefacto servido por HTTPS. Se pierde
acceso a APIs nativas, que este dominio no necesita. La instalación es un "Agregar
a la pantalla de inicio" desde el navegador.

## D02 — Supabase como backend gestionado

**Contexto.** Se necesitaban base de datos relacional, autenticación, almacenamiento
de firmas y lógica de integridad financiera (ventas, dashboards) sin mantener
infraestructura propia.

**Decisión.** Supabase (PostgreSQL + Auth + Storage + RPCs PostgREST). El esquema se
gestiona con **migraciones SQL versionadas** reproducibles y RLS como modelo de
seguridad por defecto.

**Alternativas.** Backend propio (Express/Fastify) — más control, más operación;
Firebase — buen fit pero SQL para reportes financieros es más sólido aquí.

**Consecuencia.** La seguridad vive en la base de datos (RLS + funciones `SECURITY
DEFINER`), no solo en el cliente. Requiere migraciones disciplinadas y el plan free
impone el keep-alive (ver D06).

## D03 — RPCs con validación de propiedad (SECURITY DEFINER)

**Contexto.** Operaciones complejas (venta de bebidas con descuento atómico de stock,
dashboards agregados) necesitan correr del lado del servidor. Un RPC sin validación
permite a un usuario consultar o mutar datos ajenos.

**Decisión.** Funciones `SECURITY DEFINER` que comparan el `p_user_id` recibido con
`auth.uid()` del solicitante y devuelven `NULL` o lanzan `NOTICE` si no coincide.
En la auditoría de seguridad se detectó y corrigió un RPC de dashboard que no
verificaba la propiedad (migración `0009_dashboard_rpc_auth.sql`).

**Alternativas.** RLS directo sobre selects del cliente (insuficiente para agregados
y atómicos); triggers — más ocultos y difíciles de auditar.

**Consecuencia.** El cliente nunca confía en su propio filtro; el servidor valida
autorización sobre datos ajenos. Requiere vigilar cada función nueva para que
conserve el patrón.

## D04 — Offline: cola en AsyncStorage vs. IndexedDB (deuda pendiente)

**Contexto.** Se desarrollaron dos mecanismos de persistencia offline: una cola de
escrituras en AsyncStorage (`src/utils/offlineSync.ts`, integrada con NetInfo y la
app) y un sistema Dexie/IndexedDB (`src/pwa/db.ts` + `src/pwa/sync.ts`) que quedó
sin conectar.

**Decisión.** La cola de **AsyncStorage es la activa**. Se mantuvo Dexie como sistema
de respaldo documentado, pero duplicar dos motores de sincronización es un riesgo de
inconsistencia.

**Consecuencia (deuda conocida).** Pendiente unificar en un solo motor y retirar el
otro. Hasta entonces, solo `offlineSync.ts` encola y sincroniza operaciones.

## D05 — Índice único y limpieza de datos duplicados

**Contexto.** Usuarios migrando entre teléfonos y la migración local→nube crearon
personas y pagos duplicados (mismos datos, IDs distintos).

**Decisión.** Migración `0007_data_integrity.sql`: índice único sobre campos
significativos (teléfono/persona+monto+mes+año) para impedir duplicados nuevos y
`0010_clean_duplicates.sql`: limpieza de los existentes conservando los más recientes
y reasignando las llaves foráneas.

**Alternativas.** Limpieza manual en consola (no reproducible); upserts por nombre
(arriesgado).

**Consecuencia.** El esquema impide la regresión y la migración documenta el
procedimiento para volver a ejecutarlo en otros entornos.

## D06 — Keep-alive del plan free de Supabase

**Contexto.** Supabase pausa proyectos gratuitos por inactividad (≈1 semana), y una
app de congregación puede no tener tráfico diario.

**Decisión.** Workflow de GitHub Actions (`keep-supabase-active.yml`) que dispara una
petición autenticada al proyecto los lunes y jueves y verifica HTTP 200. Como la
política de ejecuciones programadas de GitHub tiene límites, se agregó además una
tarea programada local para los días intermedios.

**Alternativas.** cron-job.org (más frecuente, configurable) — descartada por decisión
de mantener todo dentro del repo.

**Consecuencia.** Proyecto siempre activo. Hay que vigilar el primer run y el límite
de jobs programados de GitHub.

## D07 — Ventas idempotentes con ID generado en el cliente

**Contexto.** Una venta descuenta stock del servidor. Si la petición se completa pero
la respuesta se pierde por la red, un reintento duplicaría el descuento (stock o
venta duplicados).

**Decisión.** La venta se genera con un `p_sale_id` UUID creado en el cliente. El RPC
`sell_beverage` inserta la venta con ese ID y descuenta stock solo si el ID no existe
(`ON CONFLICT DO NOTHING`); el reintento offline con el mismo ID se trata como éxito.
Misma estrategia para los `INSERT` de pagos y personas en la cola offline: un error
`23505` (llave duplicada) implica que la operación ya llegó y se descarta.

**Consecuencia.** La red es un canal no confiable y el reintento ya no produce datos
duplicados ni descuentos dobles.