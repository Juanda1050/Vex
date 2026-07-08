import { revalidateTag } from "next/cache";

function invalidateTag(tag: string) {
  revalidateTag(tag, "max");
}

export function invalidateDashboardOverviewCache(tenantId: string) {
  invalidateTag(`dashboard-overview:${tenantId}`);
}

export function invalidateProductCountCache(tenantId: string) {
  invalidateTag(`products-active-count:${tenantId}`);
}

export function invalidateWarehouseCountCache(tenantId: string) {
  invalidateTag(`warehouses-active-count:${tenantId}`);
}

export function invalidateUserCountCache(tenantId: string) {
  invalidateTag(`users-active-count:${tenantId}`);
}

export function invalidateTenantOperationalCaches(tenantId: string) {
  invalidateDashboardOverviewCache(tenantId);
  invalidateProductCountCache(tenantId);
  invalidateWarehouseCountCache(tenantId);
  invalidateUserCountCache(tenantId);
}
