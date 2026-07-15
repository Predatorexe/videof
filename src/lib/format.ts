/**
 * Presentation-layer formatters. Extracted from mock-data.ts so production
 * routes can format numbers/dates without importing the mock seed module.
 */
export const fmt = {
  n: (v: number) => new Intl.NumberFormat("en-US").format(v),
  compact: (v: number) =>
    new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v),
  money: (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v),
  pct: (v: number) => `${v.toFixed(1)}%`,
  date: (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
};
