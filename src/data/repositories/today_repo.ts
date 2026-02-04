import { db } from "../db/db";

import { JobItemState } from "../../domain/enums/item_state";
import { ItemUrgency } from "../../domain/enums/item_urgency";

import type { Job } from "../../domain/models/job";
import type { JobItem } from "../../domain/models/job_item";

export type TodayItem = {
  item: JobItem;
  job: Job | undefined;
};

export type TodaySnapshot = {
  nowIso: string;
  urgent: TodayItem[];
  due: TodayItem[];
};

export class TodayRepository {
  async getTodaySnapshot(args?: { limitUrgent?: number; limitDue?: number }): Promise<TodaySnapshot> {
    const limitUrgent = args?.limitUrgent ?? 20;
    const limitDue = args?.limitDue ?? 20;

    const nowIso = new Date().toISOString();

    // 1) URGENT: usa índice compuesto [state+urgency]
    const urgentItems = await db.job_items
      .where("[state+urgency]")
      .equals([JobItemState.PENDING, ItemUrgency.URGENT])
      .limit(limitUrgent)
      .toArray();

    // 2) DUE reminders: usa índice reminder_at (no tenemos [state+reminder_at] en schema v1)
    // Filtramos state en memoria (sigue siendo rápido para MVP).
    const dueItems = await db.job_items
      .where("reminder_at")
      .belowOrEqual(nowIso)
      .and((i) => i.state === JobItemState.PENDING && i.reminder_at != null)
      .limit(limitDue)
      .toArray();

    // Join local: cargar jobs por ids
    const jobIds = Array.from(new Set([...urgentItems, ...dueItems].map((i) => i.job_id)));
    const jobs = await db.jobs.bulkGet(jobIds);
    const jobById = new Map<string, Job>();
    for (const j of jobs) {
      if (j) jobById.set(j.id, j);
    }

    return {
      nowIso,
      urgent: urgentItems.map((item) => ({ item, job: jobById.get(item.job_id) })),
      due: dueItems
        .sort((a, b) => (a.reminder_at ?? "").localeCompare(b.reminder_at ?? "")) // due más antiguos primero
        .map((item) => ({ item, job: jobById.get(item.job_id) })),
    };
  }
}

export const todayRepo = new TodayRepository();
