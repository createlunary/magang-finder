"use client";

import { useQuery } from "@tanstack/react-query";
import { Cpu } from "lucide-react";
import { ambilSnapshot } from "@/lib/api";
import { timeAgo } from "@/lib/utils";

/** Pengganti tombol run di showcase: dari mana data ini datang, dan kapan terakhir diperbarui. */
export function SnapshotInfo({ className = "" }: { className?: string }) {
  const { data } = useQuery({ queryKey: ["snapshot-info"], queryFn: ambilSnapshot, staleTime: 60_000 });
  return (
    <div className={`flex items-center gap-3 rounded-xl border border-border bg-muted/60 px-3.5 py-2 ${className}`}>
      <Cpu className="size-4 shrink-0 text-primary" />
      <div className="font-mono text-[10.5px] leading-snug tracking-[0.04em] text-muted-foreground">
        <p className="text-foreground">PIPELINE BERJALAN DI MESIN LOKAL</p>
        <p>
          Qwen 7B lokal + Claude · data diperbarui {data ? timeAgo(data.dibuat) : "…"}
        </p>
      </div>
    </div>
  );
}
