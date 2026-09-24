"use client";

import { useEffect, useState } from "react";

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

export function Countdown({ target }: { target?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const text = target && now !== null ? fmt(new Date(target).getTime() - now) : "--:--:--";
  return (
    <div className="text-right">
      <p className="font-mono text-[9.5px] tracking-[0.08em] text-faint">RUN BERIKUTNYA</p>
      <p className="font-mono text-lg font-semibold tracking-[0.04em] tabular-nums" aria-live="off">
        T&minus;{text}
      </p>
    </div>
  );
}
