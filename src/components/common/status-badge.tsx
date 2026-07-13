import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "success" | "warning" | "danger" | "accent" | "info";

const tone: Record<StatusTone, string> = {
  neutral:
    "bg-[color:var(--elevated)] text-[color:var(--muted-foreground)] border-[color:var(--color-border)]",
  success:
    "bg-[color:color-mix(in_oklab,var(--success)_14%,transparent)] text-[color:var(--success)] border-[color:color-mix(in_oklab,var(--success)_35%,transparent)]",
  warning:
    "bg-[color:color-mix(in_oklab,var(--warning)_14%,transparent)] text-[color:var(--warning)] border-[color:color-mix(in_oklab,var(--warning)_35%,transparent)]",
  danger:
    "bg-[color:color-mix(in_oklab,var(--destructive)_14%,transparent)] text-[color:var(--destructive)] border-[color:color-mix(in_oklab,var(--destructive)_35%,transparent)]",
  accent:
    "bg-[color:var(--brand-soft)] text-[color:var(--brand)] border-[color:color-mix(in_oklab,var(--brand)_35%,transparent)]",
  info: "bg-[color:color-mix(in_oklab,#7dd3fc_14%,transparent)] text-[#7dd3fc] border-[color:color-mix(in_oklab,#7dd3fc_35%,transparent)]",
};

export interface StatusBadgeProps {
  children: ReactNode;
  tone?: StatusTone;
  dot?: boolean;
  className?: string;
}

/** Compact pill for status/label. Consistent border + tone across the app. */
export function StatusBadge({ children, tone: t = "neutral", dot = false, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium tabular-nums",
        tone[t],
        className,
      )}
    >
      {dot ? (
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_6px_currentColor]"
        />
      ) : null}
      {children}
    </span>
  );
}
