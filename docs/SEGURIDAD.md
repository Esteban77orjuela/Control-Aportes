# Seguridad — Control de Aportes

## Medidas implementadas

### Base de datos (Supabase)
- Row Level Security (RLS) en todas las tablas
- Políticas basadas en `auth.uid()` — cada usuario solo ve sus datos
- Soft delete en lugar de borrado físico
- Migraciones versionadas

### Autenticación
- Supabase Auth con JWT
- Sesión gestionada por `@supabase/supabase-js`
- Protección de rutas con `authGuard.ts`

### Código
- ESLint con reglas de seguridad
- TypeScript estricto
- Pre-commit hooks (Husky + lint-staged)
- Sin secretos hardcodeados (variables de entorno)

### Dependencias
- Dependabot activado (alertas automáticas)
- `npm audit` en CI (cada push)
- Escaneo semanal programado

### Cifrado
- Conexiones HTTPS (Supabase)
- Fotos de firmas almacenadas en Supabase Storage (no en base de datos)

## Recomendado para producción
- [ ] Agregar autenticación multifactor (MFA)
- [ ] Rate limiting en endpoints sensibles
- [ ] Monitoreo de intentos fallidos de login
- [ ] Pruebas de penetración periódicas
