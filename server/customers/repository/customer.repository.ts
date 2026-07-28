import { prisma } from "@/lib/prisma";
import { createPaginationMeta } from "@/server/pagination";
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

  async list(tenantId: string, filters: CustomerFilters) {
    const where = {
      tenantId,
      isActive: filters.isActive,
      OR: filters.search
        ? [
            {
              name: { contains: filters.search, mode: "insensitive" as const },
            },
            {
              legalName: {
                contains: filters.search,
                mode: "insensitive" as const,
              },
            },
            {
              email: { contains: filters.search, mode: "insensitive" as const },
            },
            {
              phone: { contains: filters.search, mode: "insensitive" as const },
            },
          ]
        : undefined,
    };

    const skip = (filters.page - 1) * filters.pageSize;
    const dir = filters.dir ?? "desc";
    const orderBy =
      filters.sort === "name"
        ? [{ name: dir }]
        : filters.sort === "creditLimit"
          ? [{ creditLimit: dir }]
          : [{ createdAt: "desc" as const }];

    const [total, items] = await prisma.$transaction([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        orderBy,
        skip,
        take: filters.pageSize,
      }),
    ]);

    return {
      items,
      pagination: createPaginationMeta(filters.page, filters.pageSize, total),
    };
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

  async softDelete(tenantId: string, id: string) {
    return prisma.customer.updateMany({
      where: { id, tenantId },
      data: { isActive: false },
    });
  }
}

export const customerRepository = new CustomerRepository();
