import { SaleStatus } from "@prisma/client";

import { type DashboardPeriod } from "@/lib/dashboard/dashboard-filters";

type ChartBucket = {
  start: DateInput;
  end: DateInput;
};

type DateInput = Date | string | number | null | undefined;

function toValidDate(value: DateInput) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

export function toNumber(value: unknown) {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: () => number }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return 0;
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);
}

export function formatCurrency(
  value: number,
  locale: string,
  currency = "USD",
) {
  const outputLocale = locale === "es" ? "es-MX" : "en-US";
  return new Intl.NumberFormat(outputLocale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDayLabel(date: DateInput, locale: string) {
  const validDate = toValidDate(date);
  if (!validDate) return "-";

  const outputLocale = locale === "es" ? "es-MX" : "en-US";
  return new Intl.DateTimeFormat(outputLocale, { weekday: "short" }).format(
    validDate,
  );
}

export function formatShortDate(date: DateInput, locale: string) {
  const validDate = toValidDate(date);
  if (!validDate) return "-";

  const outputLocale = locale === "es" ? "es-MX" : "en-US";
  return new Intl.DateTimeFormat(outputLocale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(validDate);
}

export function formatDateRange(
  start: DateInput,
  end: DateInput,
  locale: string,
) {
  return `${formatShortDate(start, locale)} - ${formatShortDate(end, locale)}`;
}

export function formatDelta(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function getMetricTone(value: number) {
  if (value > 0) return "positive" as const;
  if (value < 0) return "negative" as const;
  return "neutral" as const;
}

export function getSaleStatusVariant(status: SaleStatus) {
  switch (status) {
    case SaleStatus.DELIVERED:
      return "success" as const;
    case SaleStatus.CONFIRMED:
      return "info" as const;
    case SaleStatus.PENDING:
      return "warning" as const;
    case SaleStatus.CANCELLED:
      return "destructive" as const;
    case SaleStatus.RETURNED:
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

export function formatChartBucketLabel(
  bucket: ChartBucket,
  locale: string,
  period: DashboardPeriod,
) {
  const startDate = toValidDate(bucket.start);
  const endDate = toValidDate(bucket.end);

  if (period === "7d") {
    return formatDayLabel(startDate, locale);
  }

  if (!startDate || !endDate) return "-";

  const outputLocale = locale === "es" ? "es-MX" : "en-US";
  const formatter = new Intl.DateTimeFormat(outputLocale, {
    month: "short",
    day: "numeric",
  });

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}
