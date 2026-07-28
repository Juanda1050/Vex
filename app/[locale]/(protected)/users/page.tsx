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
import { requirePermission } from "@/server/auth";
import { userService } from "@/server/users/service/user.service";

export default async function UsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const ctx = await requirePermission("users.view");

  const [t, tCommon, tSettings] = await Promise.all([
    getTranslations("users"),
    getTranslations("common"),
    getTranslations("settings"),
  ]);

  const page = Math.max(1, Number(query.page) || 1);
  const search = query.search?.trim() || undefined;
  const isActive =
    query.status === "active" ? true : query.status === "inactive" ? false : undefined;

  const { items, pagination } = await userService.listUsers(ctx.tenantId, {
    page,
    pageSize: 20,
    search,
    isActive,
  });

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      <Card className="space-y-5 rounded-[1.75rem] border-border/70 bg-card/72 p-5 shadow-none backdrop-blur-sm sm:p-6">
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
              <TableHead>{t("fields.role")}</TableHead>
              <TableHead>{t("fields.branch")}</TableHead>
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
              items.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium text-foreground">
                    {member.userProfile?.fullName?.trim() ||
                      member.userProfile?.email ||
                      "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.userProfile?.email ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {tSettings(`roles.${member.role}`)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.branch?.name ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.isActive ? "success" : "secondary"}>
                      {member.isActive
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
          basePath={`/${locale}/users`}
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
