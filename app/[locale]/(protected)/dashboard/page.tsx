import { getTranslations } from "next-intl/server";

import { DashboardMetricCards } from "@/components/dashboard/metric-cards";
import { QuotePipelineCard } from "@/components/dashboard/quote-pipeline-card";
import { RecentSalesTable } from "@/components/dashboard/recent-sales-table";
import { RevenueChartCard } from "@/components/dashboard/revenue-chart-card";
import {
  DashboardCardLink,
  DashboardToolbar,
} from "@/components/dashboard/dashboard-toolbar";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  DASHBOARD_PERIOD_OPTIONS,
  DASHBOARD_SALES_STATUS_OPTIONS,
  resolveDashboardPeriod,
  resolveDashboardSalesStatus,
} from "@/lib/dashboard/dashboard-filters";
import {
  formatCompactNumber,
  formatCurrency,
  formatDateRange,
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
    getTranslations("dashboard"),
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

  const salesStatusLabel = salesStatusOptions.find(
    (option) => option.value === salesStatus,
  )?.label;

  return (
    <div className="space-y-8">
      <header className="space-y-4 border-b border-border/70 pb-5">
        <PageHeader
          title={tDashboard("title")}
          description={tDashboard("descriptionModern")}
        />

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

      <DashboardMetricCards overview={overview} locale={locale} tDashboard={tDashboard} />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
        <RevenueChartCard
          overview={overview}
          locale={locale}
          period={period}
          tDashboard={tDashboard}
        />
        <QuotePipelineCard
          overview={overview}
          locale={locale}
          tDashboard={tDashboard}
          tQuotes={tQuotes}
        />
      </section>

      <RecentSalesTable
        overview={overview}
        locale={locale}
        tDashboard={tDashboard}
        tNav={tNav}
        salesStatusLabel={salesStatusLabel}
      />

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
              href={getDashboardModuleRoute("quotes", locale)}
              label={tDashboard("viewModule", { module: tQuotes("title") })}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
