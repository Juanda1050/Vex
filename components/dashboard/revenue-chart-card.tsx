import type { getTranslations } from "next-intl/server";

import { Card, CardContent } from "@/components/ui/card";
import {
  formatChartBucketLabel,
  formatCurrency,
} from "@/lib/dashboard/dashboard-formatters";
import type { DashboardPeriod } from "@/lib/dashboard/dashboard-filters";
import type { getDashboardOverview } from "@/server/dashboard/get-dashboard-overview";

type Translator = Awaited<ReturnType<typeof getTranslations>>;
type DashboardOverview = Awaited<ReturnType<typeof getDashboardOverview>>;

type RevenueChartCardProps = {
  overview: DashboardOverview;
  locale: string;
  period: DashboardPeriod;
  tDashboard: Translator;
};

function RevenueChartCard({
  overview,
  locale,
  period,
  tDashboard,
}: RevenueChartCardProps) {
  return (
    <Card className="overflow-hidden rounded-[1.75rem] surface-1 ">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-h2 text-foreground">
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
            <p className="mt-1 text-h1 text-foreground">
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
  );
}

export { RevenueChartCard };
