"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Sparkles, Target } from "lucide-react";
import { ConsoleLabel } from "@/components/shared/console-panel";
import { Button } from "@/components/ui/button";
import { analyzeSkills, KIND_LABEL, type SkillKind, type SkillStat } from "@/lib/skills";
import type { Job } from "@/lib/types";
import { bandColor, scoreBand } from "@/lib/utils";

const WARNA: Record<SkillKind, string> = {
  kuasai: "var(--primary)",
  pernah: "color-mix(in srgb, var(--primary) 50%, var(--console-muted))",
  gap: "var(--danger)",
  netral: "var(--info)",
};
const ORBIT: Record<SkillKind, number> = { kuasai: 0.2, pernah: 0.32, gap: 0.44, netral: 0.44 };

/** Sudut tetap per skill (hash nama) supaya bintang tidak berpindah-pindah saat data berubah. */
function hash(s: string) {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 997;
  return h / 997;
}

export function SkillConstellation({
  jobs,
  skills,
  skillsFamiliar,
  onAddFamiliar,
}: {
  jobs: Job[];
  skills: string[];
  skillsFamiliar: string[];
  onAddFamiliar: (s: string) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(520);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const S = Math.min(W, 540);
  const C = S / 2;

  const stats = useMemo(() => analyzeSkills(jobs, { skills, skillsFamiliar }), [jobs, skills, skillsFamiliar]);
  const gaps = useMemo(() => stats.filter((s) => s.kind === "gap").sort((a, b) => b.weight - a.weight), [stats]);
  // Orbit luar hanya memuat gap yang paling berarti — sisanya kebisingan.
  const bintang = useMemo(() => [...stats.filter((s) => s.kind !== "gap"), ...gaps.slice(0, 10)], [stats, gaps]);
  const maxW = Math.max(1, ...bintang.map((s) => s.weight));

  const pos = useMemo(() => {
    const m = new Map<string, { x: number; y: number; r: number }>();
    (["kuasai", "pernah", "gap"] as SkillKind[]).forEach((k) => {
      const grup = bintang.filter((s) => s.kind === k).sort((a, b) => hash(a.key) - hash(b.key));
      grup.forEach((s, i) => {
        const a = ((i + hash(k) ) / Math.max(grup.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const rad = ORBIT[k] * S * (1 + (hash(s.key) - 0.5) * 0.12);
        m.set(s.key, { x: C + Math.cos(a) * rad, y: C + Math.sin(a) * rad, r: 3 + Math.sqrt(s.weight / maxW) * 7 });
      });
    });
    return m;
  }, [bintang, S, C, maxW]);

  // Garis rasi: dua skill yang sering diminta bersama (≥2 lowongan yang sama).
  const rasi = useMemo(() => {
    const out: [string, string, number][] = [];
    for (let i = 0; i < bintang.length; i++)
      for (let j = i + 1; j < bintang.length; j++) {
        const n = bintang[i].jobIds.filter((id) => bintang[j].jobIds.includes(id)).length;
        if (n >= 2) out.push([bintang[i].key, bintang[j].key, n]);
      }
    return out;
  }, [bintang]);

  const [pilih, setPilih] = useState<string | null>(null);
  const aktif = pilih ?? gaps[0]?.key ?? bintang[0]?.key ?? null;
  const sel = bintang.find((s) => s.key === aktif) ?? null;
  const tetangga = new Set(rasi.filter(([a, b]) => a === aktif || b === aktif).flatMap(([a, b]) => [a, b]));

  // Cakupan: lowongan yang meminta setidaknya satu skill yang sudah kamu punya.
  const tersentuh = new Set(stats.filter((s) => s.kind !== "gap").flatMap((s) => s.jobIds));
  const cakupan = jobs.length ? Math.round((tersentuh.size / jobs.length) * 100) : 0;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,540px)_1fr]">
      <div ref={box} className="relative mx-auto w-full" style={{ height: S, maxWidth: 540 }}>
        <svg width={S} height={S} className="absolute top-0 left-1/2 -translate-x-1/2" role="img" aria-label="Konstelasi skill: pusat adalah kamu, orbit dalam skill dikuasai, tengah pernah dipakai, luar diminta lowongan tapi belum dimiliki">
          {(["kuasai", "pernah", "gap"] as SkillKind[]).map((k) => (
            <circle key={k} cx={C} cy={C} r={ORBIT[k] * S} fill="none" stroke={WARNA[k]} strokeOpacity={k === "gap" ? 0.22 : 0.18} strokeDasharray={k === "gap" ? "2 6" : "1 5"} />
          ))}
          {rasi.map(([a, b, n]) => {
            const p = pos.get(a)!, q = pos.get(b)!;
            const on = !aktif || a === aktif || b === aktif;
            return <line key={a + b} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="var(--console-foreground)" strokeOpacity={on && aktif ? 0.45 : 0.07} strokeWidth={Math.min(2.2, 0.6 + n * 0.3)} style={{ transition: "stroke-opacity .3s" }} />;
          })}
          {bintang.filter((s) => s.kind === "kuasai").map((s) => {
            const p = pos.get(s.key)!;
            return <line key={`c${s.key}`} x1={C} y1={C} x2={p.x} y2={p.y} stroke="var(--primary)" strokeOpacity={0.12} />;
          })}
        </svg>

        {/* Pusat: kamu */}
        <div className="absolute top-1/2 left-1/2 flex size-[58px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_40px_color-mix(in_srgb,var(--primary)_45%,transparent)]">
          <span className="anim-pulse-ring absolute inset-0 rounded-full border border-primary" />
          <span className="font-mono text-[8.5px] font-bold tracking-[0.08em]">PROFIL</span>
          <span className="font-display text-[13px] leading-none font-bold">kamu</span>
        </div>

        {bintang.map((s, i) => {
          const p = pos.get(s.key)!;
          const x = p.x + (W > S ? (W - S) / 2 : 0);
          const on = !pilih || s.key === aktif || tetangga.has(s.key);
          // Label menjauhi pusat, kecuali orbit luar di layar sempit: di sana label
          // mengarah ke dalam supaya tidak terpotong tepi layar.
          const keDalam = s.kind === "gap" && S < 480;
          const labelKanan = (p.x >= C) !== keDalam;
          // Layar sempit: 20+ label saling tumpuk. Tampilkan hanya skill yang dikuasai dan
          // bintang terpilih + tetangganya; sisanya muncul saat diketuk.
          const tampilLabel = S >= 480 || s.kind === "kuasai" || s.key === aktif || (!!pilih && tetangga.has(s.key));
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setPilih((c) => (c === s.key ? null : s.key))}
              aria-pressed={s.key === aktif}
              aria-label={`${s.label}: ${KIND_LABEL[s.kind]}, diminta ${s.jobIds.length} lowongan`}
              className="group absolute flex items-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ left: x, top: p.y, transform: `translate(${labelKanan ? -p.r : `calc(-100% + ${p.r}px)`}, -50%)`, flexDirection: labelKanan ? "row" : "row-reverse", opacity: on ? 1 : 0.3, transition: "opacity .3s" }}
            >
              <span
                className={s.kind === "gap" ? "block rounded-full" : "anim-twinkle block rounded-full"}
                style={{
                  width: p.r * 2, height: p.r * 2, animationDelay: `${(i % 7) * 0.45}s`,
                  ...(s.kind === "gap"
                    ? { border: `1.5px dashed ${WARNA.gap}`, background: "color-mix(in srgb, var(--danger) 12%, transparent)" }
                    : { background: WARNA[s.kind], boxShadow: `0 0 ${6 + p.r * 2}px ${WARNA[s.kind]}` }),
                  outline: s.key === aktif ? `2px solid ${WARNA[s.kind]}` : undefined, outlineOffset: 3,
                }}
              />
              <span className={tampilLabel ? "font-mono text-[10.5px] whitespace-nowrap text-console-foreground/90 group-hover:text-console-foreground" : "sr-only"}>
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        {sel && <DetailBintang s={sel} jobs={jobs} onAdd={onAddFamiliar} />}
        <div>
          <ConsoleLabel className="mb-2 flex items-center gap-2 text-primary"><Target className="size-3" /> rekomendasi belajar</ConsoleLabel>
          {gaps.length ? (
            <ol className="flex flex-col gap-2">
              {gaps.slice(0, 4).map((g, i) => (
                <li key={g.key}>
                  <button type="button" onClick={() => setPilih(g.key)} className="w-full text-left">
                    <div className="flex items-baseline justify-between gap-2 font-mono text-[11.5px]">
                      <span className="text-console-foreground">{i + 1}. {g.label}</span>
                      <span className="text-console-muted">{g.jobIds.length} lowongan</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded bg-console-deep">
                      <div className="h-full rounded" style={{ width: `${(g.weight / gaps[0].weight) * 100}%`, background: "var(--danger)", opacity: 0.8 }} />
                    </div>
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-[12.5px] text-console-muted">Semua skill yang diminta lowongan sudah ada di profilmu.</p>
          )}
          <p className="mt-3 font-mono text-[10.5px] text-console-muted">
            Skill-mu menyentuh {cakupan}% dari {jobs.length} lowongan yang dinilai.
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailBintang({ s, jobs, onAdd }: { s: SkillStat; jobs: Job[]; onAdd: (s: string) => void }) {
  const roles = jobs.filter((j) => s.jobIds.includes(j.id)).slice(0, 4);
  return (
    <div className="anim-rise rounded-xl border border-console-border bg-console-deep/70 p-4" key={s.key}>
      <ConsoleLabel className="mb-1 flex items-center gap-2" style={{ color: WARNA[s.kind] }}>
        <Sparkles className="size-3" /> {KIND_LABEL[s.kind]}
      </ConsoleLabel>
      <p className="font-display text-lg font-bold text-console-foreground">{s.label}</p>
      <p className="mt-0.5 text-[12.5px] text-console-muted">
        {s.jobIds.length
          ? `Diminta ${s.jobIds.length} lowongan · rata-rata skor ${s.avgScore}`
          : "Belum diminta lowongan mana pun yang sedang dinilai."}
      </p>
      {roles.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {roles.map((r) => (
            <li key={r.id}>
              <Link href={`/lowongan/${r.id}`} className="text-[12.5px] text-console-foreground/85 hover:text-primary">
                <span className="font-mono text-[11px]" style={{ color: bandColor[scoreBand(r.score)] }}>{r.score}</span> &middot; {r.role}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {s.kind === "gap" && (
        <Button variant="console" size="sm" className="mt-3" onClick={() => onAdd(s.label)}>
          <Plus className="size-3.5" /> Sudah pernah pakai — tambahkan
        </Button>
      )}
    </div>
  );
}
