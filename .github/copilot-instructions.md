# 🚀 Copilot Development Guidelines - Vex Project

> **Misión**: Demo funcional de inventario y cotizaciones con código limpio, mantenible y sin vibecodings.

---

## 📁 Estructura de Carpetas

```
vex/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── (auth)/                  # Auth routes group
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── (dashboard)/             # Dashboard group
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Dashboard home
│   │   ├── inventory/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   └── components/      # ONLY inventory-specific UI
│   │   ├── quotations/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   └── components/      # ONLY quotation-specific UI
│   │   ├── billing/             # Stripe integration
│   │   │   ├── page.tsx
│   │   │   ├── payment-methods/
│   │   │   │   ├── page.tsx
│   │   │   │   └── components/
│   │   │   └── invoices/
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   ├── account/
│   │   │   └── security/        # Password, 2FA, etc
│   │   └── admin/               # Admin only
│   ├── api/                     # API Routes
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── logout/
│   │   │   └── refresh-token/
│   │   ├── inventory/
│   │   │   ├── route.ts         # GET/POST /api/inventory
│   │   │   └── [id]/            # GET/PUT/DELETE /api/inventory/[id]
│   │   ├── quotations/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   ├── billing/             # Stripe webhook & payment routes
│   │   │   ├── webhook/         # POST /api/billing/webhook
│   │   ├── payment-methods/     # Stripe payment methods
│   │   │   ├── route.ts         # GET/POST (list/add)
│   │   │   └── [id]/route.ts    # DELETE (remove payment method)
│   │   ├── health/              # Health check
│   │   └── users/               # User profile, security
│   ├── error.tsx, loading.tsx, not-found.tsx
│   └── middleware.ts            # Auth & rate limiting
├── components/                   # Shared, reusable components
│   ├── ui/                      # Dumb components (Buttons, Cards, Forms)
│   │   ├── button.tsx           # Pure presentational
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   ├── badge.tsx
│   │   ├── table.tsx            # NO logic, just rendering
│   │   └── alert.tsx            # Error/warning displays
│   ├── layout/                  # Layout dumb components
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   ├── footer.tsx
│   │   └── navbar.tsx
│   └── shared/                  # Domain-agnostic smart components
│       ├── data-table.tsx       # Generic table with sorting/filtering
│       ├── pagination.tsx
│       ├── search-bar.tsx
│       ├── empty-state.tsx
│       └── protected-route.tsx  # Auth wrapper
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts
│   ├── useInventory.ts          # Inventory logic
│   ├── useQuotations.ts         # Quotation logic
│   ├── usePaymentMethods.ts     # Stripe payment methods
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   └── useAsync.ts
├── lib/                          # Utilities & helpers
│   ├── db.ts                    # Prisma client
│   ├── auth/
│   │   ├── auth.ts              # Auth utilities
│   │   ├── jwt.ts               # JWT token handling
│   │   ├── password.ts          # Password hashing (bcrypt)
│   │   ├── middleware.ts        # Auth middleware
│   │   └── rate-limit.ts        # Rate limiting
│   ├── security/
│   │   ├── cors.ts              # CORS configuration
│   │   ├── csp.ts               # Content Security Policy headers
│   │   ├── encryption.ts        # Encryption/decryption utilities
│   │   ├── sanitize.ts          # Input sanitization
│   │   ├── csrf.ts              # CSRF protection
│   │   └── secrets.ts           # Secret management
│   ├── stripe/
│   │   ├── client.ts            # Stripe client initialization
│   │   ├── payment-methods.ts   # Stripe payment methods API
│   │   ├── webhooks.ts          # Webhook handlers
│   │   └── charges.ts           # Charge handling
│   ├── validators.ts            # Zod schemas
│   ├── formatters.ts            # Number, date, currency formatting
│   ├── errors.ts                # Custom error classes
│   └── constants.ts             # App constants
├── types/                        # TypeScript types
│   ├── index.ts                 # Global types
│   ├── inventory.ts             # Inventory domain types
│   ├── quotations.ts            # Quotation domain types
│   ├── billing.ts               # Stripe/payment types
│   ├── api.ts                   # API response types
│   └── auth.ts                  # Auth types
├── middleware.ts                # Next.js middleware
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── seed.ts                  # Seed data
├── public/                       # Static assets
├── .env.local                   # Environment variables (NEVER commit)
└── .env.example                 # Template env file (commit this)
```

