"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { Network, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ConsoleLabel, ConsolePanel } from "@/components/shared/console-panel";
import { ScoreBadge, StatusBadge } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NeuralMap } from "@/components/lowongan/neural-map";
import { useCompanies, useJobs, useProfile, useSources } from "@/hooks/use-api";
import type { JobQuery, JobStatus, SourceKey } from "@/lib/types";
import { IS_SHOWCASE } from "@/lib/mode";
import { STATUS_LABEL, sourceLabel } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const STATUSES: (JobStatus | "semua")[] = ["semua", "baru", "dilamar", "diterima", "ditolak"];

export default function LowonganPage() {
  // Chip sumber mengikuti sumber aktif di backend; null = belum difilter (semua).
  const { data: sourceList = [] } = useSources();
  const SOURCES = sourceList.filter((s) => s.enabled).map((s) => s.key);
  const [picked, setPicked] = useState<SourceKey[] | null>(null);
  const sources = picked ?? SOURCES;
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<JobStatus | "semua">("semua");
  const [minScore, setMinScore] = useState(0);
  const [sort, setSort] = useState<JobQuery["sort"]>("skor");

  const deferredQ = useDeferredValue(q);
  const deferredScore = useDeferredValue(minScore);
  const { data: jobs = [], isLoading, isFetching } = useJobs({
    q: deferredQ,
    sources: picked ?? undefined,
    status,
    minScore: deferredScore,
    sort,
  });

  const { data: companies = [] } = useCompanies();
  const { data: profile } = useProfile();
  const [peta, setPeta] = useState(true);

  const toggleSource = (s: SourceKey) =>
    setPicked(sources.includes(s) ? sources.filter((x) => x !== s) : [...sources, s]);

  return (
    <div className="pb-16">
      <PageHeader index="02" eyebrow="Pencarian kandidat" title="Lowongan" description="Semua kandidat hasil pipeline — bisa difilter, diurutkan, dan dicari secara semantik" />

      <div className="px-4 sm:px-6 lg:px-10 pt-6">
        <ConsolePanel className="flex flex-col gap-5">
          <div>
            <ConsoleLabel className="mb-2">&gt; pencarian semantik</ConsoleLabel>
            <label className="relative block max-w-lg">
              <span className="sr-only">Pencarian semantik</span>
              <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-console-muted" aria-hidden="true" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder='cth: "backend python remote"'
                className="h-11 w-full rounded-lg border border-console-border bg-console-deep pr-3 pl-10 font-mono text-[13px] text-console-foreground outline-none placeholder:text-console-muted focus-visible:border-primary"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-end gap-7">
            <div>
              <ConsoleLabel className="mb-2">Sumber</ConsoleLabel>
              <div className="flex flex-wrap gap-2">
                {SOURCES.map((s) => (
                  <Button key={s} variant="console" size="sm" data-active={sources.includes(s)} aria-pressed={sources.includes(s)} onClick={() => toggleSource(s)}>
                    {sourceLabel(s)}
                  </Button>
                ))}
              </div>
            </div>
            {/* Status lamaran = data pribadi; showcase tidak memuatnya. */}
            {!IS_SHOWCASE && (
            <div>
              <ConsoleLabel className="mb-2">Status</ConsoleLabel>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <Button key={s} variant="console" size="sm" data-active={status === s} aria-pressed={status === s} onClick={() => setStatus(s)}>
                    {s === "semua" ? "Semua" : STATUS_LABEL[s]}
                  </Button>
                ))}
              </div>
            </div>
            )}
            <div className="w-48">
              <ConsoleLabel className="mb-1">Skor minimum: {minScore}</ConsoleLabel>
              <Slider tone="console" thumbLabel="Skor minimum" min={0} max={100} step={1} value={[minScore]} onValueChange={([v]) => setMinScore(v)} />
            </div>
          </div>
        </ConsolePanel>
      </div>

      <div className="px-4 pt-4 sm:px-6 lg:px-10">
        <ConsolePanel className="px-4 py-4 sm:px-6 sm:py-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <ConsoleLabel className="text-primary">&gt; jaringan saraf &middot; skill &rarr; lowongan &rarr; perusahaan</ConsoleLabel>
            <Button variant="console" size="sm" onClick={() => setPeta((v) => !v)} aria-expanded={peta}>
              <Network className="size-3.5" /> {peta ? "sembunyikan" : "tampilkan"}
            </Button>
          </div>
          {peta && (isLoading ? (
            <Skeleton className="h-96 rounded-xl bg-console-deep" />
          ) : (
            <NeuralMap jobs={jobs} companies={companies} profile={profile} total={jobs.length} />
          ))}
        </ConsolePanel>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 pt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow" aria-live="polite">
            {jobs.length} kandidat {isFetching && !isLoading ? "· memperbarui…" : ""}
          </p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-faint">urutkan:</span>
            <Button variant="chip" size="sm" data-active={sort === "skor"} aria-pressed={sort === "skor"} onClick={() => setSort("skor")}>Skor tertinggi</Button>
            <Button variant="chip" size="sm" data-active={sort === "deadline"} aria-pressed={sort === "deadline"} onClick={() => setSort("deadline")}>Deadline terdekat</Button>
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-80 rounded-2xl" />
        ) : (
          <>
          {/* Layar kecil: kartu yang seluruhnya bisa diketuk, bukan tabel 6 kolom. */}
          <ul className="flex flex-col gap-2.5 md:hidden">
            {jobs.map((j) => (
              <li key={j.id}>
                <Link
                  href={`/lowongan/${j.id}`}
                  className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card px-4 py-3.5 active:bg-muted"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="block font-display text-[15px] leading-snug font-bold">{j.role}</span>
                      <span className="block text-[12.5px] text-muted-foreground">{j.company}</span>
                    </div>
                    <ScoreBadge score={j.score} size="sm" />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[11px] text-muted-foreground">
                    {!IS_SHOWCASE && <StatusBadge status={j.status} />}
                    <span>{sourceLabel(j.source)}</span>
                    <span>{j.lokasi}</span>
                    {j.deadline && <span>⏰ {formatDate(j.deadline, true)}</span>}
                  </div>
                </Link>
              </li>
            ))}
            {!jobs.length && (
              <li className="py-12 text-center font-mono text-xs text-faint">Tidak ada lowongan yang cocok dengan filter ini.</li>
            )}
          </ul>
          <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Peran &amp; perusahaan</TableHead>
                <TableHead>Skor</TableHead>
                <TableHead>Sumber</TableHead>
                <TableHead>Lokasi</TableHead>
                {!IS_SHOWCASE && <TableHead>Status</TableHead>}
                <TableHead>Deadline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((j) => (
                <TableRow key={j.id} className="relative">
                  <TableCell>
                    <Link href={`/lowongan/${j.id}`} className="after:absolute after:inset-0">
                      <span className="block font-display text-[14.5px] font-bold">{j.role}</span>
                      <span className="block text-[12.5px] text-muted-foreground">{j.company}</span>
                    </Link>
                  </TableCell>
                  <TableCell><ScoreBadge score={j.score} size="sm" /></TableCell>
                  <TableCell className="font-mono text-[11.5px] text-muted-foreground">{sourceLabel(j.source)}</TableCell>
                  <TableCell className="font-mono text-[11.5px] text-muted-foreground">{j.lokasi}</TableCell>
                  {!IS_SHOWCASE && <TableCell><StatusBadge status={j.status} /></TableCell>}
                  <TableCell className="font-mono text-[11.5px] text-muted-foreground">{formatDate(j.deadline, true)}</TableCell>
                </TableRow>
              ))}
              {!jobs.length && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={IS_SHOWCASE ? 5 : 6} className="py-12 text-center font-mono text-xs text-faint">
                    Tidak ada lowongan yang cocok dengan filter ini.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
