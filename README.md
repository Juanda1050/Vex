# Vex MVP

Vex es el MVP de un SaaS multi-tenant para gestionar operaciones comerciales básicas: clientes, productos, inventario, cotizaciones, compras, ventas, suscripciones y configuración del sistema. El objetivo de esta primera versión es cubrir el flujo operativo principal con autenticación, control de acceso por rol y soporte multiidioma.

## Alcance del MVP

- Autenticación con Supabase: login, registro, verificación de correo, recuperación de contraseña y cierre de sesión.
- Gestión de clientes, productos e inventario.
- Flujos iniciales de cotizaciones, compras, ventas y suscripciones.
- Soporte para multiempresa y separación por sucursal.
- Roles y permisos para restringir rutas y acciones sensibles.
- Interfaz en español e inglés con `next-intl`.

## Stack

- Next.js 16
- React 19
- TypeScript
- Prisma
- Supabase
- next-intl
- Tailwind CSS 4

## Requisitos

- Node.js 20 o superior
- npm 10 o superior
- Una base de datos PostgreSQL, idealmente Supabase Postgres

## Configuración local

1. Instala dependencias.

   ```bash
   npm install
   ```

2. Crea tu archivo `.env` con las variables necesarias.

   ```bash
   DATABASE_URL=
   DIRECT_URL=
   NEXT_PUBLIC_APP_URL=
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   PERF_LOG=false
   ```

   Si `DIRECT_URL` no está definido, Prisma puede reutilizar `DATABASE_URL` para migraciones.

   Para mejorar rendimiento cuando hay contención de conexiones, agrega parámetros de pool en `DATABASE_URL` y `DIRECT_URL`:

   ```text
   connection_limit=10
   pool_timeout=30
   connect_timeout=15
   ```

   Ejemplo:

   ```text
   postgresql://.../postgres?pgbouncer=true&connection_limit=10&pool_timeout=30&connect_timeout=15&sslmode=require
   ```

   Si tu proveedor limita conexiones, usa valores acordes al plan (por ejemplo `connection_limit=5`).

3. Genera Prisma y aplica migraciones.

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. Inicia el entorno de desarrollo.

   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000).

5. (Opcional) Activa medición de performance server para detectar rutas lentas.

   ```bash
   PERF_LOG=true npm run dev
   ```

   Verás logs con formato `[perf] ...` para tiempos de render y consultas pesadas.

## Caching operacional (dashboard/settings)

- El overview del dashboard usa cache por tenant y filtros (`period`, `salesStatus`) con revalidación corta.
- Los contadores usados en settings (productos, almacenes, usuarios) usan cache por tenant.
- Las mutaciones operativas invalidan tags para refresco inmediato (productos, inventario, quotes, usuarios).

Archivo clave de invalidación:

- `server/cache/tenant-cache-invalidation.ts`

Esto permite navegación más rápida sin mantener datos stale por largos periodos.

## POS integrado (Fase inicial)

Se agregó una primera implementación de POS + inventario + pricing + planes por features, sin reemplazar los módulos legacy de ventas/suscripciones.

### Decisiones técnicas

- Se mantiene `sales` y `sale_items` actuales, agregando campos POS (`clientTxnId`, `posSessionId`) para idempotencia y trazabilidad.
- Se agrega una capa nueva para POS/inventario detallado:
  - `cash_register_sessions`, `sale_payments`, `cash_movements`, `sale_documents`
  - `locations`, `inventory_balances`, `inventory_movements`, `product_barcodes`
  - `price_lists`, `product_prices`, `promotions`, `promotion_products`
- Se agrega capa de planes por feature flag/límite con tablas nuevas:
  - `plans`, `plan_features`, `subscriptions`
- Compatibilidad: `server/plans/feature-flags.ts` lee primero tablas nuevas y hace fallback al esquema legacy (`tenant_subscriptions` + `subscription_plans.features`) cuando aplica.

### Feature keys y limit keys

- Features:
  - `pos.enabled`, `pos.multi_register`, `pos.scanner_hid`, `pos.refunds`
  - `inventory.multi_location`, `inventory.negative_stock_allowed`
  - `pricing.price_lists`, `pricing.promotions_basic`, `pricing.promotions_advanced`
