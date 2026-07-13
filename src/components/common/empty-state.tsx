import type { ComponentType, ReactNode } from "react";
import { Card } from "./card";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: ComponentType<{ className?: string }>;
  title: ReactNode;
  description?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <Card
      variant="outline"
      padding="lg"
      className={cn("flex flex-col items-center justify-center gap-4 py-14 text-center", className)}
    >
      {Icon ? (
        <div
          aria-hidden
          className="grid h-12 w-12 place-items-center rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--elevated)] text-[color:var(--muted-foreground)]"
        >
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <div className="flex flex-col gap-1">
        <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-foreground">{title}</h3>
        {description ? (
          <p className="mx-auto max-w-md text-[13px] leading-relaxed text-[color:var(--muted-foreground)]">
            {description}
          </p>
        ) : null}
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {primaryAction}
          {secondaryAction}
        </div>
      )}
    </Card>
  );
}
