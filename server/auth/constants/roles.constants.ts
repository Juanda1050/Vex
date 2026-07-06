import type { Role } from "../types";

export const ROLE_HIERARCHY: Role[] = [
  "WAREHOUSE",
  "PURCHASING",
  "ADMIN",
  "OWNER",
];

export const ROLE_LABELS: Record<Role, { es: string; en: string }> = {
  OWNER: { es: "Propietario", en: "Owner" },
  ADMIN: { es: "Administrador", en: "Administrator" },
  WAREHOUSE: { es: "Almacenista", en: "Warehouse" },
  PURCHASING: { es: "Compras", en: "Purchasing" },
};