---

## 🎨 Componentes Dumb vs Smart

### ✅ DUMB Components (presentational)
**Ubicación**: `components/ui/` y `components/layout/`

```typescript
// ✅ CORRECTO: Button dumb component
// components/ui/button.tsx
import { cva } from "class-variance-authority";
import React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-gray-300 hover:bg-gray-50",
        secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? "Loading..." : children}
    </button>
  )
);
Button.displayName = "Button";
```

**Características dumb:**
- ✅ Props solamente
- ✅ Sin hooks (excepto React.forwardRef)
- ✅ Styling con Tailwind + CVA
- ✅ Totalmente reutilizable
- ✅ Sin lógica de negocio

---

### 🧠 SMART Components (container/logic)
**Ubicación**: `app/`, `components/shared/`

```typescript
// ✅ CORRECTO: Smart component con lógica
// app/(dashboard)/inventory/components/inventory-list.tsx
"use client";

import { useInventory } from "@/hooks/useInventory";
import { InventoryTable } from "./inventory-table"; // Dumb component
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state"; // Dumb

export function InventoryList() {
  const { items, isLoading, error, deleteItem } = useInventory();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!items.length) return <EmptyState title="No inventory items" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventario</h1>
        <Button variant="default" size="md">
          + Nuevo Artículo
        </Button>
      </div>
      <InventoryTable
        items={items}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onDelete={deleteItem}
      />
    </div>
  );
}
```

**Características smart:**
- ✅ Hooks y lógica de estado
- ✅ Maneja datos y efectos
- ✅ Compone dumb components
- ✅ Lógica de negocio específica
- ✅ Manejo de errores y loading

---

### ❌ NO HACER: Mezclar Smart + Dumb
```typescript
// ❌ INCORRECTO: Button con lógica
function BadButton() {
  const [count, setCount] = useState(0);
  const { user } = useAuth(); // ← NO en UI pura
  
  return (
    <button onClick={() => setCount(count + 1)}>
      {user?.name} clicked {count} times
    </button>
  );
}
```

---

## 📝 Convenciones de Nombrado

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Componentes (PascalCase) | `Component.tsx` | `InventoryForm.tsx`, `QuotationCard.tsx` |
| Hooks (camelCase con `use`) | `useHookName.ts` | `useInventory.ts`, `useQuotations.ts` |
| Utilities (camelCase) | `functionName.ts` | `formatCurrency.ts`, `validateEmail.ts` |
| Tipos (PascalCase) | `TypeName.ts` | `Inventory.ts`, `Quotation.ts` |
| Constantes (UPPER_SNAKE_CASE) | `CONSTANT_NAME` | `MAX_ITEMS_PER_PAGE` |
| Rutas API | `/api/[domain]/[action]` | `/api/inventory/[id]`, `/api/quotations` |

---

## 🔐 TypeScript - Strict Mode

**SIEMPRE usa tipos explícitos:**

```typescript
// ✅ CORRECTO
interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  createdAt: Date;
}

function processItem(item: InventoryItem): void {
  console.log(item.name);
}

// ❌ INCORRECTO
function processItem(item: any) { // NO
  console.log(item.name);
}

// ❌ INCORRECTO
const items = []; // NO - infer type
```

---

## ⚛️ Patrones de Componentes

### Server Components (por defecto)
```typescript
// ✅ CORRECTO: Page es Server Component
// app/(dashboard)/inventory/page.tsx
import { InventoryList } from "./components/inventory-list";

export default async function InventoryPage() {
  // ✅ Puedes hacer queries, acceder a DB directamente
  const items = await db.inventory.findMany();

  return <InventoryList initialItems={items} />;
}
```

