import { OWASP_2025 } from "@/lib/probes/types";
import { cn } from "@/lib/utils";

export function OwaspGrid({
  coverage,
}: {
  coverage: Record<string, { tested: number; hits: number; partials: number }>;
}) {
  return (
    <div>
      <p className="px-3 pb-2 font-mono text-xs tracking-[0.14em] text-subtle uppercase">
        <span aria-hidden className="mr-3 inline-block">
          <span className="text-accent-text">H/H</span> hits / tested ·{" "}
          <span className="text-muted">P</span> partial-only ·{" "}
          <span className="text-low">0/4</span> clean ·{" "}
          <span className="text-subtle">NT</span> not tested
        </span>
        <span className="sr-only">
          Format: hits out of tested. P plus a count means only partial
          findings. NT means not tested.
        </span>
      </p>
      <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
        {OWASP_2025.map((item) => {
          const c = coverage[item.id];
          const tested = c?.tested ?? 0;
          const hits = c?.hits ?? 0;
          const partials = c?.partials ?? 0;
          const state =
            tested === 0
              ? "not tested"
              : hits > 0
                ? `${hits} hits out of ${tested} tested`
                : partials > 0
                  ? `${partials} partial findings out of ${tested} tested`
                  : "clean";
          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 bg-surface px-3 py-3"
            >
              <div className="min-w-0">
                <p className="font-mono text-xs text-subtle">{item.id}</p>
                <p className="truncate text-sm">{item.name}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 font-mono text-xs tabular-nums",
                  hits > 0
                    ? "text-accent-text"
                    : partials > 0
                      ? "text-muted"
                      : tested > 0
                        ? "text-low"
                        : "text-subtle",
                )}
              >
                <span aria-hidden>
                  {tested === 0
                    ? "NT"
                    : hits > 0
                      ? `${hits}/${tested}`
                      : partials > 0
                        ? `${partials}p/${tested}`
                        : `0/${tested}`}
                </span>
                <span className="sr-only">{state}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
