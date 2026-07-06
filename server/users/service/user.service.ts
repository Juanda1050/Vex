import { userRepository } from "../repository/user.repository";
import type { CreateTenantUserInput, UserFilters } from "../types/user.types";

export class UserService {
  async countActiveUsers(tenantId: string) {
    return userRepository.countActiveUsersByTenant(tenantId);
  }

  async listUsers(tenantId: string, filters: UserFilters) {
    return userRepository.listUsers(tenantId, filters);
  }

  async createTenantUser(input: CreateTenantUserInput) {
    return userRepository.createTenantUser(input);
  }
}

export const userService = new UserService();
