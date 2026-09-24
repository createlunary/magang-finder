"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUp, Globe, Loader2, MessageSquare, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConsoleLabel } from "@/components/shared/console-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { qk, useChat, useClearChat } from "@/hooks/use-api";
import { api } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";
import { amanUrl, cn } from "@/lib/utils";

const SARAN = [
  "Kira-kira di posisi ini aku bakal ngerjain apa aja?",
  "Skill apa yang perlu aku siapkan sebelum melamar?",
  "Cari info budaya kerja dan ulasan karyawan perusahaan ini",
  "Berapa kisaran uang saku magang untuk posisi seperti ini?",
];

// Markdown jawaban Claude: tanpa HTML mentah (bawaan react-markdown), tautan selalu tab baru.
const MD: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-2 flex list-disc flex-col gap-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 flex list-decimal flex-col gap-1 pl-5 last:mb-0">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  a: ({ href, children }) => (
    <a href={amanUrl(href)} target="_blank" rel="noreferrer" className="break-words text-primary underline-offset-2 hover:underline">
      {children}
    </a>
  ),
  code: ({ children }) => <code className="rounded bg-muted px-1 py-0.5 font-mono text-[12px]">{children}</code>,
  table: ({ children }) => (
    <div className="mb-2 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-[12.5px]">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-b border-border px-2 py-1.5 text-left font-semibold text-foreground">{children}</th>,
  td: ({ children }) => <td className="border-b border-border/60 px-2 py-1.5 align-top">{children}</td>,
  h1: ({ children }) => <p className="mb-2 font-semibold">{children}</p>,
  h2: ({ children }) => <p className="mb-2 font-semibold">{children}</p>,
  h3: ({ children }) => <p className="mb-2 font-semibold">{children}</p>,
};

function Aktivitas({ items, live }: { items: string[]; live?: boolean }) {
  if (!items.length) return null;
  return (
    <details className="mb-2 font-mono text-[11px] text-faint" open={live}>
      <summary className="cursor-pointer select-none hover:text-muted-foreground">
        <Globe className="mr-1 inline size-3" />
        {items.length} langkah pencarian web
      </summary>
      <ul className="mt-1 flex flex-col gap-0.5 pl-4">
        {items.map((a, i) => <li key={i} className="truncate">· {a}</li>)}
      </ul>
    </details>
  );
}

