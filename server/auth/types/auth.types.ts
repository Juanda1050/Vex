import type { Permission, Role } from "./permissions.types";
import type { PlanTier, SubscriptionStatus } from "@prisma/client";

export interface TenantContext {
  userId: string;
  email: string;
  tenantId: string;
  branchId: string;
  warehouseId: string;
  role: Role;
  tenantName: string;
  subscriptionPlanCode: string;
  subscriptionPlanTier: PlanTier;
  subscriptionStatus: SubscriptionStatus;
  isPremium: boolean;
}

export interface AuthContext extends TenantContext {
  permissions: Permission[];
  locale: string;
}

export interface AuthUser {
  id: string;
  email: string;
}
