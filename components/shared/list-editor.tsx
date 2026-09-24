"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Editor daftar string: tampil sebagai chip (inline) atau baris (stacked). */
export function ListEditor({
  items,
  onChange,
  placeholder,
  layout = "chips",
  label,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  layout?: "chips" | "rows";
  label: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v || items.includes(v)) return;
    onChange([...items, v]);
    setDraft("");
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="flex flex-col gap-3">
      {layout === "chips" ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span key={item} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted py-1 pr-1 pl-3 font-mono text-xs">
              {item}
              <button type="button" onClick={() => remove(i)} aria-label={`Hapus ${item}`} className="flex size-6 cursor-pointer items-center justify-center rounded-full text-faint hover:bg-border hover:text-foreground">
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item, i) => (
            <li key={item} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-subtle py-1.5 pr-1.5 pl-3.5 text-[13px]">
              {item}
              <button type="button" onClick={() => remove(i)} aria-label={`Hapus ${item}`} className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-faint hover:bg-muted hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          value={draft}
          aria-label={label}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
        />
        <Button onClick={add} disabled={!draft.trim()}>
          <Plus /> Tambah
        </Button>
      </div>
    </div>
  );
}
