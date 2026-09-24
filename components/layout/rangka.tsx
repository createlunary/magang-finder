"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { apiBase, IS_LOKAL } from "@/lib/mode";
import { ambilToken, keHalamanMasuk } from "@/lib/sesi";
import { MobileTabBar, MobileTopBar } from "./mobile-nav";
import { Sidebar } from "./sidebar";

/** Navigasi aplikasi; halaman /masuk tampil polos tanpa sidebar & tab bar. */
export function Rangka({ children }: { children: React.ReactNode }) {
  const diMasuk = usePathname().startsWith("/masuk");
  if (diMasuk) return <main className="min-h-screen">{children}</main>;
  return (
    <Gerbang>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <MobileTopBar />
          {/* pb-20: ruang untuk tab bar bawah di layar kecil */}
          <main className="min-w-0 overflow-x-clip pb-20 lg:pb-0">{children}</main>
        </div>
      </div>
      <MobileTabBar />
    </Gerbang>
  );
}

/**
 * Panel lokal: pastikan sesi sah SEBELUM menampilkan apa pun. Datanya sendiri sudah
 * dilindungi API (tanpa token semua endpoint menjawab 401), tapi tanpa gerbang ini
 * kerangka halaman sempat terlihat sekilas sebelum dialihkan ke /masuk.
 */
function Gerbang({ children }: { children: React.ReactNode }) {
  const [boleh, setBoleh] = useState(!IS_LOKAL);

  useEffect(() => {
    if (!IS_LOKAL) return;
    const token = ambilToken();
    const cek = token
      ? fetch(`${apiBase()}/auth/saya`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.ok)
      : // Tanpa token: boleh masuk hanya kalau login belum disiapkan (komputer ini sendiri).
        fetch(`${apiBase()}/auth/saya`).then((r) => r.ok);
    cek
      .then((ok) => (ok ? setBoleh(true) : keHalamanMasuk()))
      .catch(() => keHalamanMasuk());
  }, []);

  if (!boleh) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Memeriksa sesi" />
      </div>
    );
  }
  return <>{children}</>;
}