- Limits:
  - `limits.products.max`, `limits.monthly_sales.max`, `limits.locations.max`
  - `limits.registers.max`, `limits.users.max`, `limits.price_lists.max`

Helpers:

- `requireFeature(featureKey)`
- `enforceLimit(limitKey, currentUsage)`

Archivo: `server/plans/feature-flags.ts`

### Checkout POS atómico

Implementado en `server/pos/pos.service.ts` con transacción Prisma:

1. Valida feature del plan (`pos.enabled`).
2. Valida stock por producto si `trackStock=true`.
3. Guarda pagos (`sale_payments`).
4. Descuenta `inventory_balances`.
5. Registra `inventory_movements` tipo `SALE`.
6. Registra `cash_movements` tipo `SALE_INCOME`.
7. Marca la venta como completada (`SaleStatus.DELIVERED`).

Incluye reversa para refund/cancel (stock + caja) y soporte de idempotencia con `clientTxnId` único por tenant.

### Endpoints mínimos

- `POST /api/pos/register/open`
- `POST /api/pos/register/close`
- `POST /api/pos/sales`
- `POST /api/pos/sales/:id/items`
- `POST /api/pos/sales/:id/checkout`
- `POST /api/pos/sales/:id/refund`
- `POST /api/pos/scan/resolve`
- `GET /api/billing/features`

### UI mínima

- POS principal: `/[locale]/pos`
- Caja (abrir/cerrar + resumen): `/[locale]/pos/register`
- Billing features/límites: `/[locale]/billing/features`
- Dashboard POS (ventas día, ticket promedio, utilidad, top productos): `/[locale]/dashboard/pos`

### Migrar y seed

1. Generar cliente y aplicar migraciones:

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

2. Ejecutar seed:

   ```bash
   npm run prisma:seed
   ```

3. Levantar app:

   ```bash
   npm run dev
   ```

Migración POS creada: `prisma/migrations/20260716054446_pos_phase1/migration.sql`

Nota: la migración agrega constraints únicos para `products(tenantId, sku)`, `products(tenantId, barcode)` y `sales(tenantId, clientTxnId)`. Si hay datos duplicados existentes, limpia duplicados antes de aplicar en producción.

## Configurar Google OAuth en Supabase

1. En Supabase, ve a `Authentication > Providers > Google` y activa el proveedor.
2. Configura el `Client ID` y `Client Secret` de Google Cloud para tu proyecto.
3. En Google Cloud, agrega como URI de redirección autorizada:

   ```text
   https://<PROJECT-REF>.supabase.co/auth/v1/callback
   ```

4. En Supabase, agrega como URL de redirección adicional de tu app:

   ```text
   http://localhost:3000/es/auth/callback
   http://localhost:3000/en/auth/callback
   ```

5. En producción, usa las rutas equivalentes de tu dominio público:

   ```text
   https://tu-dominio.com/es/auth/callback
   https://tu-dominio.com/en/auth/callback
   ```

El flujo OAuth usa `NEXT_PUBLIC_APP_URL` para construir el callback localizado, por lo que esta variable debe coincidir con el dominio donde corre la app.

## Scripts disponibles

- `npm run dev` - arranca la aplicación en desarrollo.
- `npm run build` - genera el build de producción.
- `npm run start` - ejecuta la aplicación en producción.
- `npm run lint` - ejecuta ESLint.
- `npm run prisma:generate` - genera el cliente de Prisma.
- `npm run prisma:migrate` - aplica migraciones en desarrollo.
- `npm run prisma:migrate:deploy` - aplica migraciones en despliegue.
- `npm run prisma:studio` - abre Prisma Studio.

## Estructura del proyecto

- `app/` - rutas, layouts y páginas por locale.
- `components/` - componentes UI reutilizables.
- `server/` - lógica de dominio para auth y módulos del negocio.
- `prisma/` - schema, migraciones y seeds.
- `messages/` - traducciones por idioma.
- `utils/supabase/` - clientes de Supabase para navegador, servidor y middleware.

## Despliegue

Antes de publicar el MVP, verifica que el entorno de producción tenga las mismas variables que el entorno local y ejecuta `npm run prisma:migrate:deploy` sobre la base de datos destino.

## Licencia

Proyecto interno. Añade aquí la licencia si el repositorio se va a publicar de forma abierta.
