import { db } from "../db/db";
import { uuid } from "../../shared/utils/uuid";
import { nowIso } from "../../shared/utils/dates";
import { normalizeText } from "../../shared/utils/normalize_text";
import { InventoryItem } from "../../domain/models/inventory_item";
import { InventoryLevel } from "../../domain/enums/inventory_level";
import { eventLogRepo } from "./event_log_repo";
import { jobItemRepo } from "./job_item_repo";
import { JobItemType } from "../../domain/enums/item_type";
import { ItemUrgency } from "../../domain/enums/item_urgency";

export type InventoryCreatePayload = {
  name: string;
  level?: InventoryLevel;
  default_store?: string;
  tags?: string[];
};

export class InventoryRepository {
  async list(args?: { level?: InventoryLevel; search?: string }): Promise<InventoryItem[]> {
    const level = args?.level;
    const search = (args?.search ?? "").trim().toLowerCase();

    let items: InventoryItem[] = [];

    if (level) {
      items = await db.inventory_items.where("level").equals(level).toArray();
    } else {
      items = await db.inventory_items.toArray();
    }

    if (search) {
      items = items.filter((i) => i.name.toLowerCase().includes(search));
    }

    items.sort((a, b) => a.name.localeCompare(b.name));
    return items;
  }

  async findByNameKey(nameKey: string): Promise<InventoryItem | undefined> {
    return db.inventory_items.where("name_key").equals(nameKey).first();
  }

  async create(payload: InventoryCreatePayload): Promise<InventoryItem> {
    const now = nowIso();
    const name_key = normalizeText(payload.name);

    const existing = await this.findByNameKey(name_key);
    if (existing) {
      // MVP: lanzamos error para que la UI proponga merge
      throw new Error("Inventory item already exists (name_key dedupe)");
    }

    const item: InventoryItem = {
      id: uuid(),
      name: payload.name.trim(),
      name_key,
      level: payload.level ?? InventoryLevel.MISSING,
      default_store: payload.default_store,
      tags: payload.tags,
      created_at: now,
      updated_at: now,
    };

    await db.inventory_items.add(item);
    await eventLogRepo.append({
      entity_type: "INVENTORY",
      entity_id: item.id,
      action: "INV_CREATED",
      meta: { name: item.name, level: item.level },
    });

    return item;
  }

  async update(
    id: string,
    patch: Partial<Omit<InventoryItem, "id" | "created_at" | "name_key">> & { name?: string }
  ): Promise<InventoryItem> {
    const existing = await db.inventory_items.get(id);
    if (!existing) throw new Error("InventoryItem not found");

    let nextName = existing.name;
    let nextNameKey = existing.name_key;

    if (typeof patch.name === "string") {
      nextName = patch.name.trim();
      nextNameKey = normalizeText(nextName);

      // si cambia name_key, comprobamos dedupe
      if (nextNameKey !== existing.name_key) {
        const other = await this.findByNameKey(nextNameKey);
        if (other && other.id !== id) {
          throw new Error("Inventory item name conflicts with existing name_key");
        }
      }
    }

    const updated: InventoryItem = {
      ...existing,
      ...patch,
      id: existing.id,
      created_at: existing.created_at,
      name: nextName,
      name_key: nextNameKey,
      updated_at: nowIso(),
    };

    await db.inventory_items.put(updated);
    await eventLogRepo.append({
      entity_type: "INVENTORY",
      entity_id: id,
      action: "INV_UPDATED",
      meta: { patch },
    });

    return updated;
  }

  async setLevel(id: string, level: InventoryLevel): Promise<InventoryItem> {
    const updated = await this.update(id, { level });
    await eventLogRepo.append({
      entity_type: "INVENTORY",
      entity_id: id,
      action: "INV_LEVEL_CHANGED",
      meta: { level },
    });
    return updated;
  }

  async merge(targetId: string, sourceId: string): Promise<void> {
    if (targetId === sourceId) return;

    const target = await db.inventory_items.get(targetId);
    const source = await db.inventory_items.get(sourceId);
    if (!target || !source) throw new Error("Merge target/source not found");

    // MVP: fusiona tags y conserva el "peor" nivel (MISSING > LOW > HAVE)
    const rank = (lvl: InventoryLevel) =>
      lvl === InventoryLevel.MISSING ? 3 : lvl === InventoryLevel.LOW ? 2 : 1;

    const mergedTags = Array.from(new Set([...(target.tags ?? []), ...(source.tags ?? [])]));
    const mergedLevel = rank(source.level) > rank(target.level) ? source.level : target.level;

    await db.transaction("rw", db.inventory_items, async () => {
      await db.inventory_items.put({
        ...target,
        tags: mergedTags,
        level: mergedLevel,
        updated_at: nowIso(),
      });
      await db.inventory_items.delete(sourceId);
    });

    await eventLogRepo.append({
      entity_type: "INVENTORY",
      entity_id: targetId,
      action: "INV_MERGED",
      meta: { sourceId },
    });
  }

  async addToPurchases(
    inventoryItemId: string,
    args: { jobId: string; qty?: number }
  ): Promise<void> {
    const inv = await db.inventory_items.get(inventoryItemId);
    if (!inv) throw new Error("InventoryItem not found");

    await jobItemRepo.create(args.jobId, {
      type: JobItemType.BUY,
      title: inv.name,
      urgency: ItemUrgency.NORMAL,
      quantity: args.qty ? { amount: args.qty } : undefined,
      store: inv.default_store ? { name: inv.default_store } : undefined,
    });

    await eventLogRepo.append({
      entity_type: "INVENTORY",
      entity_id: inventoryItemId,
      action: "INV_ADDED_TO_PURCHASES",
      meta: { jobId: args.jobId, qty: args.qty ?? null },
    });
  }
}

export const inventoryRepo = new InventoryRepository();
