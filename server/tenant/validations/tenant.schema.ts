import { z } from "zod";

const roleEnum = z.enum([
  "READ_ONLY",
  "SELLER",
  "OWNER",
  "ADMIN",
  "WAREHOUSE",
  "PURCHASING",
]);

export const registerTenantSchema = z.object({
  companyName: z.string().trim().min(2, "companyNameRequired"),
  ownerId: z.string().uuid("invalidOwnerId"),
});

export const updateTenantBrandingSchema = z.object({
  tenantId: z.string().uuid("invalidTenantId"),
  logoUrl: z.string().url("invalidLogoUrl").nullable().optional(),
  brandPrimary: z.string().trim().max(20).nullable().optional(),
  brandSecondary: z.string().trim().max(20).nullable().optional(),
  address: z.string().trim().max(240).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
});

export const setRolePermissionSchema = z.object({
  tenantId: z.string().uuid("invalidTenantId"),
  role: roleEnum,
  permission: z.string().trim().min(3, "invalidPermission"),
  isAllowed: z.boolean(),
});
