import type { getTranslations } from "next-intl/server";

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
  formatCurrency,
  formatShortDate,
  getSaleStatusVariant,
  toNumber,
} from "@/lib/dashboard/dashboardFormatters";
import type { getDashboardOverview } from "@/server/dashboard/getDashboardOverview";

type Translator = Awaited<ReturnType<typeof getTranslations>>;
type DashboardOverview = Awaited<ReturnType<typeof getDashboardOverview>>;

type RecentSalesTableProps = {
  overview: DashboardOverview;
  locale: string;
  tDashboard: Translator;
  tNav: Translator;
  salesStatusLabel?: string;
};

function RecentSalesTable({
  overview,
  locale,
  tDashboard,
  tNav,
  salesStatusLabel,
}: RecentSalesTableProps) {
  return (
    <Card className="overflow-hidden rounded-[1.75rem] surface-1 ">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-h2 text-foreground">
              {tDashboard("recentSalesTitle")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {tDashboard("recentSalesDescription")}
            </p>
          </div>

          {salesStatusLabel ? (
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>{tDashboard("filters.salesStatus.label")}</span>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                {salesStatusLabel}
              </Badge>
            </div>
          ) : null}
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
                      {sale.customer?.name ?? tDashboard("customerFallback")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSaleStatusVariant(sale.status)}>
                        {tDashboard(`saleStatus.${sale.status.toLowerCase()}`)}
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
  );
}

export { RecentSalesTable };
