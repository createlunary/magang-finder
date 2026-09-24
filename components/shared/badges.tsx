import { Badge } from "@/components/ui/badge";
import type { JobStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";
import { cn, scoreBand } from "@/lib/utils";

const statusVariant: Record<JobStatus, "info" | "accent" | "success" | "danger"> = {
  baru: "info",
  dilamar: "accent",
  diterima: "success",
  ditolak: "danger",
};

export function StatusBadge({ status }: { status: JobStatus }) {
  return <Badge variant={statusVariant[status]}>{STATUS_LABEL[status]}</Badge>;
}

export function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const band = scoreBand(score);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[10px] font-mono font-bold",
        band === "kuat" && "bg-success/15 text-success",
        band === "sedang" && "bg-primary/15 text-accent-text",
        band === "lemah" && "bg-muted text-faint",
        size === "sm" && "px-2 py-0.5 text-[13px]",
        size === "md" && "px-3.5 py-1.5 text-base",
        size === "lg" && "px-4 py-2 text-[22px]",
      )}
      aria-label={`Skor kecocokan ${score}`}
    >
      {score}
    </span>
  );
}
