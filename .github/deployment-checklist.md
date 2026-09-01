# Checklist de despliegue — Fase 2 seguridad

## Pre-despliegue (CI/CD)

- [ ] `npm run lint` pasa sin errores
- [ ] `npm run typecheck` pasa sin errores
- [ ] `npm run build` completado exitosamente
- [ ] `npm audit --omit=dev` reporta vulnerabilidades resueltas (3 altas documentadas en Prisma)
- [ ] Todas las pruebas pasan (si existen)

## Despliegue de aplicación

- [ ] Confirmar `DATABASE_URL` resuelve el host Supabase correctamente
- [ ] Ejecutar `npm run prisma:migrate:deploy` en producción
  - Aplica todas las migraciones pendientes, incluyendo `20260901120000_add_audit_logs`
  - Crea tabla `audit_logs` con índices de búsqueda por tenant, actor y acción
- [ ] Verificar que POST a `/api/*/route.ts` retorna JSON `401`/`403`, no HTML con redirect
- [ ] Probar login, registro, recuperación de contraseña con rate limiting
  - 5 intentos en 15 min para login (brinda tiempo de respuesta de error genérico)
  - 3 intentos en 30 min para registro e invitaciones (impide enumeración)

## Post-despliegue (operaciones)

- [ ] Revisar primeros eventos de auditoría en tabla `audit_logs`:
  - `AUTH_LOGIN_SUCCEEDED` y `AUTH_LOGIN_FAILED` para autenticación
  - `ROLE_UPDATED` para cambios de permisos por tenant
  - `SUBSCRIPTION_*` para cambios de suscripción
  - `INVENTORY_MOVEMENT_CREATED` para movimientos de inventario
- [ ] Configurar retención de logs según regulación aplicable (GDPR, SOX, etc.)
- [ ] Documentar acceso a audit logs en runbook operativo (`security-operations.md`)
- [ ] Probar restauración de backup PostgreSQL en entorno aislado
- [ ] Configurar rotación de `STRIPE_SECRET_KEY`, credenciales Supabase y `DATABASE_URL`

## Verificación de seguridad

- [ ] CSP headers presentes en respuestas:
  - `Content-Security-Policy: default-src 'self'; ...`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] Cookies Supabase configuradas:
  - `Secure` en HTTPS (producción)
  - `SameSite=Lax` siempre
  - `Path=/` siempre
- [ ] Monitorizar errores de escritura en `audit_logs` (logs van a stderr si tabla no existe)
- [ ] Revisar logs sanitizados: sin tokens, contraseñas, números de tarjeta visibles

## Rollback

- [ ] Si migración falla: revierte `DATABASE_URL`, restaura snapshot previo
- [ ] Si API retorna HTML en lugar de JSON: revierte cambios de guards (`requirePermissionApi`)
- [ ] Si rate limiting bloquea usuarios legítimos: ajusta `RATE_LIMIT_PRESETS` en `lib/rate-limit.ts`
- [ ] Audit logs son fail-soft: no bloqueará login ni mutaciones si tabla no existe

## Próximas iteraciones

- Lote 1 completo: Actualizar Next.js, PostCSS, Sharp, Undici tras verificar compatibilidad
- Lote 6 completo: Configurar mínimo privilegio en Supabase RLS y roles PostgreSQL
- Fase 3: Renombrar archivos propios a camelCase según convención
