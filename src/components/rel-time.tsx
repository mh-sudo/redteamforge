import { useEffect, useState } from "react";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function RelTime({
  iso,
  className,
}: {
  iso: string;
  className?: string;
}) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return <span className={cn(className)}>{formatRelative(iso)}</span>;
}
