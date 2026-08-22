import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Frame } from "@/components/frame";
import { Progress } from "@/components/ui/progress";
import { RelTime } from "@/components/rel-time";
import { RiskRing } from "@/components/risk-ring";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useScanRunner } from "@/lib/scan/runner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ScanRecord } from "@/lib/probes/types";
import { riskLabelFor, scoreResults, tally } from "@/lib/scan/risk";
import { useScanStore } from "@/lib/scan/store";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
  head: () => ({ meta: [{ title: "History — RedTeamForge" }] }),
});

function HistoryPage() {
  const scans = useScanStore((s) => s.scans);
  const deleteScan = useScanStore((s) => s.deleteScan);
  const [pending, setPending] = useState<ScanRecord | null>(null);
  const runId = useScanRunner((s) => s.id);
  const runDone = useScanRunner((s) => s.done);
  const runTotal = useScanRunner((s) => s.total);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl leading-[0.9] tracking-tight uppercase md:text-5xl">
          History
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Scans stay in this browser. Nothing is uploaded unless you pointed at
          a live target.
        </p>
      </header>

      {scans.length === 0 ? (
        <Frame mark className="p-10 text-center">
          <h2 className="font-display text-2xl tracking-tight uppercase">
            No stored scans
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Every scan you run is archived here, in this browser only.
          </p>
          <Button asChild className="mt-6">
            <Link to="/scan">Run one</Link>
          </Button>
        </Frame>
      ) : (
        <ul className="space-y-3">
          {scans.map((scan) => {
            const score = scoreResults(scan.results);
            const t = tally(scan.results);
            return (
              <li key={scan.id}>
                <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  {scan.status === "running" ? (
                    <div
                      role="status"
                      aria-live="polite"
                      className="w-24 shrink-0 self-center sm:self-auto"
                    >
                      <Progress
                        value={
                          runId === scan.id && runTotal
                            ? Math.round((runDone / runTotal) * 100)
                            : undefined
                        }
                      />
                      <p className="mt-2 flex items-center gap-1.5 font-mono text-xs tracking-[0.14em] text-muted uppercase">
                        <Loader2 aria-hidden className="size-3 animate-spin" />
                        {runId === scan.id ? `${runDone}/${runTotal}` : "…"}
                      </p>
                    </div>
                  ) : (
                    <RiskRing
                      score={score}
                      label={riskLabelFor(scan.results)}
                      size={88}
                      className="self-center sm:self-auto"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to="/scans/$scanId"
                        params={{ scanId: scan.id }}
                        className="inline-flex min-h-11 items-center text-base font-medium hover:underline"
                      >
                        {scan.name}
                      </Link>
                      {scan.sample ? <Badge>sample</Badge> : null}
                      {scan.status === "aborted" ? (
                        <Badge variant="error">aborted</Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted">
                      {scan.target.label} · <RelTime iso={scan.createdAt} /> ·{" "}
                      {t.hit} hits
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                      <Link to="/scans/$scanId" params={{ scanId: scan.id }}>
                        Open
                      </Link>
                    </Button>
                    {scan.status !== "running" || scan.id !== runId ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-11 text-muted hover:text-critical"
                        aria-label="Delete scan"
                        onClick={() => setPending(scan)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog
        open={Boolean(pending)}
        onOpenChange={(open) => !open && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this scan?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.name ?? "This scan"} will be removed from this browser.
              Reports cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pending) deleteScan(pending.id);
                setPending(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
