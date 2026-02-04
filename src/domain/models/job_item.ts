import { JobItemType } from "../enums/item_type";
import { JobItemState } from "../enums/item_state";
import { ItemUrgency } from "../enums/item_urgency";

export type Quantity = {
  amount: number;
  unit?: string;
};

export type StoreInfo = {
  name?: string;
  reference?: string;
};

export type JobItem = {
  id: string;
  job_id: string;

  type: JobItemType;
  title: string;
  details?: string;

  urgency: ItemUrgency;
  state: JobItemState;

  sort_order: number;

  quantity?: Quantity;
  store?: StoreInfo;

  reminder_at?: string | null;

  created_at: string;
  updated_at: string;

  done_at?: string | null;
};
