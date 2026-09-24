"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/layout/page-header";
import { JENIS, jenisRun, MissionTimeline } from "@/components/riwayat/mission-timeline";
import { ConsoleLabel, ConsolePanel } from "@/components/shared/console-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRuns } from "@/hooks/use-api";
import { formatDate, formatDateTime, formatDuration, formatTokens } from "@/lib/utils";

const axis = { fill: "var(--faint)", fontSize: 10, fontFamily: "var(--font-mono)" };
const tooltip = {
  contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontFamily: "var(--font-mono)", fontSize: 11 },
  labelStyle: { color: "var(--foreground)" },
};

export default function RiwayatPage() {
  const { data: runs = [], isLoading } = useRuns();
  const [onlyFailed, setOnlyFailed] = useState(false);

  // Metrik dari run pengumpulan saja: run "penilaian ulang" tidak mencari lowongan baru.
  const kumpul = runs.filter((r) => jenisRun(r) === "pengumpulan");
  const sum = (f: (r: (typeof runs)[number]) => number, xs = kumpul) => xs.reduce((s, r) => s + f(r), 0);
  const found = sum((r) => r.found);
  const lolos = sum((r) => r.passedLocal);
  const rekom = sum((r) => r.recommended, runs);
  const bermasalah = runs.filter((r) => r.status === "gagal").length;

  const corong = [...kumpul].reverse().map((r) => ({
    label: formatDate(r.startedAt),
    ditemukan: r.found,
    lolos: r.passedLocal,
    rekomendasi: r.recommended,
  }));
  const token = [...runs].reverse().map((r) => ({ label: formatDate(r.startedAt), tokens: Math.round(r.tokens / 1000) }));
  const rows = onlyFailed ? runs.filter((r) => r.status === "gagal") : runs;

  return (
    <div className="pb-16">
      <PageHeader index="07" eyebrow="Buku log penerbangan" title="Riwayat Run" description="Setiap misi pipeline: apa yang ditemukan, apa yang lolos, dan berapa biayanya" />

      <div className="flex flex-col gap-4 px-4 pt-6 sm:px-6 lg:px-10">
        <ConsolePanel className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {[
            ["Lowongan ditemukan", String(found), "", `${kumpul.length} run pengumpulan`],
            ["Lolos filter lokal", found ? `${Math.round((lolos / found) * 100)}%` : "—", "", `${lolos} magang IT relevan`],
            ["Rekomendasi", String(rekom), "text-success", "di atas ambang skor"],
            ["Durasi rata-rata", kumpul.length ? formatDuration(Math.round(sum((r) => r.durationSec) / kumpul.length)) : "—", "", `${bermasalah} run gagal/dibatalkan`],
          ].map(([k, v, c, sub]) => (
            <div key={k}>
              <ConsoleLabel>{k}</ConsoleLabel>
              <p className={`mt-1 font-display text-[25px] font-bold tabular-nums ${c || "text-[#F1EEE3]"}`}>{isLoading ? "—" : v}</p>
              <p className="font-mono text-[10px] text-console-muted">{sub}</p>
            </div>
          ))}
        </ConsolePanel>

        <ConsolePanel className="px-4 py-4 sm:px-6 sm:py-5">
          <ConsoleLabel className="mb-2 text-primary">&gt; linimasa misi &middot; ketuk titik untuk detail</ConsoleLabel>
          {isLoading ? <Skeleton className="h-24 rounded-xl bg-console-deep" /> : <MissionTimeline runs={runs} />}
        </ConsolePanel>
      </div>

      <div className="grid gap-4 px-4 pt-4 sm:px-6 lg:grid-cols-2 lg:px-10">
        <Card className="px-4 py-5 sm:px-6">
          <p className="eyebrow mb-3">Corong per run pengumpulan</p>
          <div className="h-56">
            {isLoading ? <Skeleton className="h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={corong} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barGap={2}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="2 5" vertical={false} />
                  <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
                  <YAxis tick={axis} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip {...tooltip} cursor={{ fill: "var(--muted)" }} />
                  <Legend wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: 10.5 }} iconType="circle" iconSize={8} />
                  <Bar dataKey="ditemukan" name="ditemukan" fill="var(--console-muted)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lolos" name="lolos lokal" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rekomendasi" name="rekomendasi" fill="var(--success)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <Card className="px-4 py-5 sm:px-6">
          <p className="eyebrow mb-3">Pemakaian token Claude per run (ribu)</p>
          <div className="h-56">
            {isLoading ? <Skeleton className="h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={token} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="2 5" vertical={false} />
                  <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
                  <YAxis tick={axis} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltip} cursor={{ fill: "var(--muted)" }} />
                  <Bar dataKey="tokens" name="Token (K)" fill="var(--info)" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="px-4 pt-6 sm:px-6 lg:px-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="eyebrow">Catatan run</p>
          <Button variant="chip" size="sm" data-active={onlyFailed} aria-pressed={onlyFailed} onClick={() => setOnlyFailed((v) => !v)}>
            Hanya run gagal/dibatalkan
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Waktu run</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Ditemukan → lolos → rekomendasi</TableHead>
              <TableHead>Durasi</TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="font-mono text-[12.5px]">
            {rows.map((r) => {
              const j = jenisRun(r);
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-semibold whitespace-nowrap">{formatDateTime(r.startedAt)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="size-2 rounded-full" style={{ background: JENIS[j].color }} /> {JENIS[j].label}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.found} → {r.passedLocal} → <span className="text-success">{r.recommended}</span></TableCell>
                  <TableCell className="text-muted-foreground">{formatDuration(r.durationSec)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatTokens(r.tokens)}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "berhasil" ? "success" : j === "dibatalkan" ? "default" : "danger"}>
                      {r.status === "berhasil" ? "Berhasil" : j === "dibatalkan" ? "Dibatalkan" : `Gagal · ${r.error ?? "error"}`}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
