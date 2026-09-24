import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { ConsoleLabel, ConsolePanel } from "@/components/shared/console-panel";
import { Button } from "@/components/ui/button";

/** Halaman yang ada di panel kontrol tapi sengaja tidak dipublikasikan di showcase. */
export function TidakPublik({ judul, alasan }: { judul: string; alasan: string }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <ConsolePanel className="flex w-full max-w-md flex-col gap-3 px-7 py-7">
        <ConsoleLabel className="flex items-center gap-2 text-primary">
          <LockKeyhole className="size-3.5" /> hanya di panel kontrol
        </ConsoleLabel>
        <p className="font-display text-lg font-bold">{judul}</p>
        <p className="text-[13.5px] leading-relaxed text-console-foreground/80">{alasan}</p>
        <Button asChild variant="console" className="mt-1 self-start">
          <Link href="/lowongan">
            Lihat lowongan <ArrowRight className="size-4" />
          </Link>
        </Button>
      </ConsolePanel>
    </div>
  );
}
