import type { getTranslations } from "next-intl/server";
import { TriangleAlert } from "lucide-react";

import { DashboardCardLink } from "@/components/dashboard/dashboardToolbar";
import { Sparkline } from "@/components/dashboard/sparkline";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatCurrency,
  formatDelta,
  getMetricTone,
} from "@/lib/dashboard/dashboardFormatters";
import { getDashboardModuleRoute } from "@/lib/dashboard/dashboardRoutes";
import { getModuleIcon } from "@/lib/modules/moduleIcons";
import type { getDashboardOverview } from "@/server/dashboard/getDashboardOverview";

type Translator = Awaited<ReturnType<typeof getTranslations>>;
type DashboardOverview = Awaited<ReturnType<typeof getDashboardOverview>>;

type DashboardMetricCardsProps = {
  overview: DashboardOverview;
  locale: string;
  tDashboard: Translator;
};

function DashboardMetricCards({
  overview,
  locale,
  tDashboard,
}: DashboardMetricCardsProps) {
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
      href: getDashboardModuleRoute("sales", locale),
      icon: getModuleIcon("sales"),
      sparklineValues: overview.revenue.buckets.map((bucket) => bucket.total),
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
      href: getDashboardModuleRoute("sales", locale),
      icon: getModuleIcon("customers"),
      sparklineValues: [
        overview.customers.previous,
        overview.customers.current,
      ],
    },
    {
      id: "inventory",
      title: tDashboard("lowStockTitle"),
      value: String(overview.inventory.lowStock),
      trendLabel: `${overview.inventory.availability}%`,
      trendTone:
        overview.inventory.availability >= 80
          ? ("positive" as const)
          : overview.inventory.lowStock > 0
            ? ("negative" as const)
            : ("neutral" as const),
      description:
        overview.inventory.positions > 0
          ? tDashboard("inventoryCoverage", {
              count: overview.inventory.positions,
            })
          : tDashboard("noData"),
      href: getDashboardModuleRoute("inventory", locale),
      icon: TriangleAlert,
      sparklineValues: undefined as number[] | undefined,
    },
    {
      id: "quotes",
      title: tDashboard("acceptedQuotesTitle"),
      value: String(overview.quotes.accepted),
      trendLabel: `${overview.quotes.winRate}%`,
      trendTone:
        overview.quotes.winRate >= 50
          ? ("positive" as const)
          : ("neutral" as const),
      description:
        overview.quotes.total > 0
          ? tDashboard("quoteBaseLabel", { count: overview.quotes.total })
          : tDashboard("noQuotesYet"),
      href: getDashboardModuleRoute("quotes", locale),
      icon: getModuleIcon("quotes"),
      sparklineValues: undefined as number[] | undefined,
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {metricCards.map((metric) => {
        const Icon = metric.icon;
        const toneClass =
          metric.trendTone === "positive"
            ? "bg-success/12 text-success"
            : metric.trendTone === "negative"
              ? "bg-destructive/12 text-destructive"
              : "bg-muted text-muted-foreground";
        const sparklineToneClass =
          metric.trendTone === "positive"
            ? "text-success"
            : metric.trendTone === "negative"
              ? "text-destructive"
              : "text-muted-foreground";

        return (
          <Card
            key={metric.id}
            className="overflow-hidden rounded-[1.5rem] surface-1 "
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </p>
                  <div className="space-y-2">
                    <p className="text-h1 text-foreground">{metric.value}</p>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${toneClass}`}
                    >
                      {metric.trendLabel}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  {metric.sparklineValues ? (
                    <Sparkline
                      values={metric.sparklineValues}
                      className={sparklineToneClass}
                    />
                  ) : null}
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
  );
}

export { DashboardMetricCards };
