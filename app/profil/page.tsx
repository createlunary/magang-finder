"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ListEditor } from "@/components/shared/list-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SkillConstellation } from "@/components/profil/skill-constellation";
import { ConsoleLabel, ConsolePanel } from "@/components/shared/console-panel";
import { useJobs, useProfile, useUpdateProfile } from "@/hooks/use-api";
import type { Profile } from "@/lib/types";
import { TidakPublik } from "@/components/shared/tidak-publik";
import { IS_SHOWCASE } from "@/lib/mode";

const BIDANG = ["Backend Dev", "Game Dev", "ML / NLP", "Web Dev", "Data Analyst"];
const LOKASI = ["Remote", "Yogyakarta", "Kota lain"];
type Draft = Omit<Profile, "version" | "updatedAt">;

export default function ProfilPage() {
  if (IS_SHOWCASE) return <TidakPublik judul="Profil kandidat tidak dipublikasikan" alasan="Skill, minat, dan preferensi yang dipakai Claude untuk menilai lowongan adalah data pribadi pemilik, jadi hanya tampil di panel kontrol lokal." />;
  return <ProfilPageIsi />;
}

function ProfilPageIsi() {
  const { data, isLoading } = useProfile();
  const { data: jobs = [] } = useJobs({ sort: "skor" });
  const save = useUpdateProfile();
  const [draft, setDraft] = useState<Draft | null>(null);
  const dirty = useRef(false);

  useEffect(() => {
    if (data && !draft) {
      const { version: _v, updatedAt: _u, ...rest } = data;
      setDraft(rest);
    }
  }, [data, draft]);

  // Autosave: simpan 800ms setelah perubahan terakhir.
  useEffect(() => {
    if (!draft || !dirty.current) return;
    const t = setTimeout(() => {
      save.mutate(draft);
      dirty.current = false;
    }, 800);
    return () => clearTimeout(t);
  }, [draft]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = (p: Partial<Draft>) => {
    dirty.current = true;
    setDraft((d) => (d ? { ...d, ...p } : d));
  };
  const toggle = (key: "bidang" | "lokasi", v: string) =>
    draft && patch({ [key]: draft[key].includes(v) ? draft[key].filter((x) => x !== v) : [...draft[key], v] });

  const saving = save.isPending || dirty.current;

  return (
    <div className="max-w-5xl pb-16">
      <PageHeader
        index="04"
        eyebrow="Parameter profil"
        title="Profil"
        description="Kriteria yang dipakai large LLM untuk menilai kecocokan"
        actions={
          data && (
            <Badge variant={saving ? "accent" : "success"} className="px-3 py-1" aria-live="polite">
              {saving ? "Menyimpan…" : `Tersimpan · profil v${data.version} · memicu penilaian ulang`}
            </Badge>
          )
        }
      />

      <div className="flex flex-col gap-4 px-4 sm:px-6 lg:px-10 pt-6">
        {!draft || isLoading ? (
          <Skeleton className="h-[600px] rounded-2xl" />
        ) : (
          <>
            <ConsolePanel className="px-4 py-4 sm:px-6 sm:py-5">
              <ConsoleLabel className="mb-3 text-primary">&gt; konstelasi skill &middot; permintaan dari {jobs.length} lowongan yang dinilai</ConsoleLabel>
              <SkillConstellation
                jobs={jobs}
                skills={draft.skills}
                skillsFamiliar={draft.skillsFamiliar ?? []}
                onAddFamiliar={(s) =>
                  !draft.skillsFamiliar?.includes(s) && patch({ skillsFamiliar: [...(draft.skillsFamiliar ?? []), s] })
                }
              />
            </ConsolePanel>

            <Card>
              <CardHeader>
                <CardTitle>Bidang minat</CardTitle>
                <CardDescription>Dipakai local LLM untuk filter kasar sebelum ranking</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {BIDANG.map((b) => (
                  <Button key={b} variant="chip" data-active={draft.bidang.includes(b)} aria-pressed={draft.bidang.includes(b)} onClick={() => toggle("bidang", b)} className="rounded-full font-sans text-[12.5px] font-semibold">
                    {b}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skill teknis</CardTitle>
                <CardDescription>Yang sudah dikuasai</CardDescription>
              </CardHeader>
              <CardContent>
                <ListEditor label="Skill baru" placeholder="tambah skill baru…" items={draft.skills} onChange={(skills) => patch({ skills })} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pernah dipakai</CardTitle>
                <CardDescription>Belum mahir, tapi cukup sebagai dasar — dinilai lebih ringan daripada skill yang dikuasai</CardDescription>
              </CardHeader>
              <CardContent>
                <ListEditor label="Skill pernah dipakai" placeholder="tambah skill yang pernah dipakai…" items={draft.skillsFamiliar} onChange={(skillsFamiliar) => patch({ skillsFamiliar })} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preferensi lokasi</CardTitle>
                <CardDescription>Tanpa &ldquo;Kota lain&rdquo;, lowongan di luar pilihan ini dinilai sebagai ketidakcocokan besar</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {LOKASI.map((l) => (
                  <Button key={l} variant="chip" data-active={draft.lokasi.includes(l)} aria-pressed={draft.lokasi.includes(l)} onClick={() => toggle("lokasi", l)} className="rounded-full font-sans text-[12.5px] font-semibold">
                    {l}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Must-have</CardTitle>
                <CardDescription>Requirement yang wajib ada di lowongan</CardDescription>
              </CardHeader>
              <CardContent>
                <ListEditor layout="rows" label="Must-have baru" placeholder="tambah must-have…" items={draft.mustHave} onChange={(mustHave) => patch({ mustHave })} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Red flag</CardTitle>
                <CardDescription>Kriteria yang otomatis mendiskualifikasi lowongan</CardDescription>
              </CardHeader>
              <CardContent>
                <ListEditor layout="rows" label="Red flag baru" placeholder="tambah red flag…" items={draft.redFlags} onChange={(redFlags) => patch({ redFlags })} />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
