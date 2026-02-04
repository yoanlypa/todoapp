import { Job } from "./job";
import { JobItem } from "./job_item";
import { InventoryItem } from "./inventory_item";
import { EventLog } from "./event_log";

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
