import { useEffect, useState } from "react";

import { todayRepo } from "../../data/repositories/today_repo";
import { jobItemRepo } from "../../data/repositories/job_item_repo";

import { JobItemType } from "../../domain/enums/item_type";
import { JobItemState } from "../../domain/enums/item_state";

import { addMinutes, tomorrowAt } from "../../shared/utils/time";

import type { CSSProperties } from "react";
import type { TodaySnapshot, TodayItem } from "../../data/repositories/today_repo";

const fillOn: CSSProperties = { fontVariationSettings: '"FILL" 1' };

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function TodayScreen() {
  const [snapshot, setSnapshot] = useState<TodaySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const snap = await todayRepo.getTodaySnapshot({ limitUrgent: 20, limitDue: 20 });
      setSnapshot(snap);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Today");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function markDone(t: TodayItem) {
    await jobItemRepo.setDone(t.item.id, t.item.state !== JobItemState.DONE);
    await load();
  }

  async function snoozePlus1h(t: TodayItem) {
    const next = addMinutes(new Date(), 60).toISOString();
    await jobItemRepo.snooze(t.item.id, next);
    await load();
  }

  async function snoozeTomorrow9(t: TodayItem) {
    const next = tomorrowAt(9, 0).toISOString();
    await jobItemRepo.snooze(t.item.id, next);
    await load();
  }

  async function convertToBuy(t: TodayItem) {
    await jobItemRepo.convertToBuy(t.item.id);
    await load();
  }

  const urgentCount = snapshot?.urgent.length ?? 0;
  const dueCount = snapshot?.due.length ?? 0;

  return (
    <div className="pb-2">
      {/* Top App Bar */}
      <header className="sticky top-0 z-10 bg-(--background-dark)/80 backdrop-blur-md">
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-(--muted)">Today</p>
            <h2 className="text-xl font-bold leading-tight tracking-tight">Your focus</h2>
          </div>

          <button
            onClick={() => void load()}
            className="flex size-10 items-center justify-center rounded-xl bg-(--card-dark) text-white"
            title="Refresh"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </header>

      <main className="px-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 py-4">
          <div className="rounded-xl border border-(--border-dark) bg-(--card-dark) p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-(--accent-yellow)" style={fillOn}>
                warning
              </span>
              <span className="rounded-full bg-(--accent-yellow)/10 px-2 py-0.5 text-xs font-bold text-(--accent-yellow)">
                Urgent
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold">{urgentCount}</div>
              <div className="text-sm text-(--muted)">Pending urgent</div>
            </div>
          </div>

          <div className="rounded-xl border border-(--border-dark) bg-(--card-dark) p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-(--primary)" style={fillOn}>
                schedule
              </span>
              <span className="rounded-full bg-(--primary)/10 px-2 py-0.5 text-xs font-bold text-(--primary)">
                Due
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold">{dueCount}</div>
              <div className="text-sm text-(--muted)">Reminders due</div>
            </div>
          </div>
        </div>

        {loading ? <p className="text-(--muted)">Loading…</p> : null}
        {error ? <p className="text-red-300">{error}</p> : null}

        {/* Urgent section */}
        <div className="flex items-center justify-between pb-22 pt-2">
          <h3 className="text-lg font-bold">Urgent</h3>
          <span className="text-sm text-(--muted)">{urgentCount}</span>
        </div>

        <div className="flex flex-col gap-4 pb-6">
          {snapshot?.urgent.length ? (
            snapshot.urgent.map((t) => (
              <TodayCard
                key={t.item.id}
                t={t}
                badge="URGENT"
                borderClass="border-(--accent-yellow)"
                onDone={() => void markDone(t)}
                onSnooze1h={() => void snoozePlus1h(t)}
                onSnoozeTomorrow={() => void snoozeTomorrow9(t)}
                onConvertBuy={() => void convertToBuy(t)}
              />
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-(--border-dark) bg-(--card-dark)/40 p-4 text-(--muted)">
              No urgent items.
            </div>
          )}
        </div>

        {/* Due section */}
        <div className="flex items-center justify-between pb-2">
          <h3 className="text-lg font-bold">Due reminders</h3>
          <span className="text-sm text-(--muted)">{dueCount}</span>
        </div>

        <div className="flex flex-col gap-4 pb-10">
          {snapshot?.due.length ? (
            snapshot.due.map((t) => (
              <TodayCard
                key={t.item.id}
                t={t}
                badge={t.item.reminder_at ? formatTime(t.item.reminder_at) : "DUE"}
                borderClass="border-(--primary)"
                onDone={() => void markDone(t)}
                onSnooze1h={() => void snoozePlus1h(t)}
                onSnoozeTomorrow={() => void snoozeTomorrow9(t)}
                onConvertBuy={() => void convertToBuy(t)}
              />
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-(--border-dark) bg-(--card-dark)/40 p-4 text-(--muted)">
              No due reminders.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function TodayCard(props: {
  t: TodayItem;
  badge: string;
  borderClass: string;
  onDone: () => void;
  onSnooze1h: () => void;
  onSnoozeTomorrow: () => void;
  onConvertBuy: () => void;
}) {
  const { item, job } = props.t;

  return (
    <div className={`flex items-stretch justify-between gap-4 rounded-xl border-l-4 ${props.borderClass} bg-(--card-dark) p-4 shadow-lg`}>
      <div className="flex flex-[2_2_0px] flex-col justify-between py-1">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-(--muted)">
              {job?.title ?? "Unknown job"}
            </span>
            <span className="text-[10px] text-(--muted)">•</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">{props.badge}</span>
          </div>

          <p className="mt-1 text-base font-bold leading-tight">{item.title}</p>

          <div className="mt-1 text-xs text-(--muted)">
            {item.type}
            {item.type === JobItemType.BUY && item.quantity ? ` • qty ${item.quantity.amount}${item.quantity.unit ? ` ${item.quantity.unit}` : ""}` : ""}
            {item.store?.name ? ` • ${item.store.name}` : ""}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={props.onDone}
            className="h-8 rounded-lg bg-(--primary) px-3 text-xs font-bold tracking-wide text-white"
          >
            {item.state === JobItemState.DONE ? "UNDO" : "DONE"}
          </button>

          <button
            onClick={props.onSnooze1h}
            className="h-8 rounded-lg bg-white/5 px-3 text-xs font-bold tracking-wide text-slate-200 ring-1 ring-white/10"
          >
            +1h
          </button>

          <button
            onClick={props.onSnoozeTomorrow}
            className="h-8 rounded-lg bg-white/5 px-3 text-xs font-bold tracking-wide text-slate-200 ring-1 ring-white/10"
          >
            Tomorrow 9:00
          </button>

          {item.type !== JobItemType.BUY ? (
            <button
              onClick={props.onConvertBuy}
              className="h-8 rounded-lg bg-white/5 px-3 text-xs font-bold tracking-wide text-slate-200 ring-1 ring-white/10"
              title="Convert to BUY"
            >
              To BUY
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex w-20 flex-col items-end justify-between">
        <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-bold tracking-widest text-(--muted) ring-1 ring-white/10">
          {item.urgency}
        </span>

        {job?.reference ? (
          <span className="text-[10px] text-(--muted)">Ref {job.reference}</span>
        ) : (
          <span className="text-[10px] text-(--muted)">&nbsp;</span>
        )}
      </div>
    </div>
  );
}
