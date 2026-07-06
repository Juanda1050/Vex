import { requireRole } from "@/server/auth/guards/require-role";

export async function requireTenantAdmin() {
  return requireRole("ADMIN");
}
