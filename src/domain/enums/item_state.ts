export const JobItemState = {
  PENDING: "PENDING",
  DONE: "DONE",
} as const;

export type JobItemState = typeof JobItemState[keyof typeof JobItemState];
