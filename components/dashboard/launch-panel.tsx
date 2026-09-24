import type { RunProgress, RunRecord } from "@/lib/types";
import { STAGES } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LaunchPanel({ progress, lastRun }: { progress?: RunProgress; lastRun?: RunRecord }) {
  const running = progress?.running ?? false;
  const step = running ? progress!.stageIndex : 4;

  const funnel = lastRun
    ? [
        { value: lastRun.found, label: "ditemukan dari semua sumber", pct: 100, color: "var(--foreground)", stage: 2 },
        {
          value: lastRun.passedLocal,
          label: "lolos filter local LLM",
          pct: lastRun.found ? (lastRun.passedLocal / lastRun.found) * 100 : 0,
          color: "var(--primary)",
          stage: 3,
        },
        {
          value: lastRun.recommended,
          label: "direkomendasikan (di atas ambang)",
          pct: lastRun.found ? Math.max(3, (lastRun.recommended / lastRun.found) * 100) : 0,
          color: "var(--success)",
          stage: 4,
        },
      ]
    : [];

  return (
    <section aria-label="Sekuens pipeline">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="eyebrow">Sekuens pipeline</p>
        <p className="font-mono text-[10.5px] text-primary" aria-live="polite">
          {running ? `TAHAP ${step + 1}/4 — ${STAGES[step].label.toUpperCase()}` : "SELESAI · 4/4"}
        </p>
      </div>

      <ol className="mb-4 grid grid-cols-4 gap-1.5">
        {STAGES.map((s, i) => {
          const done = i < step;
          const active = running && i === step;
          return (
            <li key={s.key} className="flex flex-col gap-1.5">
              <span
                className={cn(
                  "h-1 rounded-sm transition-colors",
                  done ? "bg-primary" : active ? "anim-blink bg-primary/60" : "bg-border",
                )}
              />
              <span className={cn("font-mono text-[9.5px] tracking-[0.05em] uppercase", active ? "text-primary" : "text-faint")}>
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col gap-2.5">
        {funnel.map((f) => {
          const lit = !running || step >= f.stage - 1;
          return (
            <div key={f.label} className="flex items-center gap-3.5">
              <span
                className="w-11 text-right font-display text-[22px] font-bold tabular-nums transition-colors"
                style={{ color: lit ? f.color : "var(--border)" }}
              >
                {f.value}
              </span>
              <div className="flex flex-1 flex-col gap-1">
                <div className="h-2 overflow-hidden rounded bg-muted">
                  <div
                    className="h-full rounded transition-[width] duration-700 ease-[cubic-bezier(.2,.8,.2,1)]"
                    style={{ width: `${lit ? f.pct : 0}%`, background: f.color }}
                  />
                </div>
                <span className="font-mono text-[10.5px] text-faint">{f.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
