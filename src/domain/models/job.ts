import { JobPriority } from "../enums/job_priority";
import { JobStatus } from "../enums/job_status";

export type JobSite = {
  address?: string;
  contact_name?: string;
  contact_phone?: string;
  schedule_note?: string;
};

export type Job = {
  id: string;
  title: string;
  reference?: string;

  status: JobStatus;
  priority: JobPriority;

  site?: JobSite;

  sort_order: number;

  created_at: string; // ISO
  updated_at: string; // ISO
  archived_at?: string | null;
};
