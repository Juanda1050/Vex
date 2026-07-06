export type Role =
  "READ_ONLY" | "SELLER" | "OWNER" | "ADMIN" | "WAREHOUSE" | "PURCHASING";

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
  // Customers
  | "customers.view"
  | "customers.create"
  | "customers.edit"
  | "customers.delete"
  // Quotes
  | "quotes.view"
  | "quotes.create"
  | "quotes.edit"
  | "quotes.send"
  | "quotes.accept"
  | "quotes.reject"
  | "quotes.convert"
  // Billing
  | "billing.manage"
  // Settings
  | "settings.view"
  | "settings.edit"
  // Users
  | "users.view"
  | "users.create"
  | "users.edit"
  | "users.delete";
