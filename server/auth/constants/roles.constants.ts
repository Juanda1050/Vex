import type { Role } from "../types";

export const ROLE_HIERARCHY: Role[] = [
  "CASHIER",
  "WAREHOUSE",
  "PURCHASING",
  "SUPERVISOR",
  "ADMIN",
  "OWNER",
];

export const ROLE_LABELS: Record<Role, { es: string; en: string }> = {
  OWNER: { es: "Propietario", en: "Owner" },
  ADMIN: { es: "Administrador", en: "Administrator" },
  SUPERVISOR: { es: "Supervisor", en: "Supervisor" },
  CASHIER: { es: "Cajero", en: "Cashier" },
  WAREHOUSE: { es: "Almacenista", en: "Warehouse" },
  PURCHASING: { es: "Compras", en: "Purchasing" },
};
