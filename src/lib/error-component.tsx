import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Frame, Stamp } from "@/components/frame";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-16">
      <Frame mark className="w-full max-w-xl bg-surface p-8 text-left md:p-10">
        <Stamp>Malfunction</Stamp>
        <div className="mt-4 flex items-start gap-4">
          <span aria-hidden className="text-accent">
            <TriangleAlert className="size-8" strokeWidth={2} />
          </span>
          <h1 className="font-display text-2xl leading-tight tracking-tight uppercase md:text-3xl">
            Something went wrong
          </h1>
        </div>
        <p className="mt-4 max-w-md text-sm break-words text-muted">
          {error instanceof Error && error.message
            ? error.message
            : "An unexpected error occurred."}
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          <Button onClick={() => window.location.reload()}>Reload</Button>
          <Button asChild variant="outline">
            <Link to="/">Back to dashboard</Link>
          </Button>
        </div>
      </Frame>
    </main>
  );
}
