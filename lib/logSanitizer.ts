/**
 * Log sanitization for preventing sensitive data leakage.
 *
 * Redacts:
 * - Passwords and passphrases
 * - Authentication tokens (Bearer, JWT, API keys)
 * - Credit card data
 * - Cookies and session data
 * - Personal identifiable information in logs
 *
 * Usage:
 *   const safe = sanitizeLog({ email: 'user@example.com', password: '...' });
 *   console.error('Login failed:', safe);
 */

const SENSITIVE_KEYS = [
  // Auth
  "password",
  "passcode",
  "pin",
  "token",
  "accessToken",
  "refreshToken",
  "sessionId",
  "apiKey",
  "apiSecret",
  "authorization",

  // Payment
  "cardNumber",
  "cardToken",
  "cvv",
  "cvc",
  "expiryDate",
  "expiryMonth",
  "expiryYear",
  "stripeToken",
  "stripeSecretKey",

  // User data
  "email", // when logging errors, exclude email
  "phone",
  "ssn",
  "taxId",

  // Cookies & headers
  "cookie",
  "setCookie",
  "x-api-key",
];

const SENSITIVE_PATTERNS = [
  // Bearer tokens
  /bearer\s+[\w-_.]+/gi,
  // JWT-like tokens (3 parts separated by dots)
  /[\w-]+\.[\w-]+\.[\w-]+/g,
  // Credit cards
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  // SSN
  /\b\d{3}-\d{2}-\d{4}\b/g,
];

/**
 * Recursively sanitize an object, replacing sensitive values.
 *
 * @param obj Object to sanitize
 * @param depth Max recursion depth (default 10)
 * @returns Sanitized copy of object
 */
export function sanitizeLog(obj: unknown, depth: number = 0): unknown {
  const MAX_DEPTH = 10;

  if (depth > MAX_DEPTH) {
    return "[Max depth exceeded]";
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== "object") {
    if (typeof obj === "string") {
      return sanitizeString(obj);
    }
    return obj;
  }

  if (obj instanceof Date) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeLog(item, depth + 1));
  }

  // Object
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveKey(key)) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = sanitizeLog(value, depth + 1);
    }
  }

  return sanitized;
}

/**
 * Sanitize a string by removing sensitive patterns.
 */
function sanitizeString(str: string): string {
  let sanitized = str;

  SENSITIVE_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  });

  return sanitized;
}

/**
 * Check if a key looks sensitive.
 */
function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return SENSITIVE_KEYS.some((sensitive) =>
    lowerKey.includes(sensitive.toLowerCase()),
  );
}

/**
 * Wrapper for console.error that sanitizes before logging.
 */
export function logError(
  message: string,
  error?: unknown,
  context?: Record<string, unknown>,
): void {
  const sanitizedError = error ? sanitizeLog(error) : undefined;
  const sanitizedContext = context ? sanitizeLog(context) : undefined;

  console.error(message, sanitizedError, sanitizedContext);
}

/**
 * Wrapper for console.warn that sanitizes before logging.
 */
export function logWarn(
  message: string,
  context?: Record<string, unknown>,
): void {
  const sanitizedContext = context ? sanitizeLog(context) : undefined;

  console.warn(message, sanitizedContext);
}

/**
 * Wrapper for console.info that sanitizes before logging.
 */
export function logInfo(
  message: string,
  context?: Record<string, unknown>,
): void {
  const sanitizedContext = context ? sanitizeLog(context) : undefined;

  console.info(message, sanitizedContext);
}
