import { QuoteStatus } from "@prisma/client";
import { DollarSign, FileText, TriangleAlert, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import {
  DashboardCardLink,
  DashboardToolbar,
} from "@/components/dashboard/dashboard-toolbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DASHBOARD_PERIOD_OPTIONS,
  DASHBOARD_SALES_STATUS_OPTIONS,
  resolveDashboardPeriod,
  resolveDashboardSalesStatus,
} from "@/lib/dashboard/dashboard-filters";
import {
  formatChartBucketLabel,
  formatCompactNumber,
  formatCurrency,
  formatDateRange,
  formatDelta,
  formatShortDate,
  getMetricTone,
  getSaleStatusVariant,
  toNumber,
} from "@/lib/dashboard/dashboard-formatters";
import { getDashboardModuleRoute } from "@/lib/dashboard/dashboard-routes";
import { requireAuth } from "@/server/auth";
import { getDashboardOverview } from "@/server/dashboard/get-dashboard-overview";

export default async function DashboardModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ period?: string; salesStatus?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const auth = await requireAuth();

  const period = resolveDashboardPeriod(query.period);
  const salesStatus = resolveDashboardSalesStatus(query.salesStatus);

  const [tDashboard, tNav, tProducts, tQuotes, overview] = await Promise.all([
    getTranslations("mvp.dashboard"),
    getTranslations("nav"),
    getTranslations("products"),
    getTranslations("quotes"),
    getDashboardOverview({
      tenantId: auth.tenantId,
      period,
      salesStatus,
    }),
  ]);

  const periodOptions = DASHBOARD_PERIOD_OPTIONS.map((value) => ({
    value,
    label: tDashboard(`filters.period.${value}`),
  }));

  const salesStatusOptions = DASHBOARD_SALES_STATUS_OPTIONS.map((value) => ({
    value,
    label:
      value === "all"
        ? tDashboard("filters.salesStatus.all")
        : tDashboard(`saleStatus.${value}`),
  }));

  const metricCards = [
    {
      id: "sales",
      title: tDashboard("periodRevenueTitle"),
      value: formatCurrency(
        overview.revenue.currentTotal,
        locale,
        overview.currency,
      ),
      trendLabel: formatDelta(overview.revenue.growth),
      trendTone: getMetricTone(overview.revenue.growth),
      description: tDashboard("previousPeriodRevenue", {
        amount: formatCurrency(
          overview.revenue.previousTotal,
          locale,
          overview.currency,
        ),
      }),
      href: getDashboardModuleRoute("sales"),
      icon: DollarSign,
    },
    {
      id: "customers",
      title: tDashboard("newCustomersTitle"),
      value: String(overview.customers.current),
      trendLabel: formatDelta(overview.customers.growth),
      trendTone: getMetricTone(overview.customers.growth),
      description: tDashboard("previousPeriodCustomers", {
        count: overview.customers.previous,
      }),
      href: getDashboardModuleRoute("sales"),
      icon: Users,
    },
    {
      id: "inventory",
      title: tDashboard("lowStockTitle"),
      value: String(overview.inventory.lowStock),
      trendLabel: `${overview.inventory.availability}%`,
      trendTone:
        overview.inventory.availability >= 80
          ? "positive"
          : overview.inventory.lowStock > 0
            ? "negative"
            : "neutral",
      description:
        overview.inventory.positions > 0
          ? tDashboard("inventoryCoverage", {
              count: overview.inventory.positions,
            })
          : tDashboard("noData"),
      href: getDashboardModuleRoute("inventory"),
      icon: TriangleAlert,
    },
    {
      id: "quotes",
      title: tDashboard("acceptedQuotesTitle"),
      value: String(overview.quotes.accepted),
      trendLabel: `${overview.quotes.winRate}%`,
      trendTone: overview.quotes.winRate >= 50 ? "positive" : "neutral",
      description:
        overview.quotes.total > 0
          ? tDashboard("quoteBaseLabel", { count: overview.quotes.total })
          : tDashboard("noQuotesYet"),
      href: getDashboardModuleRoute("quotes"),
      icon: FileText,
    },
  ] as const;

  return (
    <div className="space-y-8">
      <header className="space-y-4 border-b border-border/70 pb-5">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-[2.15rem]">
            {tDashboard("title")}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            {tDashboard("descriptionModern")}
          </p>
        </div>

        <DashboardToolbar
          period={period}
          salesStatus={salesStatus}
          rangeText={formatDateRange(
            overview.range.currentStart,
            overview.range.currentEnd,
            locale,
          )}
          labels={{
            period: tDashboard("filters.period.label"),
            salesStatus: tDashboard("filters.salesStatus.label"),
          }}
          periodOptions={periodOptions}
          salesStatusOptions={salesStatusOptions}
        />
      </header>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          const toneClass =
            metric.trendTone === "positive"
              ? "bg-success/12 text-success"
              : metric.trendTone === "negative"
                ? "bg-destructive/12 text-destructive"
                : "bg-muted text-muted-foreground";

          return (
            <Card
              key={metric.id}
              className="overflow-hidden rounded-[1.5rem] border-border/70 bg-card/72 shadow-none backdrop-blur-sm"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </p>
                    <div className="space-y-2">
                      <p className="text-3xl font-semibold tracking-tight text-foreground">
                        {metric.value}
                      </p>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${toneClass}`}
                      >
                        {metric.trendLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    {metric.description}
                  </p>
                  <DashboardCardLink
                    href={metric.href}
                    label={tDashboard("viewModule", { module: metric.title })}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
        <Card className="overflow-hidden rounded-[1.75rem] border-border/70 bg-card/72 shadow-none backdrop-blur-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {tDashboard("periodRevenueTitle")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tDashboard("periodRevenueDescription")}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  {tDashboard("totalRevenueTitle")}
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {formatCurrency(
                    overview.revenue.totalRecorded,
                    locale,
                    overview.currency,
                  )}
                </p>
              </div>
            </div>

            {overview.revenue.maxBucketTotal === 0 ? (
              <div className="mt-8 rounded-3xl border border-dashed border-border/80 bg-muted/35 px-5 py-12 text-center text-sm text-muted-foreground">
                {tDashboard("noSalesInRange")}
              </div>
            ) : (
              <div className="mt-8 grid gap-4 lg:grid-cols-[44px_minmax(0,1fr)]">
                <div className="hidden h-72 justify-between text-xs text-muted-foreground lg:flex lg:flex-col">
                  {[100, 75, 50, 25, 0].map((tick) => (
                    <span key={tick}>
                      {Math.round(
                        (overview.revenue.maxBucketTotal * tick) / 100 / 1000,
                      )}
                      k
                    </span>
                  ))}
                </div>

                <div className="relative flex h-72 items-end gap-3 rounded-[1.5rem] bg-muted/25 px-4 pb-4 pt-10">
                  <div className="pointer-events-none absolute inset-x-4 top-10 bottom-4 flex flex-col justify-between">
                    {[0, 1, 2, 3].map((line) => (
                      <div
                        key={line}
                        className="border-t border-dashed border-border/70"
                      />
                    ))}
                  </div>

                  {overview.revenue.buckets.map((bucket, index) => {
                    const height = Math.max(
                      14,
                      (bucket.total / overview.revenue.maxBucketTotal) * 100,
                    );
                    const isHighlighted =
                      index === overview.revenue.highlightedBucketIndex;

                    return (
                      <div
                        key={`${bucket.start.toISOString()}-${index}`}
                        className="relative z-10 flex flex-1 flex-col items-center justify-end gap-3"
                      >
                        <div className="relative flex h-full w-full items-end justify-center">
                          {isHighlighted ? (
                            <div className="absolute -top-9 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-lg">
                              {formatCurrency(
                                bucket.total,
                                locale,
                                overview.currency,
                              )}
                            </div>
                          ) : null}

                          <div
                            className={[
                              "w-full rounded-[999px] transition-all",
                              isHighlighted
                                ? "bg-linear-to-b from-primary to-primary/85 shadow-[0_16px_32px_hsl(var(--primary)/0.28)]"
                                : "bg-linear-to-b from-primary/80 to-primary/60",
                            ].join(" ")}
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <span className="text-center text-[11px] font-medium leading-4 text-muted-foreground">
                          {formatChartBucketLabel(bucket, locale, period)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[1.75rem] border-border/70 bg-card/72 shadow-none backdrop-blur-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {tDashboard("quotePipelineTitle")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tDashboard("quotePipelineDescription")}
                </p>
              </div>

              <DashboardCardLink
                href={getDashboardModuleRoute("quotes")}
                label={tDashboard("viewModule", { module: tQuotes("title") })}
              />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-muted/35 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  {tQuotes("title")}
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {overview.quotes.total}
                </p>
              </div>
              <div className="rounded-2xl bg-muted/35 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  {tDashboard("stats.winRate")}
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {overview.quotes.winRate}%
                </p>
              </div>
            </div>

            {overview.quotes.maxStatusValue === 0 ? (
              <div className="mt-8 rounded-3xl border border-dashed border-border/80 bg-muted/35 px-5 py-12 text-center text-sm text-muted-foreground">
                {tDashboard("noQuotesYet")}
              </div>
            ) : (
              <div className="mt-8">
                <div className="flex h-64 items-end gap-3 rounded-[1.5rem] bg-muted/25 px-4 pb-4 pt-8">
                  {overview.quotes.statusDistribution.map((item) => {
                    const height = Math.max(
                      16,
                      (item.value / overview.quotes.maxStatusValue) * 100,
                    );
                    const isPositive =
                      item.status === QuoteStatus.ACCEPTED ||
                      item.status === QuoteStatus.CONVERTED;
                    const isNegative =
                      item.status === QuoteStatus.REJECTED ||
                      item.status === QuoteStatus.EXPIRED;

                    return (
                      <div
                        key={item.status}
                        className="flex flex-1 flex-col items-center gap-3"
                      >
                        <div className="flex h-full w-full items-end justify-center gap-1">
                          <div className="h-[28%] w-full rounded-[999px] bg-foreground/85" />
                          <div
                            className={[
                              "w-full rounded-[999px]",
                              isPositive
                                ? "bg-primary"
                                : isNegative
                                  ? "bg-destructive/85"
                                  : "bg-info/85",
                            ].join(" ")}
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <div className="space-y-1 text-center">
                          <p className="text-xs font-medium text-foreground">
                            {item.value}
                          </p>
                          <p className="text-[11px] leading-4 text-muted-foreground">
                            {tDashboard(
                              `quoteStatus.${item.status.toLowerCase()}`,
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="overflow-hidden rounded-[1.75rem] border-border/70 bg-card/72 shadow-none backdrop-blur-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {tDashboard("recentSalesTitle")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tDashboard("recentSalesDescription")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>{tDashboard("filters.salesStatus.label")}</span>
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  {
                    salesStatusOptions.find(
                      (option) => option.value === salesStatus,
                    )?.label
                  }
                </Badge>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tDashboard("salesOrderLabel")}</TableHead>
                    <TableHead>{tDashboard("dateColumnLabel")}</TableHead>
                    <TableHead>{tNav("customers")}</TableHead>
                    <TableHead>{tDashboard("statusColumnLabel")}</TableHead>
                    <TableHead>{tDashboard("itemsColumnLabel")}</TableHead>
                    <TableHead className="text-right">
                      {tDashboard("totalColumnLabel")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.recentSales.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        {tDashboard("noData")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    overview.recentSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium text-foreground">
                          #{sale.number}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatShortDate(sale.saleDate, locale)}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {sale.customer?.name ??
                            tDashboard("customerFallback")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getSaleStatusVariant(sale.status)}>
                            {tDashboard(
                              `saleStatus.${sale.status.toLowerCase()}`,
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {tDashboard("itemsCount", { count: sale.itemCount })}
                        </TableCell>
                        <TableCell className="text-right font-medium text-foreground">
                          {formatCurrency(
                            toNumber(sale.total),
                            locale,
                            overview.currency,
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-[1.5rem] border-border/70 bg-card/72 shadow-none backdrop-blur-sm lg:col-span-2">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {tDashboard("totalRevenueTitle")}
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatCurrency(
                  overview.revenue.totalRecorded,
                  locale,
                  overview.currency,
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
              <span>
                {tProducts("title")}: {overview.products.active}
              </span>
              <span>
                {tDashboard("stats.unitsInStock")}:{" "}
                {formatCompactNumber(overview.inventory.unitsInStock)}
              </span>
              <span>
                {tDashboard("stats.availability")}:{" "}
                {overview.inventory.availability}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-border/70 bg-card/72 shadow-none backdrop-blur-sm">
          <CardContent className="flex h-full items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {tDashboard("acceptedQuotesTitle")}
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {overview.quotes.accepted}
              </p>
            </div>
            <DashboardCardLink
              href={getDashboardModuleRoute("quotes")}
              label={tDashboard("viewModule", { module: tQuotes("title") })}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
