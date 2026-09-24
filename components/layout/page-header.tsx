import { cn } from "@/lib/utils";

export function PageHeader({
  index,
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  index: string;
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("relative px-4 sm:px-6 lg:px-10 pt-9", className)}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-2 left-2 lg:left-9 font-display text-[130px] leading-none font-bold text-foreground/[0.045] select-none"
      >
        {index}
      </span>
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">
            [ {index} ] &mdash; {eyebrow}
          </p>
          <h1 className="mt-1.5 font-display text-[28px] font-bold tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-[13.5px] text-muted-foreground">{description}</p>}
          <div className="flight-path mt-3.5" />
        </div>
        {actions}
      </div>
    </header>
  );
}
