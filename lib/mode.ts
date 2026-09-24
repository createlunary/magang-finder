/**
 * Tiga cara aplikasi ini berjalan:
 *
 * - "lokal"    — panel kontrol di komputer utama (atau perangkat di WiFi yang sama).
 *                Bicara dengan FastAPI, wajib login Google (lewat jembatan showcase).
 * - "showcase" — situs publik di Vercel. Baca-saja dari snapshot JSON yang di-push
 *                komputer utama; tidak pernah menghubungi komputer itu. Tanpa login.
 * - "demo"     — tanpa backend sama sekali, data tiruan (lib/mock-data.ts).
 */
export type Mode = "lokal" | "showcase" | "demo";

const API_ENV = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

export const MODE: Mode =
  process.env.NEXT_PUBLIC_MODE === "showcase" ? "showcase" : API_ENV ? "lokal" : "demo";

export const IS_SHOWCASE = MODE === "showcase";
export const IS_LOKAL = MODE === "lokal";

/**
 * Alamat API. "auto" = host yang sama dengan halaman, port 8000 — supaya panel yang
 * dibuka dari HP lewat http://192.168.1.4:3000 memanggil http://192.168.1.4:8000,
 * bukan 127.0.0.1 milik HP itu sendiri.
 */
export function apiBase(): string {
  if (API_ENV !== "auto") return API_ENV;
  if (typeof window === "undefined") return "http://127.0.0.1:8000";
  return `${window.location.protocol}//${window.location.hostname}:8000`;
}

/** Snapshot data publik. Default `/snapshot.json` untuk mencoba mode showcase secara lokal. */
export const SNAPSHOT_URL = process.env.NEXT_PUBLIC_SNAPSHOT_URL || "/snapshot.json";

/** Alamat situs showcase — dipakai panel lokal untuk login Google. */
export const SHOWCASE_URL = (process.env.NEXT_PUBLIC_SHOWCASE_URL ?? "").replace(/\/$/, "");

export const PESAN_BACA_SAJA =
  "Ini situs showcase (baca-saja). Menjalankan pipeline hanya bisa dari panel kontrol di mesin lokal.";
