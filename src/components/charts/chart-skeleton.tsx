export function ChartSkeleton({ className = "h-64" }: { className?: string }) {
  return (
    <div className={`relative w-full overflow-hidden rounded-md bg-muted/40 ${className}`}>
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-muted/60 to-transparent" />
    </div>
  );
}
