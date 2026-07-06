import { cookies } from "next/headers";
import { COOKIE_KEYS, COOKIE_OPTIONS } from "../constants";

export const cookieManager = {
  async setLocale(locale: string): Promise<void> {
    const store = await cookies();
    store.set(COOKIE_KEYS.locale, locale, COOKIE_OPTIONS);
  },

  async getLocale(): Promise<string | null> {
    const store = await cookies();
    return store.get(COOKIE_KEYS.locale)?.value ?? null;
  },

  async setBranchId(branchId: string): Promise<void> {
    const store = await cookies();
    store.set(COOKIE_KEYS.branchId, branchId, COOKIE_OPTIONS);
  },

  async getBranchId(): Promise<string | null> {
    const store = await cookies();
    return store.get(COOKIE_KEYS.branchId)?.value ?? null;
  },

  async setWarehouseId(warehouseId: string): Promise<void> {
    const store = await cookies();
    store.set(COOKIE_KEYS.warehouseId, warehouseId, COOKIE_OPTIONS);
  },

  async getWarehouseId(): Promise<string | null> {
    const store = await cookies();
    return store.get(COOKIE_KEYS.warehouseId)?.value ?? null;
  },

  async setTheme(theme: "light" | "dark"): Promise<void> {
    const store = await cookies();
    store.set(COOKIE_KEYS.theme, theme, COOKIE_OPTIONS);
  },

  async getTheme(): Promise<"light" | "dark" | null> {
    const store = await cookies();
    const value = store.get(COOKIE_KEYS.theme)?.value;
    return (value as "light" | "dark") ?? null;
  },

  async clearAll(): Promise<void> {
    const store = await cookies();
    Object.values(COOKIE_KEYS).forEach((key) => store.delete(key));
  },
};
