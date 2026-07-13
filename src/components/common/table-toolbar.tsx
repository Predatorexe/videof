import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TableToolbarProps {
  search?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function TableToolbar({ search, filters, actions, className }: TableToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-t-[16px] border border-b-0 border-[color:var(--color-border)] bg-[color:var(--surface)] p-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {search}
        {filters ? <div className="flex flex-wrap items-center gap-2">{filters}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
