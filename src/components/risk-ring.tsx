import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { riskLabel } from "@/lib/scan/risk";
import type { Severity } from "@/lib/probes/types";

export function RiskRing({
  score,
  label,
  size = 148,
  className,
}: {
  score: number;
  /**
   * Band to display. Defaults to the numeric band, but callers that have
   * the results should pass `riskLabelFor(results)` so the severity floor
   * and inconclusive scans are honored here too.
   */
  label?: Severity | "inconclusive";
  size?: number;
  className?: string;
}) {
  const band = label ?? riskLabel(score);
  const compact = size < 110;
  const display = useCount(score);
  const strong = `var(--color-${band === "critical" ? "accent" : band === "high" ? "high" : band === "low" ? "low" : "fg"})`;
  const textTone =
    band === "critical"
      ? "var(--color-accent-text)"
      : band === "high"
        ? "var(--color-high)"
        : band === "low"
          ? "var(--color-low)"
          : "var(--color-fg)";

  return (
    <div
      className={cn("flex flex-col", className)}
      style={{ minWidth: compact ? size : undefined }}
      role="img"
      aria-label={`Risk score ${score} out of 100 — ${band}`}
    >
      <span
        className={cn(
          "font-display leading-[0.85] tracking-tighter tabular-nums",
          compact ? "text-4xl" : "mt-1 pt-2 text-6xl md:text-7xl",
        )}
        style={{ color: strong }}
        aria-hidden
      >
        {display}
      </span>
      <span
        aria-hidden
        className="mt-2 font-mono text-xs font-medium tracking-[0.2em] uppercase"
        style={{ color: textTone }}
      >
        {band}
      </span>
      {!compact ? (
        <span aria-hidden className="mt-4 block h-px w-24 bg-border">
          <span
            className="block h-px"
            style={{ width: `${Math.min(100, score)}%`, background: strong }}
          />
        </span>
      ) : null}
    </div>
  );
}

function useCount(n: number) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
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
