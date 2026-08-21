import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Crosshair,
  FlaskConical,
  History,
  LayoutDashboard,
  Lock,
  Menu,
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
    <Link to="/" className="flex min-h-11 items-center gap-2.5">
      <span className="flex size-8 items-center justify-center border border-border">
        <Crosshair className="size-4 text-accent" strokeWidth={2} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-sm tracking-tight uppercase">
          RedTeamForge
        </span>
        <span className="mt-0.5 font-mono text-xs tracking-[0.16em] text-subtle uppercase">
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
            className={cn(
              "flex h-11 items-center gap-2 px-3 font-mono text-xs tracking-[0.14em] uppercase transition-colors",
              active ? "text-accent" : "text-muted hover:text-fg",
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
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-bg/90 px-4 backdrop-blur-sm md:px-6">
        <Brand />
        <NavLinks orientation="row" />
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/settings"
                aria-label={pipLabel}
                className="flex size-11 items-center justify-center"
              >
                <span
                  className={cn("size-1.5", ready ? "bg-low" : "bg-accent")}
                />
              </Link>
            </TooltipTrigger>
            <TooltipContent>{pipLabel}</TooltipContent>
          </Tooltip>
          {gated ? (
            <Button
              variant="ghost"
              onClick={() => void lock()}
              aria-label="Lock"
            >
              <Lock className="size-4" />
              <span className="hidden md:inline">Lock</span>
            </Button>
          ) : null}
          <Button asChild>
            <Link to="/scan">New scan</Link>
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

      <main>
        <div className="mx-auto max-w-6xl px-4 py-8 pb-32 md:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
