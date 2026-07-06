import { Role } from "./types";

export const ROLE_HIERARCHY: Role[] = [
  "CASHIER",
  "WAREHOUSE",
  "PURCHASING",
  "SUPEVISOR",
  "ADMIN",
  "OWNER",
];

export const AUTH_REDIRECTS = {
  login: (locale: string) => `/${locale}/login`,
  onboarding: (locale: string) => `/${locale}/onboarding`,
  unauthorized: (locale: string) => `/${locale}/unauthorized`,
} as const;
