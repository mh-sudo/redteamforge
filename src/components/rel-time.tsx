import { useEffect, useState } from "react";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * One shared 60s ticker for every RelTime on the page — a per-row interval
 * would wake (and re-render) the whole history list every minute.
 */
const listeners = new Set<() => void>();
let timer: number | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (timer === undefined && typeof window !== "undefined") {
    timer = window.setInterval(() => {
      for (const fn of listeners) fn();
    }, 60_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };
}

export function RelTime({
  iso,
  className,
}: {
  iso: string;
  className?: string;
}) {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);
  return <span className={cn(className)}>{formatRelative(iso)}</span>;
}
