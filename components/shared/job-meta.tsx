import { Clock, Globe, MapPin } from "lucide-react";
import type { Job } from "@/lib/types";
import { sourceLabel } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function JobMeta({ job }: { job: Pick<Job, "lokasi" | "deadline" | "source"> }) {
  return (
    <div className="flex flex-wrap items-center gap-3.5 font-mono text-[11px] text-faint">
      <span className="flex items-center gap-1.5">
        <MapPin className="size-3" aria-hidden="true" />
        {job.lokasi}
      </span>
      <span className="flex items-center gap-1.5">
        <Clock className="size-3" aria-hidden="true" />
        {formatDate(job.deadline)}
      </span>
      <span className="flex items-center gap-1.5">
        <Globe className="size-3" aria-hidden="true" />
        {sourceLabel(job.source)}
      </span>
    </div>
  );
}
