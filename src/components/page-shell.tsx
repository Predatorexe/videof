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
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-5 py-8 md:px-10 md:py-10">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
              <span className="h-1 w-1 rounded-full bg-signal shadow-[0_0_10px_2px_var(--brand-glow)]" />
              {eyebrow}
            </div>
          )}
          <h1 className="font-display truncate text-4xl leading-[1.02] md:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              {description}
            </p>
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
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: "signal" | "ember" | "none";
  icon?: ReactNode;
}) {
  const isAccent = accent === "signal" || accent === "ember";

  return (
    <div className="glass-card card-hover group relative overflow-hidden p-5">
      {isAccent && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-signal/25 blur-3xl transition-opacity duration-300 group-hover:opacity-100 opacity-70"
        />
      )}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            {label}
          </div>
          <div className="font-display mt-3 text-3xl leading-none tracking-tight text-foreground md:text-[2.25rem]">
            {value}
          </div>
          {hint && (
            <div className="mt-3 text-xs font-medium text-muted-foreground">{hint}</div>
          )}
        </div>
        {icon && <div className="icon-tile shrink-0">{icon}</div>}
      </div>
    </div>
  );
}
