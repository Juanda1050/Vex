import {
  Boxes,
  CreditCard,
  DollarSign,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Fase 0 — one icon per module, reused everywhere that module shows up:
 * nav dropdown, PageHeader, dashboard metric cards.
 */
const MODULE_ICONS = {
  dashboard: LayoutDashboard,
  sales: DollarSign,
  quotes: FileText,
  customers: Users,
  products: Package,
  inventory: Boxes,
  purchases: Truck,
  users: UserCog,
  billing: CreditCard,
  settings: Settings,
  pos: ShoppingCart,
} as const satisfies Record<string, LucideIcon>;

type ModuleKey = keyof typeof MODULE_ICONS;

function getModuleIcon(module: ModuleKey): LucideIcon {
  return MODULE_ICONS[module];
}

export { MODULE_ICONS, getModuleIcon };
export type { ModuleKey };
