"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, CircleCheck, Info, Loader2, RotateCw, ScanSearch, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { ConsoleLabel, ConsolePanel } from "@/components/shared/console-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useResearch, useStartResearch } from "@/hooks/use-api";
import type { CompanyReport } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { IS_SHOWCASE } from "@/lib/mode";

const LEVEL: Record<CompanyReport["level"], { label: string; color: string }> = {
  tinggi: { label: "Kredibel", color: "var(--success)" },
  sedang: { label: "Cukup kredibel", color: "var(--primary)" },
  rendah: { label: "Perlu waspada", color: "var(--danger)" },
  tidak_cukup_data: { label: "Data tidak cukup", color: "var(--console-muted)" },
};

const LANGKAH = [
  "mencari situs resmi & halaman \"tentang kami\"",
  "memeriksa LinkedIn & profil di job board",
  "mencari berita dan ulasan karyawan",
  "memeriksa laporan penipuan lowongan",
  "menyusun penilaian kredibilitas",
];

function Elapsed({ since }: { since?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = since ? Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000)) : 0;
  return <span className="tabular-nums">{String(Math.floor(s / 60)).padStart(2, "0")}:{String(s % 60).padStart(2, "0")}</span>;
}

/** Nomor sumber sebagai tautan kecil: [1][2]. */
function Refs({ ids, sources }: { ids: number[]; sources: CompanyReport["sources"] }) {
  return (
    <>
      {ids.filter((i) => sources[i - 1]).map((i) => (
        <a
          key={i}
          href={sources[i - 1].url}
          target="_blank"
          rel="noreferrer"
          title={sources[i - 1].title}
          className="ml-0.5 align-super font-mono text-[9.5px] text-primary hover:underline"
        >
          [{i}]
        </a>
      ))}
    </>
  );
}

function SignalList({ items, tone }: { items: string[]; tone: "pos" | "neg" | "info" }) {
  const Icon = tone === "pos" ? CircleCheck : tone === "neg" ? TriangleAlert : Info;
  const cls = tone === "pos" ? "text-success" : tone === "neg" ? "text-danger" : "text-muted-foreground";
  return (
    <ul className="flex flex-col gap-2">
      {items.map((s) => (
        <li key={s} className="flex items-start gap-2 text-[13px]">
          <Icon className={`mt-0.5 size-3.5 shrink-0 ${cls}`} aria-hidden="true" />
          {s}
        </li>
      ))}
    </ul>
  );
}

