"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Building2, ScanSearch, ShieldCheck, Sparkles } from "lucide-react";
import { ConsoleLabel } from "@/components/shared/console-panel";
import type { Company, Job, Profile } from "@/lib/types";
import { sourceLabel } from "@/lib/types";
import { analyzeSkills, KIND_LABEL, type SkillKind, type SkillStat } from "@/lib/skills";
import { bandColor, cn, scoreBand } from "@/lib/utils";

type Sel = { type: "skill" | "role" | "company"; id: string };

const KIND_COLOR: Record<SkillKind, string> = {
  kuasai: "var(--primary)",
  pernah: "color-mix(in srgb, var(--primary) 55%, var(--console-muted))",
  gap: "var(--danger)",
  netral: "var(--info)",
};
const CRED_COLOR = { tinggi: "var(--success)", sedang: "var(--primary)", rendah: "var(--danger)", tidak_cukup_data: "var(--console-muted)" } as const;
const CRED_LABEL = { tinggi: "Kredibel", sedang: "Cukup kredibel", rendah: "Perlu waspada", tidak_cukup_data: "Data tidak cukup" } as const;

const normKey = (s: string) => s.toLowerCase().replace(/\b(pt|cv|tbk|persero)\b\.?/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
const companyOf = (j: Job) => j.companyKey || normKey(j.company);

/** Urutkan node kiri/kanan menurut rata-rata posisi tetangganya (barycenter) → garis jarang bersilangan. */
function barycenter<T>(items: T[], neighbours: (t: T) => number[]): T[] {
  return [...items]
    .map((t) => {
      const n = neighbours(t);
      return { t, c: n.length ? n.reduce((a, b) => a + b, 0) / n.length : Number.MAX_SAFE_INTEGER };
    })
    .sort((a, b) => a.c - b.c)
    .map((x) => x.t);
}

const curve = (x1: number, y1: number, x2: number, y2: number) => {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
};

export function NeuralMap({ jobs, companies, profile, total }: { jobs: Job[]; companies: Company[]; profile?: Profile | null; total: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(900);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(300, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const compact = W < 640;

  // ---------------------------------------------------------------- data
  const g = useMemo(() => {
    const roles = [...jobs].sort((a, b) => b.score - a.score).slice(0, compact ? 12 : 16);
    const roleIdx = new Map(roles.map((r, i) => [r.id, i]));
    const stats = analyzeSkills(roles, profile);
    // Skill yang terhubung ke lowongan yang tampil + 5 gap teratas; skill tanpa koneksi disembunyikan.
    // Tanpa profil (showcase), semuanya "netral": tampilkan yang paling banyak diminta.
    const connected = stats.filter((s) => s.jobIds.some((id) => roleIdx.has(id)));
    const teratas = (k: SkillKind, n: number) =>
      connected.filter((s) => s.kind === k).sort((a, b) => b.weight - a.weight).slice(0, n);
    const skills = barycenter(
      [...connected.filter((s) => s.kind === "kuasai" || s.kind === "pernah"), ...teratas("gap", compact ? 3 : 5),
       ...teratas("netral", compact ? 6 : 10)],
      (s) => s.jobIds.filter((id) => roleIdx.has(id)).map((id) => roleIdx.get(id)!),
    );
    const byKey = new Map(companies.map((c) => [c.key, c]));
    const compKeys = [...new Set(roles.map(companyOf))];
    const comps = barycenter(
      compKeys.map((k) => byKey.get(k) ?? ({
        key: k, name: roles.find((r) => companyOf(r) === k)!.company, jobIds: [], bestScore: 0, avgScore: 0,
        locations: [], sources: [], blurb: "", blurbSource: null, credibility: null,
      } as Company)),
      (c) => roles.filter((r) => companyOf(r) === c.key).map((r) => roleIdx.get(r.id)!),
    );
    const sr = skills.flatMap((s) => s.jobIds.filter((id) => roleIdx.has(id)).map((id) => ({ skill: s.key, role: id, kind: s.kind })));
    const rc = roles.map((r) => ({ role: r.id, company: companyOf(r) }));
    return { roles, skills, comps, sr, rc };
  }, [jobs, companies, profile, compact]);

  // ------------------------------------------------------------ geometri
  const top = 30;
  const rowH = compact ? 42 : 46;
  const colA = Math.round(W * (compact ? 0.28 : 0.24));
  const colC = Math.round(W * (compact ? 0.28 : 0.24));
  const gap = compact ? 14 : 28;
  const xA = colA - 6;
  const xB0 = colA + gap;
  const xB1 = W - colC - gap;
  const xC = W - colC + 6;
  const rows = Math.max(g.roles.length, g.skills.length, g.comps.length, 1);
  const H = top + rows * rowH + 10;
  const yAt = (i: number, n: number) => top + ((i + 0.5) * rows * rowH) / Math.max(n, 1);
  const ySkill = new Map(g.skills.map((s, i) => [s.key, yAt(i, g.skills.length)]));
  const yRole = new Map(g.roles.map((r, i) => [r.id, yAt(i, g.roles.length)]));
  const yComp = new Map(g.comps.map((c, i) => [c.key, yAt(i, g.comps.length)]));

  // ------------------------------------------------------------ interaksi
  const [sel, setSel] = useState<Sel | null>(null);
  const [hov, setHov] = useState<Sel | null>(null);
  const focus = hov ?? sel;
  const aktif = useMemo(() => {
    if (!focus) return null;
    let roles: string[] = [];
    if (focus.type === "role") roles = [focus.id];
    if (focus.type === "company") roles = g.rc.filter((e) => e.company === focus.id).map((e) => e.role);
    if (focus.type === "skill") roles = g.sr.filter((e) => e.skill === focus.id).map((e) => e.role);
    const R = new Set(roles);
    const S = focus.type === "skill" ? new Set([focus.id]) : new Set(g.sr.filter((e) => R.has(e.role)).map((e) => e.skill));
    const C = new Set(g.rc.filter((e) => R.has(e.role)).map((e) => e.company));
    return { R, S, C };
  }, [focus, g]);
  const on = (t: Sel["type"], id: string) =>
    !aktif || (t === "role" ? aktif.R.has(id) : t === "skill" ? aktif.S.has(id) : aktif.C.has(id));
  const pilih = (s: Sel) => setSel((cur) => (cur?.type === s.type && cur.id === s.id ? null : s));
  const hoverProps = (s: Sel) => ({
    onMouseEnter: () => setHov(s),
    onMouseLeave: () => setHov(null),
    onFocus: () => setHov(s),
    onBlur: () => setHov(null),
    onClick: () => pilih(s),
    "aria-pressed": sel?.type === s.type && sel.id === s.id,
  });

  // Sinyal: satu titik per koneksi aktif-mungkin (dibatasi supaya ringan di HP).
  const sinyal = useMemo(() => {
    const out: { d: string; dur: number; delay: number; color: string; key: string }[] = [];
    g.sr.filter((e) => e.kind !== "gap").slice(0, 34).forEach((e, i) => {
      const y1 = ySkill.get(e.skill)!, y2 = yRole.get(e.role)!;
      out.push({ key: `s${i}`, d: curve(xA, y1, xB0, y2), dur: 2.6 + (i % 5) * 0.35, delay: -(i * 0.53) % 3, color: KIND_COLOR[e.kind] });
    });
    g.rc.forEach((e, i) => {
      const y1 = yRole.get(e.role)!, y2 = yComp.get(e.company)!;
      const r = g.roles.find((x) => x.id === e.role)!;
      out.push({ key: `c${i}`, d: curve(xB1, y1, xC, y2), dur: 2.2 + (i % 4) * 0.4, delay: -(i * 0.71) % 3, color: bandColor[scoreBand(r.score)] });
    });
    return out;
  }, [g, xA, xB0, xB1, xC, ySkill, yRole, yComp]);

  const tampil = sel ?? (g.roles[0] ? { type: "role" as const, id: g.roles[0].id } : null);

  if (!g.roles.length) {
    return <p className="py-10 text-center font-mono text-xs text-console-muted">Tidak ada lowongan untuk dipetakan dengan filter ini.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px] text-console-muted">
        {profile ? (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: KIND_COLOR.kuasai }} /> dikuasai</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: KIND_COLOR.pernah }} /> pernah dipakai</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full border border-dashed" style={{ borderColor: KIND_COLOR.gap }} /> belum dimiliki</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: KIND_COLOR.netral }} /> teknologi yang paling banyak diminta</span>
        )}
        <span>{g.roles.length} dari {total} lowongan teratas &middot; ikut filter</span>
      </div>

      <div ref={box} className="relative w-full select-none" style={{ height: H }} role="group" aria-label="Jaringan saraf skill, lowongan, dan perusahaan">
        {/* Label lapisan */}
        {[["skill-mu", 0, "left"], ["lowongan", (xB0 + xB1) / 2, "center"], ["perusahaan", W, "right"]].map(([t, x, a]) => (
          <span
            key={t as string}
            className="absolute top-0 font-mono text-[9.5px] tracking-[0.1em] text-console-muted uppercase"
            style={{ left: a === "left" ? 0 : undefined, right: a === "right" ? 0 : undefined, ...(a === "center" ? { left: x as number, transform: "translateX(-50%)" } : {}) }}
          >
            {`▸ ${t}`}
          </span>
        ))}

        <svg width={W} height={H} className="absolute inset-0" aria-hidden="true">
          {g.sr.map((e, i) => {
            const act = !aktif || (aktif.S.has(e.skill) && aktif.R.has(e.role));
            return (
              <path
                key={`e${i}`}
                d={curve(xA, ySkill.get(e.skill)!, xB0, yRole.get(e.role)!)}
                fill="none"
                stroke={KIND_COLOR[e.kind]}
                strokeWidth={act && aktif ? 1.8 : 1.1}
                strokeDasharray={e.kind === "gap" ? "3 4" : undefined}
                strokeOpacity={act ? (aktif ? 0.9 : e.kind === "gap" ? 0.35 : 0.3) : 0.05}
                style={{ transition: "stroke-opacity .25s, stroke-width .25s" }}
              />
            );
          })}
          {g.rc.map((e, i) => {
            const r = g.roles.find((x) => x.id === e.role)!;
            const act = !aktif || (aktif.R.has(e.role) && aktif.C.has(e.company));
            return (
              <path
                key={`f${i}`}
                d={curve(xB1, yRole.get(e.role)!, xC, yComp.get(e.company)!)}
                fill="none"
                stroke={bandColor[scoreBand(r.score)]}
                strokeWidth={act && aktif ? 2 : 1.2}
                strokeOpacity={act ? (aktif ? 0.95 : 0.35) : 0.05}
                style={{ transition: "stroke-opacity .25s, stroke-width .25s" }}
              />
            );
          })}
        </svg>

        {/* Sinyal yang mengalir di sepanjang koneksi (dimatikan untuk prefers-reduced-motion) */}
        <div className="pointer-events-none absolute inset-0 motion-reduce:hidden" aria-hidden="true">
          {sinyal.map((s) => (
            <span
              key={s.key}
              className="neural-signal absolute top-0 left-0 size-[5px] rounded-full"
              style={{
                offsetPath: `path("${s.d}")`,
                background: s.color,
                boxShadow: `0 0 8px ${s.color}`,
                animationDuration: `${s.dur}s`,
                animationDelay: `${s.delay}s`,
                opacity: aktif ? 0.15 : 0.9,
              }}
            />
          ))}
        </div>

        {/* Neuron skill */}
        {g.skills.map((s, i) => {
          const y = ySkill.get(s.key)!;
          const lit = on("skill", s.key);
          return (
            // Pembungkus mengatur posisi & redup; animasi masuk di tombol dalam, karena
            // fill-mode animasi akan menimpa opacity kalau keduanya di elemen yang sama.
            <div key={s.key} className="absolute -translate-y-1/2" style={{ left: 0, width: xA + 7, top: y, opacity: lit ? 1 : 0.22, transition: "opacity .25s" }}>
            <button
              type="button"
              {...hoverProps({ type: "skill", id: s.key })}
              aria-label={`Skill ${s.label}, ${KIND_LABEL[s.kind]}, diminta ${s.jobIds.length} lowongan`}
              className="anim-rise flex w-full items-center justify-end gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ animationDelay: `${i * 0.03}s` }}
            >
              <span className="truncate font-mono text-[10.5px] text-console-foreground">{s.label}</span>
              <span
                className="block size-3 shrink-0 rounded-full"
                style={
                  s.kind === "gap"
                    ? { border: `1.5px dashed ${KIND_COLOR.gap}` }
                    : { background: KIND_COLOR[s.kind], boxShadow: `0 0 10px ${KIND_COLOR[s.kind]}` }
                }
              />
            </button>
            </div>
          );
        })}

        {/* Neuron lowongan */}
        {g.roles.map((r, i) => {
          const y = yRole.get(r.id)!;
          const c = bandColor[scoreBand(r.score)];
          const lit = on("role", r.id);
          const picked = sel?.type === "role" && sel.id === r.id;
          return (
            <div key={r.id} className="absolute -translate-y-1/2" style={{ left: xB0, width: xB1 - xB0, top: y, opacity: lit ? 1 : 0.22, transition: "opacity .25s" }}>
            <button
              type="button"
              {...hoverProps({ type: "role", id: r.id })}
              aria-label={`${r.role} di ${r.company}, skor ${r.score}`}
              className="anim-rise flex h-[30px] w-full items-center gap-2 rounded-full border bg-console-deep/90 pr-3 pl-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{
                borderColor: picked ? c : "var(--console-border)",
                boxShadow: picked ? `0 0 0 3px color-mix(in srgb, ${c} 25%, transparent)` : undefined,
                transition: "border-color .25s", animationDelay: `${0.15 + i * 0.03}s`,
              }}
            >
              <span className="flex h-[22px] min-w-[30px] items-center justify-center rounded-full font-mono text-[10.5px] font-bold text-[#17170F]" style={{ background: c }}>
                {r.score}
              </span>
              <span className="truncate text-[12px] font-semibold text-console-foreground">{r.role}</span>
            </button>
            </div>
          );
        })}

        {/* Neuron perusahaan */}
        {g.comps.map((c, i) => {
          const y = yComp.get(c.key)!;
          const warna = c.credibility ? CRED_COLOR[c.credibility.level] : "var(--console-muted)";
          const lit = on("company", c.key);
          return (
            <div key={c.key} className="absolute -translate-y-1/2" style={{ left: xC - 7, width: W - xC + 7, top: y, opacity: lit ? 1 : 0.22, transition: "opacity .25s" }}>
            <button
              type="button"
              {...hoverProps({ type: "company", id: c.key })}
              aria-label={`Perusahaan ${c.name}`}
              className="anim-rise flex w-full items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ animationDelay: `${0.3 + i * 0.03}s` }}
            >
              <span className="relative flex size-3.5 shrink-0 items-center justify-center">
                {c.credibility && <span className="anim-pulse-ring absolute inset-0 rounded-full border" style={{ borderColor: warna }} />}
                <span className="block size-3.5 rounded-[4px] rotate-45" style={{ background: warna, boxShadow: `0 0 10px ${warna}` }} />
              </span>
              <span className="truncate font-mono text-[10.5px] text-console-foreground">{c.name}</span>
            </button>
            </div>
          );
        })}
      </div>

      {tampil && <InfoNode sel={tampil} g={g} />}
    </div>
  );
}

