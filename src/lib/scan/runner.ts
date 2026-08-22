import { create } from "zustand";
import { PROBE_BY_ID } from "@/lib/probes/catalog";
import type { ProbeResult, TargetKind, Verdict } from "@/lib/probes/types";
import { executeProbe } from "./engine";
import { useScanStore } from "./store";

export type ScanRunConfig = {
  name: string;
  kind: TargetKind;
  model: string;
  baseUrl?: string;
  apiKey?: string;
  targetLabel: string;
  systemPrompt: string;
  probeIds: string[];
};

type RunnerState = {
  /** id of the scan currently executing, null when idle */
  id: string | null;
  total: number;
  done: number;
  verdicts: Record<string, Verdict | undefined>;
  running: boolean;
  start: (cfg: ScanRunConfig) => Promise<{ id: string; stopped: boolean }>;
  stop: () => void;
};

let stopFlag = false;

/**
 * App-level scan controller. Lives outside React so a run keeps going
 * while the visitor navigates between routes; the header chip, History
 * rows, and /scan progress all subscribe here.
 */
export const useScanRunner = create<RunnerState>()((set, get) => ({
  id: null,
  total: 0,
  done: 0,
  verdicts: {},
  running: false,

  stop: () => {
    stopFlag = true;
  },

  start: async (cfg) => {
    if (get().running) {
      // One scan at a time — return the active run so callers can link to it.
      return { id: get().id ?? "", stopped: false };
    }
    stopFlag = false;

    const id = crypto.randomUUID();
    set({
      id,
      running: true,
      total: cfg.probeIds.length,
      done: 0,
      verdicts: {},
    });

    const started = performance.now();
    useScanStore.getState().upsertScan({
      id,
      createdAt: new Date().toISOString(),
      name: cfg.name,
      target: {
        kind: cfg.kind,
        label: cfg.targetLabel,
        model: cfg.model,
        baseUrl: cfg.baseUrl,
      },
      systemPrompt: cfg.systemPrompt,
      probeIds: cfg.probeIds,
      results: [],
      status: "running",
      durationMs: 0,
    });

    const results: ProbeResult[] = [];
    let stopped = false;
    for (const probeId of cfg.probeIds) {
      if (stopFlag) {
        stopped = true;
        break;
      }
      const probe = PROBE_BY_ID[probeId];
      if (!probe) continue;
      try {
        const result = await executeProbe(probe, cfg.systemPrompt, {
          kind: cfg.kind,
          model: cfg.model,
          baseUrl: cfg.baseUrl,
          apiKey: cfg.apiKey,
        });
        results.push(result);
        set((s) => ({
          done: results.length,
          verdicts: { ...s.verdicts, [probeId]: result.verdict },
        }));
      } catch (err) {
        results.push({
          probeId,
          verdict: "error",
          severity: probe.severity,
          response: "",
          evidence: "",
          latencyMs: 0,
          model: cfg.model,
          error:
            err instanceof Error ? err.message : "The probe could not run.",
        });
        set((s) => ({
          done: results.length,
          verdicts: { ...s.verdicts, [probeId]: "error" as Verdict },
        }));
      }
    }

    useScanStore.getState().patchScan(id, {
      results,
      status: stopped ? "aborted" : "complete",
      durationMs: Math.round(performance.now() - started),
    });
    set({ running: false });
    return { id, stopped };
  },
}));
