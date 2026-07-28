import type { getTranslations } from "next-intl/server";
import { DollarSign, FileText, TriangleAlert, Users } from "lucide-react";

import {
  DashboardCardLink,
} from "@/components/dashboard/dashboard-toolbar";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatCurrency,
  formatDelta,
  getMetricTone,
} from "@/lib/dashboard/dashboard-formatters";
import { getDashboardModuleRoute } from "@/lib/dashboard/dashboard-routes";
import type { getDashboardOverview } from "@/server/dashboard/get-dashboard-overview";

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
      href: getDashboardModuleRoute("sales", locale),
      icon: Users,
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
    },
    {
      id: "quotes",
      title: tDashboard("acceptedQuotesTitle"),
      value: String(overview.quotes.accepted),
      trendLabel: `${overview.quotes.winRate}%`,
      trendTone:
        overview.quotes.winRate >= 50 ? ("positive" as const) : ("neutral" as const),
      description:
        overview.quotes.total > 0
          ? tDashboard("quoteBaseLabel", { count: overview.quotes.total })
          : tDashboard("noQuotesYet"),
      href: getDashboardModuleRoute("quotes", locale),
      icon: FileText,
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
  );
}

export { DashboardMetricCards };
