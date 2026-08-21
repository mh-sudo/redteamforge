import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
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
  resolvePresetModel,
  useVault,
  type Connection,
  type ProviderId,
} from "@/lib/providers";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const connections = useVault((s) => s.connections);
  const upsert = useVault((s) => s.upsert);
  const disconnect = useVault((s) => s.disconnect);
  const [openId, setOpenId] = useState<ProviderId | null>(null);
  const [draft, setDraft] = useState<Connection>(defaultConnection("openai"));

  function startEdit(id: ProviderId) {
    setOpenId(id);
    const base = connections[id] ?? defaultConnection(id);
    setDraft({ ...base, model: resolvePresetModel(id, base.model) });
  }

  function save() {
    if (!openId) return;
    if (!draft.apiKey.trim()) {
      toast("API key is required");
      return;
    }
    if (
      (openId === "custom" || openId === "ollama") &&
      !draft.baseUrl?.trim()
    ) {
      toast("Base URL is required");
      return;
    }
    if (!draft.model.trim() && openId !== "custom") {
      toast("Model is required");
      return;
    }
    if (openId === "custom" && !draft.model.trim()) {
      toast("Model is required");
      return;
    }
    upsert(openId, {
      apiKey: draft.apiKey.trim(),
      model: draft.model.trim(),
      baseUrl: draft.baseUrl?.trim() || undefined,
    });
    setOpenId(null);
    toast(`${PROVIDERS[openId].displayName} connected`);
  }

  function drop(id: ProviderId) {
    disconnect(id);
    if (openId === id) setOpenId(null);
    toast(`${PROVIDERS[id].displayName} disconnected`);
  }

  const readyCount = PROVIDER_IDS.filter((id) =>
    connectionReady(connections, id),
  ).length;

  return (
    <div className="space-y-6">
      <header className="rise">
        <h1 className="font-display text-4xl leading-[0.9] tracking-tight uppercase md:text-5xl">
          Settings
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Connect live providers here. Keys stay in this browser, are not
          encrypted, and are never uploaded. Sandbox needs no key.
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
                <span
                  className={cn(
                    "size-1.5 shrink-0",
                    ready ? "bg-low" : "bg-subtle",
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{spec.displayName}</p>
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
                    <Button variant="outline" onClick={() => drop(id)}>
                      Disconnect
                    </Button>
                  </>
                ) : !editing ? (
                  <Button variant="outline" onClick={() => startEdit(id)}>
                    Connect
                  </Button>
                ) : null}
              </div>

              {editing ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {presetsFor(id) ? (
                    <ModelPresets
                      presets={presetsFor(id)!}
                      value={draft.model}
                      onChange={(model) => setDraft((d) => ({ ...d, model }))}
                      inputId={`${id}-model`}
                      placeholder={spec.defaultModel || "model-id"}
                    />
                  ) : (
                    <div className="space-y-1.5">
                      <Label htmlFor={`${id}-model`}>Model</Label>
                      <Input
                        id={`${id}-model`}
                        value={draft.model}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, model: e.target.value }))
                        }
                        placeholder={spec.defaultModel || "model-id"}
                      />
                    </div>
                  )}
                  {id === "ollama" || id === "custom" ? (
                    <div className="space-y-1.5">
                      <Label htmlFor={`${id}-url`}>Base URL</Label>
                      <Input
                        id={`${id}-url`}
                        value={draft.baseUrl ?? ""}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, baseUrl: e.target.value }))
                        }
                        placeholder={spec.defaultBaseUrl || "https://…/v1"}
                      />
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
                    <Input
                      id={`${id}-key`}
                      type="password"
                      value={draft.apiKey}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, apiKey: e.target.value }))
                      }
                      placeholder={spec.keyPlaceholder}
                      autoComplete="off"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 sm:col-span-2">
                    <Button onClick={save}>Save</Button>
                    <Button variant="ghost" onClick={() => setOpenId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
