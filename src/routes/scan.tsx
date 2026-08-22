import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { Frame } from "@/components/frame";
import { TargetPicker } from "@/components/target-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { VerdictBadge } from "@/components/severity-badge";
import {
  ALL_PACKS,
  DEFAULT_SYSTEM_PROMPT,
  PROBE_BY_ID,
  PROBES,
} from "@/lib/probes/catalog";
import { PACK_META } from "@/lib/probes/types";
import type {
  ProbePack,
  ProbeResult,
  TargetKind,
  Verdict,
} from "@/lib/probes/types";
import { PROVIDERS, connectionReady, useVault } from "@/lib/providers";
import { executeProbe, liveTargetLabel } from "@/lib/scan/engine";
import { useScanStore } from "@/lib/scan/store";

export const Route = createFileRoute("/scan")({ component: ScanPage });

type PackMode = "quick" | "full" | "custom";

const MODES: { id: PackMode; label: string; caption: string }[] = [
  {
    id: "quick",
    label: "Quick",
    caption: "8 high-signal probes across 5 packs.",
  },
  {
    id: "full",
    label: "Full",
    caption: "Full sweep — all 26 probes across all 8 packs.",
  },
  { id: "custom", label: "Custom", caption: "Narrow the full set by pack." },
];

function ScanPage() {
  const navigate = useNavigate();
  const upsert = useScanStore((s) => s.upsertScan);
  const patch = useScanStore((s) => s.patchScan);
  const connections = useVault((s) => s.connections);

  const [kind, setKind] = useState<TargetKind>("sandbox");
  const [model, setModel] = useState("sandbox-forge");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [mode, setMode] = useState<PackMode>("quick");
  const [packs, setPacks] = useState<ProbePack[]>(ALL_PACKS);
  const [name, setName] = useState("ForgeBank assistant");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [live, setLive] = useState<{ id: string; verdict?: Verdict }[]>([]);
  const alive = useRef(true);

  const selected = useMemo(() => {
    if (mode === "quick") return PROBES.filter((p) => p.quick);
    if (mode === "full") return PROBES;
    return PROBES.filter((p) => packs.includes(p.pack));
  }, [mode, packs]);

  function togglePack(pack: ProbePack) {
    setPacks((cur) =>
      cur.includes(pack) ? cur.filter((p) => p !== pack) : [...cur, pack],
    );
  }

  function selectPack(pack: ProbePack) {
    if (mode === "custom") {
      togglePack(pack);
      return;
    }
    const base =
      mode === "full"
        ? [...ALL_PACKS]
        : ALL_PACKS.filter((p) => PROBES.some((x) => x.pack === p && x.quick));
    setPacks(() =>
      base.includes(pack) ? base.filter((p) => p !== pack) : [...base, pack],
    );
    setMode("custom");
  }

  async function run() {
    if (selected.length === 0) {
      toast("Pick at least one pack");
      return;
    }
    if (kind !== "sandbox" && !connectionReady(connections, kind)) {
      toast("Connect this provider in Settings");
      return;
    }

    const conn = kind === "sandbox" ? undefined : connections[kind];
    const id = crypto.randomUUID();
    const started = performance.now();
    const probeIds = selected.map((p) => p.id);

    upsert({
      id,
      createdAt: new Date().toISOString(),
      name,
      target: {
        kind,
        label: liveTargetLabel(kind),
        model: kind === "sandbox" ? "sandbox-forge" : model,
        baseUrl:
          kind === "sandbox"
            ? undefined
            : conn?.baseUrl || PROVIDERS[kind].defaultBaseUrl,
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
          baseUrl: conn?.baseUrl,
          apiKey: conn?.apiKey,
        });
        results.push(result);
        if (alive.current) {
          setLive((rows) =>
            rows.map((r) =>
              r.id === probe.id ? { id: probe.id, verdict: result.verdict } : r,
            ),
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
            rows.map((r) =>
              r.id === probe.id ? { id: probe.id, verdict: "error" } : r,
            ),
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

  const progress = selected.length
    ? Math.round((done / selected.length) * 100)
    : 0;

  const activeMode = MODES.find((m) => m.id === mode);

  return (
    <div className="space-y-6">
      <header className="rise flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl leading-[0.9] tracking-tight uppercase md:text-5xl">
            New scan
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            Choose a target, keep or edit the system prompt under test, then
            fire a probe pack. Live calls are user-initiated; probe responses
            are token-capped.
          </p>
        </div>
        <Button
          onClick={() => void run()}
          disabled={running}
          className="shrink-0"
        >
          {running ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4" />
          )}
          {running ? "Scanning" : "Run scan"}
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-sm font-medium">Target</h2>
            <div className="mt-3">
              <TargetPicker
                kind={kind}
                onKind={setKind}
                model={model}
                onModel={setModel}
              />
            </div>
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
            <div
              className="mt-4 grid grid-cols-3 gap-1"
              role="group"
              aria-label="Probe pack selection"
            >
              {MODES.map((m) => (
                <Button
                  key={m.id}
                  size="sm"
                  variant={mode === m.id ? "default" : "secondary"}
                  aria-pressed={mode === m.id}
                  onClick={() => setMode(m.id)}
                >
                  {m.label}
                  <span className="font-mono text-xs opacity-70">
                    {m.id === "custom"
                      ? packs.length
                      : m.id === "quick"
                        ? 8
                        : 26}
                  </span>
                </Button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">{activeMode?.caption}</p>

            <div className="mt-4 space-y-2">
              {ALL_PACKS.map((pack) => {
                const meta = PACK_META[pack];
                const count =
                  mode === "quick"
                    ? PROBES.filter((p) => p.pack === pack && p.quick).length
                    : PROBES.filter((p) => p.pack === pack).length;
                const checked =
                  mode === "full"
                    ? true
                    : mode === "quick"
                      ? count > 0
                      : packs.includes(pack);
                return (
                  <label
                    key={pack}
                    className={`flex min-h-11 cursor-pointer items-start gap-3 bg-elevated px-3 py-2.5${
                      mode === "quick" && count === 0 ? " opacity-50" : ""
                    }`}
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={checked}
                      onCheckedChange={() => selectPack(pack)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm">{meta.label}</span>
                        <span className="font-mono text-xs text-subtle">
                          {count}
                        </span>
                      </span>
                      <span className="block text-xs text-muted">
                        {meta.blurb}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-subtle">
              {selected.length} probes selected
            </p>
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
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
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
