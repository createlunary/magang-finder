import type { CompanyReport, DashboardSummary, Job, LogLine, Profile, RunRecord, Settings, Source, TrendPoint } from "./types";

// Data contoh untuk mode tanpa backend. Semua perusahaan fiktif.

export const mockJobs: Job[] = [
  {
    id: "c1",
    role: "Backend Developer Intern",
    company: "Nusantara Cipta Teknologi",
    source: "linkedin",
    lokasi: "Yogyakarta",
    status: "baru",
    score: 92,
    deadline: "2026-10-12",
    foundAt: "2026-09-23T07:02:10+07:00",
    tags: ["Node.js", "REST API", "PostgreSQL"],
    reasoning:
      "REST API, database relasional, dan alur kerja Git cocok kuat dengan pengalaman asisten lab dan proyek RPL. Deskripsi kerja jelas dan ada mentor yang ditunjuk selama masa magang — dua sinyal kualitas yang jarang muncul bersamaan.",
    mustHave: [
      { label: "Requirement dan deskripsi kerja jelas", met: true },
      { label: "Ada pembimbing/mentor di tempat magang", met: true },
    ],
    redFlags: [],
    scoreHistory: [
      { version: "v1", date: "2026-09-10", score: 78 },
      { version: "v2", date: "2026-09-18", score: 85 },
      { version: "v3", date: "2026-09-23", score: 92 },
    ],
    notes: "Siapkan portofolio proyek RPL sebelum apply.",
    url: "https://example.com/lowongan/c1",
  },
  {
    id: "c2",
    role: "Game Programmer Intern (Unreal Engine)",
    company: "Piksel Nara Studio",
    source: "kampus",
    lokasi: "Remote",
    status: "dilamar",
    score: 88,
    deadline: "2026-10-20",
    foundAt: "2026-09-21T07:03:02+07:00",
    tags: ["Unreal Engine 5", "C++", "Multiplayer"],
    reasoning:
      "Sejalan langsung dengan pengalaman freelance backend di Unreal Engine 5; requirement C++ dan sistem gameplay real-time tumpang tindih kuat dengan pekerjaan sebelumnya.",
    mustHave: [
      { label: "Requirement dan deskripsi kerja jelas", met: true },
      { label: "Ada pembimbing/mentor di tempat magang", met: false },
    ],
    redFlags: [],
    scoreHistory: [
      { version: "v2", date: "2026-09-18", score: 86 },
      { version: "v3", date: "2026-09-23", score: 88 },
    ],
    notes: "",
    url: "https://example.com/lowongan/c2",
  },
  {
    id: "c7",
    role: "Backend Engineer Intern (Python / FastAPI)",
    company: "Rantai Data Indonesia",
    source: "glints",
    lokasi: "Remote",
    status: "baru",
    score: 84,
    deadline: "2026-10-30",
    foundAt: "2026-09-23T07:02:40+07:00",
    tags: ["Python", "FastAPI", "Backend", "Docker"],
    reasoning:
      "Stack Python dan FastAPI relevan dengan proyek RAG yang sedang dikerjakan. Sedikit kekurangan di pengalaman Docker production, tapi tertulis bisa dipelajari selama magang.",
    mustHave: [
      { label: "Requirement dan deskripsi kerja jelas", met: true },
      { label: "Ada pembimbing/mentor di tempat magang", met: true },
    ],
    redFlags: [],
    scoreHistory: [{ version: "v3", date: "2026-09-23", score: 84 }],
    notes: "",
    url: "https://example.com/lowongan/c7",
  },
  {
    id: "c3",
    role: "NLP Research Intern",
    company: "DataMuara Analytics",
    source: "glints",
    lokasi: "Remote",
    status: "baru",
    score: 81,
    deadline: "2026-11-05",
    foundAt: "2026-09-22T07:02:55+07:00",
    tags: ["Python", "NLP", "Transformers"],
    reasoning:
      "Selaras dengan mata kuliah Pemrosesan Bahasa Alami dan Deep Learning. Requirement riset independen sedikit di atas level magang pada umumnya.",
    mustHave: [
      { label: "Requirement dan deskripsi kerja jelas", met: true },
      { label: "Ada pembimbing/mentor di tempat magang", met: true },
    ],
    redFlags: [],
    scoreHistory: [
      { version: "v2", date: "2026-09-18", score: 79 },
      { version: "v3", date: "2026-09-23", score: 81 },
    ],
    notes: "",
    url: "https://example.com/lowongan/c3",
  },
  {
    id: "c4",
    role: "DevOps Intern",
    company: "Vertikal Cloud Indonesia",
    source: "linkedin",
    lokasi: "Yogyakarta",
    status: "ditolak",
    score: 74,
    deadline: "2026-10-28",
    foundAt: "2026-09-19T07:01:48+07:00",
    tags: ["Docker", "CI/CD", "Linux"],
    reasoning:
      "Relevan di sisi infrastruktur backend, tapi menuntut pengalaman cloud production lebih dalam dari yang tercatat di profil.",
    mustHave: [
      { label: "Requirement dan deskripsi kerja jelas", met: true },
      { label: "Ada pembimbing/mentor di tempat magang", met: false },
    ],
    redFlags: [],
    scoreHistory: [
      { version: "v1", date: "2026-09-10", score: 70 },
      { version: "v3", date: "2026-09-23", score: 74 },
    ],
    notes: "Ditolak — minta pengalaman AWS minimal 6 bulan.",
    url: "https://example.com/lowongan/c4",
  },
  {
    id: "c5",
    role: "Gameplay Intern (Unity)",
    company: "Sintesa Kreatif Games",
    source: "kampus",
    lokasi: "Bandung",
    status: "baru",
    score: 68,
    deadline: "2026-11-02",
    foundAt: "2026-09-20T07:02:30+07:00",
    tags: ["Unity", "C#"],
    reasoning: "Bidang cocok, tapi stack utamanya Unity/C#, bukan Unreal/C++ seperti pengalaman di profil.",
    mustHave: [
      { label: "Requirement dan deskripsi kerja jelas", met: true },
      { label: "Ada pembimbing/mentor di tempat magang", met: true },
    ],
    redFlags: ["Lokasi di luar preferensi"],
    scoreHistory: [{ version: "v3", date: "2026-09-23", score: 68 }],
    notes: "",
    url: "https://example.com/lowongan/c5",
  },
  {
    id: "c6",
    role: "Data Analyst Intern",
    company: "Anargya Data Labs",
    source: "glints",
    lokasi: "Remote",
    status: "diterima",
    score: 55,
    deadline: "2026-10-15",
    foundAt: "2026-09-15T07:02:12+07:00",
    tags: ["SQL", "Excel", "Dashboard"],
    reasoning: "Fokus kerja ke business analytics, bukan pengembangan model — kecocokan skill teknis rendah.",
    mustHave: [
      { label: "Requirement dan deskripsi kerja jelas", met: false },
      { label: "Ada pembimbing/mentor di tempat magang", met: true },
    ],
    redFlags: ["Deskripsi tanggung jawab samar"],
    scoreHistory: [{ version: "v2", date: "2026-09-18", score: 55 }],
    notes: "",
    url: "https://example.com/lowongan/c6",
  },
];

