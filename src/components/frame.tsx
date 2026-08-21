import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Frame({
  className,
  children,
  mark = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { mark?: boolean }) {
  return (
    <div
      className={cn("relative overflow-hidden border border-border bg-surface", className)}
      {...props}
    >
      {mark ? (
        <>
          <span className="pointer-events-none absolute top-0 left-0 size-2.5 border-t-2 border-l-2 border-accent" />
          <span className="pointer-events-none absolute top-0 right-0 size-2.5 border-t-2 border-r-2 border-accent" />
          <span className="pointer-events-none absolute bottom-0 left-0 size-2.5 border-b-2 border-l-2 border-accent" />
          <span className="pointer-events-none absolute right-0 bottom-0 size-2.5 border-r-2 border-b-2 border-accent" />
        </>
      ) : null}
      {children}
    </div>
  );
}

export function Stamp({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "font-mono text-xs font-medium tracking-[0.18em] text-subtle uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}
