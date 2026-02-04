import type  { Job } from "./job";
import type  { JobItem } from "./job_item";
import type  { InventoryItem } from "./inventory_item";
import type { EventLog } from "./event_log";

export type BackupFile = {
  schema_version: 1;
  exported_at: string;
  app: {
    name: string;
    build: string;
  };
  data: {
    jobs: Job[];
    job_items: JobItem[];
    inventory_items: InventoryItem[];
    event_logs: EventLog[];
  };
};
