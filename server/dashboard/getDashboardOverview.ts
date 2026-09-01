import { QuoteStatus, SaleStatus } from "@prisma/client";
import { unstable_cache } from "next/cache";

import {
  type DashboardPeriod,
  type DashboardSalesStatusFilter,
  getDashboardPeriodDays,
} from "@/lib/dashboard/dashboardFilters";
import { toNumber } from "@/lib/dashboard/dashboardFormatters";
import { startServerTimer } from "@/lib/perf";
import { prisma } from "@/lib/prisma";

type DashboardOverviewInput = {
  tenantId: string;
  period: DashboardPeriod;
  salesStatus: DashboardSalesStatusFilter;
};

type SalesByDayRow = {
  day: Date;
  total: unknown;
};

type InventoryOverviewRow = {
  positions: number;
  unitsInStock: unknown;
  lowStock: number;
};

type CustomerCountsRow = {
  currentCount: number;
  previousCount: number;
};

type DashboardChartBucket = {
  start: Date;
  end: Date;
  total: number;
};

type DashboardOverview = {
  currency: string;
  range: {
    currentStart: Date;
    currentEnd: Date;
    previousStart: Date;
    previousEnd: Date;
  };
  revenue: {
    currentTotal: number;
    previousTotal: number;
    totalRecorded: number;
    growth: number;
    buckets: DashboardChartBucket[];
    maxBucketTotal: number;
    highlightedBucketIndex: number;
  };
  customers: {
    current: number;
    previous: number;
    growth: number;
  };
  inventory: {
    positions: number;
    unitsInStock: number;
    lowStock: number;
    availability: number;
  };
  products: {
    active: number;
  };
  quotes: {
    total: number;
    accepted: number;
    winRate: number;
    statusDistribution: Array<{
      status: QuoteStatus;
      value: number;
    }>;
    maxStatusValue: number;
  };
  recentSales: Array<{
    id: string;
    number: string;
    status: SaleStatus;
    total: unknown;
    saleDate: Date;
    customer: { name: string } | null;
    itemCount: number;
  }>;
};

function buildPeriodRange(period: DashboardPeriod, now: Date) {
  const currentEnd = new Date(now);
  currentEnd.setHours(23, 59, 59, 999);

  const currentStart = new Date(now);
  currentStart.setDate(
    currentStart.getDate() - (getDashboardPeriodDays(period) - 1),
  );
  currentStart.setHours(0, 0, 0, 0);

  const previousEnd = new Date(currentStart);
  previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1);

  const previousStart = new Date(currentStart);
  previousStart.setDate(
    previousStart.getDate() - getDashboardPeriodDays(period),
  );
  previousStart.setHours(0, 0, 0, 0);

  return {
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
  };
}

function getChartSegmentCount(period: DashboardPeriod) {
  switch (period) {
    case "30d":
      return 5;
    case "90d":
      return 3;
    case "7d":
    default:
      return 7;
  }
}

function buildChartBuckets(
  start: Date,
  end: Date,
  period: DashboardPeriod,
): DashboardChartBucket[] {
  const totalDays = getDashboardPeriodDays(period);
  const segments = getChartSegmentCount(period);
  const segmentSize = Math.ceil(totalDays / segments);

  return Array.from({ length: segments }, (_, index) => {
    const bucketStart = new Date(start);
    bucketStart.setDate(start.getDate() + index * segmentSize);
    bucketStart.setHours(0, 0, 0, 0);

    const bucketEnd = new Date(bucketStart);
    bucketEnd.setDate(bucketStart.getDate() + segmentSize - 1);
    bucketEnd.setHours(23, 59, 59, 999);

    if (bucketEnd > end) {
      bucketEnd.setTime(end.getTime());
    }

    return {
      start: bucketStart,
      end: bucketEnd,
      total: 0,
    };
  }).filter((bucket) => bucket.start <= end);
}

