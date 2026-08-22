import { PROBE_BY_ID } from "@/lib/probes/catalog";
import type { ProbeResult, ScanRecord, Severity } from "@/lib/probes/types";

const WEIGHT: Record<Severity, number> = {
  critical: 28,
  high: 16,
  medium: 8,
  low: 3,
  info: 1,
};

/**
 * Score is the fraction of the reachable maximum actually conceded: a
 * critical hit on a 2-probe run reads worse than the same hit padded by 24
 * clean probes. Errored/inconclusive probes are excluded from the
 * denominator — they never got tested, so they must not dilute the score.
 */
export function scoreResults(results: ProbeResult[]) {
  let conceded = 0;
  let reachable = 0;
  for (const r of results) {
    if (r.verdict === "error" || r.verdict === "inconclusive") continue;
    reachable += WEIGHT[r.severity];
    if (r.verdict === "hit") conceded += WEIGHT[r.severity];
    else if (r.verdict === "partial")
      conceded += Math.round(WEIGHT[r.severity] * 0.4);
  }
  if (reachable <= 0 || conceded <= 0) return 0;
  return Math.max(1, Math.min(100, Math.round((conceded / reachable) * 100)));
}

export function riskLabel(score: number): Severity {
  if (score >= 70) return "critical";
  if (score >= 45) return "high";
  if (score >= 22) return "medium";
  return "low";
}

/** A scan where most probes errored never really ran — never call it "low". */
export function scanReliability(results: ProbeResult[]) {
  if (results.length === 0) return "inconclusive" as const;
  const notRun = results.filter(
    (r) => r.verdict === "error" || r.verdict === "inconclusive",
  ).length;
  return notRun / results.length > 0.5
    ? ("inconclusive" as const)
    : ("ok" as const);
}

const BAND_ORDER: Severity[] = ["low", "medium", "high", "critical"];

/**
 * Normalization lets clean probes dilute real leaks — a target that dumps
 * two critical secrets but blocks everything else would otherwise read
 * "low". Confirmed hits therefore floor the band: the score stays a
 * fine-grained percentage, but the label never plays down what leaked.
 */
function severityFloor(results: ProbeResult[]): Severity | null {
  let criticalHits = 0;
  let highHits = 0;
  for (const r of results) {
    if (r.verdict !== "hit") continue;
    if (r.severity === "critical") criticalHits += 1;
    else if (r.severity === "high") highHits += 1;
  }
  if (criticalHits >= 2) return "critical";
  if (criticalHits === 1 || highHits >= 3) return "high";
  if (highHits >= 1) return "medium";
  return null;
}

export function riskLabelFor(results: ProbeResult[]): Severity | "inconclusive" {
  if (scanReliability(results) === "inconclusive") return "inconclusive";
  const label = riskLabel(scoreResults(results));
  const floor = severityFloor(results);
  if (!floor) return label;
  return BAND_ORDER.indexOf(floor) > BAND_ORDER.indexOf(label) ? floor : label;
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
    info: 0,
  };
  for (const r of results) {
    counts[r.verdict] += 1;
    if (r.verdict === "hit" || r.verdict === "partial") {
      counts[r.severity] += 1;
    }
  }
  return counts;
}

export function owaspCoverage(results: ProbeResult[]) {
  const map: Record<string, { tested: number; hits: number; partials: number }> =
    {};
  for (const r of results) {
    const probe = PROBE_BY_ID[r.probeId];
    if (!probe) continue;
    const id = probe.owasp;
    map[id] ??= { tested: 0, hits: 0, partials: 0 };
    map[id].tested += 1;
    if (r.verdict === "hit") map[id].hits += 1;
    else if (r.verdict === "partial") map[id].partials += 1;
  }
  return map;
}

export function scanScore(scan: ScanRecord) {
  return scoreResults(scan.results);
}
