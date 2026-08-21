import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Crosshair, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { unlockGate } from "@/lib/server/auth";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await unlockGate({ data: { password } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      await navigate({ to: "/" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <header className="rise text-center">
          <span className="mx-auto flex size-8 items-center justify-center border border-border">
            <Crosshair className="size-4 text-accent" strokeWidth={2} />
          </span>
          <h1 className="mt-4 font-display text-4xl leading-[0.9] tracking-tight uppercase md:text-5xl">
            Unlock
          </h1>
          <p className="mt-3 text-sm text-muted">
            This instance is password-protected. Keys still stay in your
            browser.
          </p>
        </header>
        <Card className="p-5">
          <form onSubmit={(e) => void submit(e)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="gate-password">Password</Label>
              <Input
                id="gate-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                autoFocus
              />
            </div>
            {error ? <p className="text-sm text-critical">{error}</p> : null}
            <Button
              type="submit"
              className="w-full"
              disabled={busy || !password}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              Unlock
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
