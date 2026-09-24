import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ScoreBand = "kuat" | "sedang" | "lemah";

// Sama dengan definisi `kecocokan` di prompt ranking (pipeline/rank.py):
// tinggi >= 75, sedang 50-74, rendah < 50.
export function scoreBand(score: number): ScoreBand {
  if (score >= 75) return "kuat";
  if (score >= 50) return "sedang";
  return "lemah";
}

export const bandColor: Record<ScoreBand, string> = {
  kuat: "var(--success)",
  sedang: "var(--primary)",
  lemah: "var(--console-muted)",
};

export const bandLabel: Record<ScoreBand, string> = {
  kuat: "Cocok kuat",
  sedang: "Cocok sedang",
  lemah: "Cocok lemah",
};

const monthsId = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

// Banyak lowongan tidak mencantumkan deadline; backend mengirim "" untuk itu.
const valid = (iso: string) => !!iso && !Number.isNaN(new Date(iso).getTime());

export function formatDate(iso: string, withYear = false) {
  if (!valid(iso)) return "—";
  const d = new Date(iso);
  return `${d.getDate()} ${monthsId[d.getMonth()]}${withYear ? ` ${d.getFullYear()}` : ""}`;
}

export function formatDateTime(iso: string) {
  if (!valid(iso)) return "—";
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(iso)} ${hh}:${mm}`;
}

export function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatTokens(n: number) {
  return n >= 1000 ? `${Math.round(n / 1000)}K` : String(n);
}

export function timeAgo(iso: string) {
  if (!valid(iso)) return "belum pernah";
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return `${Math.max(1, Math.floor(diff / 60_000))} menit lalu`;
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

/**
 * Tautan dari data luar (hasil scraping, sumber laporan Claude) hanya boleh http/https.
 * React 19 sudah memblokir `javascript:`, tapi skema lain (data:, vbscript:, file:) tidak.
 */
export function amanUrl(u: string | null | undefined): string | undefined {
  if (!u) return undefined;
  try {
    const p = new URL(u);
    return p.protocol === "http:" || p.protocol === "https:" ? p.href : undefined;
  } catch {
    return undefined;
  }
}
