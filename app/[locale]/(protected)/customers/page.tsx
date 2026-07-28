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
    query.status === "active" ? true : query.status === "inactive" ? false : undefined;

  const { items, pagination } = await customerService.listCustomers(
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
              <TableHead>{t("fields.email")}</TableHead>
              <TableHead>{t("fields.phone")}</TableHead>
              <TableHead>{t("fields.taxId")}</TableHead>
              <TableHead className="text-right">
                {t("fields.creditLimit")}
              </TableHead>
              <TableHead>{t("fields.status")}</TableHead>
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
                  <TableCell>
                    <Badge variant={customer.isActive ? "success" : "secondary"}>
                      {customer.isActive
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
        basePath={`/${locale}/customers`}
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
