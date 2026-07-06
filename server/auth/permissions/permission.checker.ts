import { authService } from "../service/auth.service";
import type { Permission, Role } from "../types";

export const permissionChecker = {
  can(role: Role, permission: Permission): boolean {
    return authService.hasPermission(role, permission);
  },

  canAll(role: Role, permissions: Permission[]): boolean {
    return permissions.every((p) => authService.hasPermission(role, p));
  },

  canAny(role: Role, permissions: Permission[]): boolean {
    return permissions.some((p) => authService.hasPermission(role, p));
  },

  isAtLeast(userRole: Role, requiredRole: Role): boolean {
    return authService.hasRole(userRole, requiredRole);
  },

  getAll(role: Role): Permission[] {
    return authService.getPermissions(role);
  },
};
