"use client";

import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { ConsoleLabel, ConsolePanel } from "@/components/shared/console-panel";
import { GroundStation } from "@/components/sumber/ground-station";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useSources, useUpdateSource } from "@/hooks/use-api";
import { IS_SHOWCASE } from "@/lib/mode";
import type { Source } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

function SourceCard({ source }: { source: Source }) {
  const update = useUpdateSource();
  const commit = (patch: Partial<Source>) =>
    update.mutate(
      { key: source.key, patch },
      {
        onSuccess: () => toast(`${source.name} diperbarui`),
        // Backend menolak isian tidak valid (mis. baris yang bukan URL) dengan pesan jelas.
        onError: (e) => toast.error(`${source.name}: ${e.message}`),
      },
    );

  return (
    <Card id={`sumber-${source.key}`} className="flex scroll-mt-20 flex-col gap-4 px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Switch
            checked={source.enabled}
            onCheckedChange={(enabled) => commit({ enabled })}
            disabled={IS_SHOWCASE}
            aria-label={`Aktifkan ${source.name}`}
          />
          <h2 className="font-display text-[15.5px] font-bold">{source.name}</h2>
          {!source.enabled && <Badge>nonaktif</Badge>}
        </div>
        {/* Pesan status bisa panjang; di HP boleh membungkus alih-alih menjorok keluar layar. */}
        {source.enabled ? (
          <Badge variant={source.status === "ok" ? "success" : "danger"} className="h-auto max-w-full px-3 py-1 text-left whitespace-normal">
            <span className="size-1.5 shrink-0 rounded-full bg-current" />
            {source.status === "ok" ? "Berhasil" : "Error"} &middot; {source.lastMessage} &middot; {timeAgo(source.lastRunAt)}
          </Badge>
        ) : (
          // Sumber nonaktif: tampilkan alasannya saja, bukan "Berhasil" yang menyesatkan.
          <Badge className="h-auto max-w-full px-3 py-1 text-left whitespace-normal">{source.lastMessage}</Badge>
        )}
      </div>
      {/* Showcase: konfigurasi pencarian tidak dipublikasikan dan tidak bisa diubah. */}
      {!IS_SHOWCASE && (
      <div className="grid gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="eyebrow">Kata kunci pencarian &middot; pisahkan dengan koma</span>
          <Input defaultValue={source.keywords} onBlur={(e) => e.target.value !== source.keywords && commit({ keywords: e.target.value })} />
        </label>
      </div>
      )}
      {source.targetedQuery && (
        <label className="flex flex-col gap-1.5">
          <span className="eyebrow">URL pencarian bertarget &middot; satu per baris &middot; {"{q}"} = kata kunci</span>
          <Textarea
            defaultValue={source.targetedQuery}
            rows={Math.min(4, source.targetedQuery.split("\n").length)}
            spellCheck={false}
            className="font-mono text-[11.5px]"
            onBlur={(e) => e.target.value !== source.targetedQuery && commit({ targetedQuery: e.target.value })}
          />
        </label>
      )}
    </Card>
  );
}

export default function SumberPage() {
  const { data: sources, isLoading } = useSources();
  return (
    <div className="max-w-5xl pb-16">
      <PageHeader index="05" eyebrow="Stasiun pemantau" title="Sumber" description="Situs yang dipantau connector, kata kunci pencarian, dan status tiap sumber" />
      <div className="px-4 pt-6 sm:px-6 lg:px-10">
        <ConsolePanel className="px-4 py-4 sm:px-6 sm:py-5">
          <ConsoleLabel className="mb-3 text-primary">&gt; stasiun bumi &middot; aliran sinyal run terakhir tiap sumber</ConsoleLabel>
          {sources ? <GroundStation sources={sources} /> : <Skeleton className="h-64 rounded-xl bg-console-deep" />}
        </ConsolePanel>
      </div>
      <div className="flex flex-col gap-3.5 px-4 sm:px-6 lg:px-10 pt-4">
        {isLoading || !sources
          ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
          : sources.map((s) => <SourceCard key={s.key} source={s} />)}
      </div>
    </div>
  );
}
