import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { jobRepo } from "../../data/repositories/job_repo";
import { jobItemRepo } from "../../data/repositories/job_item_repo";
import { JobItemType } from "../../domain/enums/item_type";
import { ItemUrgency } from "../../domain/enums/item_urgency";

import type { Job } from "../../domain/models/job";
import type { JobItem } from "../../domain/models/job_item";

export function JobDetailScreen() {
  const { jobId } = useParams<{ jobId: string }>();

  const [job, setJob] = useState<Job | null>(null);
  const [items, setItems] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(id: string) {
    setLoading(true);
    setError(null);
    try {
      const j = await jobRepo.get(id);
      if (!j) {
        setJob(null);
        setItems([]);
        setError("Job not found");
        return;
      }
      setJob(j);
      const its = await jobItemRepo.listByJob(id, { includeDone: true });
      setItems(its);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load job");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!jobId) return;
    load(jobId).catch(console.error);
  }, [jobId]);

  async function addQuickNote() {
    if (!jobId) return;
    const title = prompt("Note title?");
    if (!title || !title.trim()) return;

    await jobItemRepo.create(jobId, {
      type: JobItemType.NOTE,
      title: title.trim(),
      urgency: ItemUrgency.NORMAL,
    });
    await load(jobId);
  }

  if (!jobId) {
    return (
      <div>
        <h1>Job Detail</h1>
        <p>Missing jobId.</p>
        <Link to="/jobs">Back</Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
        <div>
          <h1 style={{ margin: 0 }}>Job Detail</h1>
          <p style={{ marginTop: 6, opacity: 0.8 }}>
            <Link to="/jobs" style={{ color: "rgba(255,255,255,0.9)" }}>
              ← Back to Jobs
            </Link>
          </p>
        </div>
        <button onClick={() => void addQuickNote()} style={btnPrimary}>
          + Quick note
        </button>
      </div>

      {loading ? <p style={{ opacity: 0.8 }}>Loading…</p> : null}
      {error ? <p style={{ color: "#ff9b9b" }}>{error}</p> : null}

      {!loading && job ? (
        <div style={card}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>{job.title}</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
            {job.status} • {job.priority} • {job.archived_at ? "ARCHIVED" : "ACTIVE"}
          </div>

          <hr style={{ margin: "14px 0", opacity: 0.2 }} />

          <div style={{ fontWeight: 800, marginBottom: 8 }}>Items ({items.length})</div>
          {items.length === 0 ? (
            <div style={{ opacity: 0.8 }}>No items yet.</div>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {items.map((it) => (
                <li key={it.id} style={{ marginBottom: 8 }}>
                  <span style={{ fontWeight: 700 }}>{it.title}</span>{" "}
                  <span style={{ opacity: 0.75, fontSize: 12 }}>
                    ({it.type}, {it.urgency}, {it.state})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

const card: React.CSSProperties = {
  marginTop: 12,
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.10)",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};
