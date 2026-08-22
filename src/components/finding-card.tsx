import { useState } from "react";
import { ChevronDown, Copy } from "lucide-react";
import { toast } from "sonner";
import { PACK_META, PROBE_BY_ID } from "@/lib/probes/catalog";
import type { ProbeResult } from "@/lib/probes/types";
import { cn, truncate } from "@/lib/utils";
import { SeverityBadge, VerdictBadge } from "./severity-badge";
import { Button } from "./ui/button";

export function FindingCard({
  result,
  defaultOpen,
}: {
  result: ProbeResult;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const probe = PROBE_BY_ID[result.probeId];
  if (!probe) return null;
  const detailId = `finding-${result.probeId}`;

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${label} copied`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`);
    }
  }

  return (
    <article className="border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={detailId}
        className="flex w-full items-start gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fg md:p-5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium">{probe.name}</h3>
            <VerdictBadge verdict={result.verdict} />
            <SeverityBadge severity={probe.severity} />
          </div>
          <p className="mt-1 font-mono text-xs text-muted">
            {probe.owasp} · {PACK_META[probe.pack].label} · {probe.atlas}
          </p>
          {result.evidence && result.verdict !== "blocked" ? (
            <p className="mt-2 font-mono text-xs text-subtle">
              {truncate(result.evidence, 140)}
            </p>
          ) : null}
          {result.error ? (
            <p className="mt-2 text-xs text-accent-text">{result.error}</p>
          ) : null}
        </div>
        <ChevronDown
          className={cn(
            "mt-1 size-4 shrink-0 text-subtle transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div
          id={detailId}
          className="space-y-4 border-t border-border px-4 py-4 md:px-5"
        >
          <p className="text-sm text-muted">{probe.description}</p>
          <Block
            label="Payload"
            text={probe.payload}
            onCopy={() => void copy(probe.payload, "Payload")}
          />
          <Block
            label={`Response · ${result.latencyMs}ms · ${result.model}`}
            text={result.response || "(empty)"}
            onCopy={() =>
              void copy(result.response || "(empty)", "Response")
            }
          />
        </div>
      ) : null}
    </article>
  );
}

function Block({
  label,
  text,
  onCopy,
}: {
  label: string;
  text: string;
  onCopy: () => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-medium tracking-wider text-subtle uppercase">
          {label}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-11 px-3"
          onClick={onCopy}
        >
          <Copy className="size-3.5" />
          Copy
        </Button>
      </div>
      <pre className="max-h-56 overflow-auto border border-border bg-elevated p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted">
        {text}
      </pre>
    </div>
  );
}
