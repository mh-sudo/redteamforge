import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-none border px-2 py-0.5 font-mono text-xs font-medium tracking-wider uppercase",
  {
    variants: {
      variant: {
        default: "border-border bg-elevated text-muted",
        outline: "border-border text-muted",
        critical: "border-accent text-accent-text",
        high: "border-high/50 text-high",
        medium: "border-border text-fg",
        low: "border-low/40 text-low",
        hit: "border-accent bg-accent text-accent-fg",
        blocked: "border-low/40 text-low",
        partial: "border-high/50 text-high",
        error: "border-border text-muted",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
