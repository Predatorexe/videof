import type { ComponentType, ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "./card";
import { cn } from "@/lib/utils";

export interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  delta?: number;
  deltaLabel?: string;
  icon?: ComponentType<{ className?: string }>;
  className?: string;
}

/**
 * Standardized KPI tile. Uses tabular numerals, consistent spacing,
 * accent-aware trend indicator.
 */
export function StatTile({
  label,
  value,
  hint,
  delta,
  deltaLabel,
  icon: Icon,
  className,
}: StatTileProps) {
  const up = typeof delta === "number" && delta >= 0;
  return (
    <Card className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--muted-foreground)]">
          {label}
        </span>
        {Icon ? (
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--elevated)] text-[color:var(--muted-foreground)]"
          >
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>

      <div className="font-display text-[28px] leading-none tabular-nums tracking-[-0.02em] text-foreground">
        {value}
      </div>

      <div className="flex items-center gap-2 text-[12px] text-[color:var(--muted-foreground)]">
        {typeof delta === "number" ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
              up
                ? "bg-[color:color-mix(in_oklab,var(--success)_15%,transparent)] text-[color:var(--success)]"
                : "bg-[color:color-mix(in_oklab,var(--destructive)_15%,transparent)] text-[color:var(--destructive)]",
            )}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        ) : null}
        {deltaLabel ? <span>{deltaLabel}</span> : null}
        {hint ? <span className="truncate">{hint}</span> : null}
      </div>
    </Card>
  );
}
