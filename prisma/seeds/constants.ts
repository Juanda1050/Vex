export const SEED_TENANT_ID = "00000000-0000-0000-0000-000000000001";
export const SEED_BRANCH_ID = "00000000-0000-0000-0000-000000000002";
export const SEED_WAREHOUSE_ID = "00000000-0000-0000-0000-000000000003";
export const SEED_SETTINGS_ID = "00000000-0000-0000-0000-000000000004";

export const generateSeedId = (prefix: number, index: number): string => {
  const hexIndex = index.toString(16).padStart(12, "0");
  return `${prefix}0000000-0000-0000-0000-${hexIndex}`;
};