### Client Components (con "use client")
```typescript
// ✅ CORRECTO: Componente interactivo es Client
// app/(dashboard)/inventory/components/inventory-list.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function InventoryList({ initialItems }) {
  const [items, setItems] = useState(initialItems);

  return (
    <div>
      <Button onClick={() => setItems([])}>Clear</Button>
    </div>
  );
}
```

### Suspense & Loading
```typescript
// ✅ CORRECTO: Usa Suspense
import { Suspense } from "react";
import { InventoryList } from "./components/inventory-list";
import { LoadingState } from "@/components/shared/loading-state";

export default function InventoryPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <InventoryList />
    </Suspense>
  );
}
```

---

## 🔐 SEGURIDAD - CRÍTICO

### 1️⃣ Autenticación & Autorización

```typescript
// ✅ CORRECTO: Middleware de autenticación
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/jwt";

const protectedRoutes = ["/api/inventory", "/api/quotations", "/api/billing"];

export async function middleware(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");

  // Rutas públicas
  if (!protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Validar token en rutas protegidas
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await verifyAuth(token);
    const response = NextResponse.next();
    response.headers.set("x-user-id", user.id);
    response.headers.set("x-user-role", user.role);
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

export const config = {
  matcher: ["/api/:path*", "/(dashboard)/:path*"],
};
```

```typescript
// ✅ CORRECTO: JWT Token handling
// lib/auth/jwt.ts
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRY = "24h";

export interface TokenPayload {
  id: string;
  email: string;
  role: "user" | "admin";
  iat?: number;
  exp?: number;
}

export function generateToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

export async function verifyAuth(token: string): Promise<TokenPayload> {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

export function refreshToken(token: string): string {
  const payload = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }) as TokenPayload;
  return generateToken({
    id: payload.id,
    email: payload.email,
    role: payload.role,
  });
}
```

```typescript
// ✅ CORRECTO: Password hashing
// lib/auth/password.ts
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

---

### 2️⃣ Protección de API Routes

```typescript
// ✅ CORRECTO: API Route con autenticación
// app/api/inventory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/jwt";
import { createInventory, getInventory } from "@/lib/db";
import { InventorySchema } from "@/lib/validators";
import { ApiError, handleApiError } from "@/lib/errors";

async function authenticateRequest(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    throw new ApiError("Unauthorized", 401);
  }
  return verifyAuth(token);
}

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    // ✅ Verificar rol si es necesario
    if (!user.id) throw new ApiError("Forbidden", 403);

    const { searchParams } = new URL(req.url);
    const skip = parseInt(searchParams.get("skip") ?? "0");
    const take = parseInt(searchParams.get("take") ?? "10");

    // ✅ Limitar cantidad de resultados
    const safeTake = Math.min(take, 100);

    const items = await getInventory({ skip, take: safeTake });

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const body = await req.json();

    // ✅ Validar entrada
    const validated = InventorySchema.parse(body);

    // ✅ Asociar con usuario (multi-tenant)
    const item = await createInventory({
      ...validated,
      userId: user.id,
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

### 3️⃣ Validación de Entrada (Zod)

```typescript
// ✅ CORRECTO: Esquemas con validación strict
// lib/validators.ts
import { z } from "zod";

export const InventorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name too long")
    .trim(),
  sku: z
    .string()
    .min(1, "SKU required")
    .max(50, "SKU too long")
    .regex(/^[A-Z0-9\-]+$/, "SKU format invalid")
    .toUpperCase(),
  quantity: z
    .number()
    .int("Quantity must be integer")
    .nonnegative("Quantity >= 0")
    .max(1000000, "Quantity too large"),
  price: z
    .number()
    .positive("Price > 0")
    .max(999999.99, "Price too large")
    .refine((p) => p % 0.01 === 0, "Price must have max 2 decimals"),
  category: z
    .string()
    .min(1, "Category required")
    .max(100)
    .trim(),
});

export type Inventory = z.infer<typeof InventorySchema>;

// Stripe payment methods
export const PaymentMethodSchema = z.object({
  token: z.string().min(20, "Invalid card token"),
  // NUNCA guardes números de tarjeta completos
});

// Login
export const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password min 8 chars"),
});

// Register
export const RegisterSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(12, "Password min 12 chars")
    .regex(/[A-Z]/, "Must have uppercase")
    .regex(/[0-9]/, "Must have number")
    .regex(/[^A-Za-z0-9]/, "Must have special char"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

---

### 4️⃣ Rate Limiting

```typescript
// ✅ CORRECTO: Rate limiting
// lib/auth/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 10 requests per minute per IP
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
});

