import type { Role } from "../types";

export const ROLE_HIERARCHY: Role[] = [
  "READ_ONLY",
  "WAREHOUSE",
  "PURCHASING",
  "SELLER",
  "ADMIN",
  "OWNER",
];

export const ROLE_LABELS: Record<Role, { es: string; en: string }> = {
  READ_ONLY: { es: "Solo lectura", en: "Read only" },
  SELLER: { es: "Vendedor", en: "Seller" },
  OWNER: { es: "Propietario", en: "Owner" },
  ADMIN: { es: "Administrador", en: "Administrator" },
  WAREHOUSE: { es: "Almacenista", en: "Warehouse" },
  PURCHASING: { es: "Compras", en: "Purchasing" },
};
