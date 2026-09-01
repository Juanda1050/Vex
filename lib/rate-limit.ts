/**
 * Rate limiting adapter for login, registration, and sensitive operations.
 *
 * Development: In-memory store with sliding window algorithm.
 * Production: Use Upstash Redis (see configuration below).
 *
 * Environment variables (add to .env.local for production):
 *   UPSTASH_REDIS_REST_URL=https://...
 *   UPSTASH_REDIS_REST_TOKEN=...
 */

interface RateLimitStore {
  [key: string]: { attempts: number; resetAt: number }[];
}

// In-memory store for development
const inMemoryStore: RateLimitStore = {};

// Clean old entries every minute
const CLEANUP_INTERVAL = 60 * 1000;
setInterval(() => {
  const now = Date.now();
  Object.keys(inMemoryStore).forEach((key) => {
    inMemoryStore[key] = inMemoryStore[key].filter(
      (entry) => entry.resetAt > now,
    );
    if (inMemoryStore[key].length === 0) {
      delete inMemoryStore[key];
    }
  });
}, CLEANUP_INTERVAL);

export interface RateLimitConfig {
  /** Max attempts within the window */
  maxAttempts: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Optional custom key generator (default: "ip:endpoint") */
  keyGenerator?: (identifier: string, endpoint: string) => string;
}

export function getRateLimitIdentifier(
  requestHeaders: Headers,
  fallback: string,
): string {
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim();

  return clientIp || fallback;
}

/**
 * Check if request is within rate limit.
 *
 * @param identifier IP address, user ID, or session ID
 * @param endpoint Name of the endpoint (e.g., "login", "register", "forgot-password")
 * @param config Rate limit configuration
 * @returns Object with { allowed: boolean, remaining: number, resetAt: Date }
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig,
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}> {
  const key =
    config.keyGenerator?.(identifier, endpoint) ?? `${identifier}:${endpoint}`;

  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Initialize or retrieve bucket
  if (!inMemoryStore[key]) {
    inMemoryStore[key] = [];
  }

  const bucket = inMemoryStore[key];

  // Remove old attempts outside the window
  const recentAttempts = bucket.filter((entry) => entry.resetAt > windowStart);
  bucket.length = 0;
  bucket.push(...recentAttempts);

  const allowedAttempts = config.maxAttempts - recentAttempts.length;
  const allowed = allowedAttempts > 0;

  if (allowed) {
    bucket.push({
      attempts: recentAttempts.length + 1,
      resetAt: now + config.windowMs,
    });
  }

  // Return reset time (earliest expiration in bucket, or now + window)
  const resetAt = new Date(
    bucket.length > 0
      ? Math.max(...bucket.map((e) => e.resetAt))
      : now + config.windowMs,
  );

  return {
    allowed,
    remaining: Math.max(0, allowedAttempts - 1),
    resetAt,
  };
}

/**
 * Rate limit presets for common endpoints.
 */
export const RATE_LIMIT_PRESETS = {
  // Strict: 5 attempts per 15 minutes
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
  } as RateLimitConfig,

  // Strict: 3 attempts per 30 minutes (prevent account enumeration)
  register: {
    maxAttempts: 3,
    windowMs: 30 * 60 * 1000,
  } as RateLimitConfig,

  // Strict: 3 attempts per 30 minutes
  forgotPassword: {
    maxAttempts: 3,
    windowMs: 30 * 60 * 1000,
  } as RateLimitConfig,

  // Moderate: 10 attempts per 5 minutes
  checkout: {
    maxAttempts: 10,
    windowMs: 5 * 60 * 1000,
  } as RateLimitConfig,

  // Moderate: 20 attempts per minute
  mutation: {
    maxAttempts: 20,
    windowMs: 60 * 1000,
  } as RateLimitConfig,
} as const;

/**
 * TODO: Upstash Redis implementation
 *
 * For production, replace the in-memory store with Upstash Redis:
 *
 * ```typescript
 * import { Ratelimit } from "@upstash/ratelimit";
 * import { Redis } from "@upstash/redis";
 *
 * const redis = new Redis({
 *   url: process.env.UPSTASH_REDIS_REST_URL!,
 *   token: process.env.UPSTASH_REDIS_REST_TOKEN!,
 * });
 *
 * export const rateLimiter = new Ratelimit({
 *   redis,
 *   limiter: Ratelimit.slidingWindow(
 *     config.maxAttempts,
 *     `${config.windowMs}ms`
 *   ),
 *   analytics: true,
 * });
 *
 * export async function checkRateLimit(
 *   identifier: string,
 *   endpoint: string,
 *   config: RateLimitConfig,
 * ): Promise<{
 *   allowed: boolean;
 *   remaining: number;
 *   resetAt: Date;
 * }> {
 *   const key =
 *     config.keyGenerator?.(identifier, endpoint) ??
 *     `${identifier}:${endpoint}`;
 *
 *   const { success, limit, remaining, reset } = await rateLimiter.limit(
 *     key,
 *   );
 *
 *   return {
 *     allowed: success,
 *     remaining,
 *     resetAt: new Date(reset),
 *   };
 * }
 * ```
 */
