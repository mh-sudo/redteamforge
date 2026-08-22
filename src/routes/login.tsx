import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";
import { Crosshair, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { unlockGate } from "@/lib/server/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Unlock — RedTeamForge" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await unlockGate({ data: { password } });
      if (!res.ok) {
        setError(res.error);
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }
      await navigate({ to: "/" });
    } catch {
      setError("Could not reach the server. Try again.");
      inputRef.current?.focus();
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
              <div className="relative">
                <Input
                  id="gate-password"
                  ref={inputRef}
                  type={showKey ? "text" : "password"}
                  value={password}
                  autoComplete="current-password"
                  autoFocus
                  aria-invalid={Boolean(error) || undefined}
                  aria-describedby={error ? "gate-password-error" : undefined}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  aria-label={showKey ? "Hide password" : "Show password"}
                  aria-pressed={showKey}
                  className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center text-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg"
                >
                  {showKey ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
            {error ? (
              <p
                id="gate-password-error"
                role="alert"
                className="text-sm text-accent-text"
              >
                {error}
              </p>
            ) : null}
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