function populateBucketTotals(
  buckets: DashboardChartBucket[],
  salesTotalsByDate: Map<string, number>,
) {
  return buckets.map((bucket) => {
    let total = 0;
    const cursor = new Date(bucket.start);

    while (cursor <= bucket.end) {
      const key = cursor.toISOString().slice(0, 10);
      total += salesTotalsByDate.get(key) ?? 0;
      cursor.setDate(cursor.getDate() + 1);
    }

    return {
      ...bucket,
      total,
    };
  });
}

function resolveGrowth(currentTotal: number, previousTotal: number) {
  if (previousTotal > 0) {
    return ((currentTotal - previousTotal) / previousTotal) * 100;
  }

  if (currentTotal > 0) {
    return 100;
  }

  return 0;
}

function resolveSaleStatusFilter(status: DashboardSalesStatusFilter) {
  switch (status) {
    case "pending":
      return SaleStatus.PENDING;
    case "confirmed":
      return SaleStatus.CONFIRMED;
    case "delivered":
      return SaleStatus.DELIVERED;
    case "cancelled":
      return SaleStatus.CANCELLED;
    case "returned":
      return SaleStatus.RETURNED;
    case "all":
    default:
      return undefined;
  }
}

async function computeDashboardOverview({
  tenantId,
  period,
  salesStatus,
}: DashboardOverviewInput): Promise<DashboardOverview> {
  const perf = startServerTimer("dashboard.overview", {
    tenantId,
    period,
    salesStatus,
  });

  const now = new Date();
  const range = buildPeriodRange(period, now);
  const recentSaleStatus = resolveSaleStatusFilter(salesStatus);

  // Fetch tenant settings first (required for currency)
  const tenantSettings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
    select: { currency: true },
  });

  // Fetch products count
  const productsCount = await prisma.product.count({
    where: { tenantId, isActive: true },
  });

  // Fetch inventory in a single aggregated query
  const inventoryRows = await prisma.$queryRaw<Array<InventoryOverviewRow>>`
    SELECT
      COUNT(*)::int AS positions,
      COALESCE(SUM("quantityOnHand"), 0) AS "unitsInStock",
      COUNT(*) FILTER (
        WHERE "minStock" > 0 AND "quantityOnHand" <= "minStock"
      )::int AS "lowStock"
    FROM inventory
    WHERE "tenantId" = ${tenantId}::uuid
  `;

  // Fetch all sales totals in one query
  const totalSales = await prisma.sale.aggregate({
    where: { tenantId },
    _sum: { total: true },
  });

  // Fetch sales by day for the entire period
  const salesByDayRows = await prisma.$queryRaw<Array<SalesByDayRow>>`
    SELECT DATE("saleDate") AS day, SUM(total) AS total
    FROM sales
    WHERE "tenantId" = ${tenantId}::uuid
      AND "saleDate" >= ${range.previousStart}
      AND "saleDate" <= ${range.currentEnd}
    GROUP BY DATE("saleDate")
  `;

  // Fetch quote statuses
  const quoteStatusTotals = await prisma.quote.groupBy({
    by: ["status"],
    where: { tenantId },
    _count: { _all: true },
  });

  // Fetch customer counts
  const customerCountsRows = await prisma.$queryRaw<Array<CustomerCountsRow>>`
    SELECT
      COUNT(*) FILTER (
        WHERE "createdAt" >= ${range.currentStart}
          AND "createdAt" <= ${range.currentEnd}
      )::int AS "currentCount",
      COUNT(*) FILTER (
        WHERE "createdAt" >= ${range.previousStart}
          AND "createdAt" <= ${range.previousEnd}
      )::int AS "previousCount"
    FROM customers
    WHERE "tenantId" = ${tenantId}::uuid
  `;

  // Fetch recent sales with limited fields
  const recentSales = await prisma.sale.findMany({
    where: {
      tenantId,
      ...(recentSaleStatus ? { status: recentSaleStatus } : {}),
    },
    orderBy: { saleDate: "desc" },
    take: 6,
    select: {
      id: true,
      number: true,
      status: true,
      total: true,
      saleDate: true,
      customer: { select: { name: true } },
      _count: { select: { items: true } },
    },
  });

  const inventoryOverview = inventoryRows[0];
  const customerCounts = customerCountsRows[0];

  const inventoryPositions = inventoryOverview?.positions ?? 0;
  const unitsInStock = toNumber(inventoryOverview?.unitsInStock);
  const lowStock = inventoryOverview?.lowStock ?? 0;
  const availability =
    inventoryPositions === 0
      ? 0
      : Math.max(
          0,
          Math.round(
            ((inventoryPositions - lowStock) / inventoryPositions) * 100,
          ),
        );

  const salesTotalsByDate = new Map<string, number>();
  for (const row of salesByDayRows) {
    const key = new Date(row.day).toISOString().slice(0, 10);
    salesTotalsByDate.set(key, toNumber(row.total));
  }

  const currentBuckets = populateBucketTotals(
    buildChartBuckets(range.currentStart, range.currentEnd, period),
    salesTotalsByDate,
  );

  const currentRevenue = currentBuckets.reduce(
    (sum, bucket) => sum + bucket.total,
    0,
  );

  let previousRevenue = 0;
  const previousCursor = new Date(range.previousStart);
  while (previousCursor <= range.previousEnd) {
    const key = previousCursor.toISOString().slice(0, 10);
    previousRevenue += salesTotalsByDate.get(key) ?? 0;
    previousCursor.setDate(previousCursor.getDate() + 1);
  }

  const maxBucketTotal = Math.max(
    ...currentBuckets.map((bucket) => bucket.total),
    0,
  );
  const highlightedBucketIndex = currentBuckets.findIndex(
    (bucket) => bucket.total === maxBucketTotal,
  );

  const quoteStatuses = [
    QuoteStatus.DRAFT,
    QuoteStatus.SENT,
    QuoteStatus.ACCEPTED,
    QuoteStatus.REJECTED,
    QuoteStatus.EXPIRED,
    QuoteStatus.CONVERTED,
  ];

  const statusDistribution = quoteStatuses.map((status) => {
    const found = quoteStatusTotals.find((item) => item.status === status);
    return {
      status,
      value: found?._count._all ?? 0,
    };
  });

  const totalQuotes = statusDistribution.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const acceptedQuotes = statusDistribution
    .filter(
      (item) =>
        item.status === QuoteStatus.ACCEPTED ||
        item.status === QuoteStatus.CONVERTED,
    )
    .reduce((sum, item) => sum + item.value, 0);

  const currentPeriodCustomers = customerCounts?.currentCount ?? 0;
  const previousPeriodCustomers = customerCounts?.previousCount ?? 0;

  const result = {
    currency: tenantSettings?.currency ?? "USD",
    range,
    revenue: {
      currentTotal: currentRevenue,
      previousTotal: previousRevenue,
      totalRecorded: toNumber(totalSales._sum.total),
      growth: resolveGrowth(currentRevenue, previousRevenue),
      buckets: currentBuckets,
      maxBucketTotal,
      highlightedBucketIndex,
    },
    customers: {
      current: currentPeriodCustomers,
      previous: previousPeriodCustomers,
      growth: resolveGrowth(currentPeriodCustomers, previousPeriodCustomers),
    },
    inventory: {
      positions: inventoryPositions,
      unitsInStock,
      lowStock,
      availability,
    },
    products: {
      active: productsCount,
    },
    quotes: {
      total: totalQuotes,
      accepted: acceptedQuotes,
      winRate:
        totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0,
      statusDistribution,
      maxStatusValue: Math.max(
        ...statusDistribution.map((item) => item.value),
        0,
      ),
    },
    recentSales: recentSales.map((sale) => ({
      id: sale.id,
      number: sale.number,
      status: sale.status,
      total: sale.total,
      saleDate: sale.saleDate,
      customer: sale.customer,
      itemCount: sale._count.items,
    })),
  };

  perf.end();
  return result;
}

export async function getDashboardOverview(
  input: DashboardOverviewInput,
): Promise<DashboardOverview> {
  const { tenantId, period, salesStatus } = input;

  return unstable_cache(
    () => computeDashboardOverview({ tenantId, period, salesStatus }),
    ["dashboard-overview", tenantId, period, salesStatus],
    {
      revalidate: 20,
      tags: [`dashboard-overview:${tenantId}`],
    },
  )();
}
