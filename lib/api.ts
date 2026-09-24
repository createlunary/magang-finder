import {
  buildSummary,
  mockJobs,
  mockLastRunLog,
  mockReport,
  mockProfile,
  mockRuns,
  mockSettings,
  mockSources,
} from "./mock-data";
import type {
  ChatEvent,
  ChatMessage,
  Company,
  CompanyResearch,
  DashboardSummary,
  Job,
  JobQuery,
  LogLine,
  Profile,
  RunProgress,
  RunRecord,
  Settings,
  Source,
  SourceKey,
} from "./types";
import { STAGES } from "./types";
import { apiBase, IS_SHOWCASE, MODE, PESAN_BACA_SAJA, SNAPSHOT_URL } from "./mode";
import { ambilToken, keHalamanMasuk } from "./sesi";

/**
 * Lapisan akses data — tiga mode, lihat lib/mode.ts:
 * - lokal    -> FastAPI (kontrak endpoint di README), dengan token sesi login.
 * - showcase -> snapshot JSON publik, baca-saja.
 * - demo     -> mock in-memory.
 */
export const USING_MOCK = MODE === "demo";

function headerAuth(): Record<string, string> {
  const t = ambilToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...headerAuth(), ...(init?.headers ?? {}) },
  });
  if (res.status === 401) {
    keHalamanMasuk();
    throw new Error("Sesi habis — silakan masuk lagi");
  }
  if (!res.ok) {
    // FastAPI mengirim alasan penolakan di `detail` (string, atau daftar error validasi).
    const body = await res.json().catch(() => null);
    const detail = body?.detail;
    const pesan = typeof detail === "string" ? detail : Array.isArray(detail) ? detail.map((d) => d.msg).join("; ") : null;
    throw new Error(pesan ?? `${res.status} ${res.statusText} — ${path}`);
  }
  return res.json() as Promise<T>;
}

