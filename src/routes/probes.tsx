import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { SeverityBadge } from "@/components/severity-badge";
import { Frame } from "@/components/frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PACK_META, type ProbePack } from "@/lib/probes/types";
import { ALL_PACKS, PROBES } from "@/lib/probes/catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/probes")({
  component: ProbesPage,
  head: () => ({ meta: [{ title: "Probe library — RedTeamForge" }] }),
});

function ProbesPage() {
  const [q, setQ] = useState("");
  const [pack, setPack] = useState<ProbePack | "all">("all");

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return PROBES.filter((p) => {
      if (pack !== "all" && p.pack !== pack) return false;
      if (!query) return true;
      return (
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.owasp.toLowerCase().includes(query) ||
        p.atlas.toLowerCase().includes(query) ||
        p.payload.toLowerCase().includes(query)
      );
    });
  }, [q, pack]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl leading-[0.9] tracking-tight uppercase md:text-5xl">
            Probe library
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted">
            {PROBES.length} Garak-style probes mapped to OWASP LLM Top 10 and
            MITRE ATLAS. Payloads are educational. They target the demo policy,
            not the public internet.
          </p>
        </div>
        <Button asChild>
          <Link to="/scan">Run a pack</Link>
        </Button>
      </header>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
          />
          <Input
            aria-label="Search probes by name, OWASP, ATLAS, or payload"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, OWASP, ATLAS, payload…"
            className="pr-11 pl-9"
            type="search"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center text-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={pack === "all"} onClick={() => setPack("all")}>
            All
          </FilterChip>
          {ALL_PACKS.map((p) => (
            <FilterChip key={p} active={pack === p} onClick={() => setPack(p)}>
              {PACK_META[p].label}
            </FilterChip>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <Frame mark className="p-10 text-center">
          <h2 className="font-display text-2xl tracking-tight uppercase">
            No probes match
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Nothing in the catalog matches “{q}”
            {pack !== "all" ? ` in ${PACK_META[pack].label}` : ""}.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => {
              setQ("");
              setPack("all");
            }}
          >
            Reset filters
          </Button>
        </Frame>
      ) : (
        <>
          <p role="status" className="text-xs text-subtle">
            {list.length} probes
          </p>

          <div className="space-y-3">
            {list.map((probe) => (
              <Card key={probe.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-sm font-medium">{probe.name}</h2>
                    <p className="mt-1 text-sm text-muted">
                      {probe.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <SeverityBadge severity={probe.severity} />
                    <Badge variant="outline">{probe.owasp}</Badge>
                    <Badge variant="outline">{probe.atlas}</Badge>
                    {probe.quick ? <Badge>quick</Badge> : null}
                  </div>
                </div>
                <pre className="mt-4 max-h-40 overflow-auto border border-border bg-elevated p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted">
                  {probe.payload}
                </pre>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 min-w-11 shrink-0 items-center rounded-none border px-3 font-mono text-xs font-medium tracking-wider uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/50",
        active
          ? "border-accent bg-accent text-accent-fg"
          : "border-border bg-elevated text-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}