// 5 login attempts per 15 minutes
export const loginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
});
```

```typescript
// ✅ Usar en API routes
// app/api/auth/login/route.ts
import { loginLimiter } from "@/lib/auth/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.ip || "unknown";
  const { success } = await loginLimiter.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Too many login attempts" },
      { status: 429 }
    );
  }

  // Procesar login...
}
```

---

### 5️⃣ CSRF Protection

```typescript
// ✅ CORRECTO: CSRF token en formularios
// lib/security/csrf.ts
import crypto from "crypto";

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function verifyCsrfToken(token: string, storedToken: string): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(storedToken)
  );
}
```

```typescript
// ✅ En formularios
"use client";

import { useEffect, useState } from "react";

export function InventoryForm() {
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    fetch("/api/csrf-token")
      .then((r) => r.json())
      .then((d) => setCsrfToken(d.token));
  }, []);

  return (
    <form method="POST" action="/api/inventory">
      <input type="hidden" name="csrf" value={csrfToken} />
      {/* resto del form */}
    </form>
  );
}
```

---

### 6️⃣ Stripe Integration - Seguro

```typescript
// ✅ CORRECTO: Cliente Stripe
// lib/stripe/client.ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

// NUNCA expongas la stripe key pública en el cliente
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;
```

```typescript
// ✅ CORRECTO: Guardar payment methods
// lib/stripe/payment-methods.ts
import { stripe } from "./client";

export async function createPaymentMethod(
  customerId: string,
  tokenId: string // Token de Stripe, NO tarjeta
) {
  // Stripe maneja la seguridad del token
  const paymentMethod = await stripe.paymentMethods.create({
    type: "card",
    card: { token: tokenId },
  });

  // Vincular con cliente
  await stripe.paymentMethods.attach(paymentMethod.id, { customer: customerId });

  return paymentMethod.id; // Guardar SOLO el ID, nunca detalles de tarjeta
}

export async function listPaymentMethods(customerId: string) {
  return stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
  });
}

export async function deletePaymentMethod(paymentMethodId: string) {
  return stripe.paymentMethods.detach(paymentMethodId);
}
```

```typescript
// ✅ CORRECTO: API Route para payment methods
// app/api/payment-methods/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/jwt";
import { createPaymentMethod } from "@/lib/stripe/payment-methods";
import { PaymentMethodSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req.headers.get("authorization")!);

    const body = await req.json();
    const { token } = PaymentMethodSchema.parse(body);

    // NUNCA guardes o registres la tarjeta completa
    const paymentMethodId = await createPaymentMethod(user.id, token);

    // Guardar en DB solo el ID
    await db.paymentMethod.create({
      data: {
        userId: user.id,
        stripePaymentMethodId: paymentMethodId,
        brand: "card", // desde Stripe webhook
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

### 7️⃣ Webhook de Stripe (SEGURO)

```typescript
// ✅ CORRECTO: Webhook handler
// app/api/billing/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import Stripe from "stripe";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    // ✅ Validar signature (CRÍTICO)
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  // Procesar eventos
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      // Actualizar DB de cotización/factura
      break;

    case "payment_intent.payment_failed":
      // Notificar usuario
      break;

    case "customer.subscription.deleted":
      // Cancelar suscripción en DB
      break;
  }

  return NextResponse.json({ received: true });
}
```

---

### 8️⃣ Content Security Policy (CSP)

```typescript
// ✅ CORRECTO: Headers de seguridad
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: async () => {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' api.stripe.com",
              "frame-src 'self' js.stripe.com",
            ].join(";"),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

---

### 9️⃣ Encriptación de Datos Sensibles

```typescript
// ✅ CORRECTO: Encriptar datos en DB
// lib/security/encryption.ts
import crypto from "crypto";

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, "utf-8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
}

export function decrypt(text: string): string {
  const parts = text.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];

  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);

  let decrypted = decipher.update(encrypted, "hex", "utf-8");
  decrypted += decipher.final("utf-8");

  return decrypted;
}
```

---

### 🔟 Esquema Prisma con Seguridad

```prisma
// ✅ CORRECTO: Schema con fields de seguridad
// prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // HASHED con bcrypt
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relaciones
  inventoryItems InventoryItem[]
  quotations     Quotation[]
  paymentMethods PaymentMethod[]
  auditLogs      AuditLog[]

  @@index([email])
}

