import { inventoryRepository } from "../repository/inventory.repository";
import type {
  InventoryFilters,
  RegisterStockMovementInput,
} from "../types/inventory.types";

export class InventoryService {
  async countActiveWarehouses(tenantId: string) {
    return inventoryRepository.countActiveWarehousesByTenant(tenantId);
  }

  async listInventory(tenantId: string, filters: InventoryFilters) {
    return inventoryRepository.listInventory(tenantId, filters);
  }

  async registerStockMovement(input: RegisterStockMovementInput) {
    return inventoryRepository.registerMovement(input);
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
