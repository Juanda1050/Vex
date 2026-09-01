import { Prisma, SaleStatus } from "@prisma/client";
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
  getSaleStatusVariant,
} from "@/lib/dashboard/dashboardFormatters";
import {
  resolveSortDirection,
  resolveSortKey,
} from "@/lib/modules/sortParams";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/server/auth";
import { createPaginationMeta } from "@/server/pagination";

export default async function SalesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const ctx = await requirePermission("sales.view");

  const [t, tCommon, tDashboard] = await Promise.all([
    getTranslations("sales"),
    getTranslations("common"),
    getTranslations("dashboard"),
  ]);

  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = 20;
  const search = query.search?.trim() || undefined;
  const status =
    query.status && query.status in SaleStatus
      ? (query.status as SaleStatus)
      : undefined;
  const hasFilters = Boolean(search) || Boolean(query.status);
  const sort = resolveSortKey(query.sort, ["saleDate", "total"] as const);
  const dir = resolveSortDirection(query.dir);

  const where: Prisma.SaleWhereInput = {
    tenantId: ctx.tenantId,
    status,
    OR: search
      ? [
          { number: { contains: search, mode: "insensitive" } },
          { notes: { contains: search, mode: "insensitive" } },
          { customer: { name: { contains: search, mode: "insensitive" } } },
        ]
      : undefined,
  };

  const [total, items] = await prisma.$transaction([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: [sort === "total" ? { total: dir } : { saleDate: dir }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const pagination = createPaginationMeta(page, pageSize, total);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        icon={getModuleIcon("sales")}
      />

      <Card className="space-y-5 rounded-[1.75rem] surface-1 p-5  sm:p-6">
        <ModuleToolbar
          searchPlaceholder={t("searchPlaceholder")}
          statusParamName="status"
          statusLabel={t("fields.status")}
          statusOptions={[
            { value: "", label: t("filters.allStatuses") },
            ...Object.values(SaleStatus).map((value) => ({
              value,
              label: tDashboard(`saleStatus.${value.toLowerCase()}`),
            })),
          ]}
        />

        <Table>
          <TableHeader className="sticky top-20 z-10 bg-card">
            <TableRow>
              <TableHead>{t("fields.number")}</TableHead>
              <SortableTableHead
                sortKey="saleDate"
                currentSort={sort}
                currentDir={dir}
              >
                {t("fields.date")}
              </SortableTableHead>
              <TableHead>{t("fields.customer")}</TableHead>
              <TableHead>{t("fields.branch")}</TableHead>
              <TableHead>{t("fields.status")}</TableHead>
              <TableHead>{t("fields.items")}</TableHead>
              <SortableTableHead
                sortKey="total"
                currentSort={sort}
                currentDir={dir}
                align="right"
              >
                {t("fields.total")}
              </SortableTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <ModuleEmptyState
                    hasFilters={hasFilters}
                    emptyText={t("emptyNoData")}
                    noResultsText={t("empty")}
                  />
                </TableCell>
              </TableRow>
            ) : (
              items.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium text-foreground">
                    #{sale.number}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatShortDate(sale.saleDate, locale)}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {sale.customer?.name ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {sale.branch?.name ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getSaleStatusVariant(sale.status)}>
                      {tDashboard(`saleStatus.${sale.status.toLowerCase()}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {sale._count.items}
                  </TableCell>
                  <TableCell className="relative pr-6 text-right text-foreground">
                    {formatCurrency(Number(sale.total ?? 0), locale)}
                    <RowActionHint />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <ModulePagination
          pagination={pagination}
          basePath={`/${locale}/sales`}
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
