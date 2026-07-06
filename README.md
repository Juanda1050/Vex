# Cotify

Cotify is a SaaS platform built with Next.js for managing customers, products, inventory, quotes, and subscriptions. It combines authentication, role-aware access, multilingual support, and a Prisma-backed data layer with Supabase integration.

## What it includes

- Customer, product, inventory, quote, and subscription workflows.
- Supabase authentication with protected routes and session handling.
- Internationalization for English and Spanish.
- Prisma schema, migrations, and seed data for local development.
- Reusable UI primitives and form components built with Tailwind CSS.

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Prisma
- Supabase
- next-intl
- Tailwind CSS 4

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- A PostgreSQL database, such as Supabase Postgres

## Getting started

1. Install dependencies.

   ```bash
   npm install
   ```

2. Configure environment variables.

   Create a local `.env` file with the values required by your database and Supabase setup.

   ```bash
   DATABASE_URL=
   DIRECT_URL=
   NEXT_PUBLIC_APP_URL=
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   ```

   If `DIRECT_URL` is not provided, Prisma can fall back to `DATABASE_URL` during migrations.

3. Generate Prisma client and run migrations.

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. Start the development server.

   ```bash
   npm run dev
   ```

   Then open [http://localhost:3000](http://localhost:3000).

## Available scripts

- `npm run dev` - start the app in development mode.
- `npm run build` - create a production build.
- `npm run start` - start the production server.
- `npm run lint` - run ESLint.
- `npm run prisma:generate` - generate the Prisma client.
- `npm run prisma:migrate` - apply Prisma migrations in development.
- `npm run prisma:migrate:deploy` - apply migrations in deployment environments.
- `npm run prisma:studio` - open Prisma Studio.

## Project structure

- `app/` - application routes, layouts, and locale-aware pages.
- `components/` - shared UI components.
- `lib/` - application utilities, including Prisma and Supabase helpers.
- `server/` - domain logic for auth and business modules.
- `prisma/` - schema, migrations, and seed data.
- `messages/` - translation files for each locale.
- `utils/supabase/` - browser, server, and middleware Supabase clients.

## Deployment notes

This application is designed to run against PostgreSQL with Prisma migrations and Supabase authentication. Before deploying, make sure the production environment provides the same variables used locally and that migrations are applied with `npm run prisma:migrate:deploy`.

## License

Internal project. Add license information here if the repository will be published publicly.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
