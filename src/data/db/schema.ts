// Mantén este archivo como "single source of truth" del schema de IndexedDB (Dexie)

export const DB_NAME = "todoapp_db";
export const DB_VERSION = 1;

// Tablas (una por entidad) + meta
export const TABLES = {
  jobs: "jobs",
  job_items: "job_items",
  inventory_items: "inventory_items",
  event_logs: "event_logs",
  meta: "meta",
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];

// Esquema Dexie: el string define primary key + índices.
// Nota: el primer campo suele ser la PK (id).
export const SCHEMA_V1: Record<TableName, string> = {
  jobs: `
    id,
    status,
    priority,
    archived_at,
    created_at,
    updated_at,
    sort_order
  `,

  // Índices críticos para "Hoy" y performance:
  // - job_id: listar items de un job
  // - [state+urgency]: urgentes pendientes
  // - reminder_at: items "due"
  job_items: `
    id,
    job_id,
    state,
    urgency,
    [state+urgency],
    reminder_at,
    created_at,
    updated_at,
    sort_order
  `,

  // Dedupe por name_key + filtros por level
  inventory_items: `
    id,
    name_key,
    level,
    updated_at,
    created_at
  `,

  // Append-only: indexa por timestamp y por entidad para trazabilidad
  event_logs: `
    id,
    timestamp,
    entity_type,
    entity_id,
    [entity_type+entity_id]
  `,

  // Meta: clave-valor (schema_version, settings, etc.)
  meta: `
    key
  `,
};
