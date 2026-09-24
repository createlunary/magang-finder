"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Eye, Loader2, LockKeyhole, ShieldCheck, Wifi } from "lucide-react";
import { BrandMark } from "@/components/layout/brand-mark";
import { ConsoleLabel, ConsolePanel } from "@/components/shared/console-panel";
import { Button } from "@/components/ui/button";
import { apiBase, IS_LOKAL, SHOWCASE_URL } from "@/lib/mode";
import { emailSesi, simpanToken } from "@/lib/sesi";

const KUNCI_LANJUT = "mf.lanjut";

const GALAT: Record<string, string> = {
  batal: "Login dibatalkan.",
  google: "Google menolak atau gagal memverifikasi login. Coba lagi.",
  ditolak: "Akun Google itu tidak diizinkan membuka panel kontrol.",
  tiket: "Tiket login tidak sah atau kedaluwarsa. Coba lagi.",
  jaringan: "API di mesin lokal tidak terjangkau. Pastikan komputer utama menyala dan kamu di WiFi yang sama.",
};

export default function MasukPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-10">
      <ConsolePanel className="w-full max-w-md px-7 py-7">
        <div className="mb-5 flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="font-display text-lg leading-tight font-bold">Magang Finder</p>
            <ConsoleLabel>{IS_LOKAL ? "panel kontrol · mesin lokal" : "showcase publik"}</ConsoleLabel>
          </div>
        </div>
        {IS_LOKAL ? <MasukLokal /> : <InfoShowcase />}
      </ConsolePanel>
    </div>
  );
}

function InfoShowcase() {
  return (
    <div className="flex flex-col gap-4 text-[13.5px] leading-relaxed text-console-foreground/85">
      <p className="flex gap-2.5">
        <Eye className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>Pengunjung tidak perlu login. Semua lowongan, skor, alasan penilaian, dan riset perusahaan bisa dilihat bebas.</span>
      </p>
      <p className="flex gap-2.5">
        <Wifi className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>
          Panel kontrol (menjalankan pipeline, Deep Search, chat dengan Claude) hanya terbuka dari mesin pemilik dan perangkat
          di jaringan WiFi yang sama. Login Google dimulai dari panel itu.
        </span>
      </p>
      <Button asChild variant="console" className="mt-1 self-start">
        <Link href="/">
          Lihat showcase <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}

function MasukLokal() {
  const [status, setStatus] = useState<"cek" | "siap" | "tukar" | "tanpa-login">("cek");
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    const lanjut = new URLSearchParams(window.location.search).get("lanjut");
    if (lanjut?.startsWith("/") && !lanjut.startsWith("//")) sessionStorage.setItem(KUNCI_LANJUT, lanjut);

    const hash = new URLSearchParams(window.location.hash.slice(1));
    // Hapus tiket dari bilah alamat segera: tiket sekali pakai, tapi tak perlu terlihat.
    if (window.location.hash) history.replaceState(null, "", window.location.pathname);

    const tiket = hash.get("tiket");
    if (tiket) {
      setStatus("tukar");
      fetch(`${apiBase()}/auth/tukar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tiket }),
      })
        .then(async (r) => {
          if (!r.ok) throw new Error("tiket");
          const s = (await r.json()) as { token: string; exp: number; email: string };
          simpanToken(s.token, s.exp, s.email);
          const ke = sessionStorage.getItem(KUNCI_LANJUT) ?? "/";
          sessionStorage.removeItem(KUNCI_LANJUT);
          window.location.replace(ke);
        })
        .catch((e: Error) => {
          setGalat(GALAT[e.message === "tiket" ? "tiket" : "jaringan"]);
          setStatus("siap");
        });
      return;
    }
    if (hash.get("galat")) setGalat(GALAT[hash.get("galat")!] ?? "Login gagal.");

    fetch(`${apiBase()}/auth/status`)
      .then((r) => r.json())
      .then((s: { loginAktif: boolean }) => setStatus(s.loginAktif ? "siap" : "tanpa-login"))
      .catch(() => {
        setGalat(GALAT.jaringan);
        setStatus("siap");
      });
  }, []);

  const mulai = () => {
    const kembali = `${window.location.origin}/masuk`;
    window.location.href = `${SHOWCASE_URL}/api/masuk?kembali=${encodeURIComponent(kembali)}`;
  };

  if (status === "cek" || status === "tukar") {
    return (
      <p className="flex items-center gap-2 font-mono text-[12px] text-console-muted">
        <Loader2 className="size-4 animate-spin" /> {status === "tukar" ? "memverifikasi login…" : "memeriksa mesin lokal…"}
      </p>
    );
  }

  if (status === "tanpa-login") {
    return (
      <div className="flex flex-col gap-3 text-[13.5px] text-console-foreground/85">
        <p>
          Login Google belum disiapkan di mesin ini, jadi panel hanya terbuka dari komputer ini sendiri. Perangkat lain di WiFi
          akan ditolak sampai <code className="font-mono text-[12px]">MF_JEMBATAN_SECRET</code> dan{" "}
          <code className="font-mono text-[12px]">MF_EMAIL_IZIN</code> diisi di <code className="font-mono text-[12px]">.env</code>.
        </p>
        <Button asChild variant="console" className="self-start">
          <Link href="/">
            Buka panel <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    );
  }

  const email = emailSesi();
  return (
    <div className="flex flex-col gap-4">
      <p className="flex gap-2.5 text-[13.5px] leading-relaxed text-console-foreground/85">
        <LockKeyhole className="mt-0.5 size-4 shrink-0 text-primary" />
        Panel kontrol menjalankan pipeline di mesin ini. Masuk dengan akun Google yang diizinkan.
      </p>
      {galat && (
        <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-[12.5px] text-danger">
          {galat}
        </p>
      )}
      {SHOWCASE_URL ? (
        <Button onClick={mulai} className="self-start">
          <GoogleIcon /> Masuk dengan Google
        </Button>
      ) : (
        <p className="text-[12.5px] text-console-muted">
          Isi <code className="font-mono">NEXT_PUBLIC_SHOWCASE_URL</code> dengan alamat situs showcase supaya login Google bisa dipakai.
        </p>
      )}
      <p className="flex items-center gap-2 font-mono text-[10.5px] text-console-muted">
        <ShieldCheck className="size-3.5" />
        login lewat {SHOWCASE_URL ? new URL(SHOWCASE_URL).host : "situs showcase"} · sesi berlaku 30 hari di perangkat ini
        {email ? ` · terakhir: ${email}` : ""}
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.9A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.8 14c-.2-.7-.4-1.3-.4-2s.1-1.4.4-2V7.1H2.1A11 11 0 0 0 1 12c0 1.8.4 3.5 1.1 4.9L5.8 14z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1L5.8 10c.9-2.7 3.3-4.6 6.2-4.6z" />
    </svg>
  );
}
