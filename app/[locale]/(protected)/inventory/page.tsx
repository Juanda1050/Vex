import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/layout/pageHeader";
import { getModuleIcon } from "@/lib/modules/moduleIcons";
import { ModuleEmptyState } from "@/components/modules/moduleEmptyState";
import { ModulePagination } from "@/components/modules/modulePagination";
import { RowActionHint } from "@/components/modules/rowActionHint";
import { SortableTableHead } from "@/components/modules/sortableTableHead";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
  resolveSortDirection,
  resolveSortKey,
} from "@/lib/modules/sortParams";
import { cn } from "@/lib/utils";
import { requirePermission } from "@/server/auth";
import { inventoryService } from "@/server/inventory/service/inventory.service";

export default async function InventoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const ctx = await requirePermission("inventory.view");

  const [t, tCommon] = await Promise.all([
    getTranslations("inventory"),
    getTranslations("common"),
  ]);

  const page = Math.max(1, Number(query.page) || 1);
  const lowStockOnly = query.lowStockOnly === "true";
  const sort = resolveSortKey(query.sort, ["quantityOnHand"] as const);
  const dir = resolveSortDirection(query.dir);

  const { items, pagination } = await inventoryService.listInventory(
    ctx.tenantId,
    { page, pageSize: 20, lowStockOnly, sort, dir },
  );

  const toggleHref = lowStockOnly
    ? `/${locale}/inventory`
    : `/${locale}/inventory?lowStockOnly=true`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        icon={getModuleIcon("inventory")}
        actions={
          <Link
            href={toggleHref}
            className={cn(
              buttonVariants({
                variant: lowStockOnly ? "default" : "outline",
                size: "sm",
              }),
            )}
          >
            {t("lowStockOnly")}
          </Link>
        }
      />

      <Card className="space-y-5 rounded-[1.75rem] surface-1 p-5  sm:p-6">
        <Table>
          <TableHeader className="sticky top-20 z-10 bg-card">
            <TableRow>
              <TableHead>{t("fields.product")}</TableHead>
              <TableHead>{t("fields.warehouse")}</TableHead>
              <SortableTableHead
                sortKey="quantityOnHand"
                currentSort={sort}
                currentDir={dir}
                align="right"
              >
                {t("fields.quantityOnHand")}
              </SortableTableHead>
              <TableHead className="text-right">
                {t("fields.minStock")}
              </TableHead>
              <TableHead className="text-right">
                {t("fields.maxStock")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <ModuleEmptyState
                    hasFilters={lowStockOnly}
                    emptyText={t("emptyNoData")}
                    noResultsText={t("empty")}
                  />
                </TableCell>
              </TableRow>
            ) : (
              items.map((position) => {
                const quantityOnHand = Number(position.quantityOnHand ?? 0);
                const minStock = Number(position.minStock ?? 0);
                const isLowStock = quantityOnHand <= minStock;

                return (
                  <TableRow key={position.id}>
                    <TableCell className="font-medium text-foreground">
                      {position.product?.name ?? position.variant?.name ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {position.warehouse?.name ?? "-"}
                    </TableCell>
                    <TableCell className="text-right text-foreground">
                      <span className="inline-flex items-center gap-2">
                        {quantityOnHand}
                        {isLowStock ? (
                          <Badge variant="destructive">
                            {t("lowStockBadge")}
                          </Badge>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {minStock}
                    </TableCell>
                    <TableCell className="relative pr-6 text-right text-muted-foreground">
                      {Number(position.maxStock ?? 0)}
                      <RowActionHint />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <ModulePagination
          pagination={pagination}
          basePath={`/${locale}/inventory`}
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
