export type AuthStyle = "bearer" | "anthropic";
export type RequestFormat = "openai" | "anthropic";

export type ModelPreset = {
  id: string;
  label: string;
};

export type ProviderDef = {
  displayName: string;
  defaultBaseUrl: string;
  authStyle: AuthStyle;
  defaultModel: string;
  requestFormat: RequestFormat;
  hint: string;
  baseUrlEditable?: boolean;
  keyPlaceholder?: string;
};

export const PROVIDERS = {
  openai: {
    displayName: "OpenAI",
    defaultBaseUrl: "https://api.openai.com/v1",
    authStyle: "bearer",
    defaultModel: "gpt-5.6-luna",
    requestFormat: "openai",
    hint: "Chat Completions",
    keyPlaceholder: "sk-…",
  },
  anthropic: {
    displayName: "Anthropic",
    defaultBaseUrl: "https://api.anthropic.com",
    authStyle: "anthropic",
    defaultModel: "claude-sonnet-5",
    requestFormat: "anthropic",
    hint: "Messages API",
    keyPlaceholder: "sk-ant-…",
  },
  google: {
    displayName: "Google",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    authStyle: "bearer",
    defaultModel: "gemini-3.6-flash",
    requestFormat: "openai",
    hint: "Gemini (OpenAI-compatible)",
    keyPlaceholder: "AIza…",
  },
  xai: {
    displayName: "xAI",
    defaultBaseUrl: "https://api.x.ai/v1",
    authStyle: "bearer",
    defaultModel: "grok-4.6",
    requestFormat: "openai",
    hint: "Grok",
    keyPlaceholder: "xai-…",
  },
  openrouter: {
    displayName: "OpenRouter",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    authStyle: "bearer",
    defaultModel: "google/gemini-3.6-flash",
    requestFormat: "openai",
    hint: "Many models, one key",
    keyPlaceholder: "sk-or-…",
  },
  groq: {
    displayName: "Groq",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    authStyle: "bearer",
    defaultModel: "openai/gpt-oss-120b",
    requestFormat: "openai",
    hint: "Fast inference",
    keyPlaceholder: "gsk_…",
  },
  mistral: {
    displayName: "Mistral",
    defaultBaseUrl: "https://api.mistral.ai/v1",
    authStyle: "bearer",
    defaultModel: "mistral-small-2603",
    requestFormat: "openai",
    hint: "La Plateforme",
    keyPlaceholder: "…",
  },
  deepseek: {
    displayName: "DeepSeek",
    defaultBaseUrl: "https://api.deepseek.com",
    authStyle: "bearer",
    defaultModel: "deepseek-v4-flash",
    requestFormat: "openai",
    hint: "Chat Completions",
    keyPlaceholder: "sk-…",
  },
  together: {
    displayName: "Together AI",
    defaultBaseUrl: "https://api.together.xyz/v1",
    authStyle: "bearer",
    defaultModel: "Qwen/Qwen3.6-Plus",
    requestFormat: "openai",
    hint: "Open models",
    keyPlaceholder: "…",
  },
  fireworks: {
    displayName: "Fireworks",
    defaultBaseUrl: "https://api.fireworks.ai/inference/v1",
    authStyle: "bearer",
    defaultModel: "accounts/fireworks/models/qwen3p6-plus",
    requestFormat: "openai",
    hint: "Inference API",
    keyPlaceholder: "…",
  },
  ollama: {
    displayName: "Ollama",
    defaultBaseUrl: "http://localhost:11434/v1",
    authStyle: "bearer",
    defaultModel: "qwen3.6",
    requestFormat: "openai",
    hint: "Local OpenAI-compatible",
    baseUrlEditable: true,
    keyPlaceholder: "ollama",
  },
  custom: {
    displayName: "Custom",
    defaultBaseUrl: "",
    authStyle: "bearer",
    defaultModel: "",
    requestFormat: "openai",
    hint: "Any OpenAI-compatible endpoint",
    baseUrlEditable: true,
    keyPlaceholder: "sk-…",
  },
} as const satisfies Record<string, ProviderDef>;

export type ProviderId = keyof typeof PROVIDERS;

export const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

export const MODEL_PRESETS: Partial<
  Record<ProviderId, readonly ModelPreset[]>
> = {
  openai: [
    { id: "gpt-5.6-luna", label: "Luna" },
    { id: "gpt-5.6-terra", label: "Terra" },
    { id: "gpt-5.6-sol", label: "Sol" },
  ],
  anthropic: [
    { id: "claude-haiku-4-5", label: "Haiku 4.5" },
    { id: "claude-sonnet-5", label: "Sonnet 5" },
    { id: "claude-opus-5", label: "Opus 5" },
  ],
  google: [
    { id: "gemini-3.5-flash-lite", label: "3.5 Flash Lite" },
    { id: "gemini-3.6-flash", label: "3.6 Flash" },
    { id: "gemini-3.7-flash", label: "3.7 Flash" },
  ],
  xai: [
    { id: "grok-4.3", label: "Grok 4.3" },
    { id: "grok-4.5", label: "Grok 4.5" },
    { id: "grok-4.6", label: "Grok 4.6" },
  ],
  deepseek: [
    { id: "deepseek-v4-flash", label: "V4 Flash" },
    { id: "deepseek-v4-pro", label: "V4 Pro" },
    { id: "deepseek-v4-flash-vision-exp", label: "V4 Flash Vision" },
  ],
};

export function isProviderId(value: string): value is ProviderId {
  return Object.prototype.hasOwnProperty.call(PROVIDERS, value);
}

export function providerLabel(id: ProviderId) {
  return PROVIDERS[id].displayName;
}

/**
 * UI-facing name. Custom endpoints can carry a user label so several
 * self-hosted targets are distinguishable: "Custom - MyProxy".
 */
export function providerDisplayLabel(id: ProviderId, label?: string) {
  const base = PROVIDERS[id].displayName;
  if (id !== "custom") return base;
  const clean = label?.trim();
  return clean ? `${base} - ${clean}` : base;
}

export function resolveBaseUrl(id: ProviderId, override?: string) {
  const trimmed = override?.trim().replace(/\/+$/, "") ?? "";
  if (trimmed) return trimmed;
  return PROVIDERS[id].defaultBaseUrl.replace(/\/+$/, "");
}

export function presetsFor(id: ProviderId) {
  return MODEL_PRESETS[id];
}

export function resolvePresetModel(id: ProviderId, current?: string) {
  const presets = MODEL_PRESETS[id];
  const fallback = PROVIDERS[id].defaultModel;
  if (!presets) return current?.trim() || fallback;
  if (current && presets.some((p) => p.id === current)) return current;
  return fallback;
}
