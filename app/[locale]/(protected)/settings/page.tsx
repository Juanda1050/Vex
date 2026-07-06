import { getTranslations } from "next-intl/server";

import { SettingsPlanComparison } from "@/components/subscriptions/settings-plan-comparison";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/server/auth";
import { authRepository } from "@/server/auth/repository/auth.repository";
import { authService } from "@/server/auth/service/auth.service";
import { inventoryService } from "@/server/inventory";
import { productService } from "@/server/products";
import { subscriptionService } from "@/server/subscriptions";
import { userService } from "@/server/users";

export default async function SettingsPage() {
  const t = await getTranslations("settings");
  const ctx = await requirePermission("settings.view");

  const [
    subscription,
    plans,
    roleOverrides,
    productCount,
    warehouseCount,
    userCount,
  ] = await Promise.all([
    subscriptionService.getTenantSubscription(ctx.tenantId),
    subscriptionService.listOfferedPlans(),
    authRepository.listRolePermissions(ctx.tenantId, ctx.role),
    productService.countActiveProducts(ctx.tenantId),
    inventoryService.countActiveWarehouses(ctx.tenantId),
    userService.countActiveUsers(ctx.tenantId),
  ]);

  const canManageBilling = authService.hasPermissionWithOverrides(
    ctx.role,
    "billing.manage",
    roleOverrides,
  );

  return (
    <div className="space-y-5">
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
}
