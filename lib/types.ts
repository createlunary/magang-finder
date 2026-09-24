export type JobStatus = "baru" | "dilamar" | "diterima" | "ditolak";
// Nama sumber mengikuti config/sumber_situs.yaml di backend (jobstreet, glints, …).
export type SourceKey = string;
export type Stage = "scrape" | "dedup" | "local_llm" | "ranking";

export interface MustHaveCheck {
  label: string;
  met: boolean;
}

export interface ScorePoint {
  version: string;
  date: string;
  score: number;
}

export interface Job {
  id: string;
  role: string;
  company: string;
  /** Nama perusahaan yang dinormalkan (tanpa PT/CV) — kunci ke `Company`. */
  companyKey?: string;
  source: SourceKey;
  lokasi: string;
  status: JobStatus;
  score: number;
  deadline: string;
  foundAt: string;
  tags: string[];
  reasoning: string;
  mustHave: MustHaveCheck[];
  redFlags: string[];
  scoreHistory: ScorePoint[];
  notes: string;
  url: string;
}

export interface JobQuery {
  q?: string;
  sources?: SourceKey[];
  status?: JobStatus | "semua";
  minScore?: number;
  sort?: "skor" | "deadline";
}

export interface Profile {
  version: number;
  updatedAt: string;
  bidang: string[];
  skills: string[];
  /** Pernah dipakai tapi belum mahir — dinilai sebagai dasar, bukan keahlian penuh. */
  skillsFamiliar: string[];
  lokasi: string[];
  mustHave: string[];
  redFlags: string[];
}

export interface Source {
  key: SourceKey;
  name: string;
  enabled: boolean;
  keywords: string;
  targetedQuery: string;
  status: "ok" | "error";
  lastRunAt: string;
  lastMessage: string;
  /** Corong run terakhir yang menyentuh sumber ini. */
  stats?: SourceStats | null;
}

export interface SourceStats {
  links: number;
  filtered: number;
  known: number;
  deferred: number;
  new: number;
  relevant: number;
  seconds: number;
  warnings: number;
}

export interface Company {
  key: string;
  name: string;
  jobIds: string[];
  bestScore: number;
  avgScore: number;
  locations: string[];
  sources: SourceKey[];
  /** Latar belakang singkat: dari Deep Search bila ada, kalau tidak dari halaman lowongan. */
  blurb: string;
  blurbSource: "deep-search" | "lowongan" | null;
  credibility: { score: number; level: CompanyReport["level"] } | null;
}

export interface Settings {
  threshold: number;
  backend: "claude-code" | "claude-api";
  model: "haiku" | "sonnet" | "opus";
  pagesPerSource: number;
  schedule: string; // "HH:MM"
}

export interface RunRecord {
  id: string;
  startedAt: string;
  durationSec: number;
  found: number;
  passedLocal: number;
  recommended: number;
  coverage: number | null;
  precision: number | null;
  tokens: number;
  status: "berhasil" | "gagal";
  error?: string;
}

export interface LogLine {
  t: string;
  msg: string;
  level?: "info" | "warn";
}

export interface RunProgress {
  running: boolean;
  stage: Stage | null;
  stageIndex: number; // 0..4, 4 = selesai
  log: LogLine[];
}

/* ------------------------------ Deep Search ------------------------------ */

export interface CompanyFact {
  label: string;
  value: string;
  /** Nomor sumber (mulai 1) di `CompanyReport.sources`. */
  sources: number[];
}

export interface CompanyReport {
  officialName: string;
  summary: string;
  facts: CompanyFact[];
  digitalFootprint: string[];
  employeeReviews: string | null;
  news: string[];
  positiveSignals: string[];
  negativeSignals: string[];
  credibilityScore: number;
  level: "tinggi" | "sedang" | "rendah" | "tidak_cukup_data";
  scoreReason: string;
  manualChecks: string[];
  sources: { title: string; url: string }[];
}

export interface CompanyResearch {
  status: "belum" | "berjalan" | "selesai" | "gagal";
  company?: string;
  startedAt?: string;
  finishedAt?: string;
  error?: string | null;
  /** Laporan terakhir yang berhasil; tetap ada saat riset ulang berjalan/gagal. */
  report?: CompanyReport | null;
  turns?: number | null;
}

/* --------------------------------- Chat ---------------------------------- */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  /** Pencarian web yang dilakukan Claude untuk jawaban ini. */
  activity: string[];
}

export type ChatEvent =
  | { type: "delta"; text: string }
  | { type: "activity"; text: string }
  | { type: "quota"; fiveHour: number | null; sevenDay: number | null }
  | { type: "done"; message: ChatMessage }
  | { type: "error"; text: string };

export interface TrendPoint {
  date: string;
  found: number;
  recommended: number;
}

export interface DashboardSummary {
  lastRun: RunRecord;
  nextRunAt: string;
  trend: TrendPoint[];
}

const SOURCE_LABEL: Record<string, string> = {
  jobstreet: "JobStreet",
  glints: "Glints",
  kalibrr: "Kalibrr",
  karirhub: "Karirhub",
  dealls: "Dealls",
  karir: "Karir.com",
  topkarir: "TopKarir",
  urbanhire: "Urbanhire",
  linkedin: "LinkedIn",
  jooble: "Jooble",
  adzuna: "Adzuna",
  careerjet: "Careerjet",
  lokerid: "Loker.id",
  kitalulus: "KitaLulus",
  techinasia: "Tech in Asia",
  kampus: "Portal Kampus",
};

export const sourceLabel = (key: SourceKey) => SOURCE_LABEL[key] ?? key;

export const STATUS_LABEL: Record<JobStatus, string> = {
  baru: "Baru",
  dilamar: "Dilamar",
  diterima: "Diterima",
  ditolak: "Ditolak",
};

export const STAGES: { key: Stage; label: string }[] = [
  { key: "scrape", label: "Scrape" },
  { key: "dedup", label: "Dedup RAG" },
  { key: "local_llm", label: "Local LLM" },
  { key: "ranking", label: "Ranking" },
];