export const mockProfile: Profile = {
  version: 3,
  updatedAt: "2026-09-23T06:40:00+07:00",
  bidang: ["Backend Dev", "Game Dev", "ML / NLP"],
  skills: ["C++", "Python", "Unreal Engine 5", "Node.js"],
  skillsFamiliar: ["MySQL", "Git", "Docker"],
  lokasi: ["Remote", "Yogyakarta"],
  mustHave: ["Requirement dan deskripsi kerja jelas", "Ada pembimbing/mentor di tempat magang"],
  redFlags: ["Tidak ada kompensasi/sertifikat dan deskripsi kerja tidak jelas"],
};

export const mockSources: Source[] = [
  {
    key: "linkedin",
    name: "LinkedIn",
    enabled: true,
    keywords: "backend intern, unreal engine, remote",
    targetedQuery: "",
    status: "ok",
    lastRunAt: "2026-09-23T07:00:41+07:00",
    lastMessage: "18 halaman, sesi valid",
  },
  {
    key: "glints",
    name: "Glints",
    enabled: true,
    keywords: "software engineer intern, machine learning",
    targetedQuery: "",
    status: "ok",
    lastRunAt: "2026-09-23T07:01:05+07:00",
    lastMessage: "12 halaman",
  },
  {
    key: "kampus",
    name: "Portal Karir Kampus",
    enabled: false,
    keywords: "magang informatika",
    targetedQuery: "",
    status: "error",
    lastRunAt: "2026-09-22T07:01:05+07:00",
    lastMessage: "Autentikasi gagal",
  },
];

export const mockSettings: Settings = {
  threshold: 70,
  backend: "claude-api",
  model: "sonnet",
  pagesPerSource: 5,
  schedule: "07:00",
};

