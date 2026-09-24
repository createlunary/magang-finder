"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RadioTower } from "lucide-react";
import { ConsoleLabel } from "@/components/shared/console-panel";
import type { Source } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

const TAHAP = [
  { key: "links", label: "tautan" },
  { key: "opened", label: "dibuka" },
  { key: "relevant", label: "relevan" },
] as const;

/**
 * Stasiun bumi: tiap sumber adalah pita sinyal yang menyempit dari tautan di halaman
 * daftar → halaman yang benar-benar dibuka → magang IT relevan. Paket data mengalir
 * di sepanjang pita; jumlah paket sebanding dengan hasil relevan.
 */
export function GroundStation({ sources }: { sources: Source[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(800);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const compact = W < 560;

  const rows = useMemo(
    () =>
      sources
        .filter((s) => s.enabled)
        .map((s) => {
          const st = s.stats;
          return { s, links: st?.links ?? 0, opened: st?.new ?? 0, relevant: st?.relevant ?? 0 };
        })
        .sort((a, b) => Number(b.s.enabled) - Number(a.s.enabled) || b.relevant - a.relevant),
    [sources],
  );
  const maxLinks = Math.max(1, ...rows.map((r) => r.links));
  const total = rows.reduce((t, r) => ({ links: t.links + r.links, opened: t.opened + r.opened, relevant: t.relevant + r.relevant }), { links: 0, opened: 0, relevant: 0 });

  // Geometri: kolom label kiri, lalu pita dari x0 ke x1 dengan tiga titik tahap.
  const labelW = compact ? 0 : 150;
  const x0 = labelW + 8;
  const x1 = W - 8;
  const xs = [x0, x0 + (x1 - x0) * 0.5, x1];
  const rowH = compact ? 78 : 58;
  const bandMax = compact ? 30 : 34;
  const H = rows.length * rowH + 22;
  const tinggi = (v: number) => (v ? 3 + (bandMax - 3) * Math.sqrt(v / maxLinks) : 1.5);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {TAHAP.map((t, i) => (
          <div key={t.key} className="rounded-xl border border-console-border bg-console-deep/60 px-3 py-2.5">
            <ConsoleLabel>{i === 0 ? "ditemukan" : t.label}</ConsoleLabel>
            <p className="mt-0.5 font-display text-[22px] font-bold tabular-nums" style={{ color: i === 2 ? "var(--success)" : i === 1 ? "var(--primary)" : "var(--console-foreground)" }}>
              {total[t.key]}
            </p>
            {i > 0 && total.links > 0 && (
              <p className="font-mono text-[10px] text-console-muted">{((total[t.key] / total.links) * 100).toFixed(1)}% dari tautan</p>
            )}
          </div>
        ))}
      </div>

      <div ref={box} className="relative w-full" style={{ height: H }} role="img" aria-label="Aliran sinyal tiap sumber: tautan, dibuka, relevan">
        {!compact && (
          <div className="absolute top-0 flex w-full font-mono text-[9.5px] tracking-[0.1em] text-console-muted uppercase">
            {TAHAP.map((t, i) => (
              <span key={t.key} className="absolute whitespace-nowrap" style={{ left: xs[i], transform: i === 0 ? undefined : i === 2 ? "translateX(-100%)" : "translateX(-50%)" }}>
                ▸ {t.label}
              </span>
            ))}
          </div>
        )}
        <svg width={W} height={H} className="absolute inset-0" aria-hidden="true">
          <defs>
            <linearGradient id="gs-pita" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="var(--console-muted)" stopOpacity="0.35" />
              <stop offset="55%" stopColor="var(--primary)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--success)" stopOpacity="0.85" />
            </linearGradient>
          </defs>
          {rows.map((r, i) => {
            const cy = 22 + i * rowH + (compact ? rowH - 24 : rowH / 2);
            const h = [tinggi(r.links), tinggi(r.opened), tinggi(r.relevant)];
            // Pita melengkung halus: sisi atas dari kiri ke kanan, sisi bawah kembali.
            const atas = `M ${xs[0]} ${cy - h[0] / 2} C ${xs[0] + 60} ${cy - h[0] / 2}, ${xs[1] - 60} ${cy - h[1] / 2}, ${xs[1]} ${cy - h[1] / 2} C ${xs[1] + 60} ${cy - h[1] / 2}, ${xs[2] - 60} ${cy - h[2] / 2}, ${xs[2]} ${cy - h[2] / 2}`;
            const bawah = `L ${xs[2]} ${cy + h[2] / 2} C ${xs[2] - 60} ${cy + h[2] / 2}, ${xs[1] + 60} ${cy + h[1] / 2}, ${xs[1]} ${cy + h[1] / 2} C ${xs[1] - 60} ${cy + h[1] / 2}, ${xs[0] + 60} ${cy + h[0] / 2}, ${xs[0]} ${cy + h[0] / 2} Z`;
            return (
              <g key={r.s.key} opacity={r.s.enabled ? 1 : 0.35}>
                <path d={atas + " " + bawah} fill="url(#gs-pita)" />
                {[r.links, r.opened, r.relevant].map((v, k) => (
                  <text key={k} x={xs[k] + (k === 2 ? -6 : 6)} y={cy - h[k] / 2 - 5} textAnchor={k === 2 ? "end" : "start"} fontFamily="var(--font-mono)" fontSize={10.5} fill={k === 2 ? "var(--success)" : "var(--console-foreground)"}>
                    {v}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>

        {/* Paket data: sebanyak hasil relevan (maks 6), mengalir di tengah pita */}
        <div className="pointer-events-none absolute inset-0 motion-reduce:hidden" aria-hidden="true">
          {rows.flatMap((r, i) => {
            if (!r.s.enabled || !r.links) return [];
            const cy = 22 + i * rowH + (compact ? rowH - 24 : rowH / 2);
            const d = `M ${xs[0]} ${cy} L ${xs[2]} ${cy}`;
            return Array.from({ length: Math.min(6, Math.max(1, r.relevant)) }, (_, k) => (
              <span
                key={`${r.s.key}${k}`}
                className="neural-signal absolute top-0 left-0 h-[3px] w-3 rounded-full"
                style={{
                  offsetPath: `path("${d}")`,
                  background: r.relevant ? "var(--success)" : "var(--console-muted)",
                  boxShadow: `0 0 8px ${r.relevant ? "var(--success)" : "var(--console-muted)"}`,
                  animationDuration: `${3.2 + (i % 3) * 0.5}s`,
                  animationDelay: `${-k * (3.2 / Math.min(6, Math.max(1, r.relevant)))}s`,
                }}
              />
            ));
          })}
        </div>

        {rows.map((r, i) => {
          const top = 22 + i * rowH;
          const warna = !r.s.enabled ? "var(--console-muted)" : r.s.status === "ok" ? "var(--success)" : "var(--danger)";
          return (
            <a
              key={r.s.key}
              href={`#sumber-${r.s.key}`}
              className="absolute flex items-center gap-2 rounded-md outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-primary"
              style={compact ? { left: 0, top: top + 4 } : { left: 0, top: top + rowH / 2, transform: "translateY(-50%)", width: labelW - 8 }}
            >
              <span className="relative flex size-7 shrink-0 items-center justify-center rounded-lg border border-console-border bg-console-deep">
                <RadioTower className="size-3.5 text-console-foreground" />
                <span className={`absolute -top-0.5 -right-0.5 size-2 rounded-full ${r.s.enabled && r.s.status === "ok" ? "anim-blink" : ""}`} style={{ background: warna }} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] font-semibold text-console-foreground">{r.s.name}</span>
                <span className="block truncate font-mono text-[9.5px] text-console-muted">
                  {r.s.enabled ? `${r.s.stats ? `${r.s.stats.seconds}s · ` : ""}${timeAgo(r.s.lastRunAt)}` : "nonaktif"}
                </span>
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
