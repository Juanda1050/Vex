export {
  InventoryService,
  inventoryService,
} from "./service/inventory.service";
export {
  InventoryRepository,
  inventoryRepository,
} from "./repository/inventory.repository";
export {
  registerStockMovementSchema,
  inventoryFiltersSchema,
} from "./validations/inventory.schema";
export type {
  InventoryFilters,
  RegisterStockMovementInput,
} from "./types/inventory.types";
