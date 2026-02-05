import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { jobRepo } from "../../data/repositories/job_repo";
import { jobItemRepo } from "../../data/repositories/job_item_repo";

import { JobStatus } from "../../domain/enums/job_status";

import type { Job } from "../../domain/models/job";

type JobStatusValue = typeof JobStatus[keyof typeof JobStatus];
type StatusChip = "ALL" | JobStatusValue;

type JobCardVM = {
  job: Job;
  pendingCount: number;
  progressPct: number; // 0..100
};

export function JobsScreen() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [cards, setCards] = useState<JobCardVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusChip, setStatusChip] = useState<StatusChip>("ALL");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const list = await jobRepo.list({
        status: statusChip === "ALL" ? undefined : statusChip,
        includeArchived: false,
        search: search.trim() ? search.trim() : undefined,
      });

      // Enriquecer: pending_count + progress (MVP: calculado al vuelo)
      const vms: JobCardVM[] = [];
      for (const j of list) {
        const items = await jobItemRepo.listByJob(j.id, { includeDone: true });
        const total = items.length;
        const done = items.filter((it) => it.state === "DONE").length;
        const pending = total - done;
        const pct = total === 0 ? 0 : Math.round((done / total) * 100);

        vms.push({ job: j, pendingCount: pending, progressPct: pct });
      }

      setJobs(list);
      setCards(vms);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusChip]);

  // Debounce simple para search (sin librerías)
  useEffect(() => {
    const t = window.setTimeout(() => {
      load().catch(console.error);
    }, 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function createJob() {
    const title = prompt("Job title?");
    if (!title || !title.trim()) return;

    const created = await jobRepo.create({
      title: title.trim(),
      status: JobStatus.PREP,
      priority: "NORMAL",
    });

    await load();
    navigate(`/jobs/${created.id}`);
  }

  const chipClass = (active: boolean) =>
    active
      ? "bg-(--primary) text-white shadow-lg shadow-(--primary)/20"
      : "bg-white dark:bg-(--card-dark) text-slate-600 dark:text-white border border-slate-200 dark:border-slate-700";

  const listToRender = useMemo(() => cards, [cards]);

  return (
    <div className="min-h-[calc(100dvh-140px)]">
      {/* Top area */}
      <header className="sticky top-0 z-20 bg-(--background-dark) pt-2">
        <div className="flex items-center justify-between px-4 pb-2 pt-2">
          <p className="text-[32px] font-bold leading-tight tracking-tight">Trabajos</p>
          <div className="flex size-10 items-center justify-center rounded-full bg-slate-200 dark:bg-(--card-dark) text-white/90">
            <span className="material-symbols-outlined">account_circle</span>
          </div>
        </div>

        {/* SearchBar */}
        <div className="px-4 pb-3">
          <label className="flex h-12 w-full min-w-40 flex-col">
            <div className="flex h-full w-full flex-1 items-stretch rounded-xl shadow-sm">
              <div className="flex items-center justify-center rounded-l-xl bg-white pl-4 text-slate-400 dark:bg-(--card-dark) dark:text-(--muted)">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o ref #"
                className="h-full w-full min-w-0 flex-1 rounded-r-xl bg-white px-4 pl-2 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none dark:bg-(--card-dark) dark:text-white dark:placeholder:text-(--muted)"
              />
            </div>
          </label>
        </div>

        {/* Chips */}
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-3">
          <button
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 ${chipClass(statusChip === "ALL")}`}
            onClick={() => setStatusChip("ALL")}
          >
            <span className="text-sm font-medium leading-normal">Todos</span>
          </button>

          <button
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 ${chipClass(statusChip === JobStatus.PREP)}`}
            onClick={() => setStatusChip(JobStatus.PREP)}
          >
            <span className="text-sm font-medium leading-normal">Preparación</span>
          </button>

          <button
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 ${chipClass(statusChip === JobStatus.EXEC)}`}
            onClick={() => setStatusChip(JobStatus.EXEC)}
          >
            <span className="text-sm font-medium leading-normal">Ejecución</span>
          </button>

          <button
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 ${chipClass(statusChip === JobStatus.DONE)}`}
            onClick={() => setStatusChip(JobStatus.DONE)}
          >
            <span className="text-sm font-medium leading-normal">Terminado</span>
          </button>
        </div>
      </header>

      {/* List */}
      <main className="flex flex-col gap-4 px-4 pb-24 pt-2">
        {loading ? <p className="text-(--muted)">Loading…</p> : null}
        {error ? <p className="text-red-300">{error}</p> : null}

        {!loading && jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-(--border-dark) bg-(--card-dark)/40 p-4 text-(--muted)">
            No hay trabajos todavía. Pulsa “+” para crear el primero.
          </div>
        ) : null}

        {listToRender.map((vm) => (
          <JobCard key={vm.job.id} vm={vm} />
        ))}

        <div className="h-24" />
      </main>

      {/* FAB */}
      <button
        onClick={() => void createJob()}
        className="fixed bottom-6 right-6 z-50 flex size-16 items-center justify-center rounded-full bg-(--primary) text-white shadow-xl shadow-(--primary)/40 transition-transform hover:scale-105 active:scale-95"
        title="Add job"
      >
        <span className="material-symbols-outlined text-[32px]">add</span>
      </button>
    </div>
  );
}

function JobCard(props: { vm: JobCardVM }) {
  const { job, pendingCount, progressPct } = props.vm;

  const statusLabel =
    job.status === JobStatus.EXEC
      ? { text: "En ejecución", cls: "text-(--primary)" }
      : job.status === JobStatus.PREP
      ? { text: "Preparación", cls: "text-(--muted)" }
      : { text: "Terminado", cls: "text-emerald-400" };

  const urgentBadge = job.priority === "URGENT";

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-(--card-dark)">
      {/* Imagen placeholder (luego: field optional en Job o media local) */}
      <div className="aspect-video w-full bg-gradient-to-br from-white/10 to-black/20 dark:from-white/5 dark:to-black/40" />

      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <p className={`text-xs font-bold uppercase tracking-wider ${statusLabel.cls}`}>
              {statusLabel.text}
            </p>
            <p className="text-xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
              {job.title}
            </p>
          </div>

          {urgentBadge ? (
            <span className="rounded bg-(--accent-yellow) px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-900">
              Urgente
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-sm font-normal leading-normal text-slate-500 dark:text-(--muted)">
            {job.reference ? `Ref #${job.reference}` : "Ref —"}
          </p>

          <div className="mt-2 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-700 dark:text-white">
                {pendingCount} items pendientes
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{progressPct}%</p>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div className="h-full rounded-full bg-(--primary)" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        <Link
          to={`/jobs/${job.id}`}
          className="mt-2 flex h-10 w-full items-center justify-center rounded-lg bg-(--primary)/10 text-sm font-semibold text-(--primary) transition-colors dark:bg-(--primary)/20 dark:text-white"
        >
          Ver detalles
        </Link>
      </div>
    </div>
  );
}
