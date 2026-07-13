import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface MetricProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  align?: "left" | "right";
  className?: string;
}

/** Small label+value pair, tabular numerals, consistent hierarchy. */
export function Metric({ label, value, sub, align = "left", className }: MetricProps) {
  return (
    <div className={cn("flex flex-col gap-1", align === "right" && "items-end text-right", className)}>
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--muted-foreground)]">
        {label}
      </span>
      <span className="text-[16px] font-semibold tabular-nums tracking-[-0.01em] text-foreground">
        {value}
      </span>
      {sub ? <span className="text-[12px] text-[color:var(--muted-foreground)]">{sub}</span> : null}
    </div>
  );
}
