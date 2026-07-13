import type { TooltipProps } from "recharts";

/**
 * Themed recharts tooltip. Dark surface, rounded, subtle brand-tinted border.
 * Pass as `content={<ChartTooltip />}` to any recharts <Tooltip />.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
  labelFormatter,
}: TooltipProps<number, string> & {
  valueFormatter?: (v: number, name: string) => string;
  labelFormatter?: (l: string | number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="min-w-[140px] rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--elevated)]/95 p-2.5 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.9)] backdrop-blur">
      {label !== undefined && (
        <div className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[color:var(--muted-foreground)]">
          {labelFormatter ? labelFormatter(label as string | number) : String(label)}
        </div>
      )}
      <div className="flex flex-col gap-1">
        {payload.map((entry, i) => {
          const raw = entry.value;
          const numeric = typeof raw === "number" ? raw : Number(raw);
          const name = String(entry.name ?? entry.dataKey ?? "");
          const formatted = valueFormatter
            ? valueFormatter(numeric, name)
            : numeric.toLocaleString();
          return (
            <div key={i} className="flex items-center justify-between gap-4 text-[12px]">
              <span className="flex items-center gap-1.5 text-[color:var(--muted-foreground)]">
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: entry.color }}
                />
                {name}
              </span>
              <span className="font-semibold tabular-nums text-foreground">{formatted}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
