import { inventoryRepository } from "../repository/inventory.repository";
import { unstable_cache } from "next/cache";
import { invalidateTenantOperationalCaches } from "@/server/cache/tenant-cache-invalidation";
import type {
  InventoryFilters,
  RegisterStockMovementInput,
} from "../types/inventory.types";

export class InventoryService {
  async countActiveWarehouses(tenantId: string) {
    return unstable_cache(
      () => inventoryRepository.countActiveWarehousesByTenant(tenantId),
      ["warehouses-active-count", tenantId],
      {
        revalidate: 30,
        tags: [`warehouses-active-count:${tenantId}`],
      },
    )();
  }

  async listInventory(tenantId: string, filters: InventoryFilters) {
    return inventoryRepository.listInventory(tenantId, filters);
  }

  async registerStockMovement(input: RegisterStockMovementInput) {
    const movement = await inventoryRepository.registerMovement(input);
    invalidateTenantOperationalCaches(input.tenantId);
    return movement;
  }

  async getKardex(data: {
    tenantId: string;
    warehouseId?: string;
    productId?: string;
    variantId?: string;
  }) {
    return inventoryRepository.kardexByProduct(data);
  }
}

export const inventoryService = new InventoryService();
