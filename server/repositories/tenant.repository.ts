import { prisma } from "@/lib/prisma";

export class TenantRepository {
  async createWithInitialSetup(data: {
    name: string;
    slug: string;
    ownerId: string;
  }) {
    return await prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        settings: { create: {} },
        branches: {
          create: {
            name: "Sucursal Matriz",
            warehouses: {
              create: { name: "Almacén Central", isDefault: true },
            },
          },
        },
        members: {
          create: {
            userId: data.ownerId,
            role: "OWNER",
          },
        },
      },
    });
  }
}
