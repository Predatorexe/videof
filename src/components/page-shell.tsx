import { type ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function PageShell({ eyebrow, title, description, actions, children }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              {eyebrow}
            </div>
          )}
          <h1 className="font-display truncate text-4xl leading-[0.95] md:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: "signal" | "ember" | "none";
}) {
  const accentClass =
    accent === "signal"
      ? "before:bg-signal"
      : accent === "ember"
        ? "before:bg-ember"
        : "before:bg-border";

  return (
    <div
      className={`card-hover group relative overflow-hidden rounded-xl border bg-card p-5 before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] ${accentClass}`}
    >
      <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="font-display mt-3 text-3xl leading-none tracking-tight md:text-4xl">{value}</div>
      {hint && <div className="mt-3 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
