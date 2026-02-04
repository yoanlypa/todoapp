export const InventoryLevel = {
  HAVE: "HAVE",
  LOW: "LOW",
  MISSING: "MISSING",
} as const;

export type InventoryLevel = typeof InventoryLevel[keyof typeof InventoryLevel];
