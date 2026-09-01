import { startServerTimer } from "@/lib/perf";
import { SettingsDashboard } from "@/components/settings/settingsDashboard";
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
  const ctx = await requirePermission("settings.view");

  const [
    subscription,
    plans,
    member,
    memberPage,
    productCount,
    warehouseCount,
    userCount,
  ] = await Promise.all([
    subscriptionService.getTenantSubscription(ctx.tenantId),
    subscriptionService.listOfferedPlans(),
    authRepository.findMemberByUserId(ctx.userId),
    userService.listUsers(ctx.tenantId, {
      page: 1,
      pageSize: 100,
    }),
    productService.countActiveProducts(ctx.tenantId),
    inventoryService.countActiveWarehouses(ctx.tenantId),
    userService.countActiveUsers(ctx.tenantId),
  ]);

  if (!member) {
    perf.end({ locale, tenantId: ctx.tenantId });
    return null;
  }

  const roleOverrides = await authRepository.listRolePermissions(
    ctx.tenantId,
    ctx.role,
  );

  const canManageBilling = authService.hasPermissionWithOverrides(
    ctx.role,
    "billing.manage",
    roleOverrides,
  );

  const page = (
    <SettingsDashboard
      locale={locale}
      tenant={{
        id: member.tenant.id,
        name: member.tenant.name,
        legalName: member.tenant.legalName ?? null,
        industry: member.tenant.industry ?? null,
        countryCode: member.tenant.countryCode ?? null,
        logoUrl: member.tenant.logoUrl ?? null,
        address: member.tenant.address ?? null,
        phone: member.tenant.phone ?? null,
      }}
      currentUser={{
        email: member.userProfile?.email ?? ctx.email,
        fullName: member.userProfile?.fullName ?? ctx.fullName ?? null,
        avatarUrl: member.userProfile?.avatarUrl ?? ctx.avatarUrl ?? null,
        authProvider:
          ctx.authProvider ?? member.userProfile?.authProvider ?? null,
      }}
      members={memberPage.items}
      plans={plans}
      currentPlanCode={subscription?.plan.code ?? null}
      canManageBilling={canManageBilling}
      canManageCompanySections={ctx.role === "OWNER" || ctx.role === "ADMIN"}
      subscriptionUsage={{
        products: productCount,
        warehouses: warehouseCount,
        users: userCount,
      }}
    />
  );

  perf.end({ locale, tenantId: ctx.tenantId });
  return page;
}
