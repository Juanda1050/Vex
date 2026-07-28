import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { ModulePagination } from "@/components/modules/module-pagination";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  const { items, pagination } = await inventoryService.listInventory(
    ctx.tenantId,
    { page, pageSize: 20, lowStockOnly },
  );

  const toggleHref = lowStockOnly
    ? `/${locale}/inventory`
    : `/${locale}/inventory?lowStockOnly=true`;

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

      <div className="flex justify-end">
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
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("fields.product")}</TableHead>
            <TableHead>{t("fields.warehouse")}</TableHead>
            <TableHead className="text-right">
              {t("fields.quantityOnHand")}
            </TableHead>
            <TableHead className="text-right">{t("fields.minStock")}</TableHead>
            <TableHead className="text-right">{t("fields.maxStock")}</TableHead>
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
                  <TableCell className="text-right text-muted-foreground">
                    {Number(position.maxStock ?? 0)}
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
    </div>
  );
}
