import { createHmac, randomBytes } from "node:crypto";

/**
 * Sisi server situs showcase untuk login panel lokal — pasangan api/auth.py di backend.
 *
 * Google hanya mengizinkan redirect OAuth ke localhost atau domain publik ber-HTTPS,
 * bukan ke alamat WiFi panel (http://192.168.x.x:3000). Jadi situs showcase yang
 * melakukan login Google, lalu mengirim *tiket* HMAC berumur 2 menit ke panel lokal.
 * Format tiket sama persis dengan `auth.tanda()` di Python.
 */

export const COOKIE_STATE = "mf_masuk";

export function env(nama: string): string {
  return (process.env[nama] ?? "").trim();
}

export function siap(): boolean {
  return !!(env("GOOGLE_CLIENT_ID") && env("GOOGLE_CLIENT_SECRET") && env("MF_JEMBATAN_SECRET") && env("MF_EMAIL_IZIN"));
}

export function emailDiizinkan(email: string): boolean {
  const izin = env("MF_EMAIL_IZIN").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
  return izin.includes(email.toLowerCase());
}

const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");

export function tandaTiket(email: string): string {
  const muatan = { typ: "tiket", email, exp: Math.floor(Date.now() / 1000) + 120, jti: randomBytes(12).toString("hex") };
  const badan = b64(JSON.stringify(muatan));
  const ttd = createHmac("sha256", env("MF_JEMBATAN_SECRET")).update(badan).digest("base64url");
  return `${badan}.${ttd}`;
}

export function acak(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Alamat kembali harus panel lokal: http(s) ke localhost atau IPv4 privat, path /masuk.
 * Tanpa pembatasan ini, siapa pun bisa membuat tautan login yang mengirim tiket ke
 * server miliknya sendiri (open redirect).
 */
export function kembaliSah(raw: string | null): string | null {
  if (!raw) return null;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(u.protocol) || u.username || u.password) return null;
  if (u.pathname !== "/masuk") return null;
  const h = u.hostname;
  const privat =
    h === "localhost" ||
    /^127\.\d+\.\d+\.\d+$/.test(h) ||
    /^10\.\d+\.\d+\.\d+$/.test(h) ||
    /^192\.168\.\d+\.\d+$/.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(h);
  return privat ? `${u.origin}/masuk` : null;
}

/** Payload id_token. Tanda tangannya tidak diverifikasi ulang karena token diterima
 *  langsung dari endpoint token Google lewat TLS (OpenID Connect Core §3.1.3.7). */
export function isiIdToken(idToken: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(idToken.split(".")[1], "base64url").toString("utf8"));
}
