"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Loader2, Pause, Play, Rocket, Square } from "lucide-react";
import { toast } from "sonner";
import { OrbitRadar } from "@/components/dashboard/orbit-radar";
import { Countdown } from "@/components/dashboard/countdown";
import { LaunchPanel } from "@/components/dashboard/launch-panel";
import { TelemetryTicker } from "@/components/dashboard/telemetry-ticker";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { ScoreBadge } from "@/components/shared/badges";
import { JobMeta } from "@/components/shared/job-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SnapshotInfo } from "@/components/shared/snapshot-info";
import { useJobs, useRunProgress, useSettings, useStartRun, useStopRun, useSummary } from "@/hooks/use-api";
import { IS_SHOWCASE } from "@/lib/mode";
import { sourceLabel } from "@/lib/types";
import { bandColor, formatDate, formatDuration, scoreBand } from "@/lib/utils";

const RADAR_MAX = 12;

export default function DashboardPage() {
  const { data: summary } = useSummary();
  const { data: jobs = [], isLoading } = useJobs({ sort: "skor" });
  const { data: settings } = useSettings();
  const { data: progress } = useRunProgress();
  const startRun = useStartRun();
  const stopRun = useStopRun();

  const [selectedId, setSelectedId] = useState<string>();
  const [paused, setPaused] = useState(false);

  const running = progress?.running ?? false;
  const threshold = settings?.threshold ?? 70;
  const selected = jobs.find((j) => j.id === selectedId) ?? jobs[0];
  const top = jobs.filter((j) => j.score >= threshold).slice(0, 3);
  const lastRun = summary?.lastRun;

  const launch = () =>
    startRun.mutate(undefined, {
      onSuccess: () => toast("Pipeline diluncurkan", { description: "Scrape → Dedup → Local LLM → Ranking" }),
      onError: (e) => toast.error(e.message),
    });

  const stop = () => {
    // Run bisa berjalan puluhan menit; jangan sampai terhenti karena salah klik.
    if (!window.confirm("Hentikan run yang sedang berjalan? Lowongan yang sudah diproses tetap tersimpan.")) return;
    stopRun.mutate(undefined, {
      onSuccess: () => toast("Run dihentikan", { description: "Sisa lowongan akan diproses di run berikutnya" }),
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <div>
      {/* Header strip */}
      <div className="flex flex-wrap items-center justify-between gap-5 border-b border-border px-4 sm:px-6 lg:px-10 py-5">
        <div className="flex flex-wrap items-center gap-5 font-mono text-[11px] tracking-[0.06em] text-faint">
          <span className="text-foreground">[ 01 ] MISSION CONTROL</span>
          {lastRun && (
            <span>
              RUN TERAKHIR <span className="text-foreground">{formatDuration(lastRun.durationSec)}</span> &middot;{" "}
              <span className={lastRun.status === "berhasil" ? "text-success" : "text-danger"}>
                {lastRun.status === "berhasil" ? "NOMINAL" : "GAGAL"}
              </span>
            </span>
          )}
          <span className="flex items-center gap-2">
            <span className="anim-blink size-1.5 rounded-full bg-primary" />
            {running ? "PIPELINE AKTIF" : "STANDBY"}
          </span>
        </div>
        {IS_SHOWCASE ? (
          <SnapshotInfo />
        ) : (
        <div className="flex items-center gap-4">
          <Countdown target={summary?.nextRunAt} />
          {running && (
            <Button size="lg" variant="outline" onClick={stop} disabled={stopRun.isPending} className="font-mono font-bold hover:border-danger hover:text-danger">
              {stopRun.isPending ? <Loader2 className="animate-spin" /> : <Square className="fill-current" />}
              {stopRun.isPending ? "Menghentikan…" : "Hentikan"}
            </Button>
          )}
          <Button size="lg" onClick={launch} disabled={running || startRun.isPending} className="shadow-[0_0_0_0_var(--primary)] data-[running=true]:shadow-[0_0_0_6px_color-mix(in_srgb,var(--primary)_20%,transparent)]" data-running={running}>
            {running ? <Loader2 className="animate-spin" /> : <Rocket />}
            {running ? "Meluncurkan…" : "Jalankan Sekarang"}
          </Button>
        </div>
        )}
      </div>

      {/* Hero */}
      <div className="flex flex-wrap items-start gap-6 px-4 pt-6 sm:px-6 lg:gap-9 lg:px-10 lg:pt-8">
        <div className="anim-rise flex w-full max-w-[520px] shrink-0 flex-col gap-3">
          {isLoading ? (
            <Skeleton className="aspect-square w-full rounded-full" />
          ) : (
            // Radar dirancang untuk belasan satelit; daftar lengkap ada di halaman Lowongan.
            <OrbitRadar jobs={jobs.slice(0, RADAR_MAX)} selectedId={selected?.id} onSelect={setSelectedId} paused={paused} fast={running} />
          )}
          <div className="flex items-center justify-between font-mono text-[10.5px] tracking-[0.04em] text-faint">
            <span>jarak orbit = skor kecocokan &middot; klik satelit</span>
            <Button variant="chip" size="sm" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>
              {paused ? <Play /> : <Pause />}
              {paused ? "lanjutkan orbit" : "jeda orbit"}
            </Button>
          </div>
        </div>

        <div className="anim-rise flex min-w-[min(360px,100%)] flex-1 flex-col gap-6" style={{ animationDelay: "0.12s" }}>
          <div>
            <p className="eyebrow mb-2.5">Laporan orbit &middot; {lastRun ? formatDate(lastRun.startedAt, true) : "—"}</p>
            <h1 className="font-display text-[34px] leading-[1.02] font-bold tracking-[-0.02em] sm:text-[46px]">
              {lastRun?.found ?? "—"} sinyal tertangkap.
            </h1>
            <p className="font-display text-[34px] leading-[1.02] font-bold tracking-[-0.02em] text-faint sm:text-[46px]">
              <span className="text-primary">{lastRun?.recommended ?? "—"}</span> layak diluncurkan.
            </p>
          </div>

          {selected && (
            <Card className="relative flex flex-col gap-3.5 overflow-hidden px-6 py-5">
              <span
                className="absolute inset-x-0 top-0 h-0.5"
                style={{ background: bandColor[scoreBand(selected.score)] }}
              />
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] tracking-[0.08em]" style={{ color: bandColor[scoreBand(selected.score)] }}>
                  ◎ TARGET TERKUNCI
                </span>
                <JobMeta job={selected} />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-display text-xl leading-tight font-bold">{selected.role}</h2>
                  <p className="mt-0.5 text-[13.5px] text-muted-foreground">{selected.company}</p>
                </div>
                <span
                  className="font-display text-[40px] leading-none font-bold tabular-nums"
                  style={{ color: bandColor[scoreBand(selected.score)] }}
                >
                  {selected.score}
                </span>
              </div>
              <p className="text-[13px] leading-relaxed text-muted-foreground">{selected.reasoning}</p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {selected.tags.map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
                <Link href={`/lowongan/${selected.id}`} className="flex items-center gap-1 font-mono text-xs font-bold text-primary hover:underline">
                  Buka berkas <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </Card>
          )}

          <LaunchPanel progress={progress} lastRun={lastRun} />
        </div>
      </div>

      <div className="mt-8">
        <TelemetryTicker log={progress?.log ?? []} fast={running} />
      </div>

      {/* Tren + rekomendasi */}
      <div className="grid gap-5 px-4 sm:px-6 lg:px-10 pt-8 pb-16 xl:grid-cols-[1.1fr_1fr]">
        <Card className="px-6 py-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="eyebrow">Tren 7 hari</p>
            <div className="flex gap-4 font-mono text-[10.5px] text-faint">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" /> ditemukan</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-success" /> direkomendasikan</span>
            </div>
          </div>
          {summary ? <TrendChart data={summary.trend} /> : <Skeleton className="h-56" />}
        </Card>

        <div className="flex flex-col gap-3">
          <p className="eyebrow">Rekomendasi teratas &middot; siap diluncurkan</p>
          {top.map((j, i) => (
            <Link
              key={j.id}
              href={`/lowongan/${j.id}`}
              className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-primary"
            >
              <div className="min-w-0">
                <p className="font-mono text-[10px] tracking-[0.06em] text-faint">
                  #{i + 1} &middot; {sourceLabel(j.source)}
                </p>
                <p className="mt-1 truncate font-display text-[15px] font-bold">{j.role}</p>
                <p className="text-[12.5px] text-muted-foreground">
                  {j.company} &middot; {j.lokasi}
                </p>
              </div>
              <ScoreBadge score={j.score} size="sm" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
