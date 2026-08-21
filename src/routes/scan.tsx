import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { Frame } from "@/components/frame";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { VerdictBadge } from "@/components/severity-badge";
import {
  ALL_PACKS,
  DEFAULT_SYSTEM_PROMPT,
  PROBE_BY_ID,
  PROBES,
} from "@/lib/probes/catalog";
import { PACK_META } from "@/lib/probes/types";
import type { ProbePack, ProbeResult, TargetKind, Verdict } from "@/lib/probes/types";
import { executeProbe } from "@/lib/scan/engine";
import { useScanStore } from "@/lib/scan/store";
import { getAiStatus } from "@/lib/server/ai";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/scan")({ component: ScanPage });

const QUICK_PACKS: ProbePack[] = ["injection", "jailbreak", "exfil", "agency", "output"];

function ScanPage() {
  const navigate = useNavigate();
  const upsert = useScanStore((s) => s.upsertScan);
  const patch = useScanStore((s) => s.patchScan);

  const [kind, setKind] = useState<TargetKind>("sandbox");
  const [model, setModel] = useState("grok-4.5");
  const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1");
  const [apiKey, setApiKey] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [quick, setQuick] = useState(true);
  const [packs, setPacks] = useState<ProbePack[]>(QUICK_PACKS);
  const [name, setName] = useState("ForgeBank assistant");
  const [aiOn, setAiOn] = useState(true);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [live, setLive] = useState<{ id: string; verdict?: Verdict }[]>([]);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    void getAiStatus().then((s) => setAiOn(s.available));
    return () => {
      alive.current = false;
    };
  }, []);

  const selected = useMemo(() => {
    return PROBES.filter((p) => packs.includes(p.pack) && (!quick || p.quick));
  }, [packs, quick]);

  function togglePack(pack: ProbePack) {
    setPacks((cur) =>
      cur.includes(pack) ? cur.filter((p) => p !== pack) : [...cur, pack],
    );
  }

  async function run() {
    if (selected.length === 0) {
      toast("Pick at least one pack");
      return;
    }
    if (kind === "xai" && !aiOn) {
      toast("Live Grok is not available in this environment");
      return;
    }
    if (kind === "custom" && (!apiKey.trim() || !baseUrl.trim())) {
      toast("Custom target needs a base URL and API key");
      return;
    }
    if (kind !== "sandbox" && selected.length > 12) {
      toast("Live scans are capped at 12 probes");
      return;
    }

    const id = crypto.randomUUID();
    const started = performance.now();
    const probeIds = selected.map((p) => p.id);
    const targetLabel =
      kind === "sandbox"
        ? "Sandbox (vulnerable)"
        : kind === "xai"
          ? "xAI Grok"
          : "Custom endpoint";

    upsert({
      id,
      createdAt: new Date().toISOString(),
      name,
      target: {
        kind,
        label: targetLabel,
        model: kind === "sandbox" ? "sandbox-forge" : model,
        baseUrl: kind === "custom" ? baseUrl : undefined,
      },
      systemPrompt,
      probeIds,
      results: [],
      status: "running",
      durationMs: 0,
    });

    setRunning(true);
    setDone(0);
    setLive(probeIds.map((pid) => ({ id: pid })));

    const results: ProbeResult[] = [];
    for (let i = 0; i < selected.length; i++) {
      const probe = selected[i];
      try {
        const result = await executeProbe(probe, systemPrompt, {
          kind,
          model,
          baseUrl,
          apiKey: kind === "custom" ? apiKey : undefined,
        });
        results.push(result);
        if (alive.current) {
          setLive((rows) =>
            rows.map((r) => (r.id === probe.id ? { id: probe.id, verdict: result.verdict } : r)),
          );
        }
      } catch (err) {
        const result: ProbeResult = {
          probeId: probe.id,
          verdict: "error",
          severity: probe.severity,
          response: "",
          evidence: "",
          latencyMs: 0,
          model,
          error: err instanceof Error ? err.message : "Probe failed",
        };
        results.push(result);
        if (alive.current) {
          setLive((rows) =>
            rows.map((r) => (r.id === probe.id ? { id: probe.id, verdict: "error" } : r)),
          );
        }
      }
      if (alive.current) setDone(i + 1);
    }

    patch(id, {
      results,
      status: "complete",
      durationMs: Math.round(performance.now() - started),
    });
    if (!alive.current) return;
    setRunning(false);
    toast("Scan complete");
    void navigate({ to: "/scans/$scanId", params: { scanId: id } });
  }

  const progress = selected.length ? Math.round((done / selected.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <header className="rise flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl leading-[0.9] tracking-tight uppercase md:text-5xl">
            New scan
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            Choose a target, keep or edit the system prompt under test, then fire a probe pack.
            Live calls are user-initiated and capped.
          </p>
        </div>
        <Button onClick={() => void run()} disabled={running} className="shrink-0">
          {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
          {running ? "Scanning" : "Run scan"}
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-sm font-medium">Target</h2>
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
              <TargetCard
                active={kind === "sandbox"}
                title="Sandbox"
                hint="Vulnerable ForgeBank sim. No API spend."
                onClick={() => setKind("sandbox")}
              />
              <TargetCard
                active={kind === "xai"}
                title="Live Grok"
                hint={aiOn ? "Uses grok-4.5 via xAI." : "Unavailable here."}
                disabled={!aiOn}
                onClick={() => aiOn && setKind("xai")}
              />
              <TargetCard
                active={kind === "custom"}
                title="Custom"
                hint="OpenAI-compatible URL + key."
                onClick={() => setKind("custom")}
              />
            </div>
            {kind !== "sandbox" ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                </div>
                {kind === "custom" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="base">Base URL</Label>
                    <Input
                      id="base"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://api.openai.com/v1"
                    />
                  </div>
                ) : null}
                {kind === "custom" ? (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="key">API key</Label>
                    <Input
                      id="key"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      autoComplete="off"
                    />
                    <p className="text-xs text-subtle">
                      Sent only with this scan. Not stored. HTTPS required except localhost.
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium">System prompt under test</h2>
              <Button
                variant="ghost"
                className="h-11"
                onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
              >
                Reset demo
              </Button>
            </div>
            <p className="mt-1 text-xs text-muted">
              This is the policy we attack. Paste your production instructions.
            </p>
            <Textarea
              className="mt-3 min-h-44"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="space-y-1.5">
              <Label htmlFor="scan-name">Scan name</Label>
              <Input
                id="scan-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="mt-4 flex min-h-11 items-center justify-between gap-3">
              <Label htmlFor="quick-pack" className="cursor-pointer">
                <span className="block text-sm font-medium">Quick pack</span>
                <span className="block text-xs font-normal text-muted">
                  Eight high-signal probes
                </span>
              </Label>
              <Switch id="quick-pack" checked={quick} onCheckedChange={setQuick} />
            </div>
            <div className="mt-4 space-y-2">
              {ALL_PACKS.map((pack) => {
                const meta = PACK_META[pack];
                const count = PROBES.filter(
                  (p) => p.pack === pack && (!quick || p.quick),
                ).length;
                if (count === 0) return null;
                return (
                  <label
                    key={pack}
                    className="flex min-h-11 cursor-pointer items-start gap-3 bg-elevated px-3 py-2.5"
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={packs.includes(pack)}
                      onCheckedChange={() => togglePack(pack)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm">{meta.label}</span>
                        <span className="font-mono text-xs text-subtle">{count}</span>
                      </span>
                      <span className="block text-xs text-muted">{meta.blurb}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-subtle">{selected.length} probes selected</p>
          </Card>

          {running || live.some((l) => l.verdict) ? (
            <Frame mark className="p-5">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>
                  {done}/{selected.length}
                </span>
                <span className="font-mono tabular-nums">{progress}%</span>
              </div>
              <Progress value={progress} className="mt-2" />
              <ul className="mt-4 space-y-1.5">
                {live.map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-muted">
                      {PROBE_BY_ID[row.id]?.name ?? row.id}
                    </span>
                    {row.verdict ? (
                      <VerdictBadge verdict={row.verdict} />
                    ) : (
                      <span className="text-xs text-subtle">queued</span>
                    )}
                  </li>
                ))}
              </ul>
            </Frame>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TargetCard({
  active,
  title,
  hint,
  onClick,
  disabled,
}: {
  active: boolean;
  title: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "min-h-11 border border-transparent p-3 text-left transition-colors",
        active ? "border-accent bg-elevated" : "border-border bg-elevated/40 hover:border-border-strong",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      <span className="block text-sm font-medium">{title}</span>
      <span className="mt-1 block text-xs text-muted">{hint}</span>
    </button>
  );
}
