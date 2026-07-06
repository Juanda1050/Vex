import type { UserRole } from "@prisma/client";
import { TenantRepository } from "../repository/tenant.repository";
import type { UpdateTenantBrandingInput } from "../types/tenant.types";

export class TenantService {
  private repo = new TenantRepository();

  async registerNewCompany(companyName: string, userId: string) {
    const baseSlug = companyName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    let slug = baseSlug;
    let attempt = 1;

    while (await this.repo.findBySlug(slug)) {
      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
    }

    return this.repo.createWithInitialSetup({
      name: companyName,
      slug,
      ownerId: userId,
    });
  }

  async updateTenantBranding(input: UpdateTenantBrandingInput) {
    return this.repo.updateBranding(input);
  }

  async setRolePermission(data: {
    tenantId: string;
    role: UserRole;
    permission: string;
    isAllowed: boolean;
  }) {
    return this.repo.upsertRolePermission(data);
  }

  async listRolePermissions(tenantId: string) {
    return this.repo.listRolePermissions(tenantId);
  }
}

export const tenantService = new TenantService();
