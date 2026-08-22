import {
  useRef,
  forwardRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { ModelPresets } from "@/components/model-presets";
import {
  PROVIDERS,
  connectedIds,
  presetsFor,
  providerDisplayLabel,
  resolvePresetModel,
  useVault,
  type Connection,
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
  const tileRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const optionIds: TargetKind[] = ["sandbox", ...live];

  function pick(next: TargetKind) {
    onKind(next);
    if (next === "sandbox") onModel("sandbox-forge");
    else onModel(resolvePresetModel(next, connections[next]?.model));
  }

  // Radiogroup keyboard semantics: arrows/Home/End move focus, the active
  // tile is the only tab stop.
  function onGroupKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const current = optionIds.indexOf(kind);
    let next = -1;
    if (event.key === "ArrowDown" || event.key === "ArrowRight")
      next = (current + 1 + optionIds.length) % optionIds.length;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft")
      next = (current - 1 + optionIds.length) % optionIds.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = optionIds.length - 1;
    if (next < 0) return;
    event.preventDefault();
    const target = optionIds[next];
    if (target) {
      pick(target);
      tileRefs.current[target]?.focus();
    }
  }

  return (
    <div className="space-y-4">
      <div
        role="radiogroup"
        aria-label="Scan target"
        onKeyDown={onGroupKeyDown}
        className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3"
      >
        <TargetTile
          ref={(el) => {
            tileRefs.current.sandbox = el;
          }}
          active={kind === "sandbox"}
          title="Sandbox"
          hint="Vulnerable ForgeBank sim. No API spend."
          onClick={() => pick("sandbox")}
        />
        {live.map((id) => {
          const conn = connections[id];
          return (
            <TargetTile
              key={id}
              ref={(el) => {
                tileRefs.current[id] = el;
              }}
              active={kind === id}
              title={providerDisplayLabel(id, conn?.label)}
              hint={conn?.model || PROVIDERS[id].defaultModel}
              onClick={() => pick(id)}
            />
          );
        })}
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
  connections,
  label = "Analyst provider",
}: {
  value: ProviderId | "";
  onChange: (id: ProviderId) => void;
  ids: ProviderId[];
  /** Saved connections, so options show the user's actual model + label. */
  connections?: Partial<Record<ProviderId, Connection>>;
  label?: string;
}) {
  if (ids.length === 0) return null;
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ProviderId)}
        aria-label={label}
        className="h-11 w-full appearance-none border border-border bg-elevated px-3 pr-9 font-mono text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/50"
      >
        {ids.map((id) => (
          <option key={id} value={id}>
            {providerDisplayLabel(id, connections?.[id]?.label)} ·{" "}
            {connections?.[id]?.model || PROVIDERS[id].defaultModel}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
      />
    </div>
  );
}

const TargetTile = forwardRef<
  HTMLButtonElement,
  {
    active: boolean;
    title: string;
    hint: string;
    onClick: () => void;
  }
>(function TargetTile({ active, title, hint, onClick }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={active}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={cn(
        "min-h-11 border border-transparent p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg",
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
});
