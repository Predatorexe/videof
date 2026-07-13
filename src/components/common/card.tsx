import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "surface" | "elevated" | "outline";
type Padding = "none" | "sm" | "md" | "lg";

const variantClass: Record<Variant, string> = {
  surface: "bg-[color:var(--surface)] border border-[color:var(--color-border)]",
  elevated:
    "bg-[color:var(--elevated)] border border-[color:var(--color-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_20px_40px_-30px_rgba(0,0,0,0.8)]",
  outline: "bg-transparent border border-[color:var(--color-border)]",
};

const paddingClass: Record<Padding, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  padding?: Padding;
  interactive?: boolean;
}

/**
 * Shared surface primitive. Uses design tokens, standard radius (16px),
 * one hover interaction, one focus ring.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, variant = "surface", padding = "md", interactive = false, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-[16px]",
        variantClass[variant],
        paddingClass[padding],
        interactive &&
          "transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[color:color-mix(in_oklab,var(--brand)_20%,var(--color-border))] hover:shadow-[0_20px_40px_-24px_rgba(0,0,0,0.8),0_0_0_1px_color-mix(in_oklab,var(--brand)_12%,transparent)]",
        className,
      )}
      {...rest}
    />
  );
});

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-start justify-between gap-4", className)} {...rest} />;
}

export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-[15px] font-semibold leading-tight tracking-[-0.01em] text-foreground",
        className,
      )}
      {...rest}
    />
  );
}

export function CardDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-[13px] leading-relaxed text-[color:var(--muted-foreground)]",
        className,
      )}
      {...rest}
    />
  );
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4", className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-5 flex items-center justify-between gap-3 border-t border-[color:var(--color-border)] pt-4",
        className,
      )}
      {...rest}
    />
  );
}
