# Seguridad — Control de Aportes

## Modelo de seguridad

### Base de datos (Supabase)
- Row Level Security (RLS) habilitada en todas las tablas
- Políticas basadas en `auth.uid()`: cada usuario autenticado solo lee/inserta/actualiza filas con su `user_id`
- Soft delete (borrado lógico) en lugar de borrado físico
- Operaciones sensibles expuestas como RPCs `SECURITY DEFINER` con validación de `auth.uid()` vs `p_user_id` (ver `docs/DECISIONES_TECNICAS.md` D03)
- Migraciones versionadas (`supabase/migrations/0001`…`0012`) reproducibles en cualquier entorno

### Clave anónima y secretos
- **La `anon key` de Supabase es pública por diseño**: viaja en el bundle de la PWA y da acceso solo a lo que RLS permite. El control real está en las políticas de la base de datos.
- El código usa variables de entorno (`EXPO_PUBLIC_*`). Si faltan en el entorno local, se usa un proyecto de respaldo de desarrollo; al compilar para producción, la aplicación **falla explícitamente** si no hay credenciales en lugar de funcionar con valores de prueba.
- No se versiona ningún secreto: `.env` está en `.gitignore` y las credenciales de producción viven solo en los secretos del CI (GitHub Actions) o del host.

### Autenticación
- Supabase Auth con JWT; sesión gestionada por `@supabase/supabase-js`
- Registro con confirmación de correo (`confirmed_at` verificado antes de entrar)
- Rutas protegidas con `authGuard.ts`

### Firmas y datos personales
- Las firmas digitales se suben a **Supabase Storage** (bucket `signatures`) y la base de datos guarda la ruta, no el binario
- Datos personales (nombres, teléfonos, firmas) limitados por RLS al propietario de la sesión

### Dependencias
- Dependabot activado (alertas automáticas)
- `npm audit` en CI como **aviso no bloqueante**: existe un baseline conocido de advisories transitivos de la toolchain de Expo/Metro y de `xlsx@0.18.5` (ReDoS/Prototype Pollution, sin corrección publicada en npm para la versión instalada; `xlsx` se usa solo para **escritura** de archivos, no para parsear datos no confiables)
- Escaneo semanal programado (`security-scan.yml`)
- Lint con reglas TypeScript estrictas en CI (0 errores/0 warnings exigidos)

### Transporte
- HTTPS en producción (Supabase y host de la PWA)
- `CSP`/headers adicionales a definir cuando se despliegue en el host final

## Recomendado para producción
- [ ] Autenticación multifactor (MFA)
- [ ] Rate limiting en endpoints sensibles (correo de recuperación, registro)
- [ ] Monitoreo de intentos fallidos de login y alertas de actividad anómala
- [ ] Pruebas de penetración periódicas
- [ ] Definir política de retención/borrado de firmas en Storage
- [ ] Revisar `xlsx` si algún día se importan archivos Excel generados por terceros