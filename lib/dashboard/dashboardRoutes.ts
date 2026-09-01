export const DASHBOARD_MODULE_KEYS = [
  "sales",
  "inventory",
  "products",
  "quotes",
] as const;

export type DashboardModuleKey = (typeof DASHBOARD_MODULE_KEYS)[number];

export function getDashboardModuleRoute(
  moduleKey: DashboardModuleKey,
  locale: string,
) {
  return `/${locale}/${moduleKey}`;
}
