import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

/** IPv4 komputer ini di jaringan lokal — `next dev` menolak origin lain secara default,
 *  jadi HP di WiFi yang sama (http://192.168.x.x:3000) perlu diizinkan eksplisit. */
const ipLan = Object.values(networkInterfaces())
  .flat()
  .filter((i) => i && i.family === "IPv4" && !i.internal)
  .map((i) => i!.address);

/** Berlaku di showcase (Vercel) dan panel lokal. */
const HEADER_KEAMANAN = [
  // Tidak boleh dibingkai situs lain: menangkal clickjacking tombol "Jalankan" di panel.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Tautan keluar (lowongan asli, sumber riset) tidak membawa alamat panel/IP rumah.
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: HEADER_KEAMANAN }];
  },
  allowedDevOrigins: ipLan,
  // Folder build terpisah untuk menjalankan panel lokal & pratinjau showcase berdampingan.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
