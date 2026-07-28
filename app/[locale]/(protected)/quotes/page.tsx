import { QuoteStatus } from "@prisma/client";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
import { ModulePagination } from "@/components/modules/module-pagination";
import { ModuleToolbar } from "@/components/modules/module-toolbar";
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
} from "@/lib/dashboard/dashboard-formatters";
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

  const { items, pagination } = await quoteService.listQuotes(ctx.tenantId, {
    page,
    pageSize: 20,
    search,
    status,
  });

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      <Card className="space-y-5 rounded-[1.75rem] border-border/70 bg-card/72 p-5 shadow-none backdrop-blur-sm sm:p-6">
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
              <TableHead className="text-right">{t("fields.total")}</TableHead>
              <TableHead>{t("fields.validUntil")}</TableHead>
              <TableHead>{t("fields.createdAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {t("empty")}
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
                  <TableCell className="text-muted-foreground">
                    {formatShortDate(quote.createdAt, locale)}
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