model PaymentMethod {
  id                      String   @id @default(cuid())
  userId                  String
  user                    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  stripePaymentMethodId   String   @unique
  brand                   String   // "visa", "mastercard", etc
  last4                   String   // Últimos 4 dígitos SOLO
  expiryMonth             Int
  expiryYear              Int
  isDefault               Boolean  @default(false)
  createdAt               DateTime @default(now())

  @@index([userId])
  @@index([stripePaymentMethodId])
}

model InventoryItem {
  id        String   @id @default(cuid())
  userId    String   // Multi-tenant
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  sku       String   @unique
  quantity  Int
  price     Float
  category  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  quotationItems QuotationItem[]

  @@index([userId])
  @@index([category])
}

model Quotation {
  id         String   @id @default(cuid())
  userId     String   // Multi-tenant
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  number     String   @unique
  clientName String
  total      Float
  status     Status   @default(PENDING)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  items QuotationItem[]
  payments Payment[]

  @@index([userId])
  @@index([status])
}

model Payment {
  id                String   @id @default(cuid())
  quotationId       String
  quotation         Quotation @relation(fields: [quotationId], references: [id], onDelete: Cascade)
  stripePaymentId   String   @unique
  amount            Float
  currency          String   @default("USD")
  status            PaymentStatus @default(PENDING)
  createdAt         DateTime @default(now())

  @@index([quotationId])
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  action    String   // "CREATE_ITEM", "DELETE_ITEM", "PAYMENT"
  resource  String   // "inventory", "quotation", "payment"
  resourceId String
  changes   Json     // JSON con antes/después
  ipAddress String
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([createdAt])
}

enum Role {
  USER
  ADMIN
}

enum Status {
  PENDING
  APPROVED
  REJECTED
  SENT
  PAID
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
}
```

---

## 🌐 Variables de Entorno (.env.local)

```env
# Auth
JWT_SECRET=<random 64 char hex>
BCRYPT_SALT_ROUNDS=12

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/vex

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Encryption
ENCRYPTION_KEY=<random 64 char hex>

