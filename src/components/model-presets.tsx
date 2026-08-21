import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ModelPreset } from "@/lib/providers";
import { cn } from "@/lib/utils";

export function ModelPresets({
  presets,
  value,
  onChange,
  inputId,
  placeholder,
}: {
  presets: readonly ModelPreset[];
  value: string;
  onChange: (id: string) => void;
  inputId?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5 sm:col-span-2">
      <Label htmlFor={inputId}>Model</Label>
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label="Model presets"
      >
        {presets.map((p) => {
          const active = p.id === value;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              className={cn(
                "h-8 border px-2 font-mono text-xs tracking-[0.08em] uppercase transition-colors",
                active
                  ? "border-accent bg-elevated text-fg"
                  : "border-border bg-elevated/40 text-muted hover:border-border-strong hover:text-fg",
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <Input
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
