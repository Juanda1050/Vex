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
import { formatCurrency } from "@/lib/dashboard/dashboard-formatters";
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
    query.status === "active" ? true : query.status === "inactive" ? false : undefined;

  const { items, pagination } = await productService.listProducts(
    ctx.tenantId,
    { page, pageSize: 20, search, isActive },
  );

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
          { value: "", label: tCommon("all") },
          { value: "active", label: tCommon("status.active") },
          { value: "inactive", label: tCommon("status.inactive") },
        ]}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("fields.name")}</TableHead>
            <TableHead>{t("fields.sku")}</TableHead>
            <TableHead className="text-right">{t("fields.price")}</TableHead>
            <TableHead className="text-right">{t("fields.cost")}</TableHead>
            <TableHead>{t("fields.status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                {t("empty")}
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
                <TableCell>
                  <Badge variant={product.isActive ? "success" : "secondary"}>
                    {product.isActive
                      ? tCommon("status.active")
                      : tCommon("status.inactive")}
                  </Badge>
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
    </div>
  );
}
