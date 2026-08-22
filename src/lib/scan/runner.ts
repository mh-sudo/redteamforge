import { create } from "zustand";
import { toast } from "sonner";
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

export type ScanRunResult = {
  id: string;
  stopped: boolean;
  /** True when another run was already active and this config was not started. */
  alreadyRunning: boolean;
};

/** Responses are capped before persisting so history can't blow the quota. */
const MAX_PERSISTED_RESPONSE = 20_000;

type RunnerState = {
  /** id of the scan currently executing, null when idle */
  id: string | null;
  total: number;
  done: number;
  verdicts: Record<string, Verdict | undefined>;
  running: boolean;
  start: (cfg: ScanRunConfig, opts?: { resumeId?: string }) => Promise<ScanRunResult>;
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
      // One scan at a time — surface the active run instead of silently
      // dropping the caller's config.
      return { id: get().id ?? "", stopped: false, alreadyRunning: true };
    }
    stopFlag = false;

    const existing = opts?.resumeId
      ? useScanStore.getState().scans.find((s) => s.id === opts.resumeId)
      : undefined;
    const id = existing ? existing.id : crypto.randomUUID();

    // Only catalog probes count toward the run; unknown ids are dropped up
    // front so progress math can never stall short of 100%.
    const validIds = cfg.probeIds.filter((pid) => Boolean(PROBE_BY_ID[pid]));
    const selected = new Set(validIds);

    // Resume by probeId, not index: results are only a prefix of probeIds
    // if nothing was ever skipped, which earlier versions couldn't
    // guarantee. Filtering also drops duplicates and stale foreign probes.
    const priorResults = (existing?.results ?? [])
      .filter((r) => selected.has(r.probeId))
      .filter((r, i, all) => all.findIndex((x) => x.probeId === r.probeId) === i);
    const doneSet = new Set(priorResults.map((r) => r.probeId));
    const remaining = validIds.filter((pid) => !doneSet.has(pid));

    set({
      id,
      running: true,
      total: validIds.length,
      done: priorResults.length,
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
        probeIds: validIds,
        results: [],
        status: "running",
        durationMs: 0,
      });
    }

    const started = performance.now();
    const prevDuration = existing?.durationMs ?? 0;
    const results: ProbeResult[] = [...priorResults];
    let stopped = false;

    try {
      for (const probeId of remaining) {
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
          results.push({
            ...result,
            response: result.response.slice(0, MAX_PERSISTED_RESPONSE),
          });
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
        }
        set((s) => ({
          done: results.length,
          verdicts: { ...s.verdicts, [probeId]: results[results.length - 1]!.verdict },
        }));
        // Persist progress after every probe so reloads can resume.
        useScanStore.getState().patchScan(id, { results: [...results] });
      }
    } finally {
      useScanStore.getState().patchScan(id, {
        results: [...results],
        status: stopped ? "aborted" : "complete",
        durationMs: prevDuration + Math.round(performance.now() - started),
      });
      set({ running: false });
    }
    return { id, stopped, alreadyRunning: false };
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

  const latest = stuck.reduce((a, b) => (a.createdAt >= b.createdAt ? a : b));
  stuck
    .filter((s) => s.id !== latest.id)
    .forEach((s) => store.patchScan(s.id, { status: "aborted" }));

  const doneIds = new Set(latest.results.map((r) => r.probeId));
  if (latest.probeIds.every((pid) => doneIds.has(pid))) {
    // Everything already ran; just finalize.
    store.patchScan(latest.id, { status: "complete" });
    return;
  }

  if (latest.target.kind !== "sandbox") {
    const conn = useVault.getState().connections[latest.target.kind];
    if (!conn?.apiKey?.trim()) {
      // Without the key the resume would burn every remaining probe into
      // an error result and finalize — destroying a perfectly resumable
      // scan. Park it as aborted and tell the visitor instead.
      store.patchScan(latest.id, { status: "aborted" });
      toast.error(
        `"${latest.name}" needs its provider key back — reconnect it in Settings, then re-run from the scan page.`,
      );
      return;
    }
    void useScanRunner
      .getState()
      .start(
        {
          name: latest.name,
          kind: latest.target.kind,
          model: latest.target.model,
          baseUrl: latest.target.baseUrl,
          apiKey: conn.apiKey,
          targetLabel: latest.target.label,
          systemPrompt: latest.systemPrompt,
          probeIds: latest.probeIds,
        },
        { resumeId: latest.id },
      )
      .catch((err) => {
        console.error("[resumeInterruptedScans] resume failed", err);
        useScanStore.getState().patchScan(latest.id, { status: "aborted" });
      });
    return;
  }

  void useScanRunner
    .getState()
    .start(
      {
        name: latest.name,
        kind: "sandbox",
        model: latest.target.model,
        targetLabel: latest.target.label,
        systemPrompt: latest.systemPrompt,
        probeIds: latest.probeIds,
      },
      { resumeId: latest.id },
    )
    .catch((err) => {
      console.error("[resumeInterruptedScans] resume failed", err);
      useScanStore.getState().patchScan(latest.id, { status: "aborted" });
    });
}
