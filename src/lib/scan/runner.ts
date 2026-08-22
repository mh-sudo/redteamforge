import { create } from "zustand";
import { PROBE_BY_ID } from "@/lib/probes/catalog";
import type { ProbeResult, TargetKind, Verdict } from "@/lib/probes/types";
import { executeProbe } from "./engine";
import { useScanStore } from "./store";
import { useVault } from "@/lib/providers/vault";

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
  start: (
    cfg: ScanRunConfig,
    opts?: { resumeId?: string },
  ) => Promise<{ id: string; stopped: boolean }>;
  stop: () => void;
};

let stopFlag = false;

/**
 * App-level scan controller. Lives outside React so a run keeps going
 * while the visitor navigates between routes; the header chip, History
 * rows, and /scan progress all subscribe here.
 *
 * Every completed probe is patched into the scan record immediately, so a
 * page reload never loses finished work — `resumeInterruptedScans` picks
 * the run back up from the persisted record on boot.
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

  start: async (cfg, opts) => {
    if (get().running) {
      // One scan at a time — return the active run so callers can link to it.
      return { id: get().id ?? "", stopped: false };
    }
    stopFlag = false;

    const existing = opts?.resumeId
      ? useScanStore.getState().scans.find((s) => s.id === opts.resumeId)
      : undefined;
    const id = existing ? existing.id : crypto.randomUUID();
    const priorResults = existing?.results ?? [];
    const startIndex = Math.min(priorResults.length, cfg.probeIds.length);

    set({
      id,
      running: true,
      total: cfg.probeIds.length,
      done: startIndex,
      verdicts: Object.fromEntries(
        priorResults.map((r) => [r.probeId, r.verdict]),
      ),
    });

    if (!existing) {
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
    }

    const started = performance.now();
    const prevDuration = existing?.durationMs ?? 0;
    const results: ProbeResult[] = [...priorResults];
    let stopped = false;

    for (const probeId of cfg.probeIds.slice(startIndex)) {
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
      // Persist progress after every probe so reloads can resume.
      useScanStore.getState().patchScan(id, { results: [...results] });
    }

    useScanStore.getState().patchScan(id, {
      results: [...results],
      status: stopped ? "aborted" : "complete",
      durationMs: prevDuration + Math.round(performance.now() - started),
    });
    set({ running: false });
    return { id, stopped };
  },
}));

let resumeAttempted = false;

/**
 * Called once on app boot. Any scan left at status "running" by a page
 * reload is resumed from its persisted record; the API key comes from the
 * vault, so nothing extra needs to be stored. Only resumes the most recent
 * stuck run and aborts older stragglers.
 */
export function resumeInterruptedScans() {
  if (resumeAttempted) return;
  resumeAttempted = true;

  const runner = useScanRunner.getState();
  if (runner.running) return;

  const store = useScanStore.getState();
  const stuck = store.scans.filter((s) => s.status === "running");
  if (stuck.length === 0) return;

  const latest = stuck[0];
  stuck.slice(1).forEach((s) => store.patchScan(s.id, { status: "aborted" }));

  if (latest.results.length >= latest.probeIds.length) {
    // Everything already ran; just finalize.
    store.patchScan(latest.id, { status: "complete" });
    return;
  }

  const conn =
    latest.target.kind === "sandbox"
      ? undefined
      : useVault.getState().connections[latest.target.kind];

  void runner.start(
    {
      name: latest.name,
      kind: latest.target.kind,
      model: latest.target.model,
      baseUrl: latest.target.baseUrl,
      apiKey: conn?.apiKey,
      targetLabel: latest.target.label,
      systemPrompt: latest.systemPrompt,
      probeIds: latest.probeIds,
    },
    { resumeId: latest.id },
  );
}
