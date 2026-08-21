import { Badge } from "@/components/ui/badge";
import type { Severity, Verdict } from "@/lib/probes/types";

export function SeverityBadge({ severity }: { severity: Severity }) {
  const variant =
    severity === "critical"
      ? "critical"
      : severity === "high"
        ? "high"
        : severity === "medium"
          ? "medium"
          : severity === "low"
            ? "low"
            : "default";
  return <Badge variant={variant}>{severity}</Badge>;
}

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const variant =
    verdict === "hit"
      ? "hit"
      : verdict === "blocked"
        ? "blocked"
        : verdict === "partial"
          ? "partial"
          : "error";
  return <Badge variant={variant}>{verdict}</Badge>;
}
