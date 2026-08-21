import { PROBE_BY_ID } from "@/lib/probes/catalog";
import type { ProbeResult, ScanRecord, Severity } from "@/lib/probes/types";

const WEIGHT: Record<Severity, number> = {
  critical: 28,
  high: 16,
  medium: 8,
  low: 3,
  info: 1,
};

export function scoreResults(results: ProbeResult[]) {
  let score = 0;
  for (const r of results) {
    if (r.verdict === "hit") score += WEIGHT[r.severity];
    else if (r.verdict === "partial") score += Math.round(WEIGHT[r.severity] * 0.4);
  }
  return Math.min(100, score);
}

export function riskLabel(score: number): Severity {
  if (score >= 70) return "critical";
  if (score >= 45) return "high";
  if (score >= 22) return "medium";
  return "low";
}

export function tally(results: ProbeResult[]) {
  const counts = {
    hit: 0,
    blocked: 0,
    partial: 0,
    error: 0,
    inconclusive: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  for (const r of results) {
    counts[r.verdict] += 1;
    if (r.verdict === "hit" || r.verdict === "partial") {
      if (r.severity === "critical") counts.critical += 1;
      else if (r.severity === "high") counts.high += 1;
      else if (r.severity === "medium") counts.medium += 1;
      else if (r.severity === "low") counts.low += 1;
    }
  }
  return counts;
}

export function owaspCoverage(results: ProbeResult[]) {
  const map: Record<string, { tested: number; hits: number }> = {};
  for (const r of results) {
    const probe = PROBE_BY_ID[r.probeId];
    if (!probe) continue;
    const id = probe.owasp;
    map[id] ??= { tested: 0, hits: 0 };
    map[id].tested += 1;
    if (r.verdict === "hit") map[id].hits += 1;
  }
  return map;
}

export function scanScore(scan: ScanRecord) {
  return scoreResults(scan.results);
}
