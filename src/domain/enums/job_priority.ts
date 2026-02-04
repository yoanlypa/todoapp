export const JobPriority = {
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

export type JobPriority = typeof JobPriority[keyof typeof JobPriority];
