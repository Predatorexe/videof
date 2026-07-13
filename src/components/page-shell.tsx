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
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-b border-white/[0.05] pb-6 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-4 inline-flex items-center gap-2">
              <span className="live-dot" aria-hidden />
              <span className="eyebrow-lg">{eyebrow}</span>
            </div>
          )}
          <h1 className="hero-serif truncate text-5xl md:text-6xl">
            {title}
          </h1>
          {description && (
            <p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-white/55">
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
  const live = accent === "signal" || accent === "ember";

  return (
    <div className={`${live ? "term-card-live" : "term-card-muted"} card-hover p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="eyebrow">{label}</div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="hero-serif text-3xl md:text-4xl">{value}</span>
          </div>
          {hint && (
            <div className="mt-3 text-[11px] text-white/40">{hint}</div>
          )}
        </div>
        {icon && <div className="icon-tile shrink-0">{icon}</div>}
      </div>
    </div>
  );
}
