import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { TargetPicker } from "@/components/target-picker";
import { VerdictBadge } from "@/components/severity-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_SYSTEM_PROMPT, PROBES } from "@/lib/probes/catalog";
import { verdictFromDetection } from "@/lib/probes/detectors";
import { sandboxCustomRespond, sandboxRespond } from "@/lib/probes/sandbox";
import type { Probe, TargetKind, Verdict } from "@/lib/probes/types";
import { connectionReady, useVault } from "@/lib/providers";
import { executeProbe, liveTargetLabel } from "@/lib/scan/engine";

export const Route = createFileRoute("/lab")({
  component: LabPage,
  head: () => ({ meta: [{ title: "Prompt lab — RedTeamForge" }] }),
});

function LabPage() {
  const connections = useVault((s) => s.connections);
  const [kind, setKind] = useState<TargetKind>("sandbox");
  const [model, setModel] = useState("sandbox-forge");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [probeId, setProbeId] = useState(PROBES[0].id);
  const [payload, setPayload] = useState(PROBES[0].payload);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{
    response: string;
    verdict: Verdict;
    evidence: string;
    latencyMs: number;
    model: string;
    error?: string;
  } | null>(null);

  function pickProbe(id: string) {
    setProbeId(id);
    const p = PROBES.find((x) => x.id === id);
    if (p) setPayload(p.payload);
  }

  async function fire() {
    setBusy(true);
    setOut(null);
    const started = performance.now();
    try {
      const catalog = PROBES.find((p) => p.id === probeId);
      const probe: Probe = catalog
        ? { ...catalog, payload }
        : {
            id: "custom",
            name: "Custom payload",
            pack: "injection",
            owasp: "LLM01",
            atlas: "AML.T0051",
            severity: "high",
            description: "Ad-hoc lab payload",
            payload,
            detector: {
              kind: "leak",
              tokens: [
                "482917",
                "sk_live_forge",
                "FORGE_POLICY_TOKEN",
                "rtf-7e21",
              ],
            },
            sandbox: "hit",
          };

      if (kind === "sandbox") {
        const response = catalog
          ? sandboxRespond(probe)
          : sandboxCustomRespond(payload);
        const { verdict, evidence } = verdictFromDetection(
          probe,
          response,
          systemPrompt,
        );
        setOut({
          response,
          verdict,
          evidence,
          latencyMs: Math.round(performance.now() - started),
          model: "sandbox-forge",
        });
      } else {
        if (!connectionReady(connections, kind)) {
          toast("Connect this provider in Settings");
          setOut({
            response: "",
            verdict: "error",
            evidence: "",
            latencyMs: Math.round(performance.now() - started),
            model,
            error: `${liveTargetLabel(kind)} needs a key. Connect it in Settings first.`,
          });
          return;
        }
        const conn = connections[kind];
        const result = await executeProbe(probe, systemPrompt, {
          kind,
          model,
          baseUrl: conn?.baseUrl,
          apiKey: conn?.apiKey,
        });
        setOut({
          response: result.response,
          verdict: result.verdict,
          evidence: result.evidence,
          latencyMs: result.latencyMs,
          model: result.model,
          error: result.error,
        });
      }
    } catch (err) {
      setOut({
        response: "",
        verdict: "error",
        evidence: "",
        latencyMs: Math.round(performance.now() - started),
        model: kind === "sandbox" ? "sandbox-forge" : model,
        error:
          err instanceof Error
            ? err.message
            : "The probe could not be completed.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="rise">
        <h1 className="font-display text-4xl leading-[0.9] tracking-tight uppercase md:text-5xl">
          Prompt lab
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Fire a single payload against the sandbox or a live model. Detectors
          score the completion the same way a pack scan does.
        </p>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <TargetPicker
            kind={kind}
            onKind={setKind}
            model={model}
            onModel={setModel}
          />

          <div className="space-y-1.5">
            <Label htmlFor="seed">Seed from catalog</Label>
            <div className="relative">
              <select
                id="seed"
                value={probeId}
                onChange={(e) => pickProbe(e.target.value)}
                className="h-11 w-full appearance-none border border-border bg-elevated px-3 pr-9 font-mono text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/50"
              >
                {PROBES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payload">Payload</Label>
            <Textarea
              id="payload"
              className="min-h-32"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sys">System prompt</Label>
            <Textarea
              id="sys"
              className="min-h-24"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            onClick={() => void fire()}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            Fire probe
          </Button>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-xs tracking-[0.14em] uppercase">
              Completion
            </h2>
            {out ? <VerdictBadge verdict={out.verdict} /> : null}
          </div>
          <div aria-live="polite">
            {out ? (
              <div className="mt-4 space-y-4">
                <p className="text-xs text-subtle">
                  {out.latencyMs}ms · {out.model}
                  {out.evidence ? ` · ${out.evidence}` : ""}
                </p>
                {out.error ? (
                  <p className="text-sm text-accent-text">{out.error}</p>
                ) : null}
                <pre className="max-h-[28rem] overflow-auto border border-border bg-elevated p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted">
                  {out.response || "(empty)"}
                </pre>
              </div>
            ) : (
              <p className="mt-8 text-sm text-muted">
                Results land here. Sandbox replies are deterministic so you can
                learn the detectors; live targets are the real test.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
