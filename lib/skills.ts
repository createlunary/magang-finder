import type { Job, Profile } from "./types";

/** dikuasai / pernah dipakai / diminta lowongan tapi belum kamu punya. */
/** "netral": profil tidak tersedia (showcase), jadi tidak ada dasar menyebutnya gap. */
export type SkillKind = "kuasai" | "pernah" | "gap" | "netral";

export interface SkillStat {
  key: string;
  label: string;
  kind: SkillKind;
  /** Lowongan yang memintanya (id), urut skor tertinggi. */
  jobIds: string[];
  /** Permintaan tertimbang skor: lowongan yang lebih cocok lebih berarti. */
  weight: number;
  avgScore: number;
}

const SINONIM: Record<string, string> = {
  golang: "go",
  postgres: "postgresql",
  ml: "machinelearning",
  "reactjs": "react",
  "vuejs": "vue",
  "nextjs": "next",
  "nodejs": "node",
  "unrealengine": "unreal",
};

/** "Node.js" = "node", "Unreal Engine 5" = "unreal", "Golang" = "go". */
export function skillKey(s: string): string {
  const k = s
    .toLowerCase()
    .replace(/\s+\d+(\.\d+)*$/, "")        // nomor versi di akhir
    .replace(/\.js$/, "js")
    .replace(/[^a-z0-9+#]/g, "");
  return SINONIM[k] ?? k;
}

export function analyzeSkills(jobs: Job[], profile?: Pick<Profile, "skills" | "skillsFamiliar"> | null): SkillStat[] {
  const map = new Map<string, SkillStat>();
  const tambah = (label: string, kind: SkillKind) => {
    const key = skillKey(label);
    if (!key || map.has(key)) return;
    map.set(key, { key, label, kind, jobIds: [], weight: 0, avgScore: 0 });
  };
  profile?.skills.forEach((s) => tambah(s, "kuasai"));
  profile?.skillsFamiliar?.forEach((s) => tambah(s, "pernah"));

  const urut = [...jobs].sort((a, b) => b.score - a.score);
  for (const j of urut) {
    for (const t of j.tags) {
      tambah(t, profile ? "gap" : "netral");
      const st = map.get(skillKey(t))!;
      if (!st.jobIds.includes(j.id)) {
        st.jobIds.push(j.id);
        st.weight += j.score / 100;
      }
    }
  }
  for (const st of map.values()) {
    const skor = st.jobIds.map((id) => urut.find((j) => j.id === id)!.score);
    st.avgScore = skor.length ? Math.round(skor.reduce((a, b) => a + b, 0) / skor.length) : 0;
  }
  return [...map.values()];
}

export const KIND_LABEL: Record<SkillKind, string> = {
  kuasai: "dikuasai",
  pernah: "pernah dipakai",
  gap: "belum dimiliki",
  netral: "diminta lowongan",
};
