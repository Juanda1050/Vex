export const COOKIE_KEYS = {
  locale: "app_locale",
  branchId: "app_branch_id",
  warehouseId: "app_warehouse_id",
  theme: "app_theme",
} as const;

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 días
};
