import { revalidateTag, unstable_cache } from "next/cache";
import { authRepository } from "../repository/auth.repository";
import { authService } from "../service/auth.service";

const AUTH_STATE_TAG_PREFIX = "auth-state";

function getAuthStateTag(userId: string) {
  return `${AUTH_STATE_TAG_PREFIX}:${userId}`;
}

export type CachedAuthState = {
  onboardingCompleted: boolean;
  member: Awaited<ReturnType<typeof authRepository.findMemberByUserId>>;
  branchId: string | null;
  warehouseId: string | null;
  hasBillingAccess: boolean;
};

export async function getCachedAuthState(
  userId: string,
): Promise<CachedAuthState> {
  return unstable_cache(
    async () => {
      const userProfile = await authRepository.getOrCreateUserProfile(userId);
      const member = await authRepository.findMemberByUserId(userId);

      if (!member) {
        return {
          onboardingCompleted: userProfile.onboardingCompleted,
          member: null,
          branchId: null,
          warehouseId: null,
          hasBillingAccess: false,
        };
      }

      const branchId = authService.resolveBranchId(member);
      const warehouseId = authService.resolveWarehouseId(member);
      const overrides = await authRepository.listRolePermissions(
        member.tenantId,
        member.role,
      );

      const hasBillingAccess = authService.hasPermissionWithOverrides(
        member.role,
        "billing.manage",
        overrides,
      );

      return {
        onboardingCompleted: userProfile.onboardingCompleted,
        member,
        branchId,
        warehouseId,
        hasBillingAccess,
      };
    },
    ["auth-state", userId],
    {
      revalidate: 30,
      tags: [getAuthStateTag(userId)],
    },
  )();
}

export function invalidateAuthStateCache(userId: string) {
  revalidateTag(getAuthStateTag(userId), "max");
}
