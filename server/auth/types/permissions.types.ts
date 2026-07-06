export type Role =
  "OWNER" | "ADMIN" | "SUPERVISOR" | "CASHIER" | "WAREHOUSE" | "PURCHASING";

export type Permission =
  // Products
  | "products.view"
  | "products.create"
  | "products.edit"
  | "products.delete"
  // Inventory
  | "inventory.view"
  | "inventory.adjust"
  | "inventory.transfer"
  // Sales
  | "sales.view"
  | "sales.create"
  | "sales.cancel"
  | "sales.refund"
  // Purchases
  | "purchases.view"
  | "purchases.create"
  | "purchases.receive"
  | "purchases.cancel"
  // Settings
  | "settings.view"
  | "settings.edit"
  // Users
  | "users.view"
  | "users.create"
  | "users.edit"
  | "users.delete";
