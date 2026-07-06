# Control de Aportes - Restauración Poder y Vida

![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-54.0.32-000020?style=for-the-badge&logo=expo&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3EECB5?style=for-the-badge&logo=supabase&logoColor=white)

Sistema profesional de gestión de aportes para congregaciones religiosas. Incluye módulos de miembros, pagos con firma digital, control de inventario de bebidas y retiros juveniles.

## Módulos

- **Miembros**: CRUD completo con soft delete
- **Pagos**: Registro con firma digital, control mensual, histórico
- **Dashboard**: Estadísticas en vivo, ranking, gráficos, exportación Excel
- **Bebidas**: Inventario, ventas, cálculo de ganancias
- **Retiros**: Ahorros juveniles con meta y progreso

## Stack técnico

| Capa | Tecnología |
|:-----|:-----------|
| App | React Native 0.81 + Expo SDK 54 |
| Lenguaje | TypeScript 5.9 |
| Estado | TanStack Query (React Query) |
| Navegación | React Navigation 7 |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | Supabase Auth (JWT) |
| Iconos | Lucide React Native |
| Gráficos | React Native Chart Kit |
| Firmas | React Native Signature Canvas |
| Exportación | SheetJS (xlsx) |
| Errores | Sentry |
| CI/CD | GitHub Actions + EAS Build |

## Requisitos

- Node.js 20+
- npm 10+
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Cuenta en Supabase (gratis)
- Cuenta en Sentry (gratis)

## Instalación

```bash
git clone https://github.com/Esteban77orjuela/Control-Aportes
cd Control-Aportes
npm install
```

Configurar variables de entorno (`.env`):

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-key-anon
EXPO_PUBLIC_SENTRY_DSN=https://tu-dsn@sentry.io/tu-proyecto
```

## Comandos

| Comando | Descripción |
|:--------|:------------|
| `npm start` | Inicia servidor de desarrollo |
| `npm test` | Ejecuta tests unitarios (Jest) |
| `npm run lint` | Ejecuta ESLint |
| `npm run android` | Corre en Android |
| `eas build --platform android --profile preview` | Genera APK de prueba |
| `eas build --platform android --profile production` | Genera AAB para producción |

## Estructura

```
src/
  application/useCases/   Casos de uso (Clean Architecture)
  data/repositories/      Acceso a datos (Supabase)
  hooks/                  Custom hooks de React
  lib/                    Configuración (Supabase, Auth)
  screens/                Pantallas de la app
  services/               Lógica de negocio
  styles/                 Sistema de diseño
  types/                  Definiciones TypeScript
  utils/                  Utilidades (export, money, validators, offline)
```

## Tests

53 tests, 6 suites. Cubren:

- Validación de formularios (YouthValidator, SavingValidator)
- Parseo y formateo de dinero
- Generación de UUIDs
- Exportación (getMonthName)
- Detección de género, cálculo de edad, cumpleaños
- Flujo completo de registro de jóvenes y abonos (con mocks)

## CI/CD

- **CI**: Push a main ejecuta lint + test + npm audit
- **CD**: Manual (workflow_dispatch) o automático por tags para build APK con EAS
- **Seguridad**: Escaneo semanal de dependencias
- **Keep-alive**: GitHub Actions previene pausa de Supabase (lunes y jueves)

## Licencia

Desarrollado para Restauración Poder y Vida. Todos los derechos reservados.

## Desarrollador

**Esteban Orjuela** — esteban77orjuela@gmail.com
