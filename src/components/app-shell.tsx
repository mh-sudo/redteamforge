import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Crosshair,
  FlaskConical,
  History,
  LayoutDashboard,
  Loader2,
  Lock,
  Menu,
  Plus,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { connectedIds, useVault } from "@/lib/providers";
import { useScanRunner, resumeInterruptedScans } from "@/lib/scan/runner";
import { lockGate } from "@/lib/server/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/probes", label: "Probes", icon: Crosshair },
  { to: "/lab", label: "Lab", icon: FlaskConical },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function Brand() {
  return (
    <Link to="/" className="flex min-h-11 min-w-0 items-center gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center border border-border">
        <Crosshair className="size-4 text-accent" strokeWidth={2} />
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span className="truncate font-display text-sm tracking-tight uppercase">
          RedTeamForge
        </span>
        <span className="mt-0.5 hidden font-mono text-xs tracking-[0.16em] text-subtle uppercase sm:block">
          Unit / RTF-01
        </span>
      </span>
    </Link>
  );
}

function NavLinks({
  onNavigate,
  orientation,
}: {
  onNavigate?: () => void;
  orientation: "row" | "col";
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className={cn(
        orientation === "row"
          ? "hidden items-center gap-1 md:flex"
          : "flex flex-col gap-1",
      )}
    >
      {NAV.map((item) => {
        const active =
          item.to === "/"
            ? pathname === "/"
            : pathname === item.to || pathname.startsWith(`${item.to}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-11 items-center gap-2 px-3 font-mono text-xs tracking-[0.14em] uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg",
              active ? "text-accent-text" : "text-muted hover:text-fg",
            )}
          >
            {orientation === "col" ? <Icon className="size-4" /> : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  children,
  gated,
}: {
  children: ReactNode;
  gated: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const ready = connectedIds(useVault((s) => s.connections)).length;
  const runId = useScanRunner((s) => s.id);
  const runDone = useScanRunner((s) => s.done);
  const runTotal = useScanRunner((s) => s.total);
  const runActive = useScanRunner((s) => s.running);

  // A reload kills the in-memory loop; resume persisted runs from where
  // they left off instead of losing them.
  useEffect(() => {
    resumeInterruptedScans();
  }, []);
  const pipLabel = ready
    ? `${ready} provider${ready === 1 ? "" : "s"} ready`
    : "No live provider";

  if (pathname === "/login") {
    return <div className="min-h-dvh bg-bg text-fg">{children}</div>;
  }

  async function lock() {
    await lockGate();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-surface focus:px-3 focus:py-2 focus:font-mono focus:text-xs focus:tracking-[0.14em] focus:text-fg focus:uppercase focus:ring-2 focus:ring-fg"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-bg/90 px-4 backdrop-blur-sm md:px-6">
        <Brand />
        <NavLinks orientation="row" />
        <div className="flex items-center gap-2">
          {runActive && runId ? (
            <Link
              to="/scan"
              role="status"
              aria-live="polite"
              className="flex h-9 items-center gap-2 border border-accent px-3 font-mono text-xs tracking-[0.14em] text-accent-text uppercase transition-colors hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg"
            >
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              <span aria-hidden>
                <span className="hidden sm:inline">Scanning </span>
                {runDone}/{runTotal}
              </span>
              <span className="sr-only">
                Scan running, {runDone} of {runTotal} probes complete. Continue
                to live view.
              </span>
            </Link>
          ) : null}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/settings"
                aria-label={`Providers: ${pipLabel}. Open settings`}
                data-ready={ready > 0}
                className="flex h-11 items-center gap-2 px-2 transition-colors hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg sm:px-3"
              >
                <span
                  className={cn(
                    "size-1.5 shrink-0",
                    ready ? "bg-low" : "bg-accent",
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    "hidden font-mono text-xs tracking-[0.14em] whitespace-nowrap uppercase lg:inline",
                    ready ? "text-muted" : "text-accent-text",
                  )}
                >
                  {ready ? `${ready} ready` : "no key"}
                </span>
              </Link>
            </TooltipTrigger>
            <TooltipContent>{pipLabel}</TooltipContent>
          </Tooltip>
          {gated ? (
            <Button
              variant="ghost"
              onClick={() => void lock()}
              aria-label="Lock"
              className="px-3"
            >
              <Lock className="size-4" />
              <span className="hidden md:inline">Lock</span>
            </Button>
          ) : null}
          <Button asChild className="shrink-0 px-3 sm:px-4">
            <Link to="/scan" aria-label="New scan">
              <Plus className="size-4 sm:hidden" />
              <span className="hidden sm:inline">New scan</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="bg-bg">
          <SheetHeader>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Brand />
          </SheetHeader>
          <div className="mt-8">
            <NavLinks orientation="col" onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <main id="main">
        <div className="mx-auto max-w-6xl px-4 py-8 pb-32 md:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
