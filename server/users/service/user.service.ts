import { userRepository } from "../repository/user.repository";
import { unstable_cache } from "next/cache";
import { invalidateTenantOperationalCaches } from "@/server/cache/tenant-cache-invalidation";
import type { CreateTenantUserInput, UserFilters } from "../types/user.types";

export class UserService {
  async countActiveUsers(tenantId: string) {
    return unstable_cache(
      () => userRepository.countActiveUsersByTenant(tenantId),
      ["users-active-count", tenantId],
      {
        revalidate: 30,
        tags: [`users-active-count:${tenantId}`],
      },
    )();
  }

  async listUsers(tenantId: string, filters: UserFilters) {
    return userRepository.listUsers(tenantId, filters);
  }

  async createTenantUser(input: CreateTenantUserInput) {
    const user = await userRepository.createTenantUser(input);
    invalidateTenantOperationalCaches(input.tenantId);
    return user;
  }
}

export const userService = new UserService();
