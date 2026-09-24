"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScheduleDial, ThresholdHistogram } from "@/components/pengaturan/control-instruments";
import { ConsoleLabel, ConsolePanel } from "@/components/shared/console-panel";
import { useJobs, useSettings, useSources, useUpdateSettings } from "@/hooks/use-api";
import type { Settings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TidakPublik } from "@/components/shared/tidak-publik";
import { IS_SHOWCASE } from "@/lib/mode";

const BACKENDS: { value: Settings["backend"]; title: string; desc: string }[] = [
  { value: "claude-code", title: "Claude Code", desc: "Jalan lokal, terintegrasi ke pipeline script" },
  { value: "claude-api", title: "Claude API", desc: "Panggilan langsung, cocok untuk server terjadwal" },
];

export default function PengaturanPage() {
  if (IS_SHOWCASE) return <TidakPublik judul="Pengaturan mesin lokal" alasan="Ambang skor, model, kuota, dan jadwal run diatur dari panel kontrol di mesin pemilik." />;
  return <PengaturanPageIsi />;
}

function PengaturanPageIsi() {
  const { data } = useSettings();
  const { data: jobs = [] } = useJobs({ sort: "skor" });
  const { data: sources = [] } = useSources();
  const aktif = sources.filter((s) => s.enabled && s.key !== "jooble" && s.key !== "adzuna" && s.key !== "careerjet").length || 1;
  const save = useUpdateSettings();
  const [form, setForm] = useState<Settings | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const dirty = form && data && JSON.stringify(form) !== JSON.stringify(data);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  return (
    <div className="max-w-3xl pb-16">
      <PageHeader
        index="06"
        eyebrow="Panel kontrol"
        title="Pengaturan"
        description="Konfigurasi pipeline: ranking, model, kuota, dan jadwal"
        actions={
          <Button disabled={!dirty || save.isPending} onClick={() => form && save.mutate(form, { onSuccess: () => toast("Pengaturan disimpan") })}>
            {save.isSuccess && !dirty ? <Check /> : null}
            {save.isPending ? "Menyimpan…" : dirty ? "Simpan pengaturan" : "Tersimpan"}
          </Button>
        }
      />

      <div className="flex flex-col gap-4 px-4 sm:px-6 lg:px-10 pt-6">
        {!form ? (
          <Skeleton className="h-[560px] rounded-2xl" />
        ) : (
          <>
            <ConsolePanel className="grid gap-6 px-4 py-5 sm:px-6 md:grid-cols-[1fr_220px]">
              <div>
                <ConsoleLabel className="mb-3 text-primary">&gt; ambang skor rekomendasi</ConsoleLabel>
                <ThresholdHistogram scores={jobs.map((j) => j.score)} threshold={form.threshold} onChange={(v) => set("threshold", v)} />
              </div>
              <div>
                <ConsoleLabel className="mb-3 text-primary">&gt; jadwal harian</ConsoleLabel>
                <ScheduleDial value={form.schedule} onChange={(v) => set("schedule", v)} />
              </div>
            </ConsolePanel>

            <Card>
              <CardHeader>
                <CardTitle>Backend ranking</CardTitle>
                <CardDescription>Jalur yang dipakai untuk memanggil large LLM saat penilaian akhir</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Backend ranking">
                {BACKENDS.map((b) => {
                  const active = form.backend === b.value;
                  return (
                    <button
                      key={b.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => set("backend", b.value)}
                      className={cn(
                        "cursor-pointer rounded-xl border px-4 py-3.5 text-left transition-colors",
                        active ? "border-primary bg-primary/15" : "border-border bg-subtle hover:border-faint",
                      )}
                    >
                      <span className={cn("block font-display text-[13.5px] font-bold", active && "text-accent-text")}>{b.title}</span>
                      <span className="mt-1 block text-[11.5px] text-muted-foreground">{b.desc}</span>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Model</CardTitle>
                <CardDescription>Trade-off kecepatan/biaya vs kedalaman reasoning saat ranking</CardDescription>
              </CardHeader>
              <CardContent className="max-w-xs">
                <Select value={form.model} onValueChange={(v) => set("model", v as Settings["model"])}>
                  <SelectTrigger aria-label="Model"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="haiku">Cepat &amp; hemat</SelectItem>
                    <SelectItem value="sonnet">Seimbang</SelectItem>
                    <SelectItem value="opus">Kualitas tertinggi</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle><label htmlFor="quota">Jatah halaman per sumber</label></CardTitle>
                  <CardDescription>Halaman detail lowongan per sumber tiap run; sisanya diambil run berikutnya</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Input id="quota" type="number" min={1} max={200} className="w-28" value={form.pagesPerSource} onChange={(e) => set("pagesPerSource", Number(e.target.value))} />
                  {/* ~11,5 s per lowongan (diukur: Qwen + ambil halaman berjalan paralel). */}
                  <p className="font-mono text-[11px] text-faint">
                    run terlama &asymp; {Math.max(1, Math.round((form.pagesPerSource * aktif * 11.5) / 60))} menit
                    <span className="block">bila {aktif} sumber memakai seluruh jatahnya</span>
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle><label htmlFor="schedule">Jam tepat</label></CardTitle>
                  <CardDescription>Sama dengan kenop di jam 24 jam, untuk mengetik menit selain kelipatan 15</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Input id="schedule" type="time" className="w-32" value={form.schedule} onChange={(e) => set("schedule", e.target.value)} />
                  <p className="font-mono text-[11px] text-faint">berlaku setelah jadwal didaftarkan ke Task Scheduler</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