function InfoNode({ sel, g }: { sel: Sel; g: { roles: Job[]; skills: SkillStat[]; comps: Company[]; sr: { skill: string; role: string }[] } }) {
  if (sel.type === "role") {
    const r = g.roles.find((x) => x.id === sel.id);
    if (!r) return null;
    const c = bandColor[scoreBand(r.score)];
    const skills = g.sr.filter((e) => e.role === r.id).map((e) => g.skills.find((s) => s.key === e.skill)!).filter(Boolean);
    return (
      <div className="anim-rise rounded-xl border border-console-border bg-console-deep/70 p-4">
        <ConsoleLabel className="mb-1.5 flex items-center gap-2" style={{ color: c }}><Sparkles className="size-3" /> neuron lowongan &middot; skor {r.score}</ConsoleLabel>
        <p className="font-display text-[16px] font-bold text-console-foreground">{r.role}</p>
        <p className="text-[12.5px] text-console-muted">{r.company} &middot; {r.lokasi} &middot; {sourceLabel(r.source)}</p>
        <p className="mt-2 line-clamp-3 text-[12.5px] leading-relaxed text-console-foreground/85">{r.reasoning}</p>
        {skills.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <span key={s.key} className="rounded-full border px-2 py-0.5 font-mono text-[10.5px]" style={{ borderColor: KIND_COLOR[s.kind], color: s.kind === "gap" ? KIND_COLOR.gap : "var(--console-foreground)", borderStyle: s.kind === "gap" ? "dashed" : "solid" }}>
                {s.label}
              </span>
            ))}
          </div>
        )}
        <Link href={`/lowongan/${r.id}`} className="mt-3 inline-flex items-center gap-1 font-mono text-xs font-bold text-primary hover:underline">
          Buka berkas <ArrowRight className="size-3.5" />
        </Link>
      </div>
    );
  }

  if (sel.type === "skill") {
    const s = g.skills.find((x) => x.key === sel.id);
    if (!s) return null;
    const roles = g.roles.filter((r) => s.jobIds.includes(r.id));
    return (
      <div className="anim-rise rounded-xl border border-console-border bg-console-deep/70 p-4">
        <ConsoleLabel className="mb-1.5" style={{ color: KIND_COLOR[s.kind] }}>neuron skill &middot; {KIND_LABEL[s.kind]}</ConsoleLabel>
        <p className="font-display text-[16px] font-bold text-console-foreground">{s.label}</p>
        <p className="mt-1 text-[12.5px] text-console-muted">
          Diminta {s.jobIds.length} lowongan (rata-rata skor {s.avgScore})
          {s.kind === "gap" ? " — mempelajarinya membuka jalur ke lowongan ini." : "."}
        </p>
        <ul className="mt-2 flex flex-col gap-1">
          {roles.map((r) => (
            <li key={r.id}>
              <Link href={`/lowongan/${r.id}`} className="text-[12.5px] text-console-foreground/85 hover:text-primary">
                <span className="font-mono text-[11px]" style={{ color: bandColor[scoreBand(r.score)] }}>{r.score}</span> &middot; {r.role} <span className="text-console-muted">— {r.company}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const c = g.comps.find((x) => x.key === sel.id);
  if (!c) return null;
  const roles = g.roles.filter((r) => companyOf(r) === c.key);
  const warna = c.credibility ? CRED_COLOR[c.credibility.level] : "var(--console-muted)";
  return (
    <div className="anim-rise rounded-xl border border-console-border bg-console-deep/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <ConsoleLabel className="mb-1.5 flex items-center gap-2"><Building2 className="size-3" /> neuron perusahaan</ConsoleLabel>
          <p className="font-display text-[16px] font-bold text-console-foreground">{c.name}</p>
          {c.locations.length > 0 && <p className="text-[12px] text-console-muted">{c.locations.join(" · ")}</p>}
        </div>
        {c.credibility ? (
          <span className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10.5px]" style={{ borderColor: warna, color: warna }}>
            <ShieldCheck className="size-3.5" /> {c.credibility.score} &middot; {CRED_LABEL[c.credibility.level]}
          </span>
        ) : (
          <span className="rounded-full border border-console-border px-2.5 py-1 font-mono text-[10.5px] text-console-muted">belum diriset</span>
        )}
      </div>
      <p className="mt-2.5 text-[13px] leading-relaxed text-console-foreground/90">
        {c.blurb || "Halaman lowongannya tidak menjelaskan perusahaan ini."}
      </p>
      <p className="mt-1 font-mono text-[10px] text-console-muted">
        {c.blurbSource === "deep-search" ? "sumber: Deep Search (riset web terverifikasi)" : c.blurbSource === "lowongan" ? "sumber: ringkasan dari halaman lowongan — belum diverifikasi" : ""}
      </p>
      <ul className="mt-2.5 flex flex-col gap-1">
        {roles.map((r) => (
          <li key={r.id}>
            <Link href={`/lowongan/${r.id}`} className="text-[12.5px] text-console-foreground/85 hover:text-primary">
              <span className="font-mono text-[11px]" style={{ color: bandColor[scoreBand(r.score)] }}>{r.score}</span> &middot; {r.role}
            </Link>
          </li>
        ))}
      </ul>
      {!c.credibility && roles[0] && (
        <Link href={`/lowongan/${roles[0].id}`} className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs font-bold text-primary hover:underline">
          <ScanSearch className="size-3.5" /> Deep Search perusahaan ini
        </Link>
      )}
    </div>
  );
}
