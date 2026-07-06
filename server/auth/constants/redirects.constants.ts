export const AUTH_REDIRECTS = {
  login: (locale: string) => `/${locale}/login`,
  onboarding: (locale: string) => `/${locale}/onboarding`,
  unauthorized: (locale: string) => `/${locale}/unauthorized`,
  dashboard: (locale: string) => `/${locale}/dashboard`,
} as const;
