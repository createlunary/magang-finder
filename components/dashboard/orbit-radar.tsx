"use client";

import { useEffect, useRef, useState } from "react";
import type { Job } from "@/lib/types";
import { bandColor, cn, scoreBand } from "@/lib/utils";

const SIZE = 520;
const C = SIZE / 2;
const RADIUS = { kuat: 90, sedang: 160, lemah: 230 } as const;
const DURATION = { kuat: 48, sedang: 72, lemah: 96 } as const;

/** Sudut awal tiap satelit dibuat deterministik dari id supaya posisinya stabil. */
function startAngle(id: string, index: number) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return (h + index * 137) % 360;
}

/** "PT. Javan Cipta Solusi" → "Javan": tanpa ini hampir semua label berbunyi "PT". */
function shortCompany(name: string) {
  return name.replace(/^(PT|CV|UD|Yayasan)\.?\s+/i, "").split(/\s+/)[0] || name;
}

export function OrbitRadar({
  jobs,
  selectedId,
  onSelect,
  paused,
  fast,
}: {
  jobs: Job[];
  selectedId?: string;
  onSelect: (id: string) => void;
  paused: boolean;
  fast: boolean;
}) {
  const playState = paused && !fast ? "paused" : "running";

  // Geometri radar dihitung dalam piksel untuk 520 px; di layar sempit seluruhnya
  // diskalakan, bukan dihitung ulang. Label kecil tak terbaca setelah diperkecil,
  // jadi di bawah 80% hanya label satelit terpilih yang tampil.
  const box = useRef<HTMLDivElement>(null);
  const [skala, setSkala] = useState(1);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSkala(Math.min(1, e.contentRect.width / SIZE)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const labelSemua = skala >= 0.8;

  return (
    <div ref={box} className="w-full max-w-[520px]" style={{ height: SIZE * skala }}>
    <div
      className="dot-grid relative overflow-hidden rounded-full border border-console-border bg-console-deep"
      style={{ width: SIZE, height: SIZE, transform: `scale(${skala})`, transformOrigin: "top left" }}
      role="group"
      aria-label="Radar orbit: jarak dari pusat menunjukkan skor kecocokan"
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0" aria-hidden="true">
        <line x1={C} y1={12} x2={C} y2={SIZE - 12} stroke="#2C2A22" />
        <line x1={12} y1={C} x2={SIZE - 12} y2={C} stroke="#2C2A22" />
        <circle cx={C} cy={C} r={RADIUS.kuat} fill="none" stroke="var(--success)" strokeOpacity={0.45} strokeDasharray="2 5" />
        <circle cx={C} cy={C} r={RADIUS.sedang} fill="none" stroke="var(--primary)" strokeOpacity={0.35} strokeDasharray="2 5" />
        <circle cx={C} cy={C} r={RADIUS.lemah} fill="none" stroke="#8C8A78" strokeOpacity={0.35} strokeDasharray="2 5" />
        <circle cx={C} cy={C} r={252} fill="none" stroke="#2C2A22" />
        {Array.from({ length: 36 }, (_, i) => {
          const a = (i * 10 * Math.PI) / 180;
          const inner = i % 9 === 0 ? 240 : 246;
          return (
            <line
              key={i}
              x1={C + Math.sin(a) * inner}
              y1={C - Math.cos(a) * inner}
              x2={C + Math.sin(a) * 252}
              y2={C - Math.cos(a) * 252}
              stroke="#3A3C33"
            />
          );
        })}
        <g fontFamily="var(--font-mono)" fontSize={10}>
          <text x={C + 6} y={C - RADIUS.kuat + 14} fill="var(--success)">≥75</text>
          <text x={C + 6} y={C - RADIUS.sedang + 14} fill="var(--primary)">50–74</text>
          <text x={C + 6} y={C - RADIUS.lemah + 14} fill="#8C8A78">&lt;50</text>
          <text x={SIZE - 38} y={C - 5} fill="#5A5848" fontSize={9}>090</text>
          <text x={16} y={C - 5} fill="#5A5848" fontSize={9}>270</text>
          <text x={C + 5} y={SIZE - 18} fill="#5A5848" fontSize={9}>180</text>
        </g>
      </svg>

      {/* Sapuan radar */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full"
        style={{
          left: 10,
          top: 10,
          width: SIZE - 20,
          height: SIZE - 20,
          background:
            "conic-gradient(from 0deg, rgba(240,169,59,0) 0deg, rgba(240,169,59,0) 290deg, rgba(240,169,59,0.26) 360deg)",
          // Properti terpisah, bukan `animation` gabungan: React memperingatkan
          // (dan bisa salah render) kalau shorthand dicampur animationPlayState.
          animationName: "sweep",
          animationDuration: `${fast ? 1.4 : 7}s`,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
          animationPlayState: playState,
        }}
      >
        <div
          className="absolute left-1/2 top-0 h-1/2 w-px"
          style={{ background: "linear-gradient(to top, rgba(240,169,59,0.9), rgba(240,169,59,0))" }}
        />
      </div>

      {/* Inti: profil */}
      <div className="absolute size-16" style={{ left: C - 32, top: C - 32 }}>
        <div className="anim-pulse-ring absolute inset-0 rounded-full border border-primary" />
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-primary text-primary-foreground">
          <span className="font-mono text-[9px] font-bold tracking-[0.06em]">PROFIL</span>
          <span className="font-display text-sm leading-none font-bold">aktif</span>
        </div>
      </div>

      {/* Satelit */}
      {jobs.map((job, i) => {
        const band = scoreBand(job.score);
        const dur = DURATION[band];
        const delay = -((startAngle(job.id, i) / 360) * dur);
        const color = bandColor[band];
        const selected = job.id === selectedId;
        const anim = {
          animationDuration: `${dur}s`,
          animationDelay: `${delay}s`,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
          animationPlayState: playState,
        } as const;

        return (
          <div key={job.id} className="absolute size-0" style={{ left: C, top: C, animationName: "orbit", ...anim }}>
            <div className="absolute size-0" style={{ transform: `translateX(${RADIUS[band]}px)` }}>
              <div className="absolute size-0" style={{ animationName: "counter-orbit", ...anim }}>
                <button
                  type="button"
                  onClick={() => onSelect(job.id)}
                  aria-label={`Pilih ${job.role} di ${job.company}, skor ${job.score}`}
                  aria-pressed={selected}
                  className="group absolute -top-[18px] -left-[18px] flex size-9 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span
                    className="block rounded-full transition-all duration-200 group-hover:scale-150"
                    style={{
                      width: selected ? 16 : 11,
                      height: selected ? 16 : 11,
                      background: color,
                      boxShadow: `0 0 0 ${selected ? 5 : 3}px color-mix(in srgb, ${color} ${selected ? 30 : 18}%, transparent), 0 0 18px color-mix(in srgb, ${color} 60%, transparent)`,
                    }}
                  />
                </button>
                {(labelSemua || selected) && (
                  <span
                    className={cn(
                      "pointer-events-none absolute top-[-8px] left-4 rounded-[5px] border px-1.5 py-px font-mono text-[10px] tracking-[0.03em] whitespace-nowrap",
                      selected ? "text-[#17170F]" : "border-console-border bg-console-deep/75 text-console-foreground/85",
                    )}
                    style={selected ? { background: color, borderColor: color, fontSize: 10 / Math.max(skala, 0.6) } : undefined}
                  >
                    {job.score} &middot; {shortCompany(job.company)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
    </div>
  );
}
