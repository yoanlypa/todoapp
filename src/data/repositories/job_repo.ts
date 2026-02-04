import { db } from "../db/db";
import { uuid } from "../../shared/utils/uuid";
import { nowIso } from "../../shared/utils/dates";
import type { Job } from "../../domain/models/job";
import { JobStatus } from "../../domain/enums/job_status";
import { JobPriority } from "../../domain/enums/job_priority";
import { eventLogRepo } from "./event_log_repo";

export type JobCreatePayload = {
  title: string;
  reference?: string;
  status?: JobStatus;
  priority?: JobPriority;
  site?: Job["site"];
};

export class JobRepository {
  async list(args?: {
    status?: JobStatus;
    includeArchived?: boolean;
    search?: string;
  }): Promise<Job[]> {
    const includeArchived = args?.includeArchived ?? false;
    const status = args?.status;
    const search = (args?.search ?? "").trim().toLowerCase();

    // Base query
    let jobs: Job[] = [];

    if (status) {
      jobs = await db.jobs.where("status").equals(status).toArray();
    } else {
      jobs = await db.jobs.toArray();
    }

    if (!includeArchived) {
      jobs = jobs.filter((j) => !j.archived_at);
    }

    if (search) {
      jobs = jobs.filter((j) => {
        const hay = `${j.title} ${j.reference ?? ""}`.toLowerCase();
        return hay.includes(search);
      });
    }

    // Orden estable (sort_order y fallback updated_at)
    jobs.sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return b.updated_at.localeCompare(a.updated_at);
    });

    return jobs;
  }

  async get(id: string): Promise<Job | undefined> {
    return db.jobs.get(id);
  }

  async create(payload: JobCreatePayload): Promise<Job> {
    const now = nowIso();
    const job: Job = {
      id: uuid(),
      title: payload.title,
      reference: payload.reference,
      status: payload.status ?? JobStatus.PREP,
      priority: payload.priority ?? JobPriority.NORMAL,
      site: payload.site,
      sort_order: Date.now(), // simple, monotónico para MVP
      created_at: now,
      updated_at: now,
      archived_at: null,
    };

    await db.jobs.add(job);
    await eventLogRepo.append({
      entity_type: "JOB",
      entity_id: job.id,
      action: "JOB_CREATED",
      meta: { title: job.title },
    });

    return job;
  }

  async update(id: string, patch: Partial<Omit<Job, "id" | "created_at">>): Promise<Job> {
    const existing = await db.jobs.get(id);
    if (!existing) throw new Error("Job not found");

    const updated: Job = {
      ...existing,
      ...patch,
      id: existing.id,
      created_at: existing.created_at,
      updated_at: nowIso(),
    };

    await db.jobs.put(updated);

    await eventLogRepo.append({
      entity_type: "JOB",
      entity_id: id,
      action: "JOB_UPDATED",
      meta: { patch },
    });

    return updated;
  }

  async setStatus(id: string, status: JobStatus): Promise<Job> {
    const job = await this.update(id, { status });
    await eventLogRepo.append({
      entity_type: "JOB",
      entity_id: id,
      action: "JOB_STATUS_CHANGED",
      meta: { status },
    });
    return job;
  }

  async setPriority(id: string, priority: JobPriority): Promise<Job> {
    const job = await this.update(id, { priority });
    await eventLogRepo.append({
      entity_type: "JOB",
      entity_id: id,
      action: "JOB_PRIORITY_CHANGED",
      meta: { priority },
    });
    return job;
  }

  async archive(id: string): Promise<Job> {
    const job = await this.update(id, { archived_at: nowIso() });
    await eventLogRepo.append({
      entity_type: "JOB",
      entity_id: id,
      action: "JOB_ARCHIVED",
      meta: {},
    });
    return job;
  }

  async duplicate(id: string, options?: { titleSuffix?: string }): Promise<Job> {
    const existing = await db.jobs.get(id);
    if (!existing) throw new Error("Job not found");

    const copy = await this.create({
      title: `${existing.title}${options?.titleSuffix ?? " (copy)"}`,
      reference: existing.reference,
      status: existing.status,
      priority: existing.priority,
      site: existing.site,
    });

    await eventLogRepo.append({
      entity_type: "JOB",
      entity_id: copy.id,
      action: "JOB_DUPLICATED",
      meta: { from_job_id: id },
    });

    return copy;
  }
}

export const jobRepo = new JobRepository();
