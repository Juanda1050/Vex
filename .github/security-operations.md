# Operaciones de seguridad

## Mínimo privilegio

- Mantener permisos por rol en `server/auth/constants/permissions.constants.ts`.
- Usar `requirePermission` en páginas y acciones, `requirePermissionApi` en APIs.
- Aplicar cambios de permisos mediante `TenantRolePermission`; nunca desde datos enviados por cliente.
- Usar usuario PostgreSQL de aplicación sin privilegios de DDL ni superusuario.
- Mantener claves de servicio Supabase y Stripe solo en configuración de servidor. Revocar acceso de personal que ya no lo necesite.

## Respuesta ante incidente

1. Contener: revocar sesiones afectadas, deshabilitar credenciales expuestas y preservar logs.
2. Evaluar: determinar usuarios, tenants y ventanas de tiempo afectados. No incluir secretos ni PII en tickets.
3. Erradicar: corregir causa, rotar claves, invalidar tokens y aplicar migraciones necesarias.
4. Recuperar: restaurar desde backup probado, monitorizar errores y confirmar integridad por tenant.
5. Documentar: registrar línea temporal, impacto, causa, controles correctivos y responsable de seguimiento.

## Rotación y backups

- Rotar `STRIPE_SECRET_KEY`, credenciales Supabase y `DATABASE_URL` tras exposición y cada ciclo operativo definido.
- Actualizar secretos primero en proveedor, después en despliegue; verificar health checks antes de revocar valor previo.
- Probar restauración de backups PostgreSQL periódicamente en entorno aislado.
- Restringir acceso a backups y cifrarlos en reposo y tránsito.

## Pendientes operativos

- Crear migración Prisma para eventos de auditoría con retención y controles de lectura.
- Configurar timeouts, reintentos y circuit breaking cuando se añadan integraciones HTTP salientes.
- Verificar RLS y roles de base de datos en consola Supabase/despliegue; no son configurables desde este repositorio.
