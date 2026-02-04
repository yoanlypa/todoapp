import Dexie from "dexie";
import type { Table } from "dexie";
import type { Job } from "../../domain/models/job";
import type { JobItem } from "../../domain/models/job_item";
import type { InventoryItem } from "../../domain/models/inventory_item";
import type { EventLog } from "../../domain/models/event_log";
import { DB_NAME, DB_VERSION, SCHEMA_V1 } from "./schema";

export type MetaRecord = {
  key: "schema_version" | "settings";
  value: unknown;
};

export class AppDB extends Dexie {
  jobs!: Table<Job, string>;
  job_items!: Table<JobItem, string>;
  inventory_items!: Table<InventoryItem, string>;
  event_logs!: Table<EventLog, string>;
  meta!: Table<MetaRecord, string>;

  constructor() {
    super(DB_NAME);

    // Versionado + schema
    this.version(DB_VERSION).stores({
      jobs: SCHEMA_V1.jobs,
      job_items: SCHEMA_V1.job_items,
      inventory_items: SCHEMA_V1.inventory_items,
      event_logs: SCHEMA_V1.event_logs,
      meta: SCHEMA_V1.meta,
    });

    // Hook opcional (si más adelante quieres normalización/guardas globales)
  }
}

export const db = new AppDB();

/**
 * Inicializa meta.schema_version si no existe.
 * Llamar una vez al arrancar la app (App provider).
 */
export async function ensureDbInitialized(): Promise<void> {
  // Placeholder: Add DB initialization logic here
  console.log("DB initialized (stub)");
}
