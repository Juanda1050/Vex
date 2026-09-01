import { requireRole } from "@/server/auth/guards/requireRole";

export async function requireTenantAdmin() {
  return requireRole("ADMIN");
}
