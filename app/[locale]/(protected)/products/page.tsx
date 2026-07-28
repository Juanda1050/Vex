import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
import { getModuleIcon } from "@/lib/modules/module-icons";
import { ModulePagination } from "@/components/modules/module-pagination";
import { ModuleEmptyState } from "@/components/modules/module-empty-state";
import { RowActionHint } from "@/components/modules/row-action-hint";
import { ModuleToolbar } from "@/components/modules/module-toolbar";
import { SortableTableHead } from "@/components/modules/sortable-table-head";
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
import { formatCurrency } from "@/lib/dashboard/dashboard-formatters";
import {
  resolveSortDirection,
  resolveSortKey,
} from "@/lib/modules/sort-params";
import { requirePermission } from "@/server/auth";
import { productService } from "@/server/products/service/product.service";

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const ctx = await requirePermission("products.view");

  const [t, tCommon] = await Promise.all([
    getTranslations("products"),
    getTranslations("common"),
  ]);

  const page = Math.max(1, Number(query.page) || 1);
  const search = query.search?.trim() || undefined;
  const isActive =
    query.status === "active"
      ? true
      : query.status === "inactive"
        ? false
        : undefined;
  const hasFilters = Boolean(search) || Boolean(query.status);
  const sort = resolveSortKey(query.sort, [
    "name",
    "basePrice",
    "baseCost",
  ] as const);
  const dir = resolveSortDirection(query.dir);

  const { items, pagination } = await productService.listProducts(
    ctx.tenantId,
    { page, pageSize: 20, search, isActive, sort, dir },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        icon={getModuleIcon("products")}
      />

      <Card className="space-y-5 rounded-[1.75rem] surface-1 p-5  sm:p-6">
        <ModuleToolbar
          searchPlaceholder={t("searchPlaceholder")}
          statusParamName="status"
          statusLabel={t("fields.status")}
          statusOptions={[
            { value: "", label: tCommon("all") },
            { value: "active", label: tCommon("status.active") },
            { value: "inactive", label: tCommon("status.inactive") },
          ]}
        />

        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead
                sortKey="name"
                currentSort={sort}
                currentDir={dir}
              >
                {t("fields.name")}
              </SortableTableHead>
              <TableHead>{t("fields.sku")}</TableHead>
              <SortableTableHead
                sortKey="basePrice"
                currentSort={sort}
                currentDir={dir}
                align="right"
              >
                {t("fields.price")}
              </SortableTableHead>
              <SortableTableHead
                sortKey="baseCost"
                currentSort={sort}
                currentDir={dir}
                align="right"
              >
                {t("fields.cost")}
              </SortableTableHead>
              <TableHead>{t("fields.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <ModuleEmptyState
                    hasFilters={hasFilters}
                    emptyText={t("emptyNoData")}
                    noResultsText={t("empty")}
                  />
                </TableCell>
              </TableRow>
            ) : (
              items.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium text-foreground">
                    {product.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.sku ?? product.internalCode}
                  </TableCell>
                  <TableCell className="text-right text-foreground">
                    {formatCurrency(Number(product.basePrice ?? 0), locale)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(Number(product.baseCost ?? 0), locale)}
                  </TableCell>
                  <TableCell className="relative pr-6">
                    <Badge variant={product.isActive ? "success" : "secondary"}>
                      {product.isActive
                        ? tCommon("status.active")
                        : tCommon("status.inactive")}
                    </Badge>
                    <RowActionHint />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <ModulePagination
          pagination={pagination}
          basePath={`/${locale}/products`}
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
