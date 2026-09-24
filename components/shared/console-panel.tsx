import { cn } from "@/lib/utils";

/** Panel gelap bergaya konsol misi — dipakai lintas halaman di kedua tema. */
export function ConsolePanel({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("dot-grid rounded-2xl bg-console px-6 py-5 text-console-foreground", className)} {...props} />;
}

export function ConsoleLabel({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("font-mono text-[10px] tracking-[0.06em] text-console-muted uppercase", className)}
      {...props}
    />
  );
}
