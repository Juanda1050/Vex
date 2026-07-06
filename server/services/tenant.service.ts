import { TenantRepository } from "../repositories/tenant.repository";

export class TenantService {
  private repo = new TenantRepository();

  async registerNewCompany(companyName: string, userId: string) {
    const slug = companyName.toLowerCase().trim().replace(/\s+/g, "-");

    // Aquí podrías validar si el slug ya existe antes de intentar crear
    // O aplicar límites de creación por usuario

    return await this.repo.createWithInitialSetup({
      name: companyName,
      slug,
      ownerId: userId,
    });
  }
}
