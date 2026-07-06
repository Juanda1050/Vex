import { authService } from "../service/auth.service";
import type { Permission, Role } from "../types";

export const permissionChecker = {
  can(role: string, permission: Permission): boolean {
    return authService.hasPermission(role, permission);
  },

  canAll(role: string, permissions: Permission[]): boolean {
    return permissions.every((p) => authService.hasPermission(role, p));
  },

  canAny(role: string, permissions: Permission[]): boolean {
    return permissions.some((p) => authService.hasPermission(role, p));
  },

  isAtLeast(userRole: string, requiredRole: Role): boolean {
    return authService.hasRole(userRole, requiredRole);
  },

  getAll(role: string): Permission[] {
    return authService.getPermissions(role);
  },
};
