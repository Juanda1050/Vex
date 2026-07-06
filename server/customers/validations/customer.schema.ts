import { z } from "zod";
import { paginationSchema } from "@/server/pagination";

export const createCustomerSchema = z.object({
  tenantId: z.string().uuid("invalidTenantId"),
  name: z.string().trim().min(2, "nameRequired"),
  legalName: z.string().trim().max(180).nullable().optional(),
  email: z.string().email("invalidEmail").nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  taxId: z.string().trim().max(60).nullable().optional(),
  rfc: z.string().trim().max(60).nullable().optional(),
  address: z.string().trim().max(240).nullable().optional(),
  creditLimit: z.coerce.number().min(0).optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const updateCustomerSchema = z.object({
  id: z.string().uuid("invalidCustomerId"),
  tenantId: z.string().uuid("invalidTenantId"),
  name: z.string().trim().min(2).optional(),
  legalName: z.string().trim().max(180).nullable().optional(),
  email: z.string().email("invalidEmail").nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  taxId: z.string().trim().max(60).nullable().optional(),
  rfc: z.string().trim().max(60).nullable().optional(),
  address: z.string().trim().max(240).nullable().optional(),
  creditLimit: z.coerce.number().min(0).optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const customerFiltersSchema = paginationSchema.extend({
  search: z.string().trim().max(120).optional(),
  isActive: z.coerce.boolean().optional(),
});

export type CreateCustomerSchema = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerSchema = z.infer<typeof updateCustomerSchema>;
export type CustomerFiltersSchema = z.infer<typeof customerFiltersSchema>;
