/**
 * Environment variable validation at startup.
 *
 * Fails safely if required secrets are missing in production.
 * Allows missing values in development for easier local setup.
 *
 * Usage: Import this module early in your application (e.g., in next.config.ts,
 * middleware.ts, or root layout).
 *
 *   import '@/lib/envValidator'; // Must be called before app initialization
 */

interface RequiredEnvVar {
  key: string;
  description: string;
  requiredIn: ("development" | "production" | "both")[];
}

const REQUIRED_ENV_VARS: RequiredEnvVar[] = [
  // Authentication
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    description: "Supabase project URL",
    requiredIn: ["development", "production"],
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    description: "Supabase public API key",
    requiredIn: ["development", "production"],
  },

  // Database
  {
    key: "DATABASE_URL",
    description: "PostgreSQL connection string",
    requiredIn: ["development", "production"],
  },

  // Billing & Payments (production-only for now)
  {
    key: "STRIPE_SECRET_KEY",
    description: "Stripe secret API key",
    requiredIn: ["production"],
  },
  {
    key: "STRIPE_PUBLISHABLE_KEY",
    description: "Stripe public API key",
    requiredIn: ["production"],
  },
  {
    key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    description: "Stripe public key (client-side)",
    requiredIn: ["production"],
  },

  // Rate Limiting & Redis (optional for now, required if using Upstash)
  // Uncomment if implementing rate limiting with Redis
  // {
  //   key: "UPSTASH_REDIS_REST_URL",
  //   description: "Upstash Redis REST endpoint",
  //   requiredIn: ["production"],
  // },
  // {
  //   key: "UPSTASH_REDIS_REST_TOKEN",
  //   description: "Upstash Redis auth token",
  //   requiredIn: ["production"],
  // },

  // i18n
  {
    key: "NEXT_PUBLIC_DEFAULT_LOCALE",
    description: "Default locale (e.g., 'en')",
    requiredIn: ["development", "production"],
  },
];

/**
 * Validates that required environment variables are set.
 *
 * @throws Error if required variables are missing in the current environment
 */
function validateEnvironment(): void {
  const nodeEnv = process.env.NODE_ENV || "development";
  const isProduction = nodeEnv === "production";
  const isDevelopment = nodeEnv === "development";

  const missing: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    const shouldRequire =
      envVar.requiredIn.includes("both") ||
      (isProduction && envVar.requiredIn.includes("production")) ||
      (isDevelopment && envVar.requiredIn.includes("development"));

    if (shouldRequire && !process.env[envVar.key]) {
      missing.push(`${envVar.key} (${envVar.description})`);
    }
  }

  if (missing.length > 0) {
    const message = [
      `Missing required environment variables in ${nodeEnv}:`,
      ...missing.map((v) => `  - ${v}`),
      "",
      "Add these to your .env.local or deployment configuration.",
    ].join("\n");

    // In production, fail hard. In development, warn but allow.
    if (isProduction) {
      console.error(message);
      process.exit(1);
    } else {
      console.warn(message);
    }
  }
}

// Run validation immediately when module is imported
validateEnvironment();
