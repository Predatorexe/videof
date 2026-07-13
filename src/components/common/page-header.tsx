import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: ReactNode;
  className?: string;
}

/** Top-of-page header. Consistent typography across every route. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-5", className)}>
      {breadcrumbs ? <div className="text-[12px] text-[color:var(--muted-foreground)]">{breadcrumbs}</div> : null}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
              {eyebrow}
            </div>
          ) : null}
          <h1 className="font-display text-[28px] leading-[1.1] tracking-[-0.03em] text-foreground sm:text-[32px]">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[color:var(--muted-foreground)]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
