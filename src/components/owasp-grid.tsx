import { OWASP_2025 } from "@/lib/probes/types";
import { cn } from "@/lib/utils";

export function OwaspGrid({
  coverage,
}: {
  coverage: Record<string, { tested: number; hits: number }>;
}) {
  return (
    <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
      {OWASP_2025.map((item) => {
        const c = coverage[item.id];
        const tested = c?.tested ?? 0;
        const hits = c?.hits ?? 0;
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
                hits > 0 ? "text-critical" : tested > 0 ? "text-low" : "text-subtle",
              )}
            >
              {tested === 0 ? "NT" : `${hits}/${tested}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
