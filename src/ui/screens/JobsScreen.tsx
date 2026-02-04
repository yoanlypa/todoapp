import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { jobRepo } from "../../data/repositories/job_repo";
import { JobStatus } from "../../domain/enums/job_status";
import { JobPriority } from "../../domain/enums/job_priority";

import type { Job } from "../../domain/models/job";
type JobStatusValue = typeof JobStatus[keyof typeof JobStatus];
type JobPriorityValue = typeof JobPriority[keyof typeof JobPriority];
type StatusFilter = "ALL" | (typeof JobStatus)[keyof typeof JobStatus];
type PriorityFilter = "ALL" | (typeof JobPriority)[keyof typeof JobPriority];

export function JobsScreen() {
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();

    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // UI state
    const [search, setSearch] = useState(params.get("q") ?? "");
    const [status, setStatus] = useState<StatusFilter>((params.get("status") as StatusFilter) ?? "ALL");
    const [priority, setPriority] = useState<PriorityFilter>((params.get("priority") as PriorityFilter) ?? "ALL");
    const [includeArchived, setIncludeArchived] = useState(params.get("archived") === "1");

    const filteredJobs = useMemo(() => {
        // El repo ya filtra por status + archived + search básico.
        // Aquí filtramos priority (para no complicar el repo aún).
        if (priority === "ALL") return jobs;
        return jobs.filter((j) => j.priority === priority);
    }, [jobs, priority]);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const list = await jobRepo.list({
                status: status === "ALL" ? undefined : status,
                includeArchived,
                search: search.trim() ? search.trim() : undefined,
            });
            setJobs(list);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load jobs");
        } finally {
            setLoading(false);
        }
    }

    // Sync URL params + reload
    useEffect(() => {
        const next: Record<string, string> = {};
        if (search.trim()) next.q = search.trim();
        if (status !== "ALL") next.status = status;
        if (priority !== "ALL") next.priority = priority;
        if (includeArchived) next.archived = "1";
        setParams(next, { replace: true });

        load().catch(console.error);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, status, priority, includeArchived]);

    async function createJob() {
        const title = prompt("Job title?");
        if (!title || !title.trim()) return;

        const created = await jobRepo.create({
            title: title.trim(),
            status: JobStatus.PREP,
            priority: JobPriority.NORMAL,
        });

        // reload list and go to detail
        await load();
        navigate(`/jobs/${created.id}`);
    }

    async function archiveJob(jobId: string) {
        await jobRepo.archive(jobId);
        await load();
    }

    async function setJobStatus(jobId: string, nextStatus: JobStatusValue) {
        await jobRepo.setStatus(jobId, nextStatus);
        await load();
    }

    async function setJobPriority(jobId: string, nextPriority: JobPriorityValue) {
        await jobRepo.setPriority(jobId, nextPriority);
        await load();
    }


    return (
        <div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0 }}>Jobs</h1>
                    <p style={{ marginTop: 6, opacity: 0.8 }}>List, filter, create. Click a job to open details.</p>
                </div>

                <button onClick={() => void createJob()} style={btnPrimary}>
                    + New job
                </button>
            </div>

            <div style={panel}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search (title / reference)"
                        style={input}
                    />

                    <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} style={select}>
                        <option value="ALL">Status: All</option>
                        <option value={JobStatus.PREP}>PREP</option>
                        <option value={JobStatus.EXEC}>EXEC</option>
                        <option value={JobStatus.DONE}>DONE</option>
                    </select>

                    <select value={priority} onChange={(e) => setPriority(e.target.value as PriorityFilter)} style={select}>
                        <option value="ALL">Priority: All</option>
                        <option value={JobPriority.NORMAL}>NORMAL</option>
                        <option value={JobPriority.HIGH}>HIGH</option>
                        <option value={JobPriority.URGENT}>URGENT</option>
                    </select>

                    <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={includeArchived}
                            onChange={(e) => setIncludeArchived(e.target.checked)}
                        />
                        Include archived
                    </label>

                    <button onClick={() => void load()} style={btnGhost}>
                        Refresh
                    </button>
                </div>
            </div>

            {loading ? <p style={{ opacity: 0.8 }}>Loading…</p> : null}
            {error ? <p style={{ color: "#ff9b9b" }}>{error}</p> : null}

            <div style={{ display: "grid", gap: 10 }}>
                {filteredJobs.length === 0 ? (
                    <div style={empty}>
                        <div style={{ fontWeight: 800 }}>No jobs</div>
                        <div style={{ opacity: 0.8, marginTop: 6 }}>Create your first job to start adding notes/buy/materials.</div>
                    </div>
                ) : (
                    filteredJobs.map((j) => (
                        <div key={j.id} style={card}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                                <div style={{ minWidth: 0 }}>
                                    <Link to={`/jobs/${j.id}`} style={titleLink}>
                                        {j.title}
                                    </Link>
                                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                                        {j.status} • {j.priority} • {j.archived_at ? "ARCHIVED" : "ACTIVE"}
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                    <select
                                        value={j.status}
                                        onChange={(e) =>
                                        void setJobStatus(j.id, e.target.value as JobStatusValue)
                                        }
                                        style={selectSmall}
                                        title="Set status"
                                    >
                                        <option value={JobStatus.PREP}>PREP</option>
                                        <option value={JobStatus.EXEC}>EXEC</option>
                                        <option value={JobStatus.DONE}>DONE</option>
                                    </select>

                                    <select
                                        value={j.priority}
                                        onChange={(e) =>
                                        void setJobPriority(j.id, e.target.value as JobPriorityValue)
                                        }

                                        style={selectSmall}
                                        title="Set priority"
                                    >
                                        <option value={JobPriority.NORMAL}>NORMAL</option>
                                        <option value={JobPriority.HIGH}>HIGH</option>
                                        <option value={JobPriority.URGENT}>URGENT</option>
                                    </select>

                                    <button onClick={() => void archiveJob(j.id)} style={btnDanger} disabled={!!j.archived_at}>
                                        Archive
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// ---- styles (inline for now, later we move to Tailwind) ----
const panel: React.CSSProperties = {
    margin: "14px 0 16px",
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
};

const card: React.CSSProperties = {
    padding: 14,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
};

const empty: React.CSSProperties = {
    padding: 18,
    borderRadius: 16,
    border: "1px dashed rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.02)",
};

const input: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.2)",
    color: "white",
    minWidth: 240,
    outline: "none",
};

const select: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.2)",
    color: "white",
    outline: "none",
};

const selectSmall: React.CSSProperties = {
    ...select,
    padding: "8px 10px",
    borderRadius: 12,
    fontSize: 12,
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

const btnGhost: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "transparent",
    color: "rgba(255,255,255,0.9)",
    fontWeight: 700,
    cursor: "pointer",
};

const btnDanger: React.CSSProperties = {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,80,80,0.12)",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
};

const titleLink: React.CSSProperties = {
    display: "inline-block",
    color: "white",
    textDecoration: "none",
    fontWeight: 900,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
};
