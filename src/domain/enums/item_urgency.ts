export const ItemUrgency = {
  NORMAL: "NORMAL",
  URGENT: "URGENT",
} as const;

export type ItemUrgency = typeof ItemUrgency[keyof typeof ItemUrgency];
