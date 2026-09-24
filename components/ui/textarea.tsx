import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-20 w-full rounded-lg border border-border bg-subtle px-3 py-2.5 text-[13px] leading-relaxed text-foreground outline-none transition-colors placeholder:text-faint focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
