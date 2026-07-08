import { getTranslations } from "next-intl/server";

import { PreferencesPanel } from "@/components/settings/preferences-panel";
import { SettingsPlanComparison } from "@/components/subscriptions/settings-plan-comparison";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startServerTimer } from "@/lib/perf";
import { requirePermission } from "@/server/auth";
import { authRepository } from "@/server/auth/repository/auth.repository";
import { authService } from "@/server/auth/service/auth.service";
import { inventoryService } from "@/server/inventory";
import { productService } from "@/server/products";
import { subscriptionService } from "@/server/subscriptions";
import { userService } from "@/server/users";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const perf = startServerTimer("page.settings");

  const { locale } = await params;
  const t = await getTranslations("settings");
  const ctx = await requirePermission("settings.view");

  // With low DB pool limits (e.g. connection_limit=1), firing many Prisma
  // queries in parallel can exhaust the pool and trigger timeouts.
  const subscription = await subscriptionService.getTenantSubscription(
    ctx.tenantId,
  );
  const plans = await subscriptionService.listOfferedPlans();
  const roleOverrides = await authRepository.listRolePermissions(
    ctx.tenantId,
    ctx.role,
  );
  const productCount = await productService.countActiveProducts(ctx.tenantId);
  const warehouseCount = await inventoryService.countActiveWarehouses(
    ctx.tenantId,
  );
  const userCount = await userService.countActiveUsers(ctx.tenantId);

  const canManageBilling = authService.hasPermissionWithOverrides(
    ctx.role,
    "billing.manage",
    roleOverrides,
  );

  const page = (
    <div className="space-y-5">
      <PreferencesPanel locale={locale} />

      <Card className="border-primary/25 bg-linear-to-br from-card via-card to-primary/10">
        <CardHeader>
          <Badge variant="info" className="w-fit">
            {t("subscriptions.badge")}
          </Badge>
          <CardTitle>{t("subscriptions.title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {t("subscriptions.description")}
        </CardContent>
      </Card>

      <SettingsPlanComparison
        plans={plans}
        currentPlanCode={subscription?.plan.code ?? null}
        canManageBilling={canManageBilling}
        usage={{
          products: productCount,
          warehouses: warehouseCount,
          users: userCount,
        }}
      />
    </div>
  );

  perf.end({ locale, tenantId: ctx.tenantId });
  return page;
}
