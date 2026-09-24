"use client";

import { useEffect, useRef, useState } from "react";
import { ConsoleLabel } from "@/components/shared/console-panel";
import { bandColor, scoreBand } from "@/lib/utils";

/* ------------------------------------------------------------------ Histogram */

const BIN = 5;

/**
 * Sebaran skor lowongan yang sudah dinilai + garis ambang. Bisa diseret langsung:
 * posisi horizontal pointer = ambang baru. Kolom di kanan garis = yang lolos.
 */
export function ThresholdHistogram({ scores, threshold, onChange }: { scores: number[]; threshold: number; onChange: (v: number) => void }) {
  const bins = Array.from({ length: 100 / BIN }, (_, i) => scores.filter((s) => s >= i * BIN && (i === 100 / BIN - 1 ? s <= 100 : s < (i + 1) * BIN)).length);
  const maks = Math.max(1, ...bins);
  const lolos = scores.filter((s) => s >= threshold).length;
  const area = useRef<HTMLDivElement>(null);
  const seret = useRef(false);

  const dariPointer = (clientX: number) => {
    const r = area.current!.getBoundingClientRect();
    onChange(Math.round(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100))));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <ConsoleLabel>lolos ke rekomendasi</ConsoleLabel>
          <p className="font-display text-[34px] leading-none font-bold tabular-nums text-console-foreground">
            {lolos}
            <span className="ml-1.5 text-[15px] font-medium text-console-muted">/ {scores.length} lowongan</span>
          </p>
        </div>
      </div>

      <div
        ref={area}
        className="relative h-40 cursor-ew-resize touch-none select-none"
        role="slider"
        tabIndex={0}
        aria-label="Ambang skor rekomendasi"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={threshold}
        onPointerDown={(e) => {
          seret.current = true;
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          dariPointer(e.clientX);
        }}
        onPointerMove={(e) => seret.current && dariPointer(e.clientX)}
        onPointerUp={() => (seret.current = false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") onChange(Math.max(0, threshold - 1));
          if (e.key === "ArrowRight") onChange(Math.min(100, threshold + 1));
        }}
      >
        <div className="absolute inset-x-0 bottom-5 top-0 flex items-end gap-[3px]">
          {bins.map((n, i) => {
            const tengah = i * BIN + BIN / 2;
            const lulus = tengah >= threshold;
            return (
              // h-full + justify-end: tinggi persen kolom butuh induk yang tingginya pasti.
              <div key={i} className="relative flex h-full flex-1 flex-col justify-end">
                <div
                  className="w-full rounded-t-[3px] transition-[background-color,opacity] duration-200"
                  style={{
                    height: `${Math.max(n ? 6 : 1.5, (n / maks) * 100)}%`,
                    minHeight: n ? 6 : 1.5,
                    background: lulus ? bandColor[scoreBand(tengah)] : "var(--console-muted)",
                    opacity: lulus ? 0.95 : 0.3,
                    boxShadow: lulus && n ? `0 0 12px color-mix(in srgb, ${bandColor[scoreBand(tengah)]} 45%, transparent)` : undefined,
                  }}
                />
                {n > 0 && (
                  <span className="absolute left-1/2 -translate-x-1/2 font-mono text-[9.5px] text-console-muted" style={{ bottom: `calc(${(n / maks) * 100}% + 2px)` }}>
                    {n}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {/* Garis ambang */}
        <div className="pointer-events-none absolute top-0 bottom-5 w-px bg-primary" style={{ left: `${threshold}%` }}>
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full rounded bg-primary px-1.5 py-0.5 font-mono text-[10px] font-bold whitespace-nowrap text-primary-foreground">
            {threshold}
          </span>
          <span className="absolute bottom-0 left-1/2 size-2.5 -translate-x-1/2 translate-y-1/2 rotate-45 bg-primary" />
        </div>
        <div className="absolute inset-x-0 bottom-0 flex justify-between font-mono text-[9.5px] text-console-muted">
          {[0, 25, 50, 75, 100].map((t) => <span key={t}>{t}</span>)}
        </div>
      </div>
      <p className="font-mono text-[10px] text-console-muted">seret di grafik atau pakai tombol panah untuk mengubah ambang</p>
    </div>
  );
}

/* ------------------------------------------------------------------ Jam 24 jam */

const S = 220;
const C = S / 2;
const R = 86;
const menit = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const hhmm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const titik = (m: number, r = R) => {
  const a = (m / 1440) * Math.PI * 2 - Math.PI / 2;
  return { x: C + Math.cos(a) * r, y: C + Math.sin(a) * r };
};

/** Jam 24 jam: kenop amber = jadwal (bisa diputar, kelipatan 15 menit), jarum tipis = sekarang. */
export function ScheduleDial({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  const svg = useRef<SVGSVGElement>(null);
  const seret = useRef(false);

  const jadwal = menit(value);
  const kini = now.getHours() * 60 + now.getMinutes();
  const selisih = (jadwal - kini + 1440) % 1440 || 1440;
  const k = titik(jadwal);
  const j = titik(kini, R - 18);

  // Busur dari sekarang ke jadwal berikutnya: "waktu tunggu".
  const a0 = titik(kini), a1 = titik(jadwal);
  const busur = `M ${a0.x} ${a0.y} A ${R} ${R} 0 ${selisih > 720 ? 1 : 0} 1 ${a1.x} ${a1.y}`;

  const dariPointer = (cx: number, cy: number) => {
    const r = svg.current!.getBoundingClientRect();
    const x = ((cx - r.left) / r.width) * S - C;
    const y = ((cy - r.top) / r.height) * S - C;
    let m = ((Math.atan2(y, x) + Math.PI / 2) / (Math.PI * 2)) * 1440;
    m = (Math.round(((m + 1440) % 1440) / 15) * 15) % 1440;
    onChange(hhmm(m));
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        ref={svg}
        viewBox={`0 0 ${S} ${S}`}
        className="w-full max-w-[220px] touch-none select-none"
        role="slider"
        tabIndex={0}
        aria-label="Jam run harian"
        aria-valuetext={value}
        onPointerDown={(e) => {
          seret.current = true;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          dariPointer(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => seret.current && dariPointer(e.clientX, e.clientY)}
        onPointerUp={() => (seret.current = false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(hhmm((jadwal + 15) % 1440));
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(hhmm((jadwal + 1425) % 1440));
        }}
      >
        <circle cx={C} cy={C} r={R + 14} fill="var(--console-deep)" stroke="var(--console-border)" />
        <circle cx={C} cy={C} r={R} fill="none" stroke="var(--console-border)" strokeDasharray="1 4" />
        {Array.from({ length: 24 }, (_, h) => {
          const p = titik(h * 60, R + 8), q = titik(h * 60, R + (h % 6 ? 11 : 13));
          return <line key={h} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="var(--console-muted)" strokeWidth={h % 6 ? 1 : 1.6} />;
        })}
        {[0, 6, 12, 18].map((h) => {
          const p = titik(h * 60, R - 12);
          return <text key={h} x={p.x} y={p.y + 3.5} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={10} fill="var(--console-muted)">{String(h).padStart(2, "0")}</text>;
        })}
        <path d={busur} fill="none" stroke="var(--primary)" strokeOpacity={0.35} strokeWidth={4} strokeLinecap="round" />
        <line x1={C} y1={C} x2={j.x} y2={j.y} stroke="var(--console-foreground)" strokeOpacity={0.55} strokeWidth={1.4} />
        <circle cx={C} cy={C} r={3} fill="var(--console-foreground)" />
        <circle cx={k.x} cy={k.y} r={13} fill="var(--primary)" fillOpacity={0.18} />
        <circle cx={k.x} cy={k.y} r={7.5} fill="var(--primary)" stroke="var(--console-deep)" strokeWidth={2} style={{ cursor: "grab" }} />
        <text x={C} y={C + 30} textAnchor="middle" fontFamily="var(--font-display)" fontSize={24} fontWeight={700} fill="var(--console-foreground)">{value}</text>
        <text x={C} y={C + 45} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={9.5} fill="var(--console-muted)">
          {`dalam ${Math.floor(selisih / 60)} j ${selisih % 60} m`}
        </text>
      </svg>
      <p className="text-center font-mono text-[10px] text-console-muted">putar kenop amber &middot; kelipatan 15 menit</p>
    </div>
  );
}
