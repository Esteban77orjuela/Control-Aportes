# Plan de Desarrollo — Control de Aportes

Estructura profesional SDLC para llevar el proyecto de MVP a producción enterprise.

---

## Fase 0 — Visión del Producto
- [x] Definir idea de negocio (documentado en VISION_PRODUCTO.md)
- [ ] Validar con usuarios reales

## Fase 1 — Requerimientos
- [ ] Documentar historias de usuario
- [ ] Definir épicas y backlog
- [ ] Especificar requerimientos no funcionales (rendimiento <200ms, uptime 99.9%)

## Fase 2 — Arquitectura
- [x] Clean Architecture por capas (useCases → repositories → services)
- [ ] Pendiente: Diagrama C4 de la arquitectura actual
- [ ] Pendiente: Documentar decisiones técnicas (por qué Supabase, por qué React Native)

## Fase 3 — Diseño Técnico
- [x] Estructura de carpetas definida
- [x] Patrón Repository implementado
- [ ] Pendiente: Definir contratos de API claros
- [ ] Pendiente: Documentar DTOs

## Fase 4 — Desarrollo (Estándares)
- [x] ESLint configurado
- [x] Prettier configurado
- [x] Husky con pre-commit hooks
- [x] TypeScript estricto
- [ ] Pendiente: Agregar SonarQube o análisis estático

## Fase 5 — Base de Datos
- [x] Migraciones versionadas en supabase/migrations/
- [x] RLS habilitado en todas las tablas
- [x] Índices creados
- [x] Keep-alive function para evitar pausa
- [ ] Pendiente: Agregar más cobertura de índices
- [ ] Pendiente: Auditoría de consultas lentas

## Fase 6 — Testing
- [x] Jest configurado
- [x] Tests unitarios: validators, money, uuid, export, RetreatService (43 tests)
- [x] Tests de integración: RetreatService con mocks (10 tests)
- [ ] Pendiente: Tests unitarios para useCases
- [ ] Pendiente: Tests E2E con Detox o Maestro
- [ ] Pendiente: Alcanzar >70% cobertura

## Fase 7 — Ciberseguridad (DevSecOps)
- [x] Row Level Security en Supabase
- [x] JWT con Supabase Auth
- [ ] Pendiente: Escaneo de dependencias con Snyk o Dependabot
- [ ] Pendiente: Rate limiting
- [ ] Pendiente: Secret scanning

## Fase 8 — Docker
- [x] Crear Dockerfile para entorno de desarrollo
- [x] .dockerignore para builds optimizados

## Fase 9 — CI/CD
- [x] CI con GitHub Actions (lint + test + npm audit)
- [x] Keep-alive automático de Supabase
- [x] CD para despliegue automático de APK con EAS (manual o por tags)
- [ ] Pendiente: Análisis de calidad en CI (SonarQube)

## Fase 10 — Cloud
- [x] Supabase (PostgreSQL, Auth, Storage)
- [ ] Pendiente: Evaluar multi-región si crece

## Fase 11 — Observabilidad
- [x] Integrar Sentry para errores en producción
- [ ] Pendiente: Logs estructurados
- [ ] Pendiente: Monitoreo con Supabase Logs

## Fase 12 — Escalabilidad
- [x] Índices de base de datos para consultas frecuentes (idx_people_user_active, idx_payments_user_active, idx_beverages_user_active)
- [ ] Pendiente: Paginación en consultas grandes (cuando el volumen lo requiera)
- [ ] Pendiente: Caché con React Query ya implementado

## Fase 13 — Mantenimiento y Evolución
- [x] README actualizado con toda la información del proyecto
- [x] CHANGELOG con historial de versiones
- [x] Plan de desarrollo documentado
- [ ] Pendiente: Feature flags para lanzamientos graduales
- [ ] Pendiente: Versionado semántico automatizado

---

## Backlog Priorizado (Sprints)

### Sprint 1 — Fundación (ahora)
- [x] Crear keep-alive de Supabase
- [x] Documentar visión y plan

### Sprint 2 — Testing
- [ ] Tests unitarios de casos de uso existentes
- [ ] Tests de RetreatService
- [ ] Dependabot para seguridad

### Sprint 3 — Calidad
- [ ] SonarQube o ESLint avanzado
- [ ] Revisión y limpieza de código

### Sprint 4 — DevOps
- [ ] CD con EAS Build automático
- [ ] Dockerfile

### Sprint 5 — Observabilidad
- [ ] Sentry
- [ ] Logs
