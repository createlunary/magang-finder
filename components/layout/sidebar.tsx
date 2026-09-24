"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Globe, History, LayoutGrid, List, LogOut, SlidersHorizontal, UserRound } from "lucide-react";
import { BrandMark } from "./brand-mark";
import { ThemeToggle } from "./theme-toggle";
import { useRunProgress, useSummary } from "@/hooks/use-api";
import { IS_LOKAL, IS_SHOWCASE, MODE } from "@/lib/mode";
import { emailSesi, hapusToken } from "@/lib/sesi";
import { cn, timeAgo } from "@/lib/utils";

export const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/lowongan", label: "Lowongan", icon: List },
  { href: "/profil", label: "Profil", icon: UserRound },
  { href: "/sumber", label: "Sumber", icon: Globe },
  { href: "/pengaturan", label: "Pengaturan", icon: SlidersHorizontal },
  { href: "/riwayat", label: "Riwayat Run", icon: History },
];

/** Showcase tidak memuat profil pribadi maupun pengaturan mesin lokal. */
export const NAV_AKTIF = IS_SHOWCASE ? NAV.filter((n) => n.href !== "/profil" && n.href !== "/pengaturan") : NAV;

export const LENCANA = {
  demo: { label: "MODE DEMO", singkat: "DEMO", warna: "bg-primary" },
  showcase: { label: "SHOWCASE · BACA-SAJA", singkat: "SHOWCASE", warna: "bg-info" },
  lokal: { label: "SYS.ONLINE", singkat: "ONLINE", warna: "bg-success" },
}[MODE];

export function Sidebar() {
  const pathname = usePathname();
  const { data: summary } = useSummary();
  const { data: progress } = useRunProgress();
  const running = progress?.running ?? false;

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
      <div className="border-b border-border px-5 py-5">
        <div className="mb-2.5 flex items-center gap-3">
          <BrandMark />
          <span className="font-display text-[16.5px] leading-tight font-bold">Magang Finder</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 font-mono text-[10px] tracking-[0.06em] text-muted-foreground">
          <span className={cn("size-1.5 rounded-full", LENCANA.warna)} />
          [ {LENCANA.label} ]
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Navigasi utama">
        {NAV_AKTIF.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-[9px] px-3.5 py-2.5 text-[13.5px] transition-colors",
                active
                  ? "bg-primary/20 font-bold text-accent-text"
                  : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 px-3">
        <ThemeToggle />
        {IS_LOKAL && <Keluar />}
      </div>

      <div className="dot-grid m-3 flex flex-col gap-1 rounded-xl bg-console-deep p-3.5">
        <span className="font-mono text-[9.5px] tracking-[0.06em] text-console-muted">[ MISI TERAKHIR ]</span>
        <span className="flex items-center gap-2 font-mono text-[11px] text-console-foreground">
          {running ? (
            <>
              <span className="anim-blink size-1.5 rounded-full bg-primary" />
              pipeline aktif…
            </>
          ) : summary && IS_SHOWCASE ? (
            <>data per {timeAgo(summary.lastRun.startedAt)} &middot; mesin lokal</>
          ) : summary ? (
            <>run {timeAgo(summary.lastRun.startedAt)} &middot; {summary.lastRun.status === "berhasil" ? "nominal" : "gagal"}</>
          ) : (
            "memuat…"
          )}
        </span>
      </div>
    </aside>
  );
}

/** Email sesi panel lokal (dibaca setelah mount: localStorage tidak ada saat render server). */
export function useEmailSesi() {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => setEmail(emailSesi()), []);
  return email;
}

export function keluar() {
  if (!window.confirm("Keluar dari panel kontrol di perangkat ini?")) return;
  hapusToken();
  window.location.href = "/masuk";
}

function Keluar() {
  const email = useEmailSesi();
  if (!email) return null;
  return (
    <button
      type="button"
      onClick={keluar}
      title={`Keluar dari ${email}`}
      className="flex items-center gap-3 rounded-[9px] px-3.5 py-2 text-left text-[12.5px] text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <LogOut className="size-4 shrink-0" />
      <span className="min-w-0 truncate">Keluar · {email}</span>
    </button>
  );
}
