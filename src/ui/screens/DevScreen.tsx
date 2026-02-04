import { useEffect, useMemo, useState } from "react";

import { jobRepo } from "../../data/repositories/job_repo";
import { jobItemRepo } from "../../data/repositories/job_item_repo";
import { inventoryRepo } from "../../data/repositories/inventory_repo";
import { eventLogRepo } from "../../data/repositories/event_log_repo";

import { JobStatus } from "../../domain/enums/job_status";
import { JobPriority } from "../../domain/enums/job_priority";
import { JobItemType } from "../../domain/enums/item_type";
import { ItemUrgency } from "../../domain/enums/item_urgency";
import { InventoryLevel } from "../../domain/enums/inventory_level";

import type { Job } from "../../domain/models/job";
import type { JobItem } from "../../domain/models/job_item";
import type { InventoryItem } from "../../domain/models/inventory_item";
import type { EventLog } from "../../domain/models/event_log";

export function DevScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [items, setItems] = useState<JobItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId) ?? null,
    [jobs, selectedJobId]
  );

  async function refreshAll() {
    const jobsList = await jobRepo.list({ includeArchived: true });
    setJobs(jobsList);

    const jobId = selectedJobId ?? jobsList[0]?.id ?? null;
    setSelectedJobId(jobId);

    if (jobId) {
      const jobItems = await jobItemRepo.listByJob(jobId, { includeDone: true });
      setItems(jobItems);
    } else {
      setItems([]);
    }

    const inv = await inventoryRepo.list();
    setInventory(inv);

    const ev = await eventLogRepo.list({ limit: 50 });
    setLogs(ev);
  }

  useEffect(() => {
    refreshAll().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedJobId) {
      setItems([]);
      return;
    }
    jobItemRepo
      .listByJob(selectedJobId, { includeDone: true })
      .then(setItems)
      .catch(console.error);
  }, [selectedJobId]);

  async function createJob() {
    const newJob = await jobRepo.create({
      title: `Job ${new Date().toLocaleString()}`,
      status: JobStatus.PREP,
      priority: JobPriority.NORMAL,
      site: { address: "Test address" },
    });
    setSelectedJobId(newJob.id);
    await refreshAll();
  }

  async function createUrgentItem() {
    if (!selectedJobId) return;

    await jobItemRepo.create(selectedJobId, {
      type: JobItemType.NOTE,
      title: `Urgent note ${new Date().toLocaleTimeString()}`,
      urgency: ItemUrgency.URGENT,
      details: "Created from DevScreen",
    });

    await refreshAll();
  }

  async function createBuyItem() {
    if (!selectedJobId) return;

    await jobItemRepo.create(selectedJobId, {
      type: JobItemType.BUY,
      title: `Buy item ${new Date().toLocaleTimeString()}`,
      urgency: ItemUrgency.NORMAL,
      quantity: { amount: 1, unit: "pc" },
      store: { name: "Leroy Merlin" },
    });

    await refreshAll();
  }

  async function toggleItemDone(item: JobItem) {
    await jobItemRepo.setDone(item.id, item.state !== "DONE");
    await refreshAll();
  }

  async function createInventoryItem() {
    const name = `Screws ${Math.floor(Math.random() * 100)}`;
    await inventoryRepo.create({
      name,
      level: InventoryLevel.MISSING,
      default_store: "Obramat",
      tags: ["dev"],
    });
    await refreshAll();
  }

  async function archiveSelectedJob() {
    if (!selectedJobId) return;
    await jobRepo.archive(selectedJobId);
    await refreshAll();
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ margin: 0 }}>todoapp — Dev Screen</h1>
      <p style={{ marginTop: 6, opacity: 0.8 }}>
        Quick DB checks (Dexie + repos). Reload the page to confirm persistence.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
        <button onClick={() => void createJob()}>+ Create Job</button>
        <button onClick={() => void createUrgentItem()} disabled={!selectedJobId}>
          + Add Urgent NOTE
        </button>
        <button onClick={() => void createBuyItem()} disabled={!selectedJobId}>
          + Add BUY
        </button>
        <button onClick={() => void createInventoryItem()}>+ Add Inventory</button>
        <button onClick={() => void archiveSelectedJob()} disabled={!selectedJobId}>
          Archive selected Job
        </button>
        <button onClick={() => void refreshAll()}>Refresh</button>
      </div>

      <hr />

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, marginTop: 16 }}>
        <section>
          <h2 style={{ marginTop: 0 }}>Jobs ({jobs.length})</h2>

          {jobs.length === 0 ? (
            <p>No jobs yet.</p>
          ) : (
            <ul style={{ paddingLeft: 16, margin: 0 }}>
              {jobs.map((j) => (
                <li key={j.id} style={{ marginBottom: 8 }}>
                  <button
                    onClick={() => setSelectedJobId(j.id)}
                    style={{
                      textAlign: "left",
                      width: "100%",
                      padding: 8,
                      border:
                        j.id === selectedJobId ? "2px solid #888" : "1px solid #444",
                      background: "transparent",
                      color: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{j.title}</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      {j.status} • {j.priority} • {j.archived_at ? "ARCHIVED" : "ACTIVE"}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 style={{ marginTop: 0 }}>
            Items {selectedJob ? `for: ${selectedJob.title}` : ""} ({items.length})
          </h2>

          {!selectedJobId ? (
            <p>Select or create a job.</p>
          ) : items.length === 0 ? (
            <p>No items yet for this job.</p>
          ) : (
            <ul style={{ paddingLeft: 16, margin: 0 }}>
              {items.map((it) => (
                <li key={it.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button onClick={() => void toggleItemDone(it)}>
                      {it.state === "DONE" ? "Undo" : "Done"}
                    </button>
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {it.title}{" "}
                        <span style={{ fontSize: 12, opacity: 0.8 }}>
                          ({it.type}, {it.urgency}, {it.state})
                        </span>
                      </div>
                      {it.details ? (
                        <div style={{ fontSize: 12, opacity: 0.8 }}>{it.details}</div>
                      ) : null}
                      {it.quantity ? (
                        <div style={{ fontSize: 12, opacity: 0.8 }}>
                          Qty: {it.quantity.amount} {it.quantity.unit ?? ""}
                        </div>
                      ) : null}
                      {it.store?.name ? (
                        <div style={{ fontSize: 12, opacity: 0.8 }}>
                          Store: {it.store.name}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <hr style={{ margin: "16px 0" }} />

          <h2 style={{ marginTop: 0 }}>Inventory ({inventory.length})</h2>
          {inventory.length === 0 ? (
            <p>No inventory yet.</p>
          ) : (
            <ul style={{ paddingLeft: 16, margin: 0 }}>
              {inventory.slice(0, 15).map((inv) => (
                <li key={inv.id} style={{ marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{inv.name}</span>{" "}
                  <span style={{ fontSize: 12, opacity: 0.8 }}>({inv.level})</span>
                </li>
              ))}
            </ul>
          )}

          <hr style={{ margin: "16px 0" }} />

          <h2 style={{ marginTop: 0 }}>Event logs (last {logs.length})</h2>
          {logs.length === 0 ? (
            <p>No logs yet.</p>
          ) : (
            <ul style={{ paddingLeft: 16, margin: 0 }}>
              {logs.slice(0, 12).map((ev) => (
                <li key={ev.id} style={{ marginBottom: 6, fontSize: 12, opacity: 0.85 }}>
                  <span style={{ fontWeight: 600 }}>{ev.action}</span>{" "}
                  <span>
                    [{ev.entity_type}:{ev.entity_id.slice(0, 6)}…] @ {new Date(ev.timestamp).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
