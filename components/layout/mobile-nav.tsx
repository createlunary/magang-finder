"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRunProgress } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import { BrandMark } from "./brand-mark";
import { LENCANA, NAV_AKTIF } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";

/** Label tab bawah dipersingkat supaya enam tab muat di layar 360 px. */
const SINGKAT: Record<string, string> = { "/riwayat": "Riwayat", "/pengaturan": "Setelan" };

/** Navigasi untuk layar < 1024 px: bilah atas ringkas + tab bar bawah (pola aplikasi Android). */
export function MobileTopBar() {
  const { data: progress } = useRunProgress();
  const running = progress?.running ?? false;
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-sidebar/95 px-4 py-2.5 backdrop-blur lg:hidden">
      <Link href="/" className="flex items-center gap-2.5">
        <BrandMark />
        <span className="font-display text-[15px] font-bold">Magang Finder</span>
      </Link>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.06em] text-muted-foreground">
          <span className={cn("size-1.5 rounded-full", running ? "anim-blink bg-primary" : LENCANA.warna)} />
          {running ? "AKTIF" : LENCANA.singkat}
        </span>
        <ThemeToggle compact />
      </div>
    </header>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigasi utama"
      style={{ gridTemplateColumns: `repeat(${NAV_AKTIF.length}, minmax(0, 1fr))` }}
      className="fixed inset-x-0 bottom-0 z-30 grid border-t border-border bg-sidebar/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      {NAV_AKTIF.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium",
              active ? "text-accent-text" : "text-muted-foreground",
            )}
          >
            <span className={cn("flex h-6 w-11 items-center justify-center rounded-full transition-colors", active && "bg-primary/20")}>
              <Icon className="size-[18px]" />
            </span>
            {SINGKAT[href] ?? label}
          </Link>
        );
      })}
    </nav>
  );
}
