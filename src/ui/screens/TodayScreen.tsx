import type { CSSProperties } from "react";

const fillOn: CSSProperties = { fontVariationSettings: '"FILL" 1' };

export function TodayScreen() {
  return (
    <div className="pb-2">
      {/* Top App Bar */}
      <header className="sticky top-0 z-10 bg-(--background-dark)/80 backdrop-blur-md">
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex size-12 shrink-0 items-center">
            <div
              className="size-10 rounded-full border-2 border-(--primary) bg-cover bg-center"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBzQOz5MQkg1tESZtu1XG-BHM8jDGt5zyXZeHuax7-mk3-fYBVtAikt-O0KsrIAEiEL0SS01kREyMBBSCswXY1W9iNwpyay4xuZWpvjrmJawKstgQ2E0GupF2dMlPPh7zjr3WSE56GCczhrzThMlH-rs7huk76juLwgQG7mnHkx6BU7p74dlxQnoPe1jlrojIGrKUqb5s53_ryOMpn9hnwHh-FXArgzxstmKWd_9YtYkJ1f2NcpXF6p0fSF2w6ApGPWibHFSGiNa2fe")',
              }}
              aria-label="User avatar"
            />
          </div>

          <div className="flex-1 px-3">
            <p className="text-xs font-medium uppercase tracking-wider text-(--muted)">
              Today
            </p>
            <h2 className="text-xl font-bold leading-tight tracking-tight">
              Good morning
            </h2>
          </div>

          <button className="relative flex size-10 items-center justify-center rounded-xl bg-(--card-dark) text-white">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-(--primary)" />
          </button>
        </div>
      </header>

      <main className="px-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 py-4">
          <div className="rounded-xl border border-(--border-dark) bg-(--card-dark) p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span
                className="material-symbols-outlined text-(--accent-yellow)"
                style={fillOn}
              >
                warning
              </span>
              <span className="rounded-full bg-(--accent-yellow)/10 px-2 py-0.5 text-xs font-bold text-(--accent-yellow)">
                High
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold">2</div>
              <div className="text-sm text-(--muted)">Urgent Tasks</div>
            </div>
          </div>

          <div className="rounded-xl border border-(--border-dark) bg-(--card-dark) p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span
                className="material-symbols-outlined text-(--primary)"
                style={fillOn}
              >
                shopping_cart
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold">3</div>
              <div className="text-sm text-(--muted)">Pending Orders</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pb-2 pt-4">
          <h3 className="text-lg font-bold">Tasks for Today</h3>
          <button className="text-sm font-medium text-(--primary)">
            View Schedule
          </button>
        </div>

        {/* Task list (mock data) */}
        <div className="flex flex-col gap-4 py-2">
          <div className="flex items-stretch justify-between gap-4 rounded-xl border-l-4 border-(--accent-yellow) bg-(--card-dark) p-4 shadow-lg">
            <div className="flex flex-[2_2_0px] flex-col justify-between py-1">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-(--accent-yellow)">
                    Urgent
                  </span>
                  <span className="text-[10px] text-(--muted)">•</span>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-(--muted)">
                    Restaurante X
                  </span>
                </div>
                <p className="mt-1 text-base font-bold leading-tight">
                  Install 2 main entrance doors
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button className="h-8 rounded-lg bg-(--primary) px-4 text-xs font-bold tracking-wide text-white">
                  START JOB
                </button>
                <span className="flex items-center gap-1 text-xs font-medium text-(--muted)">
                  <span className="material-symbols-outlined text-sm">
                    schedule
                  </span>
                  09:00 AM
                </span>
              </div>
            </div>

            <div
              className="h-24 w-24 rounded-xl bg-cover bg-center"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCzSm8rTnIoO9gPebp08r_sKOP3pdL2OGIQ5bA-OCyjv4_jfneDXQo8Wu9hjHV7EG-E2v921Ne_ySuteNyHoA3Y3jS6hAMKBOhKDZNYuFHgT2WC-kNxm2_uq7uRh7LwAnqaqK9R888X0OiH3b7-uUCwAfGgiCIKyZAPH6NK1TkwWLrZZjM08zysllQSIqxExUIoQYDIP3NqUIxlDiRm3HKnfDatLvzR_KEJJGn3hYdOT06sGX3CljXWhvRj0hAna2mhaSrn9oOLI7GO")',
              }}
              aria-label="Task image"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
