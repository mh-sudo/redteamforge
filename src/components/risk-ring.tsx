import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { riskLabel } from "@/lib/scan/risk";

export function RiskRing({
  score,
  size = 148,
  className,
}: {
  score: number;
  size?: number;
  className?: string;
}) {
  const label = riskLabel(score);
  const compact = size < 110;
  const display = useCount(score);
  const color =
    label === "critical"
      ? "var(--color-critical)"
      : label === "high"
        ? "var(--color-high)"
        : label === "medium"
          ? "var(--color-fg)"
          : "var(--color-low)";

  return (
    <div className={cn("flex flex-col", className)} style={{ minWidth: compact ? size : undefined }}>
      <span
        className={cn(
          "font-display leading-[0.85] tracking-tighter tabular-nums",
          compact ? "text-4xl" : "mt-1 pt-2 text-6xl md:text-7xl",
        )}
        style={{ color }}
      >
        {display}
      </span>
      <span
        className="mt-2 font-mono text-xs font-medium tracking-[0.2em] uppercase"
        style={{ color }}
      >
        {label}
      </span>
      {!compact ? (
        <span className="mt-4 block h-px w-24 bg-border">
          <span
            className="block h-px"
            style={{ width: `${Math.min(100, score)}%`, background: color }}
          />
        </span>
      ) : null}
    </div>
  );
}

function useCount(n: number) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setV(n);
      return;
    }
    const t0 = performance.now();
    const dur = 700;
    let id = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setV(Math.round(n * (1 - (1 - p) ** 3)));
      if (p < 1) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [n]);
  return v;
}