function Report({ r }: { r: CompanyReport }) {
  const lvl = LEVEL[r.level];
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0 max-w-2xl">
          <h3 className="font-display text-lg font-bold">{r.officialName}</h3>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{r.summary}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-display text-[40px] leading-none font-bold tabular-nums" style={{ color: lvl.color }}>
            {r.level === "tidak_cukup_data" ? "—" : r.credibilityScore}
          </span>
          <span className="font-mono text-[10px] tracking-[0.06em] uppercase" style={{ color: lvl.color }}>
            {lvl.label}
          </span>
        </div>
      </div>

      <ConsolePanel>
        <ConsoleLabel className="mb-2 text-primary">&gt; alasan penilaian</ConsoleLabel>
        <p className="text-[13.5px] leading-relaxed">{r.scoreReason}</p>
      </ConsolePanel>

      {r.facts.length > 0 && (
        <dl className="grid gap-x-6 gap-y-3.5 rounded-xl border border-border bg-subtle p-4 sm:grid-cols-2">
          {r.facts.map((f) => (
            <div key={f.label + f.value}>
              <dt className="font-mono text-[10px] tracking-[0.06em] text-faint uppercase">{f.label}</dt>
              <dd className="mt-1 text-[13.5px] font-semibold">
                {f.value}
                <Refs ids={f.sources} sources={r.sources} />
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="eyebrow mb-2.5">Sinyal positif</p>
          {r.positiveSignals.length ? <SignalList items={r.positiveSignals} tone="pos" /> : <p className="text-[13px] text-muted-foreground">—</p>}
        </div>
        <div>
          <p className="eyebrow mb-2.5">Sinyal negatif</p>
          {r.negativeSignals.length ? (
            <SignalList items={r.negativeSignals} tone="neg" />
          ) : (
            <p className="flex items-center gap-2 text-[13px]">
              <CircleCheck className="size-3.5 text-success" aria-hidden="true" /> Tidak ditemukan
            </p>
          )}
        </div>
      </div>

      {(r.digitalFootprint.length > 0 || r.employeeReviews) && (
        <div className="grid gap-6 sm:grid-cols-2">
          {r.digitalFootprint.length > 0 && (
            <div>
              <p className="eyebrow mb-2.5">Jejak digital</p>
              <SignalList items={r.digitalFootprint} tone="info" />
            </div>
          )}
          {r.employeeReviews && (
            <div>
              <p className="eyebrow mb-2.5">Ulasan karyawan</p>
              <p className="text-[13px] leading-relaxed">{r.employeeReviews}</p>
            </div>
          )}
        </div>
      )}

      {r.news.length > 0 && (
        <div>
          <p className="eyebrow mb-2.5">Berita & catatan penting</p>
          <SignalList items={r.news} tone="info" />
        </div>
      )}

      {r.manualChecks.length > 0 && (
        <div className="rounded-xl border border-dashed border-border px-4 py-3">
          <p className="eyebrow mb-2">Perlu dicek sendiri</p>
          <SignalList items={r.manualChecks} tone="info" />
        </div>
      )}

      <div>
        <p className="eyebrow mb-2.5">Sumber ({r.sources.length})</p>
        <ol className="flex flex-col gap-1.5">
          {r.sources.map((s, i) => (
            <li key={s.url + i} className="flex items-start gap-2 text-[12.5px]">
              <span className="w-6 shrink-0 font-mono text-faint">[{i + 1}]</span>
              <a href={s.url} target="_blank" rel="noreferrer" className="min-w-0 break-words text-muted-foreground hover:text-primary hover:underline">
                {s.title} <ArrowUpRight className="inline size-3" />
              </a>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function CompanyResearchPanel({ jobId, company }: { jobId: string; company: string }) {
  const { data } = useResearch(jobId);
  const start = useStartResearch(jobId);
  const status = data?.status ?? "belum";
  const running = status === "berjalan" || start.isPending;

  const mulai = () =>
    start.mutate(undefined, {
      onSuccess: () => toast("Deep Search dimulai", { description: "Biasanya 1–3 menit; boleh ditinggal ke halaman lain." }),
      onError: (e) => toast.error(e.message),
    });

  return (
    <Card className="flex flex-col gap-5 px-5 py-6 sm:px-8 sm:py-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">[ Deep Search ] &mdash; profil perusahaan</p>
          <h2 className="mt-1 font-display text-xl font-bold">Seberapa kredibel {company}?</h2>
          {status === "selesai" && data?.finishedAt && (
            <p className="mt-1 font-mono text-[11px] text-faint">diriset {timeAgo(data.finishedAt)}{data.turns ? ` · ${data.turns} langkah riset` : ""}</p>
          )}
        </div>
        {status === "belum" && !IS_SHOWCASE && (
          <Button onClick={mulai} disabled={running}>
            {running ? <Loader2 className="animate-spin" /> : <ScanSearch />} Deep Search
          </Button>
        )}
        {(status === "selesai" || status === "gagal") && !IS_SHOWCASE && (
          <Button variant="outline" size="sm" onClick={mulai} disabled={running}>
            <RotateCw /> {status === "gagal" ? "Coba lagi" : "Riset ulang"}
          </Button>
        )}
      </div>

      {status === "belum" && IS_SHOWCASE && (
        <p className="max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
          Perusahaan ini belum diriset. Deep Search dijalankan dari panel kontrol di mesin lokal: Claude menelusuri web
          (situs resmi, LinkedIn, berita, ulasan karyawan, laporan penipuan) lalu menyusun profil beserta skor kredibilitas.
        </p>
      )}

      {status === "belum" && !running && !IS_SHOWCASE && (
        <p className="max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
          Claude akan menelusuri web &mdash; situs resmi, LinkedIn, job board, berita, ulasan karyawan, dan laporan
          penipuan &mdash; lalu menyusun profil perusahaan beserta skor kredibilitas. Setiap fakta disertai sumbernya.
          Hasilnya disimpan dan dipakai ulang untuk semua lowongan dari perusahaan yang sama.
        </p>
      )}

      {running && (
        <ConsolePanel className="flex flex-col gap-2">
          <ConsoleLabel className="flex items-center justify-between text-primary">
            <span className="flex items-center gap-2">
              <Loader2 className="size-3.5 animate-spin" /> &gt; meriset {data?.company ?? company}
            </span>
            <Elapsed since={data?.startedAt} />
          </ConsoleLabel>
          <ul className="flex flex-col gap-1 font-mono text-[11.5px] text-console-muted">
            {LANGKAH.map((l) => <li key={l}>· {l}</li>)}
          </ul>
        </ConsolePanel>
      )}

      {status === "gagal" && data?.error && (
        <p className="flex items-start gap-2 font-mono text-[12px] text-danger">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" /> {data.error}
        </p>
      )}

      {data?.report && <Report r={data.report} />}
    </Card>
  );
}
