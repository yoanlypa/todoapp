import { db } from "../db/db";
import { uuid } from "../../shared/utils/uuid";
import { nowIso } from "../../shared/utils/dates";
import { EventLog, EntityType } from "../../domain/models/event_log";

export type AppendEventInput = {
  entity_type: EntityType;
  entity_id: string;
  action: string;
  meta?: Record<string, unknown>;
};

export class EventLogRepository {
  async append(input: AppendEventInput): Promise<EventLog> {
    const event: EventLog = {
      id: uuid(),
      timestamp: nowIso(),
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      action: input.action,
      meta: input.meta ?? {},
    };

    await db.event_logs.add(event);
    return event;
  }

  async list(args?: {
    entityType?: EntityType;
    entityId?: string;
    limit?: number;
  }): Promise<EventLog[]> {
    const limit = args?.limit ?? 100;

    if (args?.entityType && args?.entityId) {
      return db.event_logs
        .where("[entity_type+entity_id]")
        .equals([args.entityType, args.entityId])
        .reverse()
        .limit(limit)
        .toArray();
    }

    if (args?.entityType) {
      return db.event_logs
        .where("entity_type")
        .equals(args.entityType)
        .reverse()
        .limit(limit)
        .toArray();
    }

    return db.event_logs.orderBy("timestamp").reverse().limit(limit).toArray();
  }
}

export const eventLogRepo = new EventLogRepository();
