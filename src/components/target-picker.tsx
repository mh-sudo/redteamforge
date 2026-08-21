import { Link } from "@tanstack/react-router";
import { ModelPresets } from "@/components/model-presets";
import {
  PROVIDERS,
  connectedIds,
  presetsFor,
  resolvePresetModel,
  useVault,
  type ProviderId,
} from "@/lib/providers";
import type { TargetKind } from "@/lib/probes/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function TargetPicker({
  kind,
  onKind,
  model,
  onModel,
}: {
  kind: TargetKind;
  onKind: (k: TargetKind) => void;
  model: string;
  onModel: (m: string) => void;
}) {
  const connections = useVault((s) => s.connections);
  const live = connectedIds(connections);

  function pick(next: TargetKind) {
    onKind(next);
    if (next === "sandbox") onModel("sandbox-forge");
    else onModel(resolvePresetModel(next, connections[next]?.model));
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
        <TargetTile
          active={kind === "sandbox"}
          title="Sandbox"
          hint="Vulnerable ForgeBank sim. No API spend."
          onClick={() => pick("sandbox")}
        />
        {live.map((id) => (
          <TargetTile
            key={id}
            active={kind === id}
            title={PROVIDERS[id].displayName}
            hint={connections[id]?.model || PROVIDERS[id].defaultModel}
            onClick={() => pick(id)}
          />
        ))}
      </div>
      {live.length === 0 ? (
        <p className="text-xs text-muted">
          Live targets need a key.{" "}
          <Link
            to="/settings"
            className="text-fg underline-offset-4 hover:underline"
          >
            Connect a provider in Settings
          </Link>
          .
        </p>
      ) : null}
      {kind !== "sandbox" ? (
        presetsFor(kind) ? (
          <ModelPresets
            presets={presetsFor(kind)!}
            value={model}
            onChange={onModel}
            inputId="target-model"
            placeholder={PROVIDERS[kind].defaultModel || "model-id"}
          />
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="target-model">Model</Label>
            <Input
              id="target-model"
              value={model}
              onChange={(e) => onModel(e.target.value)}
            />
          </div>
        )
      ) : null}
    </div>
  );
}

export function ProviderSelect({
  value,
  onChange,
  ids,
}: {
  value: ProviderId | "";
  onChange: (id: ProviderId) => void;
  ids: ProviderId[];
}) {
  if (ids.length === 0) return null;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ProviderId)}
      className="flex h-11 w-full rounded-none border border-border bg-elevated px-3 font-mono text-sm text-fg"
    >
      {ids.map((id) => (
        <option key={id} value={id}>
          {PROVIDERS[id].displayName}
          {PROVIDERS[id].defaultModel ? ` · ${PROVIDERS[id].defaultModel}` : ""}
        </option>
      ))}
    </select>
  );
}

function TargetTile({
  active,
  title,
  hint,
  onClick,
}: {
  active: boolean;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-11 border border-transparent p-3 text-left transition-colors",
        active
          ? "border-accent bg-elevated"
          : "border-border bg-elevated/40 hover:border-border-strong",
      )}
    >
      <span className="block text-sm font-medium">{title}</span>
      <span className="mt-1 block truncate font-mono text-xs text-muted">
        {hint}
      </span>
    </button>
  );
}
