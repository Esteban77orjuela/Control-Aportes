# Control de Aportes — Restauración Poder y Vida

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3EECB5?style=for-the-badge&logo=supabase&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Web_App-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)

Sistema de gestión financiera para una congregación religiosa. Digitaliza el registro de aportes mensuales con firma, el control de inventario de bebidas y los ahorros de jóvenes para retiros. Reemplaza las planillas de papel y hojas de cálculo que se usaban antes.

La aplicación es una **PWA web-first** construida con React Native (Expo) sobre un backend gestionado en Supabase (PostgreSQL). Funciona online y offline, y se instala desde el navegador en computadoras, tabletas o celulares.

## Módulos

| Módulo | Funcionalidad |
|:-------|:--------------|
| **Aportes (Música)** | Membresía (CRUD con borrado lógico), registro de aportes mensuales con firma digital, estado anual por miembro (12 meses), ranking, dashboard en vivo y exportación a Excel |
| **Bebidas** | Inventario, ventas atómicas con descuento de stock, reabastecimiento y reinicio contable |
| **Retiro 2026** | Jóvenes con meta de ahorro, edad, cumpleaños y género; abonos con firma; progreso por joven |

## Stack técnico

| Capa | Tecnología |
|:-----|:-----------|
| Aplicación | React Native 0.81 + Expo SDK 54 (web con `react-native-web`) |
| Lenguaje | TypeScript 5.9 (estricto) |
| Navegación | Expo Router |
| Estado de servidor | TanStack Query |
| Persistencia local | AsyncStorage (cola offline) + IndexedDB (Dexie) |
| Backend | Supabase: PostgreSQL, Auth (JWT), Storage (firmas), RPCs `SECURITY DEFINER` |
| Service Worker | Workbox (precache + offline) |
| Exportación | SheetJS (xlsx) |
| Errores | Sentry (configurable por entorno) |

## Datos y seguridad

- **Migraciones versionadas** (`supabase/migrations/0001` … `0012`): esquema completo, RLS en todas las tablas, índices, RPCs y limpiezas de datos, reproducibles en cualquier entorno.
- **Row Level Security**: cada usuario autenticado solo accede a su propio conjunto de filas; las operaciones sensibles (ventas, borrados, dashboards) se ejecutan mediante RPCs del lado del servidor con validación de propiedad.
- **Firmas digitales** subidas a Supabase Storage; la base de datos guarda la ruta, no el binario.
- **Operaciones offline**: si la red falla, las escrituras se encolan en el dispositivo y se sincronizan al volver. Los IDs se generan en el cliente, por lo que los reintentos son idempotentes (un `23505` se trata como éxito).

## Requisitos

- Node.js 20 o superior
- npm 10 o superior
- Cuenta de Supabase (plan free) con proyecto y las migraciones aplicadas
- `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` (la anon key es pública por diseño: el acceso real se controla con RLS)

## Instalación

```bash
git clone https://github.com/Esteban77orjuela/Control-Aportes
cd Control-Aportes
npm install
```

Variables de entorno (`.env` en la raíz):

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-key-anon
EXPO_PUBLIC_SENTRY_DSN=https://tu-dsn@sentry.io/tu-proyecto  # opcional
```

La aplicación funciona sin variables de entorno en desarrollo: si faltan, se usa el proyecto de respaldo de desarrollo y el estricto fallo solo ocurre al compilar para producción.

## Comandos

| Comando | Descripción |
|:--------|:------------|
| `npm start` | Servidor de desarrollo (Expo) |
| `npm run web` | Desarrollo web con recarga en caliente |
| `npm test` | Pruebas unitarias (Jest, 60 tests) |
| `npm run lint` | ESLint sobre `src/` |
| `npm run typecheck` | Verificación de tipos de TypeScript |
| `npm run pwa:build` | `expo export` + inyección del precache de Workbox en `dist/` |
| `npm run pwa:preview` | Sirve `dist/` localmente para probar la PWA |
| `npm run check:env` | Valida el entorno antes de publicar |

## Estructura

```
app/                         Rutas de Expo Router (web + tabletas)
src/
  application/useCases/      Casos de uso (Clean Architecture)
  components/                Componentes web/reutilizables
  data/repositories/         Acceso a datos (Supabase, Storage)
  hooks/                     Hooks de React (datos, auth, conexión)
  lib/                       Configuración (Supabase, guard de auth)
  providers/                 Providers globales (query, alertas, banner)
  pwa/                       Service worker, IndexedDB y sincronización
  services/                  Lógica de negocio (RetreatService)
  styles/                    Sistema de diseño
  types/                     Definiciones TypeScript
  utils/                     export, money, validators, offline, uuid
supabase/migrations/         Esquema y políticas versionadas
scripts/                     Hooks/guards de entorno y migraciones
```

## Testing

60 tests en 6 suites. Cubren validaciones de dominio (jóvenes y abonos), formatos de dinero, UUIDs, exportación a Excel, detección de género y flujos de servicio completos con mocks de repositorios.

## CI/CD

- **PWA CI** (push/PR a main): audit de dependencias (aviso), ESLint, typecheck, 60 tests, y **build completo de la PWA** (`expo export` + Workbox) para garantizar que el artefacto siempre se compila.
- **Keep-alive de Supabase**: workflow programado (lunes y jueves) que hace una petición autenticada al proyecto para evitar que el plan free entre en pausa por inactividad.
- **Escaneo de seguridad**: revisión semanal de dependencias.
- **Despliegue**: la PWA se genera en `dist/`; planificado publicarla automáticamente en Netlify desde CI.

## Licencia

Desarrollado para la congregación Restauración Poder y Vida. Todos los derechos reservados.

## Desarrollador

**Esteban Orjuela** — esteban77orjuela@gmail.com