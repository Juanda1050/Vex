import { prisma } from "@/lib/prisma";
import type {
  CreateCustomerInput,
  CustomerFilters,
  UpdateCustomerInput,
} from "../types/customer.types";

export class CustomerRepository {
  async create(input: CreateCustomerInput) {
    return prisma.customer.create({
      data: {
        tenantId: input.tenantId,
        name: input.name,
        legalName: input.legalName,
        email: input.email,
        phone: input.phone,
        taxId: input.taxId,
        rfc: input.rfc,
        address: input.address,
        creditLimit: input.creditLimit ?? 0,
        notes: input.notes,
        isActive: input.isActive ?? true,
      },
    });
  }

  async findById(tenantId: string, id: string) {
    return prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        quotes: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        sales: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });
  }

  async list(tenantId: string, filters: CustomerFilters = {}) {
    return prisma.customer.findMany({
      where: {
        tenantId,
        isActive: filters.isActive,
        OR: filters.search
          ? [
              { name: { contains: filters.search, mode: "insensitive" } },
              { legalName: { contains: filters.search, mode: "insensitive" } },
              { email: { contains: filters.search, mode: "insensitive" } },
              { phone: { contains: filters.search, mode: "insensitive" } },
            ]
          : undefined,
      },
      orderBy: [{ createdAt: "desc" }],
    });
  }

  async update(input: UpdateCustomerInput) {
    return prisma.customer.update({
      where: { id: input.id },
      data: {
        name: input.name,
        legalName: input.legalName,
        email: input.email,
        phone: input.phone,
        taxId: input.taxId,
        rfc: input.rfc,
        address: input.address,
        creditLimit: input.creditLimit,
        notes: input.notes,
        isActive: input.isActive,
      },
    });
  }
}

export const customerRepository = new CustomerRepository();
