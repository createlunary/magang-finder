import type { LogLine } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TelemetryTicker({ log, fast }: { log: LogLine[]; fast: boolean }) {
  if (!log.length) return null;
  const items = [...log, ...log];
  return (
    <div className="overflow-hidden border-y border-border bg-console-deep whitespace-nowrap" aria-label="Log telemetri run">
      <div className="inline-flex" style={{ animation: `ticker ${fast ? 14 : Math.max(24, log.length * 6)}s linear infinite` }}>
        {items.map((l, i) => (
          <span
            key={i}
            aria-hidden={i >= log.length}
            className="inline-block border-r border-console-border px-7 py-3 font-mono text-[11.5px] text-console-foreground/70"
          >
            <span className={cn(l.level === "warn" ? "text-danger" : "text-primary")}>{l.t}</span>
            &nbsp;&nbsp;{l.msg}
          </span>
        ))}
      </div>
    </div>
  );
}
