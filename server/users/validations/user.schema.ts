import { z } from "zod";
import { UserRole } from "@prisma/client";

export const userFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).max(120).optional(),
  isActive: z
    .union([z.literal("true"), z.literal("false")])
    .transform((value) => value === "true")
    .optional(),
});

export const createTenantUserSchema = z.object({
  tenantId: z.string().uuid(),
  userId: z.string().uuid("invalidUserId"),
  role: z.nativeEnum(UserRole),
  branchId: z.string().uuid("invalidBranchId").nullable().optional(),
});
