"use client";

import { usePathname } from "next/navigation";
import { MobileTabBar, MobileTopBar } from "./mobile-nav";
import { Sidebar } from "./sidebar";

/** Navigasi aplikasi; halaman /masuk tampil polos tanpa sidebar & tab bar. */
export function Rangka({ children }: { children: React.ReactNode }) {
  if (usePathname().startsWith("/masuk")) return <main className="min-h-screen">{children}</main>;
  return (
    <>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <MobileTopBar />
          {/* pb-20: ruang untuk tab bar bawah di layar kecil */}
          <main className="min-w-0 overflow-x-clip pb-20 lg:pb-0">{children}</main>
        </div>
      </div>
      <MobileTabBar />
    </>
  );
}