# Rate Limiting
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Node env
NODE_ENV=production
```

**⚠️ NUNCA commites .env.local a Git**

---

## 🔌 API Routes - Next.js Best Practices

```typescript
// ✅ CORRECTO: API Route con validación
// app/api/inventory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createInventory, getInventory } from "@/lib/db";
import { InventorySchema } from "@/lib/validators";
import { ApiError, handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const skip = parseInt(searchParams.get("skip") ?? "0");
    const take = parseInt(searchParams.get("take") ?? "10");

    const items = await getInventory({ skip, take });

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = InventorySchema.parse(body);

    const item = await createInventory(validated);

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

```typescript
// ✅ CORRECTO: Dynamic API Route
// app/api/inventory/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const item = await db.inventory.findUnique({ where: { id } });

  if (!item) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: item });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await req.json();

  const updated = await db.inventory.update({
    where: { id },
    data: body,
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  await db.inventory.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
```

---

## 🗄️ Prisma - Base de Datos

### Database Layer
```typescript
// ✅ CORRECTO: Separar lógica DB
// lib/db.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getInventory({ skip = 0, take = 10 }) {
  return prisma.inventoryItem.findMany({
    skip,
    take,
    orderBy: { createdAt: "desc" },
  });
}

export async function createInventory(data: {
  userId: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  category: string;
}) {
  return prisma.inventoryItem.create({ data });
}

export async function getQuotations({ status }: { status?: string }) {
  return prisma.quotation.findMany({
    where: status ? { status: status as any } : undefined,
    include: { items: { include: { inventory: true } } },
    orderBy: { createdAt: "desc" },
  });
}
```

---

## ✅ Validación con Zod

```typescript
// ✅ CORRECTO: Esquemas compartidos
// lib/validators.ts
import { z } from "zod";

export const InventorySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  sku: z.string().min(1, "SKU is required"),
  quantity: z.number().int().nonnegative("Quantity must be >= 0"),
  price: z.number().positive("Price must be > 0"),
  category: z.string().min(1, "Category is required"),
});

export type Inventory = z.infer<typeof InventorySchema>;

export const QuotationSchema = z.object({
  clientName: z.string().min(1),
  items: z.array(
    z.object({
      inventoryId: z.string(),
      quantity: z.number().int().positive(),
      discount: z.number().nonnegative().optional(),
    })
  ),
});

export type Quotation = z.infer<typeof QuotationSchema>;
```

---

## 🪝 Custom Hooks

```typescript
// ✅ CORRECTO: Hook para inventario
// hooks/useInventory.ts
"use client";

import { useState, useEffect } from "react";
import type { InventoryItem } from "@/types/inventory";

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/inventory", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(data.data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/inventory/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err as Error);
    }
  };

  return { items, isLoading, error, deleteItem, refetch: fetchItems };
}
```

---

## 🎯 Módulos: Inventario

**Flujo esperado:**
1. Listar artículos
2. Crear/Editar artículos
3. Buscar por SKU o nombre
4. Validar cantidad y precio

**Archivos necesarios:**
- `app/(dashboard)/inventory/page.tsx` - Página lista
- `app/(dashboard)/inventory/[id]/page.tsx` - Página detalle
- `app/(dashboard)/inventory/components/inventory-list.tsx` - Smart
- `app/(dashboard)/inventory/components/inventory-form.tsx` - Smart
- `app/(dashboard)/inventory/components/inventory-table.tsx` - Dumb
- `hooks/useInventory.ts` - Hook de datos
- `app/api/inventory/route.ts` - CRUD API
- `app/api/inventory/[id]/route.ts` - Detalle API
- `lib/db.ts` - Queries Prisma
- `lib/validators.ts` - Zod schemas

---

## 📊 Módulos: Cotizaciones

**Flujo esperado:**
1. Crear cotización desde inventario
2. Agregar múltiples items
3. Calcular total con descuentos
4. Cambiar estado (PENDING → APPROVED/REJECTED)
5. Processar pago con Stripe

**Archivos necesarios:**
- `app/(dashboard)/quotations/page.tsx` - Listado
- `app/(dashboard)/quotations/[id]/page.tsx` - Detalle
- `app/(dashboard)/quotations/components/quotation-form.tsx` - Smart
- `app/(dashboard)/quotations/components/quotation-table.tsx` - Dumb
- `app/(dashboard)/quotations/components/quotation-item-selector.tsx` - Smart
- `hooks/useQuotations.ts` - Hook de datos
- `app/api/quotations/route.ts` - CRUD API
- `app/api/quotations/[id]/route.ts` - Detalle API

---

## 💳 Módulos: Billing & Stripe

**Flujo esperado:**
1. Agregar método de pago (tarjeta)
2. Listar métodos de pago guardados
3. Eliminar método de pago
4. Cobrar cotización con Stripe
5. Webhook para confirmar pago

**Archivos necesarios:**
- `app/(dashboard)/billing/page.tsx` - Panel de facturación
- `app/(dashboard)/billing/payment-methods/page.tsx` - Métodos de pago
- `app/(dashboard)/billing/payment-methods/components/add-payment-method.tsx` - Smart
- `app/(dashboard)/billing/payment-methods/components/payment-method-list.tsx` - Smart
- `hooks/usePaymentMethods.ts` - Hook Stripe
- `app/api/payment-methods/route.ts` - POST/GET
- `app/api/payment-methods/[id]/route.ts` - DELETE
- `app/api/billing/webhook/route.ts` - Webhook
- `lib/stripe/client.ts` - Stripe client
- `lib/stripe/payment-methods.ts` - Payment methods API
- `lib/stripe/webhooks.ts` - Webhook handlers

---

## 🧪 Testing & Linting

**ESLint rules:**
```javascript
// .eslintrc.json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@next/next/no-html-link-for-pages": "off",
    "react/display-name": "off",
    "react/jsx-no-comment-textnodes": "error",
    "no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

**Pre-commit:**
```bash
npm run lint
npm run build
```

---

## 🚨 ANTIPATRONES - NUNCA HACER

| ❌ NO HACER | ✅ HACER |
|-------------|---------|
| `any` types | Tipos explícitos con TS |
| Componentes mega (500+ líneas) | Dividir en componentes pequeños |
| Lógica en componentes UI dumb | Usar hooks/smart components |
| Importes circulares | Estructura clara de carpetas |
| Magic strings en condicionales | Constantes y enums |
| Fetch directo en componentes | Custom hooks abstractos |
| Efectos sin cleanup | `useEffect(() => { cleanup })` |
| Styles inline o archivo único | Tailwind + CVA |
| No validar inputs de API | Zod validation en routes |
| Componentes con side effects | Separar lógica de UI |
| Todos los archivos en root | Carpetas por módulo/feature |
| Variables globales de estado | Context API o zustand |
| **Guardar tarjetas completas** | **SOLO guardar token/ID Stripe** |
| **Exponer API keys en cliente** | **SOLO usar env vars en servidor** |
| **No validar webhooks Stripe** | **SIEMPRE verificar signature** |
| **Passwords en plain text** | **Hash con bcrypt** |
| **Tokens sin expiración** | **Usar JWT con expiración** |
| **No ratelimit login** | **Limitar intentos de login** |

---

## 📱 Performance & SEO

```typescript
// ✅ Image optimization
import Image from "next/image";

<Image
  src="/product.jpg"
  alt="Product name"
  width={300}
  height={300}
  priority
/>

// ✅ Meta tags
export const metadata = {
  title: "Inventario - Vex",
  description: "Gestiona tu inventario de forma fácil",
};

// ✅ Dynamic imports
const HeavyComponent = dynamic(() => import("@/components/heavy"), {
  loading: () => <LoadingState />,
});
```

---

## 🔄 Workflow Copilot

**Cuando solicites features:**

```
1. [ ] Crear tipos en `types/`
2. [ ] Crear validators en `lib/validators.ts`
3. [ ] Crear API routes en `app/api/`
4. [ ] Crear middleware/auth si es necesario
5. [ ] Crear hook en `hooks/`
6. [ ] Crear smart component en `app/(dashboard)/`
7. [ ] Crear dumb components en `components/`
8. [ ] Actualizar schema Prisma si es necesario
9. [ ] Testar flujo completo
10. [ ] Validar seguridad (auth, validación, encryption)
```

**Preguntas antes de:**
- Crear una carpeta nueva
- Importar una dependencia
- Cambiar estructura de DB
- Exponer datos sensibles

---

## 📞 Contact & Standards

- **Language**: TypeScript (strict mode)
- **Framework**: Next.js 16+ (App Router)
- **Styling**: Tailwind CSS v4 + CVA
- **Forms**: react-hook-form + Zod
- **Database**: Prisma
- **Code Format**: Prettier + ESLint
- **Payments**: Stripe (v2024-04-10)
- **Security**: JWT, bcrypt, encryption, rate limiting
- **Focus**: Inventario → Cotizaciones → Payments → Demo

**Copilot, follow these guidelines to avoid clutter, maintain quality, AND ensure security. DO NOT expose sensitive data, ALWAYS validate input, ALWAYS authenticate endpoints.**
