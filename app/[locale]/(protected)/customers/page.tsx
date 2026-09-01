import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/layout/pageHeader";
import { getModuleIcon } from "@/lib/modules/moduleIcons";
import { ModulePagination } from "@/components/modules/modulePagination";
import { ModuleEmptyState } from "@/components/modules/moduleEmptyState";
import { RowActionHint } from "@/components/modules/rowActionHint";
import { ModuleToolbar } from "@/components/modules/moduleToolbar";
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
import { formatCurrency } from "@/lib/dashboard/dashboardFormatters";
import {
  resolveSortDirection,
  resolveSortKey,
} from "@/lib/modules/sortParams";
import { requirePermission } from "@/server/auth";
import { customerService } from "@/server/customers/service/customer.service";

export default async function CustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const ctx = await requirePermission("customers.view");

  const [t, tCommon] = await Promise.all([
    getTranslations("customers"),
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
  const sort = resolveSortKey(query.sort, ["name", "creditLimit"] as const);
  const dir = resolveSortDirection(query.dir);

  const { items, pagination } = await customerService.listCustomers(
    ctx.tenantId,
    { page, pageSize: 20, search, isActive, sort, dir },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        icon={getModuleIcon("customers")}
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
              <TableHead>{t("fields.email")}</TableHead>
              <TableHead>{t("fields.phone")}</TableHead>
              <TableHead>{t("fields.taxId")}</TableHead>
              <SortableTableHead
                sortKey="creditLimit"
                currentSort={sort}
                currentDir={dir}
                align="right"
              >
                {t("fields.creditLimit")}
              </SortableTableHead>
              <TableHead>{t("fields.status")}</TableHead>
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
              items.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium text-foreground">
                    {customer.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {customer.email ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {customer.phone ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {customer.taxId ?? customer.rfc ?? "-"}
                  </TableCell>
                  <TableCell className="text-right text-foreground">
                    {formatCurrency(Number(customer.creditLimit ?? 0), locale)}
                  </TableCell>
                  <TableCell className="relative pr-6">
                    <Badge
                      variant={customer.isActive ? "success" : "secondary"}
                    >
                      {customer.isActive
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
          basePath={`/${locale}/customers`}
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
