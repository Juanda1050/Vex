export const DASHBOARD_PERIOD_OPTIONS = ["7d", "30d", "90d"] as const;

export type DashboardPeriod = (typeof DASHBOARD_PERIOD_OPTIONS)[number];

export const DASHBOARD_SALES_STATUS_OPTIONS = [
  "all",
  "pending",
  "confirmed",
  "delivered",
  "cancelled",
  "returned",
] as const;

export type DashboardSalesStatusFilter =
  (typeof DASHBOARD_SALES_STATUS_OPTIONS)[number];

export function resolveDashboardPeriod(value?: string): DashboardPeriod {
  if (value && DASHBOARD_PERIOD_OPTIONS.includes(value as DashboardPeriod)) {
    return value as DashboardPeriod;
  }

  return "7d";
}

export function resolveDashboardSalesStatus(
  value?: string,
): DashboardSalesStatusFilter {
  if (
    value &&
    DASHBOARD_SALES_STATUS_OPTIONS.includes(value as DashboardSalesStatusFilter)
  ) {
    return value as DashboardSalesStatusFilter;
  }

  return "all";
}

export function getDashboardPeriodDays(period: DashboardPeriod) {
  switch (period) {
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "7d":
    default:
      return 7;
  }
}
