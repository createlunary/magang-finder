"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, CircleCheck, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";
import { CompanyResearchPanel } from "@/components/shared/company-research";
import { JobChatPanel } from "@/components/shared/job-chat";
import { ConsoleLabel, ConsolePanel } from "@/components/shared/console-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useJob, useUpdateJob } from "@/hooks/use-api";
import type { JobStatus } from "@/lib/types";
import { IS_SHOWCASE } from "@/lib/mode";
import { STATUS_LABEL, sourceLabel } from "@/lib/types";
import { amanUrl, bandColor, bandLabel, formatDate, scoreBand } from "@/lib/utils";

const FLOW: JobStatus[] = ["baru", "dilamar", "diterima", "ditolak"];

export default function DetailLowonganPage() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading, error } = useJob(id);
  const update = useUpdateJob(id);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (job) setNotes(job.notes);
  }, [job?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return <p className="px-4 sm:px-6 lg:px-10 pt-10 font-mono text-sm text-danger">{(error as Error).message}</p>;
  }
  if (isLoading || !job) {
    return (
      <div className="px-4 sm:px-6 lg:px-10 pt-10">
        <Skeleton className="h-[600px] max-w-4xl rounded-2xl" />
      </div>
    );
  }

  const band = scoreBand(job.score);
  const color = bandColor[band];

  return (
    <div className="relative max-w-5xl px-4 sm:px-6 lg:px-10 pt-9 pb-16">
      <span aria-hidden="true" className="pointer-events-none absolute top-5 left-2 lg:left-9 font-display text-[130px] leading-none font-bold text-foreground/[0.045] select-none">03</span>

      <div className="relative">
        <Link href="/lowongan" className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> kembali ke daftar lowongan
        </Link>
        <p className="eyebrow mt-2 mb-4">[ 03 ] &mdash; Berkas detail</p>

        <Card className="flex flex-col gap-6 px-5 py-6 sm:px-8 sm:py-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <h1 className="font-display text-2xl font-bold">{job.role}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{job.company}</p>
            </div>
            <div className="relative size-[84px] shrink-0" aria-label={`Skor ${job.score}, ${bandLabel[band]}`}>
              <svg viewBox="0 0 84 84" className="absolute inset-0" aria-hidden="true">
                <circle cx="42" cy="42" r="38" fill="none" stroke={color} strokeOpacity={0.25} strokeWidth={2} strokeDasharray="3 5" />
                <circle cx="42" cy="42" r="38" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeDasharray={`${(job.score / 100) * 238.8} 238.8`} transform="rotate(-90 42 42)" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-2xl leading-none font-bold" style={{ color }}>{job.score}</span>
                <span className="mt-0.5 font-mono text-[8.5px] tracking-[0.06em] text-faint uppercase">{bandLabel[band]}</span>
              </div>
            </div>
          </div>

          {/* Status lamaran & catatan: data pribadi, tidak ada di showcase. */}
          {!IS_SHOWCASE && (
          <div>
            <p className="eyebrow mb-2.5">Status lamaran</p>
            <div className="flex flex-wrap items-center gap-2">
              {FLOW.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <Button
                    variant="chip"
                    size="sm"
                    data-active={job.status === s}
                    aria-pressed={job.status === s}
                    disabled={update.isPending}
                    onClick={() =>
                      update.mutate({ status: s }, { onSuccess: () => toast(`Status diubah ke "${STATUS_LABEL[s]}"`) })
                    }
                  >
                    {STATUS_LABEL[s]}
                  </Button>
                  {i < 2 && <span className="font-mono text-faint" aria-hidden="true">→</span>}
                  {i === 2 && <span className="font-mono text-faint" aria-hidden="true">/</span>}
                </div>
              ))}
            </div>
          </div>
          )}

          <dl className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-subtle p-4 sm:grid-cols-4">
            {[
              ["Sumber", sourceLabel(job.source)],
              ["Lokasi", job.lokasi],
              ["Deadline", formatDate(job.deadline, true)],
              ["Ditemukan", formatDate(job.foundAt, true)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="font-mono text-[10px] tracking-[0.06em] text-faint uppercase">{k}</dt>
                <dd className="mt-1 text-[13.5px] font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          <div>
            <p className="eyebrow mb-2">Skill diminta</p>
            <div className="flex flex-wrap gap-2">
              {job.tags.map((t) => <Badge key={t}>{t}</Badge>)}
            </div>
          </div>

          <ConsolePanel>
            <ConsoleLabel className="mb-2 text-primary">&gt; log analisis Claude</ConsoleLabel>
            <p className="text-[13.5px] leading-relaxed">{job.reasoning}</p>
          </ConsolePanel>

          <div className="grid gap-6 sm:grid-cols-2">
            {job.mustHave.length > 0 && (
            <div>
              <p className="eyebrow mb-2.5">Must-have</p>
              <ul className="flex flex-col gap-2">
                {job.mustHave.map((m) => (
                  <li key={m.label} className="flex items-start gap-2 text-[13px]">
                    {m.met ? <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-label="terpenuhi" /> : <X className="mt-0.5 size-3.5 shrink-0 text-danger" aria-label="tidak terpenuhi" />}
                    <span className={m.met ? "" : "text-muted-foreground"}>{m.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            )}
            <div>
              <p className="eyebrow mb-2.5">Red flag</p>
              {job.redFlags.length ? (
                <ul className="flex flex-col gap-2">
                  {job.redFlags.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-[13px]">
                      <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-danger" aria-hidden="true" />
                      {r}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="flex items-center gap-2 text-[13px]">
                  <CircleCheck className="size-3.5 text-success" aria-hidden="true" /> Tidak ada red flag terdeteksi
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="eyebrow mb-3">Riwayat skor per versi profil</p>
            <div className="flex flex-col gap-2.5">
              {job.scoreHistory.map((h, i) => (
                <div key={h.version} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 font-mono text-[11px] text-faint sm:w-44">
                    {h.version} &middot; {formatDate(h.date, true)}{i === job.scoreHistory.length - 1 ? " (kini)" : ""}
                  </span>
                  <div className="h-[7px] flex-1 overflow-hidden rounded bg-muted">
                    <div className="h-full rounded bg-primary transition-[width] duration-700" style={{ width: `${h.score}%` }} />
                  </div>
                  <span className="w-8 shrink-0 text-right font-mono text-xs font-semibold tabular-nums">{h.score}</span>
                </div>
              ))}
            </div>
          </div>

          {!IS_SHOWCASE && (
          <div>
            <label htmlFor="notes" className="eyebrow mb-2 block">Catatan pribadi</label>
            <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tulis catatan tentang lowongan ini…" />
            <div className="mt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                disabled={notes === job.notes || update.isPending}
                onClick={() => update.mutate({ notes }, { onSuccess: () => toast("Catatan disimpan") })}
              >
                Simpan catatan
              </Button>
            </div>
          </div>
          )}

          <Button asChild className="self-start">
            <a href={amanUrl(job.url)} target="_blank" rel="noopener noreferrer">
              Lihat sumber lowongan asli <ArrowUpRight />
            </a>
          </Button>
        </Card>

        {job.company !== "—" && (
          <div className="mt-5">
            <CompanyResearchPanel jobId={job.id} company={job.company} />
          </div>
        )}

        {!IS_SHOWCASE && (
        <div className="mt-5">
          <JobChatPanel jobId={job.id} company={job.company !== "—" ? job.company : "perusahaannya"} />
        </div>
        )}
      </div>
    </div>
  );
}
