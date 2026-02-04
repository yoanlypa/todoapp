import { InventoryLevel } from "../enums/inventory_level";

export type InventoryItem = {
  id: string;
  name: string;
  name_key: string; // normalizeText(name)

  level: InventoryLevel;

  default_store?: string;
  tags?: string[];

  created_at: string;
  updated_at: string;
};
