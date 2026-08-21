import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Download, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { FindingCard } from "@/components/finding-card";
import { OwaspGrid } from "@/components/owasp-grid";
import { RiskRing } from "@/components/risk-ring";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PROBE_BY_ID } from "@/lib/probes/catalog";
import { reportJson, reportMarkdown } from "@/lib/scan/report";
import { owaspCoverage, riskLabel, scoreResults, tally } from "@/lib/scan/risk";
import { useScanStore } from "@/lib/scan/store";
import { analyzeScan, getAiStatus } from "@/lib/server/ai";
import { downloadText, formatRelative } from "@/lib/utils";

export const Route = createFileRoute("/scans/$scanId")({ component: ScanReport });

function ScanReport() {
  const { scanId } = Route.useParams();
  const scan = useScanStore((s) => s.scans.find((x) => x.id === scanId));
  const setAnalysis = useScanStore((s) => s.setAnalysis);
  const [busy, setBusy] = useState(false);

  if (!scan) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-2xl tracking-tight uppercase">Scan not found</h1>
        <p className="mt-2 text-sm text-muted">It may have been deleted from this browser.</p>
        <Button asChild className="mt-6">
          <Link to="/history">Back to history</Link>
        </Button>
      </div>
    );
  }

  const record = scan;
  const score = scoreResults(record.results);
  const t = tally(record.results);
  const hits = record.results.filter((r) => r.verdict === "hit" || r.verdict === "partial");
  const rest = record.results.filter((r) => r.verdict !== "hit" && r.verdict !== "partial");

  async function runAnalyst() {
    setBusy(true);
    try {
      const status = await getAiStatus();
      if (!status.available) {
        toast("Analyst requires live Grok, which is unavailable here");
        return;
      }
      const res = await analyzeScan({
        data: {
          systemPrompt: record.systemPrompt,
          findings: record.results.map((r) => {
            const p = PROBE_BY_ID[r.probeId];
            return {
              probeId: r.probeId,
              name: p?.name ?? r.probeId,
              owasp: p?.owasp ?? "",
              severity: r.severity,
              verdict: r.verdict,
              evidence: r.evidence,
              responsePreview: r.response.slice(0, 280),
            };
          }),
        },
      });
      if (!res.ok) {
        toast(res.error);
        return;
      }
      setAnalysis(record.id, res.analysis);
      toast("Analyst notes ready");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" className="-ml-2">
          <Link to="/history">
            <ArrowLeft className="size-4" />
            History
          </Link>
        </Button>
        <span className="text-xs text-subtle">{formatRelative(scan.createdAt)}</span>
      </div>

      <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <RiskRing score={score} />
          <div>
            <p className="text-xs font-medium tracking-wider text-subtle uppercase">
              {scan.target.label} · {riskLabel(score)}
            </p>
            <h1 className="mt-1 font-display text-3xl tracking-tight uppercase md:text-4xl">
              {scan.name}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {t.hit} hits · {t.partial} partial · {t.blocked} blocked ·{" "}
              {(scan.durationMs / 1000).toFixed(1)}s
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="size-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  downloadText(
                    `${scan.name.replace(/\s+/g, "-").toLowerCase()}.md`,
                    reportMarkdown(scan),
                    "text/markdown",
                  )
                }
              >
                Markdown
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  downloadText(
                    `${scan.name.replace(/\s+/g, "-").toLowerCase()}.json`,
                    reportJson(scan),
                    "application/json",
                  )
                }
              >
                JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => void runAnalyst()} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {scan.analysis ? "Re-analyze" : "Analyze"}
          </Button>
        </div>
      </header>

      <Tabs defaultValue="findings">
        <TabsList>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="analyst">Analyst</TabsTrigger>
          <TabsTrigger value="coverage">Coverage</TabsTrigger>
          <TabsTrigger value="prompt">Prompt</TabsTrigger>
        </TabsList>

        <TabsContent value="findings" className="space-y-3">
          {hits.map((r, i) => (
            <FindingCard key={r.probeId} result={r} defaultOpen={i === 0} />
          ))}
          {rest.map((r) => (
            <FindingCard key={r.probeId} result={r} />
          ))}
        </TabsContent>

        <TabsContent value="analyst">
          {scan.analysis ? (
            <div className="space-y-4">
              <Card className="p-5">
                <h2 className="font-mono text-xs tracking-[0.14em] uppercase">Executive summary</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {scan.analysis.executiveSummary}
                </p>
              </Card>
              <Card className="p-5">
                <h2 className="font-mono text-xs tracking-[0.14em] uppercase">Prompt hardening</h2>
                <ul className="mt-3 list-disc space-y-2 pl-4">
                  {scan.analysis.systemPromptAdvice.map((tip) => (
                    <li key={tip} className="text-sm text-muted">
                      {tip}
                    </li>
                  ))}
                </ul>
              </Card>
              <div className="space-y-3">
                {scan.analysis.findings.map((f) => (
                  <Card key={f.probeId} className="p-5">
                    <p className="text-sm font-medium">
                      {PROBE_BY_ID[f.probeId]?.name ?? f.probeId}
                    </p>
                    <p className="mt-2 text-sm text-muted">{f.whyItMatters}</p>
                    <p className="mt-2 font-mono text-xs text-subtle">
                      Exploitability: {f.exploitability}
                    </p>
                    <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-muted">
                      {f.remediation.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>
              <p className="text-sm text-muted">{scan.analysis.residualRisk}</p>
            </div>
          ) : (
            <Card className="p-8 text-center">
              <h2 className="font-display text-xl tracking-tight uppercase">No analyst notes yet</h2>
              <p className="mt-2 text-sm text-muted">
                Grok will prioritize hits, explain why they matter, and suggest prompt-level
                fixes. One call, capped.
              </p>
              <Button className="mt-5" onClick={() => void runAnalyst()} disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Analyze
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="coverage">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">OWASP LLM Top 10</CardTitle>
            </CardHeader>
            <CardContent>
              <OwaspGrid coverage={owaspCoverage(scan.results)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompt">
          <Card className="p-5">
            <pre className="overflow-auto font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted">
              {scan.systemPrompt}
            </pre>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