function Gelembung({ role, children }: { role: ChatMessage["role"]; children: React.ReactNode }) {
  return (
    <div className={cn("flex", role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed",
          role === "user" ? "rounded-br-md bg-primary/15 text-foreground" : "rounded-bl-md border border-border bg-subtle text-muted-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function JobChatPanel({ jobId, company }: { jobId: string; company: string }) {
  const qc = useQueryClient();
  const { data: messages = [] } = useChat(jobId);
  const clear = useClearChat(jobId);

  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<{ question: string; text: string; activity: string[] } | null>(null);
  const [quota, setQuota] = useState<number | null>(null);
  const abort = useRef<AbortController | null>(null);
  const daftar = useRef<HTMLDivElement>(null);

  // Gulir KOTAK chat ke pesan terbaru — bukan halaman. scrollIntoView menggulir
  // seluruh halaman, sehingga membuka lowongan langsung melompat ke area chat.
  useEffect(() => {
    const el = daftar.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, pending?.text, pending?.activity.length]);

  useEffect(() => () => abort.current?.abort(), []);

  const kirim = async (pertanyaan: string) => {
    const q = pertanyaan.trim();
    if (!q || pending) return;
    setDraft("");
    setPending({ question: q, text: "", activity: [] });
    abort.current = new AbortController();
    try {
      await api.sendChat(
        jobId,
        q,
        (e) => {
          if (e.type === "delta") setPending((p) => p && { ...p, text: p.text + e.text });
          else if (e.type === "activity") setPending((p) => p && { ...p, activity: [...p.activity, e.text] });
          else if (e.type === "quota" && e.fiveHour != null) setQuota(e.fiveHour);
          else if (e.type === "error") throw new Error(e.text);
        },
        abort.current.signal,
      );
    } catch (err) {
      if ((err as Error).name !== "AbortError") toast.error((err as Error).message);
      else setDraft(q);             // dihentikan: kembalikan pertanyaannya supaya bisa dikirim ulang
    } finally {
      // Server sudah menyimpan (atau membuang) pesan; muat ulang dari sana.
      await qc.invalidateQueries({ queryKey: qk.chat(jobId) });
      setPending(null);
      abort.current = null;
    }
  };

  return (
    <Card className="flex flex-col gap-4 px-5 py-6 sm:px-8 sm:py-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">[ Tanya Claude ] &mdash; tentang lowongan ini</p>
          <h2 className="mt-1 font-display text-xl font-bold">Ada yang mau ditanyakan?</h2>
          <p className="mt-1 max-w-2xl text-[12.5px] text-muted-foreground">
            Claude sudah membaca lowongan ini, penilaiannya, profilmu, dan laporan Deep Search {company}.
            Untuk info di luar itu, ia mencari di web dan menyertakan sumbernya.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {quota != null && (
            <span
              className={cn("font-mono text-[10.5px]", quota >= 0.9 ? "text-danger" : "text-faint")}
              title="Pemakaian kuota Claude (jendela 5 jam), dipakai bersama Deep Search dan ranking"
            >
              kuota 5 jam {Math.round(quota * 100)}%
            </span>
          )}
          {messages.length > 0 && !pending && (
            <Button variant="ghost" size="sm" onClick={() => clear.mutate(undefined, { onSuccess: () => toast("Percakapan dihapus") })}>
              <Trash2 /> Hapus
            </Button>
          )}
        </div>
      </div>

      <div ref={daftar} className="flex max-h-[min(560px,60vh)] flex-col gap-3 overflow-y-auto overscroll-contain pr-1" aria-live="polite">
        {messages.map((m) => (
          <Gelembung key={m.id} role={m.role}>
            {m.role === "assistant" ? (
              <>
                <Aktivitas items={m.activity} />
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>{m.content}</ReactMarkdown>
              </>
            ) : (
              <p className="whitespace-pre-wrap">{m.content}</p>
            )}
          </Gelembung>
        ))}

        {pending && (
          <>
            <Gelembung role="user"><p className="whitespace-pre-wrap">{pending.question}</p></Gelembung>
            <Gelembung role="assistant">
              <Aktivitas items={pending.activity} live />
              {pending.text ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>{pending.text}</ReactMarkdown>
              ) : (
                <ConsoleLabel className="flex items-center gap-2 text-faint">
                  <Loader2 className="size-3.5 animate-spin" />
                  {pending.activity.length ? "membaca hasil pencarian…" : "Claude sedang berpikir…"}
                </ConsoleLabel>
              )}
            </Gelembung>
          </>
        )}
      </div>

      {!messages.length && !pending && (
        <div className="flex flex-wrap gap-2">
          {SARAN.map((s) => (
            <Button key={s} variant="chip" size="sm" onClick={() => kirim(s)} className="h-auto py-1.5 text-left whitespace-normal">
              <MessageSquare className="size-3" /> {s}
            </Button>
          ))}
        </div>
      )}

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          kirim(draft);
        }}
      >
        <label htmlFor={`chat-${jobId}`} className="sr-only">Pertanyaan untuk Claude</label>
        <Textarea
          id={`chat-${jobId}`}
          rows={2}
          value={draft}
          disabled={!!pending}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              kirim(draft);
            }
          }}
          placeholder="Tanya apa saja tentang lowongan atau perusahaannya… (Enter kirim, Shift+Enter baris baru)"
          className="min-h-[44px] resize-none"
        />
        {pending ? (
          <Button type="button" variant="outline" size="icon" onClick={() => abort.current?.abort()} aria-label="Hentikan jawaban">
            <Square className="fill-current" />
          </Button>
        ) : (
          <Button type="submit" size="icon" disabled={!draft.trim()} aria-label="Kirim">
            <ArrowUp />
          </Button>
        )}
      </form>
    </Card>
  );
}
