# Keep-alive de Supabase (plan free)

Supabase pausa automáticamente los proyectos del plan gratuito que presentan baja
actividad durante ~1 semana. La actividad que cuenta es la que **llega a Postgres**
(consultas, llamadas API, peticiones de la aplicación); la guía oficial recomienda
"unas pocas consultas al día". Un proyecto pausado conserva sus datos y puede
reanudarse desde el dashboard durante un año, pero deja de servir la API mientras
está pausado.

Este documento describe cómo se mantiene el proyecto activo y cómo verificar que el
mecanismo siga funcionando.

## Mecanismo

La migración `20260309_0005_keep_alive_function.sql` crea una función trivial:

    keep_alive()  -- devuelve { ok: true, timestamp } y se ejecuta en Postgres

Al invocarla por la API REST de PostgREST, la petición ejecuta SQL en la base, que es
justo lo que Supabase contabiliza como actividad:

    POST {url}/rest/v1/rpc/keep_alive

Headers:

    apikey: <anon key>
    Authorization: Bearer <anon key>
    Content-Type: application/json

Body: `{}`

La anon key es pública por diseño (el acceso real a los datos se controla con RLS);
usarla aquí no expone información.

## Ejecución activa: cron-job.org (cada 3 horas)

Con una cuenta gratuita en https://cron-job.org:

1. **New job** → *Basic settings*:
   - Title: `Supabase keep_alive`
   - URL: `https://TU-REFERENCIA.supabase.co/rest/v1/rpc/keep_alive`
2. **Request Method & Content Type** → `POST`:
   - Content type: `application/json`
   - Request body: `{}`
3. **HTTP Request Headers**:
   - `apikey: TU_ANON_KEY`
   - `Authorization: Bearer TU_ANON_KEY`
4. **Execution schedule**: intervalo de **3 hours** (~8 consultas/día, holgado sobre
   el umbral de "unas pocas al día").
5. **Email notifications**: activar para enterarte si algún disparo falla.

Los valores `TU-REFERENCIA` y `TU_ANON_KEY` están en el `.env` del repositorio
(`EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`).

### Verificación rápida desde una terminal

    curl -s -o /dev/null -w "%{http_code}" -X POST "https://TU-REF.supabase.co/rest/v1/rpc/keep_alive" -H "apikey: TU_ANON_KEY" -H "Authorization: Bearer TU_ANON_KEY" -H "Content-Type: application/json" -d "{}"

`200` significa que el proyecto está activo y la petición llegó a Postgres. Si el
proyecto estuviera pausado, la respuesta no será `200`.

## Fallback opcional: tarea local

`scripts/keep-alive-supabase.ps1` hace la misma llamada con registro en
`scripts/logs/keep-alive.log`. Puede programarse con el Programador de tareas de
Windows, pero solo funciona con el equipo encendido y con DNS disponible; no es un
plan primario.

## Límites y honestidad

- Es una **mitigación operativa**, no una garantía contractual: si el cron externo se
  detiene o falla, la ventana de 7 días de baja actividad vuelve a correr.
- La garantía de "nunca se pausa" solo existe bajo un plan de pago (Pro).
- GitHub Actions ya no participa en el keep-alive: sus jobs programados se
  auto-desactivan tras ~60 días sin actividad en el repositorio, lo que lo hacía
  poco confiable como mecanismo primario.