export const mockRuns: RunRecord[] = [
  { id: "r30", startedAt: "2026-09-23T07:00:00+07:00", durationSec: 252, found: 47, passedLocal: 19, recommended: 4, coverage: 0.82, precision: 0.78, tokens: 128_000, status: "berhasil" },
  { id: "r29", startedAt: "2026-09-22T07:00:00+07:00", durationSec: 238, found: 41, passedLocal: 16, recommended: 3, coverage: 0.79, precision: 0.81, tokens: 121_000, status: "berhasil" },
  { id: "r28", startedAt: "2026-09-21T07:00:00+07:00", durationSec: 270, found: 52, passedLocal: 21, recommended: 5, coverage: 0.85, precision: 0.75, tokens: 134_000, status: "berhasil" },
  { id: "r27", startedAt: "2026-09-20T07:00:00+07:00", durationSec: 220, found: 36, passedLocal: 14, recommended: 2, coverage: 0.74, precision: 0.8, tokens: 118_000, status: "berhasil" },
  { id: "r26", startedAt: "2026-09-19T07:00:00+07:00", durationSec: 245, found: 44, passedLocal: 17, recommended: 3, coverage: 0.8, precision: 0.77, tokens: 126_000, status: "berhasil" },
  { id: "r25", startedAt: "2026-09-18T07:00:00+07:00", durationSec: 45, found: 0, passedLocal: 0, recommended: 0, coverage: null, precision: null, tokens: 8_000, status: "gagal", error: "Portal Kampus tidak terjangkau" },
  { id: "r24", startedAt: "2026-09-17T07:00:00+07:00", durationSec: 231, found: 39, passedLocal: 15, recommended: 3, coverage: 0.77, precision: 0.79, tokens: 119_000, status: "berhasil" },
];

export const mockTrend: TrendPoint[] = [
  { date: "2026-09-17", found: 39, recommended: 3 },
  { date: "2026-09-18", found: 0, recommended: 0 },
  { date: "2026-09-19", found: 44, recommended: 3 },
  { date: "2026-09-20", found: 36, recommended: 2 },
  { date: "2026-09-21", found: 52, recommended: 5 },
  { date: "2026-09-22", found: 41, recommended: 3 },
  { date: "2026-09-23", found: 47, recommended: 4 },
];

export const mockLastRunLog: LogLine[] = [
  { t: "07:00:02", msg: "SCRAPE linkedin — 18 halaman, sesi valid" },
  { t: "07:00:41", msg: "SCRAPE glints — 12 halaman" },
  { t: "07:01:05", msg: "WARN portal-kampus — autentikasi gagal, dilewati", level: "warn" },
  { t: "07:01:22", msg: "DEDUP — 31 duplikat dibuang dari RAG store" },
  { t: "07:02:48", msg: "LOCAL LLM qwen — 47 → 19 kandidat relevan" },
  { t: "07:03:55", msg: "RANKING claude — 4 kandidat di atas ambang 70" },
  { t: "07:04:12", msg: "NOTIFY — digest terkirim ke telegram" },
];

/** Laporan Deep Search contoh untuk mode demo — fiktif, seperti semua data mock. */
export function mockReport(company: string): CompanyReport {
  return {
    officialName: `PT ${company}`,
    summary: `${company} adalah perusahaan teknologi fiktif untuk mode demo yang mengembangkan perangkat lunak untuk klien korporat di Indonesia.`,
    facts: [
      { label: "Didirikan", value: "2016", sources: [1] },
      { label: "Kantor pusat", value: "Yogyakarta", sources: [1, 2] },
      { label: "Jumlah karyawan", value: "51–200 (LinkedIn)", sources: [2] },
      { label: "Bidang", value: "Pengembangan perangkat lunak", sources: [1] },
    ],
    digitalFootprint: ["Situs resmi aktif dengan halaman tim", "Halaman LinkedIn dengan ±1.200 pengikut"],
    employeeReviews: "Ulasan umumnya positif soal mentoring; beberapa menyebut beban kerja tinggi menjelang rilis.",
    news: ["2024 — meluncurkan produk SaaS untuk UMKM"],
    positiveSignals: ["Profil konsisten di situs resmi, LinkedIn, dan job board", "Lowongan rutin diperbarui"],
    negativeSignals: [],
    credibilityScore: 78,
    level: "sedang",
    scoreReason: "Perusahaan nyata dan konsisten di beberapa sumber, tapi liputan independen masih terbatas.",
    manualChecks: ["Legalitas badan usaha di AHU Kemenkumham"],
    sources: [
      { title: "Tentang kami — situs resmi (contoh)", url: "https://example.com/tentang" },
      { title: "Profil LinkedIn (contoh)", url: "https://example.com/linkedin" },
    ],
  };
}

export function buildSummary(runs: RunRecord[], settings: Settings): DashboardSummary {
  const [hh, mm] = settings.schedule.split(":").map(Number);
  const next = new Date();
  next.setHours(hh, mm, 0, 0);
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
  return { lastRun: runs[0], nextRunAt: next.toISOString(), trend: mockTrend };
}
