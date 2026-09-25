# Control de Aportes

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3EECB5?style=for-the-badge&logo=supabase&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Web_App-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
![CI](https://img.shields.io/github/actions/workflow/status/Esteban77orjuela/Control-Aportes/ci.yml?style=for-the-badge&label=PWA%20CI)

A financial management system for a church congregation that replaces paper
ledgers and spreadsheets. It digitalizes monthly contributions with digital
signatures, beverage inventory and sales, and youth savings for retreats — with
full offline support.

A **web-first PWA** built with React Native (Expo) on a Supabase (PostgreSQL)
backend. It installs from the browser on computers, tablets, and phones.

## Why it exists

The congregation tracked weekly offerings and monthly contributions on paper and
Excel files. That meant manual sums, lost records, no per-member history, and a
painful year-end reconciliation. This app centralizes the books into a single
source of truth (PostgreSQL + Row Level Security), works on any device, and keeps
functioning when the internet is down.

## Features

| Module | Functionality |
|:-------|:--------------|
| **Aportes (Music)** | Membership (CRUD with soft deletes), monthly contributions with digital signature, 12-month yearly status per member, ranking, live dashboard, and Excel export |
| **Beverages** | Inventory, atomic sales with stock deduction, restocking, and accounting reset |
| **Retiro 2026** | Youths with savings goals, age/birthday/gender tracking, savings with signature, and per-youth progress |

## Demo

> Live deployment: add the Netlify URL here once the first deploy is done.

The app requires authentication. Components are shared **on request** (the data
belongs to a real congregation), so for a hands-on look plus screenshots:

- Drop one screenshot per module under `assets/screenshots/` and link it here.
- Ask for a demo account to try the live instance directly.

## Tech stack

| Layer | Technology |
|:------|:-----------|
| Application | React Native 0.81 + Expo SDK 54 (web via `react-native-web`) |
| Language | TypeScript 5.9 (strict) |
| Routing | Expo Router |
| Server state | TanStack Query |
| Local persistence | AsyncStorage (offline queue) — see D04 for the pending Dexie/IndexedDB unification |
| Backend | Supabase: PostgreSQL, Auth (JWT), Storage (signatures), `SECURITY DEFINER` RPCs |
| Service worker | Workbox (precache + offline) |
| Export | SheetJS (xlsx) |
| Errors | Sentry (per-environment) |

## Architecture

- **Clean Architecture layering**: `src/application/useCases` → `src/data/repositories`
  → `src/services`, with Expo Router routes in `app/`.
- **Security in the database**: every table has Row Level Security; sensitive
  operations (sales, soft deletes, dashboards) run as server-side RPCs that verify
  ownership against `auth.uid()`.
- **Versioned schema**: 14 migrations (`supabase/migrations/0001…0014`),
  reproducible in any environment (tables, RLS, policies, indexes, data cleanup).
- **Offline-first writes**: on network failure, writes are queued on the device and
  replayed. IDs are generated client-side, so replays are idempotent (a `23505`
  duplicate is treated as success).
- The full decision log lives in [`docs/DECISIONES_TECNICAS.md`](docs/DECISIONES_TECNICAS.md) (D01–D09).

## Getting started

Requirements: Node.js 20+, npm 10+, a Supabase project with the migrations applied.

```bash
git clone https://github.com/Esteban77orjuela/Control-Aportes
cd Control-Aportes
npm install
```

Environment variables (`.env` in the root):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project  # optional
```

The app runs without env vars in development using placeholder credentials and
only the production build (`APP_ENV=production`) fails hard when they are missing.

## Commands

| Command | Description |
|:--------|:------------|
| `npm start` | Expo development server |
| `npm run web` | Web development with hot reload |
| `npm test` | Jest unit/integration tests (68) |
| `npm run lint` | ESLint over `src/` (0 errors / 0 warnings) |
| `npm run typecheck` | TypeScript strict type check |
| `npm run pwa:build` | `expo export` + Workbox precache injection into `dist/` |
| `npm run pwa:preview` | Serve `dist/` locally to test the PWA |
| `npm run check:env` | Validate environment before publishing |

## Testing

68 tests in 9 suites. They cover domain validations (youth and savings), money
formatting, UUIDs, Excel export, gender detection, full service flows with mocked
repositories, data-layer repositories (offline queueing with client-side IDs), and
the offline sync (duplicate `23505` handling and signature upload).

## CI/CD

- **PWA CI** (push/PR to `main`): dependency audit (non-blocking notice), ESLint,
  typecheck, 68 tests, and a full PWA build (`expo export` + Workbox) to guarantee
  the artifact always compiles.
- **Deploy**: `netlify.toml` + the `deploy-netlify` job publishes the PWA to
  Netlify on every push to `main` (skipped until credentials are configured).
- **Security scan**: weekly dependency audit (`security-scan.yml`).
- **Supabase keep-alive**: an external cron (cron-job.org, every 3 hours) calls the
  `keep_alive()` RPC so the free-tier project never pauses for inactivity. See
  [`docs/KEEP_ALIVE.md`](docs/KEEP_ALIVE.md).

## Known limitations

Kept honest on purpose — full context per decision in
[`docs/DECISIONES_TECNICAS.md`](docs/DECISIONES_TECNICAS.md):

- **D04**: two offline engines exist; the AsyncStorage queue is the active one and
  the Dexie/IndexedDB system is inert. Unification is pending.
- **D09**: signatures bucket is public/private — the final access decision is
  pending (URL-signed vs public paths).
- **npm audit baseline**: the Expo/Metro toolchain and `xlsx@0.18.5` carry
  advisories with no upstream fix; documented and monitored in
  [`docs/SEGURIDAD.md`](docs/SEGURIDAD.md).
- **Free-tier Supabase**: pauses without activity (mitigated by the keep-alive
  cron, but it is an operational mitigation, not a contractual guarantee).

## License

Proprietary — all rights reserved. Built for the congregation "Restauración Poder
y Vida". See [`LICENSE`](LICENSE).

## Author

**Esteban Orjuela** — esteban77orjuela@gmail.com

---

## Español (resumen)

Sistema de gestión financiera para una congregación: digitaliza aportes mensuales
con firma, inventario de bebidas y ahorros de jóvenes para retiros. Es una PWA web
(React Native/Expo + Supabase/PostgreSQL) con soporte offline y sincronización
idempotente, esquema versionado por migraciones y seguridad basada en Row Level
Security. La documentación técnica (decisiones, seguridad, plan y visión) está en
español en la carpeta [`docs/`](docs/).