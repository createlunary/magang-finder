"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dark = !mounted || resolvedTheme === "dark";
  const label = dark ? "Ganti ke mode terang" : "Ganti ke mode gelap";
  return (
    <Button
      variant="ghost"
      size={compact ? "icon" : "sm"}
      className={compact ? "" : "w-full justify-start gap-3 px-3.5 font-mono text-xs"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={label}
      title={compact ? label : undefined}
    >
      {dark ? <Sun /> : <Moon />}
      {!compact && (dark ? "Mode terang" : "Mode gelap")}
    </Button>
  );
}
