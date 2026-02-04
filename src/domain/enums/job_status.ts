export const JobStatus = {
  PREP: "PREP",
  EXEC: "EXEC",
  DONE: "DONE",
} as const;

export type JobStatus = typeof JobStatus[keyof typeof JobStatus];