/** POST lalu baca aliran `data: {...}\n\n` (EventSource tidak mendukung POST). */
async function streamChat(id: string, message: string, onEvent: (e: ChatEvent) => void, signal?: AbortSignal) {
  const res = await fetch(`${apiBase()}/jobs/${id}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headerAuth() },
    body: JSON.stringify({ message }),
    signal,
  });
  if (res.status === 401) {
    keHalamanMasuk();
    throw new Error("Sesi habis — silakan masuk lagi");
  }
  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => null);
    throw new Error(typeof body?.detail === "string" ? body.detail : `${res.status} ${res.statusText}`);
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let cut: number;
    while ((cut = buf.indexOf("\n\n")) >= 0) {
      const chunk = buf.slice(0, cut);
      buf = buf.slice(cut + 2);
      if (chunk.startsWith("data: ")) onEvent(JSON.parse(chunk.slice(6)) as ChatEvent);
    }
  }
}

/* ------------------------------ Mock store ------------------------------ */

const store = {
  jobs: structuredClone(mockJobs),
  profile: structuredClone(mockProfile),
  sources: structuredClone(mockSources),
  settings: structuredClone(mockSettings),
  runs: structuredClone(mockRuns),
  lastLog: structuredClone(mockLastRunLog),
  activeRunStartedAt: null as number | null,
  research: {} as Record<string, CompanyResearch>,
  chat: {} as Record<string, ChatMessage[]>,
};

const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const STAGE_MS = 1600;

const stageLog: LogLine[][] = [
  [{ t: "", msg: "SCRAPE linkedin, glints — mengambil halaman listing" }],
  [{ t: "", msg: "DEDUP — mencocokkan embedding ke RAG store" }],
  [{ t: "", msg: "LOCAL LLM qwen — ekstraksi field & filter kasar" }],
  [{ t: "", msg: "RANKING claude — menilai kecocokan terhadap profil" }],
];

function clock(d = new Date()) {
  return d.toTimeString().slice(0, 8);
}

function filterJobs(q: JobQuery, semua: Job[] = store.jobs): Job[] {
  const words = (q.q ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  let list = semua.filter((j) => {
    if (q.sources && q.sources.length && !q.sources.includes(j.source)) return false;
    if (q.status && q.status !== "semua" && j.status !== q.status) return false;
    if (q.minScore && j.score < q.minScore) return false;
    if (words.length) {
      const hay = [j.role, j.company, j.lokasi, j.reasoning, ...j.tags].join(" ").toLowerCase();
      // Mock "semantik": semua kata harus muncul di teks lowongan.
      if (!words.every((w) => hay.includes(w))) return false;
    }
    return true;
  });
  list = [...list].sort((a, b) =>
    q.sort === "deadline" ? a.deadline.localeCompare(b.deadline) : b.score - a.score,
  );
  return list;
}

const mock = {
  async listJobs(q: JobQuery) {
    await wait();
    return filterJobs(q);
  },
  async getJob(id: string) {
    await wait(150);
    const job = store.jobs.find((j) => j.id === id);
    if (!job) throw new Error("Lowongan tidak ditemukan");
    return structuredClone(job);
  },
  async updateJob(id: string, patch: Partial<Pick<Job, "status" | "notes">>) {
    await wait(200);
    const job = store.jobs.find((j) => j.id === id);
    if (!job) throw new Error("Lowongan tidak ditemukan");
    Object.assign(job, patch);
    return structuredClone(job);
  },
  async getProfile() {
    await wait(150);
    return structuredClone(store.profile);
  },
  async updateProfile(p: Omit<Profile, "version" | "updatedAt">) {
    await wait(400);
    store.profile = { ...p, version: store.profile.version + 1, updatedAt: new Date().toISOString() };
    return structuredClone(store.profile);
  },
  async listSources() {
    await wait(150);
    return structuredClone(store.sources);
  },
  async updateSource(key: SourceKey, patch: Partial<Source>) {
    await wait(200);
    const s = store.sources.find((x) => x.key === key);
    if (!s) throw new Error("Sumber tidak ditemukan");
    Object.assign(s, patch);
    return structuredClone(s);
  },
  async getSettings() {
    await wait(150);
    return structuredClone(store.settings);
  },
  async updateSettings(s: Settings) {
    await wait(300);
    store.settings = s;
    return structuredClone(s);
  },
  async listRuns() {
    await wait(200);
    return structuredClone(store.runs);
  },
  async getSummary() {
    await wait(150);
    return buildSummary(store.runs, store.settings);
  },
  async startRun() {
    await wait(100);
    if (!store.activeRunStartedAt) store.activeRunStartedAt = Date.now();
    return { ok: true };
  },
  async getResearch(id: string): Promise<CompanyResearch> {
    await wait(150);
    const r = store.research[id];
    if (!r) return { status: "belum" };
    // Simulasi: riset "selesai" 4 detik setelah dimulai.
    if (r.status === "berjalan" && Date.now() - new Date(r.startedAt!).getTime() > 4000) {
      const job = store.jobs.find((j) => j.id === id)!;
      Object.assign(r, { status: "selesai", finishedAt: new Date().toISOString(), report: mockReport(job.company) });
    }
    return structuredClone(r);
  },
  async startResearch(id: string): Promise<CompanyResearch> {
    await wait(200);
    const job = store.jobs.find((j) => j.id === id);
    if (!job) throw new Error("Lowongan tidak ditemukan");
    store.research[id] = { ...store.research[id], status: "berjalan", company: job.company, startedAt: new Date().toISOString() };
    return structuredClone(store.research[id]);
  },
  async listCompanies(): Promise<Company[]> {
    await wait(150);
    const key = (s: string) => s.toLowerCase().replace(/\b(pt|cv|tbk)\b\.?/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
    const grup = new Map<string, Job[]>();
    for (const j of store.jobs) grup.set(key(j.company), [...(grup.get(key(j.company)) ?? []), j]);
    return [...grup.entries()].map(([k, js]) => {
      const lap = Object.values(store.research).find((r) => r.company === js[0].company)?.report;
      return {
        key: k,
        name: js[0].company,
        jobIds: js.map((j) => j.id),
        bestScore: Math.max(...js.map((j) => j.score)),
        avgScore: Math.round(js.reduce((s, j) => s + j.score, 0) / js.length),
        locations: [...new Set(js.map((j) => j.lokasi))],
        sources: [...new Set(js.map((j) => j.source))],
        blurb: lap?.summary ?? `${js[0].company} (data demo) — perusahaan fiktif yang membuka ${js.length} lowongan.`,
        blurbSource: lap ? "deep-search" : "lowongan",
        credibility: lap ? { score: lap.credibilityScore, level: lap.level } : null,
      } satisfies Company;
    });
  },
  async listChat(id: string): Promise<ChatMessage[]> {
    await wait(120);
    return structuredClone(store.chat[id] ?? []);
  },
  async clearChat(id: string) {
    await wait(120);
    delete store.chat[id];
    return { ok: true };
  },
  async sendChat(id: string, message: string, onEvent: (e: ChatEvent) => void) {
    const now = () => new Date().toISOString();
    const list = (store.chat[id] ??= []);
    list.push({ id: `u${Date.now()}`, role: "user", content: message, createdAt: now(), activity: [] });
    onEvent({ type: "activity", text: `mencari: ${message.slice(0, 40)}` });
    await wait(700);
    const jawaban =
      "Ini **mode demo**, jadi jawabannya contoh saja.\n\nSaat backend tersambung, Claude menjawab dari isi lowongan, " +
      "penilaian, profilmu, dan laporan Deep Search, dan bisa mencari di web bila perlu.";
    for (const kata of jawaban.split(/(?<= )/)) {
      onEvent({ type: "delta", text: kata });
      await wait(35);
    }
    const msg: ChatMessage = { id: `a${Date.now()}`, role: "assistant", content: jawaban, createdAt: now(), activity: [] };
    list.push(msg);
    onEvent({ type: "done", message: msg });
  },
  async stopRun() {
    await wait(100);
    if (!store.activeRunStartedAt) throw new Error("Tidak ada run yang berjalan");
    store.activeRunStartedAt = null;
    store.lastLog = [...store.lastLog, { t: clock(), msg: "RUN DIBATALKAN oleh pengguna", level: "warn" }];
    return { ok: true };
  },
  async getRunProgress(): Promise<RunProgress> {
    const started = store.activeRunStartedAt;
    if (!started) return { running: false, stage: null, stageIndex: 4, log: store.lastLog };

    const elapsed = Date.now() - started;
    const idx = Math.floor(elapsed / STAGE_MS);
    const startDate = new Date(started);

    if (idx >= STAGES.length) {
      const found = 40 + Math.floor(Math.random() * 12);
      const passed = Math.round(found * 0.4);
      const rec: RunRecord = {
        id: `r${Date.now()}`,
        startedAt: startDate.toISOString(),
        durationSec: Math.round(elapsed / 1000),
        found,
        passedLocal: passed,
        recommended: store.jobs.filter((j) => j.score >= store.settings.threshold).length,
        coverage: 0.8,
        precision: 0.79,
        tokens: 124_000,
        status: "berhasil",
      };
      store.runs = [rec, ...store.runs];
      store.lastLog = stageLog.flat().map((l, i) => ({
        ...l,
        t: clock(new Date(started + i * STAGE_MS)),
      }));
      store.activeRunStartedAt = null;
      return { running: false, stage: null, stageIndex: 4, log: store.lastLog };
    }

    const log = stageLog
      .slice(0, idx + 1)
      .flat()
      .map((l, i) => ({ ...l, t: clock(new Date(started + i * STAGE_MS)) }));
    return { running: true, stage: STAGES[idx].key, stageIndex: idx, log };
  },
};

/* ------------------------------ Public API ------------------------------ */

function toQuery(q: JobQuery) {
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  if (q.sources?.length) p.set("sources", q.sources.join(","));
  if (q.status && q.status !== "semua") p.set("status", q.status);
  if (q.minScore) p.set("min_score", String(q.minScore));
  if (q.sort) p.set("sort", q.sort);
  return p.toString();
}

const lokal = {
  listJobs: (q: JobQuery): Promise<Job[]> => http(`/jobs?${toQuery(q)}`),
  getJob: (id: string): Promise<Job> => http(`/jobs/${id}`),
  updateJob: (id: string, patch: Partial<Pick<Job, "status" | "notes">>): Promise<Job> =>
    http(`/jobs/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  getProfile: (): Promise<Profile> => http("/profile"),
  updateProfile: (p: Omit<Profile, "version" | "updatedAt">): Promise<Profile> =>
    http("/profile", { method: "PUT", body: JSON.stringify(p) }),
  listSources: (): Promise<Source[]> => http("/sources"),
  updateSource: (key: SourceKey, patch: Partial<Source>): Promise<Source> =>
    http(`/sources/${key}`, { method: "PATCH", body: JSON.stringify(patch) }),
  getSettings: (): Promise<Settings> => http("/settings"),
  updateSettings: (s: Settings): Promise<Settings> => http("/settings", { method: "PUT", body: JSON.stringify(s) }),
  listRuns: (): Promise<RunRecord[]> => http("/runs"),
  getSummary: (): Promise<DashboardSummary> => http("/dashboard/summary"),
  startRun: (): Promise<{ ok: boolean }> => http("/runs", { method: "POST" }),
  listCompanies: (): Promise<Company[]> => http("/companies"),
  listChat: (id: string): Promise<ChatMessage[]> => http(`/jobs/${id}/chat`),
  clearChat: (id: string): Promise<{ ok: boolean }> => http(`/jobs/${id}/chat`, { method: "DELETE" }),
  sendChat: (id: string, message: string, onEvent: (e: ChatEvent) => void, signal?: AbortSignal): Promise<void> =>
    streamChat(id, message, onEvent, signal),
  getResearch: (id: string): Promise<CompanyResearch> => http(`/jobs/${id}/research`),
  startResearch: (id: string): Promise<CompanyResearch> => http(`/jobs/${id}/research`, { method: "POST" }),
  stopRun: (): Promise<{ ok: boolean }> => http("/runs/current", { method: "DELETE" }),
  getRunProgress: (): Promise<RunProgress> => http("/runs/current"),
};

/* ---------------------------- Showcase (baca-saja) ---------------------------- */

/** Bentuk file yang dibuat `mf.py showcase` (api/showcase.py). */
export interface Snapshot {
  versi: number;
  dibuat: string;
  threshold: number;
  jobs: Job[];
  companies: Company[];
  research: Record<string, CompanyResearch>;
  sources: Source[];
  runs: RunRecord[];
  summary: Omit<DashboardSummary, "nextRunAt">;
}

let snapshotJanji: Promise<Snapshot> | null = null;

export function ambilSnapshot(): Promise<Snapshot> {
  snapshotJanji ??= fetch(SNAPSHOT_URL, { cache: "no-store" })
    .then((r) => {
      if (!r.ok) throw new Error(`Snapshot tidak tersedia (${r.status})`);
      return r.json() as Promise<Snapshot>;
    })
    .catch((e) => {
      snapshotJanji = null; // coba lagi di permintaan berikutnya
      throw e;
    });
  return snapshotJanji;
}

const tolak = async (): Promise<never> => {
  throw new Error(PESAN_BACA_SAJA);
};

const showcase: typeof lokal = {
  listJobs: async (q) => filterJobs(q, (await ambilSnapshot()).jobs),
  getJob: async (id) => {
    const j = (await ambilSnapshot()).jobs.find((x) => x.id === id);
    if (!j) throw new Error("Lowongan tidak ditemukan");
    return j;
  },
  updateJob: tolak,
  getProfile: tolak,
  updateProfile: tolak,
  listSources: async () => (await ambilSnapshot()).sources,
  updateSource: tolak,
  getSettings: async () => {
    // Hanya ambang yang dipublikasikan; sisanya pengaturan mesin lokal.
    const s = await ambilSnapshot();
    return { threshold: s.threshold, backend: "claude-code", model: "opus", pagesPerSource: 0, schedule: "" };
  },
  updateSettings: tolak,
  listRuns: async () => (await ambilSnapshot()).runs,
  getSummary: async () => ({ ...(await ambilSnapshot()).summary, nextRunAt: "" }),
  startRun: tolak,
  listCompanies: async () => (await ambilSnapshot()).companies,
  listChat: async () => [],
  clearChat: tolak,
  sendChat: tolak,
  getResearch: async (id) => (await ambilSnapshot()).research[id] ?? { status: "belum" },
  startResearch: tolak,
  stopRun: tolak,
  getRunProgress: async () => ({ running: false, stage: null, stageIndex: 4, log: [] }),
};

export const api: typeof lokal = MODE === "demo" ? mock : IS_SHOWCASE ? showcase : lokal;
