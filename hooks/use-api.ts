"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { IS_LOKAL, IS_SHOWCASE } from "@/lib/mode";

/**
 * Panel bisa dibuka dari beberapa perangkat sekaligus (PC + HP). Run atau Deep Search
 * yang dimulai di satu perangkat harus terlihat di perangkat lain tanpa reload, jadi
 * status diperiksa berkala juga saat diam — pelan, dan berhenti saat tab tidak terlihat
 * (refetchIntervalInBackground bawaan = false).
 */
const PANTAU_DIAM_MS = IS_LOKAL ? 4000 : false;
const PANTAU_RISET_MS = IS_LOKAL ? 10_000 : false;
import type { Job, JobQuery, Profile, Settings, Source, SourceKey } from "@/lib/types";

export const qk = {
  jobs: (q: JobQuery) => ["jobs", q] as const,
  jobsAll: ["jobs"] as const,
  job: (id: string) => ["job", id] as const,
  profile: ["profile"] as const,
  sources: ["sources"] as const,
  settings: ["settings"] as const,
  runs: ["runs"] as const,
  summary: ["summary"] as const,
  progress: ["run-progress"] as const,
  research: (id: string) => ["research", id] as const,
  chat: (id: string) => ["chat", id] as const,
  companies: ["companies"] as const,
};

export function useJobs(q: JobQuery) {
  return useQuery({ queryKey: qk.jobs(q), queryFn: () => api.listJobs(q), placeholderData: (prev) => prev });
}

export function useJob(id: string) {
  return useQuery({ queryKey: qk.job(id), queryFn: () => api.getJob(id), enabled: !!id });
}

export function useUpdateJob(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Pick<Job, "status" | "notes">>) => api.updateJob(id, patch),
    onSuccess: (job) => {
      qc.setQueryData(qk.job(id), job);
      qc.invalidateQueries({ queryKey: qk.jobsAll });
    },
  });
}

export function useProfile() {
  // Profil pribadi tidak dipublikasikan ke showcase.
  return useQuery({ queryKey: qk.profile, queryFn: api.getProfile, enabled: !IS_SHOWCASE });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Omit<Profile, "version" | "updatedAt">) => api.updateProfile(p),
    onSuccess: (p) => {
      qc.setQueryData(qk.profile, p);
      // Profil berubah -> skor lowongan akan dinilai ulang oleh backend.
      qc.invalidateQueries({ queryKey: qk.jobsAll });
    },
  });
}

export function useSources() {
  return useQuery({ queryKey: qk.sources, queryFn: api.listSources });
}

export function useUpdateSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, patch }: { key: SourceKey; patch: Partial<Source> }) => api.updateSource(key, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.sources }),
  });
}

export function useSettings() {
  return useQuery({ queryKey: qk.settings, queryFn: api.getSettings });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (s: Settings) => api.updateSettings(s),
    onSuccess: (s) => {
      qc.setQueryData(qk.settings, s);
      qc.invalidateQueries({ queryKey: qk.summary });
    },
  });
}

export function useRuns() {
  return useQuery({ queryKey: qk.runs, queryFn: api.listRuns });
}

export function useSummary() {
  return useQuery({ queryKey: qk.summary, queryFn: api.getSummary });
}

/** Progres run: polling cepat selama run berjalan, berhenti saat selesai. */
export function useRunProgress() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: qk.progress,
    queryFn: api.getRunProgress,
    refetchInterval: (q) => (q.state.data?.running ? 500 : PANTAU_DIAM_MS),
  });

  const wasRunning = useRef(false);
  const running = query.data?.running ?? false;
  useEffect(() => {
    if (wasRunning.current && !running) {
      qc.invalidateQueries({ queryKey: qk.runs });
      qc.invalidateQueries({ queryKey: qk.summary });
      qc.invalidateQueries({ queryKey: qk.jobsAll });
    }
    wasRunning.current = running;
  }, [running, qc]);

  return query;
}

export function useCompanies() {
  return useQuery({ queryKey: qk.companies, queryFn: api.listCompanies });
}

export function useChat(id: string) {
  return useQuery({ queryKey: qk.chat(id), queryFn: () => api.listChat(id), enabled: !!id && !IS_SHOWCASE });
}

export function useClearChat(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.clearChat(id),
    onSuccess: () => qc.setQueryData(qk.chat(id), []),
  });
}

/** Deep Search: polling selama riset berjalan (1–3 menit), berhenti saat selesai/gagal. */
export function useResearch(id: string) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: qk.research(id),
    queryFn: () => api.getResearch(id),
    enabled: !!id,
    refetchInterval: (q) => (q.state.data?.status === "berjalan" ? 3000 : PANTAU_RISET_MS),
  });

  // Riset selesai → backend sudah menilai ulang lowongan perusahaan ini; muat skor barunya.
  const prev = useRef(query.data?.status);
  const status = query.data?.status;
  useEffect(() => {
    if (prev.current === "berjalan" && status === "selesai") {
      qc.invalidateQueries({ queryKey: qk.job(id) });
      qc.invalidateQueries({ queryKey: qk.jobsAll });
    }
    prev.current = status;
  }, [status, id, qc]);
  return query;
}

export function useStartResearch(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.startResearch(id),
    onSuccess: (r) => qc.setQueryData(qk.research(id), r),
  });
}

export function useStopRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.stopRun,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.progress });
      qc.invalidateQueries({ queryKey: qk.runs });
      qc.invalidateQueries({ queryKey: qk.summary });
      qc.invalidateQueries({ queryKey: qk.jobsAll });
    },
  });
}

export function useStartRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.startRun,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.progress }),
  });
}
