# Visión del Producto — Control de Aportes

## ¿Qué problema resuelve?
Llevar el control de aportes económicos mensuales de los miembros de una congregación, permitiendo registrar quién pagó, cuánto, y generar reportes. También administrar la venta de bebidas (inventario, costos, ganancias) y retiros juveniles (ahorros).

## ¿Quién lo usará?
- Administradores/tesoreros de la congregación
- Líderes juveniles (módulo de retiros)
- Miembros que necesitan ver su historial de aportes

## Objetivo de negocio
Digitalizar por completo la gestión financiera de la congregación, eliminando planillas en papel y Excel, con respaldo en la nube (Supabase) y funcionalidad offline.

## Valor que entrega
- App móvil (Android) siempre disponible incluso sin internet
- Sincronización automática cuando hay conexión
- Reportes exportables a Excel
- Dashboard con estadísticas en tiempo real
- Control de inventario de bebidas con cálculo de ganancias

## Cómo monetiza (si aplica)
Actualmente es una herramienta interna sin monetización directa. A futuro podría:
- Ofrecerse como SaaS a otras congregaciones
- Cobrar por reportes avanzados o almacenamiento extra

## Riesgos
- Dependencia del plan gratuito de Supabase (pausa por inactividad) — **mitigado** con keep-alive
- Pérdida de datos offline si no se sincroniza correctamente
- Dispositivos perdidos sin respaldo
