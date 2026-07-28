import { Prisma, SaleStatus } from "@prisma/client";
import { getTranslations } from "next-intl/server";

import { ModulePagination } from "@/components/modules/module-pagination";
import { ModuleToolbar } from "@/components/modules/module-toolbar";
import { Badge } from "@/components/ui/badge";
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
} from "@/lib/dashboard/dashboard-formatters";
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
      orderBy: [{ saleDate: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const pagination = createPaginationMeta(page, pageSize, total);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {t("description")}
        </p>
      </header>

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
        <TableHeader>
          <TableRow>
            <TableHead>{t("fields.number")}</TableHead>
            <TableHead>{t("fields.date")}</TableHead>
            <TableHead>{t("fields.customer")}</TableHead>
            <TableHead>{t("fields.branch")}</TableHead>
            <TableHead>{t("fields.status")}</TableHead>
            <TableHead>{t("fields.items")}</TableHead>
            <TableHead className="text-right">{t("fields.total")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                {t("empty")}
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
                <TableCell className="text-right text-foreground">
                  {formatCurrency(Number(sale.total ?? 0), locale)}
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
    </div>
  );
}
