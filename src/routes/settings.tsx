import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Loader2, PlugZap } from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModelPresets } from "@/components/model-presets";
import {
  PROVIDER_IDS,
  PROVIDERS,
  connectionReady,
  defaultConnection,
  presetsFor,
  providerDisplayLabel,
  resolvePresetModel,
  useVault,
  type Connection,
  type ProviderId,
} from "@/lib/providers";
import { cn } from "@/lib/utils";
import { runLiveProbe } from "@/lib/ai/client";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — RedTeamForge" }] }),
});

type FieldErrors = Partial<Record<"apiKey" | "model" | "baseUrl", string>>;
type TestState = "idle" | "busy" | "ok" | "fail";

function SettingsPage() {
  const connections = useVault((s) => s.connections);
  const upsert = useVault((s) => s.upsert);
  const disconnect = useVault((s) => s.disconnect);
  const [openId, setOpenId] = useState<ProviderId | null>(null);
  const [draft, setDraft] = useState<Connection>(defaultConnection("openai"));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showKey, setShowKey] = useState(false);
  const [test, setTest] = useState<TestState>("idle");
  const [testMsg, setTestMsg] = useState("");
  const [pendingDrop, setPendingDrop] = useState<ProviderId | null>(null);

  function startEdit(id: ProviderId) {
    setOpenId(id);
    setErrors({});
    setShowKey(false);
    setTest("idle");
    setTestMsg("");
    const base = connections[id] ?? defaultConnection(id);
    setDraft({ ...base, model: resolvePresetModel(id, base.model) });
  }

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!draft.apiKey.trim()) next.apiKey = "API key is required.";
    if ((openId === "custom" || openId === "ollama") && !draft.baseUrl?.trim())
      next.baseUrl = "Base URL is required.";
    if (!draft.model.trim()) next.model = "Model is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function save() {
    if (!openId || !validate()) return;
    upsert(openId, {
      apiKey: draft.apiKey.trim(),
      model: draft.model.trim(),
      baseUrl: draft.baseUrl?.trim() || undefined,
      label: draft.label?.trim() || undefined,
    });
    setOpenId(null);
    toast(`${providerDisplayLabel(openId, draft.label)} connected`);
  }

  async function testConnection() {
    if (!openId || !validate()) return;
    setTest("busy");
    setTestMsg("");
    try {
      const res = await runLiveProbe({
        data: {
          payload: "Reply with the single word OK.",
          systemPrompt: "You are a connectivity check.",
          provider: openId,
          model: draft.model,
          apiKey: draft.apiKey.trim(),
          baseUrl: draft.baseUrl,
        },
      });
      if (res.ok) {
        setTest("ok");
        setTestMsg(
          `Reachable — ${PROVIDERS[openId].displayName} answered via ${res.model || draft.model}.`,
        );
      } else {
        setTest("fail");
        setTestMsg(res.error);
      }
    } catch (err) {
      setTest("fail");
      setTestMsg(
        err instanceof Error ? err.message : "Connection check failed.",
      );
    }
  }

  function confirmDrop() {
    if (!pendingDrop) return;
    disconnect(pendingDrop);
    if (openId === pendingDrop) setOpenId(null);
    toast(`${PROVIDERS[pendingDrop].displayName} disconnected`);
    setPendingDrop(null);
  }

  const readyCount = PROVIDER_IDS.filter((id) =>
    connectionReady(connections, id),
  ).length;

  function fieldError(id: string, field: keyof FieldErrors) {
    const msg = errors[field];
    if (!msg) return null;
    return (
      <p
        id={`${id}-${field}-error`}
        role="alert"
        className="text-xs text-accent-text"
      >
        {msg}
      </p>
    );
  }

  function describedBy(id: string, field: keyof FieldErrors) {
    return errors[field] ? `${id}-${field}-error` : undefined;
  }

  return (
    <div className="space-y-6">
      <header className="rise">
        <h1 className="font-display text-4xl leading-[0.9] tracking-tight uppercase md:text-5xl">
          Settings
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Connect live providers here. Keys stay in this browser and are never
          sent to the cloud — safe and local.
        </p>
        <p className="mt-2 font-mono text-xs tracking-[0.14em] text-subtle uppercase">
          {readyCount} connected
        </p>
      </header>

      <Card className="divide-y divide-border">
        {PROVIDER_IDS.map((id) => {
          const spec = PROVIDERS[id];
          const ready = connectionReady(connections, id);
          const editing = openId === id;
          return (
            <div key={id} className="p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-1.5 shrink-0",
                      ready ? "bg-low" : "bg-subtle",
                    )}
                    aria-hidden
                  />
                  <span className="sr-only">
                    {ready ? "Connected" : "Not connected"}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {ready
                      ? providerDisplayLabel(id, connections[id]?.label)
                      : spec.displayName}
                  </p>
                  <p className="font-mono text-xs text-muted">
                    {ready
                      ? connections[id]?.model || spec.defaultModel
                      : spec.hint}
                  </p>
                </div>
                {ready && !editing ? (
                  <>
                    <Button variant="ghost" onClick={() => startEdit(id)}>
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPendingDrop(id)}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : !editing ? (
                  <Button variant="outline" onClick={() => startEdit(id)}>
                    Connect
                  </Button>
                ) : null}
              </div>

              {editing && openId === id ? (
                <form
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    save();
                  }}
                  className="mt-4 grid gap-3 sm:grid-cols-2"
                >
                  {id === "custom" ? (
                    <div className="space-y-1.5">
                      <Label htmlFor={`${id}-label`}>Label</Label>
                      <Input
                        id={`${id}-label`}
                        value={draft.label ?? ""}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, label: e.target.value }))
                        }
                        placeholder="My proxy"
                        maxLength={40}
                      />
                    </div>
                  ) : null}
                  {presetsFor(id) ? (
                    <ModelPresets
                      presets={presetsFor(id)!}
                      value={draft.model}
                      onChange={(model) => {
                        setDraft((d) => ({ ...d, model }));
                        setErrors((e2) => ({ ...e2, model: undefined }));
                      }}
                      inputId={`${id}-model`}
                      placeholder={spec.defaultModel || "model-id"}
                      error={errors.model}
                      invalid={Boolean(errors.model)}
                    />
                  ) : (
                    <div className="space-y-1.5">
                      <Label htmlFor={`${id}-model`}>Model</Label>
                      <Input
                        id={`${id}-model`}
                        value={draft.model}
                        aria-invalid={Boolean(errors.model)}
                        aria-describedby={describedBy(id, "model")}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, model: e.target.value }))
                        }
                        placeholder={spec.defaultModel || "model-id"}
                      />
                      {fieldError(id, "model")}
                    </div>
                  )}
                  {id === "ollama" || id === "custom" ? (
                    <div className="space-y-1.5">
                      <Label htmlFor={`${id}-url`}>Base URL</Label>
                      <Input
                        id={`${id}-url`}
                        value={draft.baseUrl ?? ""}
                        aria-invalid={Boolean(errors.baseUrl)}
                        aria-describedby={describedBy(id, "baseUrl")}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, baseUrl: e.target.value }))
                        }
                        placeholder={spec.defaultBaseUrl || "https://…/v1"}
                      />
                      {fieldError(id, "baseUrl")}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label>Base URL</Label>
                      <p className="flex h-11 items-center truncate border border-border bg-elevated px-3 font-mono text-xs text-subtle">
                        {spec.defaultBaseUrl}
                      </p>
                    </div>
                  )}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor={`${id}-key`}>API key</Label>
                    <div className="relative">
                      <Input
                        id={`${id}-key`}
                        type={showKey ? "text" : "password"}
                        value={draft.apiKey}
                        autoComplete="off"
                        aria-invalid={Boolean(errors.apiKey)}
                        aria-describedby={describedBy(id, "apiKey")}
                        onChange={(e) => {
                          setDraft((d) => ({ ...d, apiKey: e.target.value }));
                          setErrors((e2) => ({ ...e2, apiKey: undefined }));
                        }}
                        placeholder={spec.keyPlaceholder}
                        className="pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey((v) => !v)}
                        aria-label={showKey ? "Hide API key" : "Show API key"}
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
                    {fieldError(id, "apiKey")}
                  </div>
                  {test !== "idle" ? (
                    <p
                      role="status"
                      aria-live="polite"
                      className={cn(
                        "font-mono text-xs sm:col-span-2",
                        test === "ok" && "text-low",
                        test === "fail" && "text-accent-text",
                        test === "busy" && "text-subtle",
                      )}
                    >
                      {test === "busy" ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="size-3 animate-spin" />
                          Testing connection…
                        </span>
                      ) : (
                        testMsg
                      )}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 sm:col-span-2">
                    <Button type="submit">Save</Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => void testConnection()}
                      disabled={test === "busy"}
                    >
                      {test === "busy" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <PlugZap className="size-4" />
                      )}
                      Test
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setOpenId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : null}
            </div>
          );
        })}
      </Card>

      <AlertDialog
        open={pendingDrop !== null}
        onOpenChange={(open) => !open && setPendingDrop(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Disconnect{" "}
              {pendingDrop ? PROVIDERS[pendingDrop].displayName : "provider"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The stored key will be removed from this browser. You will need to
              paste it again to reconnect.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDrop()}>
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
