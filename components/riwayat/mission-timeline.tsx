"use client";

import { useEffect, useRef, useState } from "react";
import type { RunRecord } from "@/lib/types";
import { formatDate, formatDateTime, formatDuration } from "@/lib/utils";

export type JenisRun = "pengumpulan" | "penilaian" | "dibatalkan" | "gagal";

export function jenisRun(r: RunRecord): JenisRun {
  if (r.status === "gagal") return r.error === "dibatalkan pengguna" ? "dibatalkan" : "gagal";
  return r.found > 0 ? "pengumpulan" : "penilaian";
}

export const JENIS: Record<JenisRun, { label: string; color: string }> = {
  pengumpulan: { label: "pengumpulan", color: "var(--primary)" },
  penilaian: { label: "penilaian ulang", color: "var(--info)" },
  dibatalkan: { label: "dibatalkan", color: "var(--console-muted)" },
  gagal: { label: "gagal", color: "var(--danger)" },
};

/** Garis waktu misi: tiap run satu titik; besar = lowongan ditemukan, warna = jenis run. */
export function MissionTimeline({ runs }: { runs: RunRecord[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(800);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const [pilih, setPilih] = useState<string | null>(null);

  const urut = [...runs].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  // Jarak rata per urutan, bukan per waktu: run yang berdekatan waktunya tidak saling tumpuk.
  const pad = 28;
  const xi = (i: number) => (urut.length === 1 ? W / 2 : pad + (i / (urut.length - 1)) * (W - pad * 2));
  const hari = (r: RunRecord) => r.startedAt.slice(0, 10);
  const gantiHari = urut.map((r, i) => i === 0 || hari(r) !== hari(urut[i - 1]));
  const maxFound = Math.max(1, ...urut.map((r) => r.found));
  const H = 96;
  const cy = 46;
  const sel = urut.find((r) => r.id === pilih) ?? urut[urut.length - 1];

  if (!urut.length) return <p className="py-6 text-center font-mono text-xs text-console-muted">Belum ada run.</p>;

  return (
    <div className="flex flex-col gap-3">
      <div ref={box} className="relative w-full" style={{ height: H }}>
        <svg width={W} height={H} className="absolute inset-0" aria-hidden="true">
          <line x1={pad} x2={W - pad} y1={cy} y2={cy} stroke="var(--console-border)" strokeDasharray="2 5" />
          {/* garis penghubung antar-run berurutan */}
          {urut.slice(1).map((r, i) => (
            <line key={r.id} x1={xi(i)} x2={xi(i + 1)} y1={cy} y2={cy} stroke="var(--primary)" strokeOpacity={0.35} />
          ))}
          {/* penanda pergantian hari */}
          {urut.map((r, i) =>
            gantiHari[i] ? (
              <g key={`h${r.id}`}>
                <line x1={xi(i) - (i ? (xi(i) - xi(i - 1)) / 2 : 0)} x2={xi(i) - (i ? (xi(i) - xi(i - 1)) / 2 : 0)} y1={12} y2={H - 20} stroke="var(--console-border)" strokeDasharray={i ? "3 3" : undefined} opacity={i ? 1 : 0} />
                <text x={xi(i)} y={H - 6} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={9.5} fill="var(--console-muted)">
                  {formatDate(r.startedAt)}
                </text>
              </g>
            ) : null,
          )}
        </svg>
        {urut.map((r, i) => {
          const j = jenisRun(r);
          const rad = 6 + Math.sqrt(r.found / maxFound) * 16;
          const aktif = sel?.id === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setPilih(r.id)}
              aria-pressed={aktif}
              aria-label={`Run ${formatDateTime(r.startedAt)}, ${JENIS[j].label}, ${r.found} ditemukan, ${r.recommended} direkomendasikan`}
              // Posisi lewat left/top (bukan translate): anim-rise menganimasikan transform.
              className="anim-rise absolute rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ left: xi(i) - rad, top: cy - rad, width: rad * 2, height: rad * 2, animationDelay: `${i * 0.05}s` }}
            >
              <span
                className="block size-full rounded-full"
                style={{
                  background: j === "dibatalkan" ? "transparent" : `color-mix(in srgb, ${JENIS[j].color} ${aktif ? 85 : 55}%, transparent)`,
                  border: `1.5px ${j === "dibatalkan" ? "dashed" : "solid"} ${JENIS[j].color}`,
                  boxShadow: aktif ? `0 0 0 4px color-mix(in srgb, ${JENIS[j].color} 25%, transparent), 0 0 18px ${JENIS[j].color}` : undefined,
                }}
              />
              {r.recommended > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-success px-1 font-mono text-[9px] font-bold text-[#0b0b08]">
                  {r.recommended}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-console-muted">
          {(Object.keys(JENIS) as JenisRun[]).map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: JENIS[k].color }} /> {JENIS[k].label}
            </span>
          ))}
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-success" /> angka = rekomendasi</span>
        </div>
        {sel && (
          <p className="font-mono text-[11px] text-console-foreground">
            <span style={{ color: JENIS[jenisRun(sel)].color }}>● {JENIS[jenisRun(sel)].label}</span> &middot; {formatDateTime(sel.startedAt)} &middot;{" "}
            {sel.found} ditemukan &rarr; {sel.passedLocal} lolos &rarr; <span className="text-success">{sel.recommended} rekomendasi</span> &middot; {formatDuration(sel.durationSec)}
          </p>
        )}
      </div>
    </div>
  );
}
