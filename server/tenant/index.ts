export { TenantRepository } from "./repository/tenant.repository";
export { TenantService, tenantService } from "./service/tenant.service";
export { requireTenantAdmin } from "./guards/require-tenant-admin";

export {
  registerTenantSchema,
  updateTenantBrandingSchema,
  setRolePermissionSchema,
} from "./validations/tenant.schema";

export {
  DEFAULT_MAIN_BRANCH_NAME,
  DEFAULT_MAIN_WAREHOUSE_NAME,
  TENANT_BRAND_DEFAULTS,
} from "./constants/tenant.constants";

export type {
  RegisterTenantInput,
  UpdateTenantBrandingInput,
  SetRolePermissionInput,
} from "./types/tenant.types";
