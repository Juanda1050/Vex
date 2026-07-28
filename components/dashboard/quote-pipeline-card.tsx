import { QuoteStatus } from "@prisma/client";
import type { getTranslations } from "next-intl/server";

import { DashboardCardLink } from "@/components/dashboard/dashboard-toolbar";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardModuleRoute } from "@/lib/dashboard/dashboard-routes";
import type { getDashboardOverview } from "@/server/dashboard/get-dashboard-overview";

type Translator = Awaited<ReturnType<typeof getTranslations>>;
type DashboardOverview = Awaited<ReturnType<typeof getDashboardOverview>>;

type QuotePipelineCardProps = {
  overview: DashboardOverview;
  locale: string;
  tDashboard: Translator;
  tQuotes: Translator;
};

function QuotePipelineCard({
  overview,
  locale,
  tDashboard,
  tQuotes,
}: QuotePipelineCardProps) {
  return (
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
            href={getDashboardModuleRoute("quotes", locale)}
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
                        {tDashboard(`quoteStatus.${item.status.toLowerCase()}`)}
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
  );
}

export { QuotePipelineCard };
