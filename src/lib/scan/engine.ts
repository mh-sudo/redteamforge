import { isProviderId, providerDisplayLabel } from "@/lib/providers";
import { PROBE_BY_ID } from "@/lib/probes/catalog";
import { verdictFromDetection } from "@/lib/probes/detectors";
import { sandboxRespond } from "@/lib/probes/sandbox";
import type { Probe, ProbeResult, TargetKind } from "@/lib/probes/types";
import { runLiveProbe } from "@/lib/ai/client";

export type LiveTarget = {
  kind: TargetKind;
  model: string;
  baseUrl?: string;
  apiKey?: string;
};

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function executeProbe(
  probe: Probe,
  systemPrompt: string,
  target: LiveTarget,
): Promise<ProbeResult> {
  const started = performance.now();
  if (target.kind === "sandbox") {
    await wait(280 + Math.round(Math.random() * 220));
    const response = sandboxRespond(probe);
    const { verdict, evidence } = verdictFromDetection(
      probe,
      response,
      systemPrompt,
    );
    return {
      probeId: probe.id,
      verdict,
      severity: probe.severity,
      response,
      evidence,
      latencyMs: Math.round(performance.now() - started),
      model: "sandbox-forge",
    };
  }

  if (!isProviderId(target.kind) || !target.apiKey) {
    return {
      probeId: probe.id,
      verdict: "error",
      severity: probe.severity,
      response: "",
      evidence: "",
      latencyMs: Math.round(performance.now() - started),
      model: target.model,
      error: "Connect this provider in Settings.",
    };
  }

  const res = await runLiveProbe({
    data: {
      payload: probe.payload,
      systemPrompt,
      provider: target.kind,
      model: target.model,
      baseUrl: target.baseUrl,
      apiKey: target.apiKey,
    },
  });

  if (!res.ok) {
    return {
      probeId: probe.id,
      verdict: "error",
      severity: probe.severity,
      response: "",
      evidence: "",
      latencyMs: Math.round(performance.now() - started),
      model: target.model,
      error: res.error,
    };
  }

  const { verdict, evidence } = verdictFromDetection(
    probe,
    res.text,
    systemPrompt,
  );
  return {
    probeId: probe.id,
    verdict,
    severity: probe.severity,
    response: res.text,
    evidence,
    latencyMs: Math.round(performance.now() - started),
    model: res.model,
  };
}

export function resolveProbes(ids: string[]): Probe[] {
  return ids.map((id) => PROBE_BY_ID[id]).filter(Boolean);
}

export function liveTargetLabel(kind: TargetKind, label?: string) {
  if (kind === "sandbox") return "Sandbox (vulnerable)";
  return providerDisplayLabel(kind, label);
}
