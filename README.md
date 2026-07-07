# Cotify MVP

Cotify es el MVP de un SaaS multi-tenant para gestionar operaciones comerciales básicas: clientes, productos, inventario, cotizaciones, compras, ventas, suscripciones y configuración del sistema. El objetivo de esta primera versión es cubrir el flujo operativo principal con autenticación, control de acceso por rol y soporte multiidioma.

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
   ```

   Si `DIRECT_URL` no está definido, Prisma puede reutilizar `DATABASE_URL` para migraciones.

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
