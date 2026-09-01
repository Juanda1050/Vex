import { QuoteStatus } from "@prisma/client";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/layout/pageHeader";
import { getModuleIcon } from "@/lib/modules/moduleIcons";
import { ModulePagination } from "@/components/modules/modulePagination";
import { ModuleEmptyState } from "@/components/modules/moduleEmptyState";
import { ModuleToolbar } from "@/components/modules/moduleToolbar";
import { RowActionHint } from "@/components/modules/rowActionHint";
import { SortableTableHead } from "@/components/modules/sortableTableHead";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
} from "@/lib/dashboard/dashboardFormatters";
import {
  resolveSortDirection,
  resolveSortKey,
} from "@/lib/modules/sortParams";
import { requirePermission } from "@/server/auth";
import { quoteService } from "@/server/quotes/service/quote.service";

const QUOTE_STATUS_VARIANTS: Record<
  QuoteStatus,
  "success" | "info" | "warning" | "destructive" | "secondary" | "outline"
> = {
  DRAFT: "outline",
  SENT: "info",
  ACCEPTED: "success",
  REJECTED: "destructive",
  EXPIRED: "secondary",
  CONVERTED: "success",
};

export default async function QuotesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const ctx = await requirePermission("quotes.view");

  const [t, tCommon, tDashboard] = await Promise.all([
    getTranslations("quotes"),
    getTranslations("common"),
    getTranslations("dashboard"),
  ]);

  const page = Math.max(1, Number(query.page) || 1);
  const search = query.search?.trim() || undefined;
  const status =
    query.status && query.status in QuoteStatus
      ? (query.status as QuoteStatus)
      : undefined;
  const hasFilters = Boolean(search) || Boolean(query.status);
  const sort = resolveSortKey(query.sort, [
    "total",
    "validUntil",
    "createdAt",
  ] as const);
  const dir = resolveSortDirection(query.dir);

  const { items, pagination } = await quoteService.listQuotes(ctx.tenantId, {
    page,
    pageSize: 20,
    search,
    status,
    sort,
    dir,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        icon={getModuleIcon("quotes")}
      />

      <Card className="space-y-5 rounded-[1.75rem] surface-1 p-5  sm:p-6">
        <ModuleToolbar
          searchPlaceholder={t("searchPlaceholder")}
          statusParamName="status"
          statusLabel={t("filters.status")}
          statusOptions={[
            { value: "", label: t("filters.allStatuses") },
            ...Object.values(QuoteStatus).map((value) => ({
              value,
              label: tDashboard(`quoteStatus.${value.toLowerCase()}`),
            })),
          ]}
        />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("fields.number")}</TableHead>
              <TableHead>{t("fields.customer")}</TableHead>
              <TableHead>{t("fields.status")}</TableHead>
              <SortableTableHead
                sortKey="total"
                currentSort={sort}
                currentDir={dir}
                align="right"
              >
                {t("fields.total")}
              </SortableTableHead>
              <SortableTableHead
                sortKey="validUntil"
                currentSort={sort}
                currentDir={dir}
              >
                {t("fields.validUntil")}
              </SortableTableHead>
              <SortableTableHead
                sortKey="createdAt"
                currentSort={sort}
                currentDir={dir}
              >
                {t("fields.createdAt")}
              </SortableTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <ModuleEmptyState
                    hasFilters={hasFilters}
                    emptyText={t("emptyNoData")}
                    noResultsText={t("empty")}
                  />
                </TableCell>
              </TableRow>
            ) : (
              items.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium text-foreground">
                    #{quote.number}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {quote.customer?.name ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={QUOTE_STATUS_VARIANTS[quote.status]}>
                      {tDashboard(`quoteStatus.${quote.status.toLowerCase()}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-foreground">
                    {formatCurrency(Number(quote.total ?? 0), locale)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {quote.validUntil
                      ? formatShortDate(quote.validUntil, locale)
                      : "-"}
                  </TableCell>
                  <TableCell className="relative pr-6 text-muted-foreground">
                    {formatShortDate(quote.createdAt, locale)}
                    <RowActionHint />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <ModulePagination
          pagination={pagination}
          basePath={`/${locale}/quotes`}
          searchParams={query}
          labels={{
            previous: tCommon("pagination.previous"),
            next: tCommon("pagination.next"),
            of: tCommon("pagination.of"),
          }}
        />
      </Card>
    </div>
  );
}
