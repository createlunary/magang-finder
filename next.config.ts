import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

/** IPv4 komputer ini di jaringan lokal — `next dev` menolak origin lain secara default,
 *  jadi HP di WiFi yang sama (http://192.168.x.x:3000) perlu diizinkan eksplisit. */
const ipLan = Object.values(networkInterfaces())
  .flat()
  .filter((i) => i && i.family === "IPv4" && !i.internal)
  .map((i) => i!.address);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ipLan,
  // Folder build terpisah untuk menjalankan panel lokal & pratinjau showcase berdampingan.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
