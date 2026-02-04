import { db } from "../db/db";
import { uuid } from "../../shared/utils/uuid";
import { nowIso } from "../../shared/utils/dates";
import type { JobItem } from "../../domain/models/job_item";
import { JobItemType } from "../../domain/enums/item_type";
import { JobItemState } from "../../domain/enums/item_state";
import { ItemUrgency } from "../../domain/enums/item_urgency";
import { eventLogRepo } from "./event_log_repo";

export type JobItemCreatePayload = {
  type: JobItemType;
  title: string;
  details?: string;
  urgency?: ItemUrgency;
  quantity?: JobItem["quantity"];
  store?: JobItem["store"];
  reminder_at?: string | null;
};

export class JobItemRepository {
  async listByJob(jobId: string, args?: { includeDone?: boolean }): Promise<JobItem[]> {
    const includeDone = args?.includeDone ?? true;

    let items = await db.job_items.where("job_id").equals(jobId).toArray();

    if (!includeDone) {
      items = items.filter((i) => i.state !== JobItemState.DONE);
    }

    items.sort((a, b) => a.sort_order - b.sort_order);
    return items;
  }

  async create(jobId: string, payload: JobItemCreatePayload): Promise<JobItem> {
    const now = nowIso();
    const item: JobItem = {
      id: uuid(),
      job_id: jobId,
      type: payload.type,
      title: payload.title,
      details: payload.details,
      urgency: payload.urgency ?? ItemUrgency.NORMAL,
      state: JobItemState.PENDING,
      sort_order: Date.now(),
      quantity: payload.quantity,
      store: payload.store,
      reminder_at: payload.reminder_at ?? null,
      created_at: now,
      updated_at: now,
      done_at: null,
    };

    await db.job_items.add(item);
    await eventLogRepo.append({
      entity_type: "JOB_ITEM",
      entity_id: item.id,
      action: "ITEM_CREATED",
      meta: { job_id: jobId, type: item.type },
    });

    return item;
  }

  async update(id: string, patch: Partial<Omit<JobItem, "id" | "job_id" | "created_at">>): Promise<JobItem> {
    const existing = await db.job_items.get(id);
    if (!existing) throw new Error("JobItem not found");

    const updated: JobItem = {
      ...existing,
      ...patch,
      id: existing.id,
      job_id: existing.job_id,
      created_at: existing.created_at,
      updated_at: nowIso(),
    };

    // regla: si DONE => done_at obligatorio
    if (updated.state === JobItemState.DONE && !updated.done_at) {
      updated.done_at = nowIso();
    }
    if (updated.state !== JobItemState.DONE) {
      updated.done_at = null;
    }

    await db.job_items.put(updated);
    await eventLogRepo.append({
      entity_type: "JOB_ITEM",
      entity_id: id,
      action: "ITEM_UPDATED",
      meta: { patch },
    });

    return updated;
  }

  async setDone(id: string, done: boolean): Promise<JobItem> {
    const updated = await this.update(id, {
      state: done ? JobItemState.DONE : JobItemState.PENDING,
      done_at: done ? nowIso() : null,
    });

    await eventLogRepo.append({
      entity_type: "JOB_ITEM",
      entity_id: id,
      action: done ? "ITEM_DONE" : "ITEM_UNDONE",
      meta: {},
    });

    return updated;
  }

  async snooze(id: string, reminderAt: string | null): Promise<JobItem> {
    const updated = await this.update(id, { reminder_at: reminderAt });
    await eventLogRepo.append({
      entity_type: "JOB_ITEM",
      entity_id: id,
      action: "ITEM_SNOOZED",
      meta: { reminder_at: reminderAt },
    });
    return updated;
  }

  async convertToBuy(id: string): Promise<JobItem> {
    const existing = await db.job_items.get(id);
    if (!existing) throw new Error("JobItem not found");

    const updated = await this.update(id, { type: JobItemType.BUY });
    await eventLogRepo.append({
      entity_type: "JOB_ITEM",
      entity_id: id,
      action: "ITEM_CONVERTED",
      meta: { from: existing.type, to: JobItemType.BUY },
    });

    return updated;
  }

  async reorder(jobId: string, orderedItemIds: string[]): Promise<void> {
    // Actualiza sort_order según el orden recibido (bulk)
    const now = nowIso();

    await db.transaction("rw", db.job_items, async () => {
      for (let idx = 0; idx < orderedItemIds.length; idx++) {
        const id = orderedItemIds[idx];
        await db.job_items.update(id, { sort_order: idx, updated_at: now });
      }
    });

    await eventLogRepo.append({
      entity_type: "JOB",
      entity_id: jobId,
      action: "ITEM_REORDERED",
      meta: { orderedItemIds },
    });
  }

  async delete(id: string): Promise<void> {
    const existing = await db.job_items.get(id);
    if (!existing) return;

    await db.job_items.delete(id);
    await eventLogRepo.append({
      entity_type: "JOB_ITEM",
      entity_id: id,
      action: "ITEM_DELETED",
      meta: { job_id: existing.job_id },
    });
  }
}

export const jobItemRepo = new JobItemRepository();
