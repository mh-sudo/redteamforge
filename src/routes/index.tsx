import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Crosshair, ScanSearch } from "lucide-react";
import { RiskRing } from "@/components/risk-ring";
import { OwaspGrid } from "@/components/owasp-grid";
import { Frame, Stamp } from "@/components/frame";
import { SeverityBadge, VerdictBadge } from "@/components/severity-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PROBE_BY_ID, PROBES } from "@/lib/probes/catalog";
import { owaspCoverage, scoreResults, tally } from "@/lib/scan/risk";
import { useScanStore } from "@/lib/scan/store";
import { formatRelative } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const scans = useScanStore((s) => s.scans);
  const latest = scans[0];
  const hits = scans.flatMap((s) => s.results.filter((r) => r.verdict === "hit"));
  const openCritical = hits.filter((r) => r.severity === "critical").length;
  const score = latest ? scoreResults(latest.results) : 0;
  const t = latest ? tally(latest.results) : null;
  const coverage = latest ? owaspCoverage(latest.results) : {};

  return (
    <div className="space-y-10">
      <header className="rise grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end">
        <div>
          <h1 className="font-display text-4xl leading-[0.9] tracking-tight uppercase md:text-6xl">
            Red-team
            <br />
            your LLM
          </h1>
          <p className="mt-4 max-w-md text-sm text-muted">
            Garak-style probes mapped to OWASP LLM Top 10. Point at Grok, any
            OpenAI-compatible endpoint, or the leaky sandbox.
          </p>
        </div>
        <dl className="rise-2 grid grid-cols-3 gap-px border border-border bg-border">
          <Stat label="Scans" value={String(scans.length)} />
          <Stat
            label="Crit hits"
            value={String(openCritical)}
            danger={openCritical > 0}
          />
          <Stat label="Catalog" value={String(PROBES.length)} />
        </dl>
      </header>

      {latest ? (
        <section className="rise-3 grid gap-px bg-border lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Frame mark className="bg-surface p-6 md:p-8">
            <Stamp>Latest sweep</Stamp>
            <RiskRing score={score} className="mt-4" />
            <p className="mt-6 text-sm">
              {latest.name}
              <span className="mt-1 block text-muted">
                {latest.target.label} · {formatRelative(latest.createdAt)}
              </span>
            </p>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs tracking-wider uppercase text-muted">
              <span className="text-accent">{t?.hit ?? 0} hit</span>
              <span>{t?.partial ?? 0} partial</span>
              <span className="text-low">{t?.blocked ?? 0} blocked</span>
            </div>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/scans/$scanId" params={{ scanId: latest.id }}>
                Open report
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </Frame>

          <div className="grid gap-px bg-border">
            <Card className="rounded-none border-0">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Recent hits</CardTitle>
                <Button asChild variant="ghost" className="h-11 px-3">
                  <Link to="/history">Archive</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-px bg-border p-0">
                {hits.slice(0, 5).length === 0 ? (
                  <p className="bg-surface px-5 py-4 text-sm text-muted">No hits in stored scans.</p>
                ) : (
                  hits.slice(0, 5).map((r, i) => {
                    const p = PROBE_BY_ID[r.probeId];
                    return (
                      <div
                        key={`${r.probeId}-${i}`}
                        className="flex items-center justify-between gap-3 bg-surface px-5 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm">{p?.name ?? r.probeId}</p>
                          <p className="font-mono text-xs text-subtle">{p?.owasp}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <SeverityBadge severity={r.severity} />
                          <VerdictBadge verdict={r.verdict} />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      ) : (
        <Frame mark className="p-10 text-center">
          <h2 className="font-display text-2xl tracking-tight uppercase">No scans yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Run the sandbox pack to watch a leaky assistant fail in deterministic order.
          </p>
          <Button asChild className="mt-6">
            <Link to="/scan">New scan</Link>
          </Button>
        </Frame>
      )}

      <section className="grid gap-px bg-border lg:grid-cols-2">
        <Card className="rounded-none border-0">
          <CardHeader>
            <CardTitle>OWASP LLM Top 10</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <OwaspGrid coverage={coverage} />
          </CardContent>
        </Card>
        <div className="grid gap-px bg-border">
          <Link
            to="/scan"
            className="group flex items-start gap-4 bg-surface p-6 transition-colors hover:bg-elevated"
          >
            <ScanSearch className="mt-0.5 size-4 shrink-0 text-accent" />
            <span>
              <span className="block font-display text-lg tracking-tight uppercase">Run a pack</span>
              <span className="mt-1 block text-sm text-muted">
                Quick 8-probe pass or a full OWASP sweep against sandbox or live Grok.
              </span>
            </span>
          </Link>
          <Link
            to="/lab"
            className="group flex items-start gap-4 bg-surface p-6 transition-colors hover:bg-elevated"
          >
            <Crosshair className="mt-0.5 size-4 shrink-0 text-accent" />
            <span>
              <span className="block font-display text-lg tracking-tight uppercase">Manual lab</span>
              <span className="mt-1 block text-sm text-muted">
                Fire a single payload, inspect the raw completion, and iterate.
              </span>
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="bg-surface px-3 py-4 md:px-4">
      <Stamp>{label}</Stamp>
      <p
        className={`mt-2 font-display text-3xl leading-none tabular-nums ${danger ? "text-accent" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
