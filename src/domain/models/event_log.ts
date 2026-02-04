export type EntityType = "JOB" | "JOB_ITEM" | "INVENTORY";

export type EventLog = {
  id: string;
  timestamp: string; // ISO
  entity_type: EntityType;
  entity_id: string;
  action: string;
  meta?: Record<string, unknown>;
};
