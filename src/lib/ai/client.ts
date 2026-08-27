/**
 * Dual-mode AI entry points.
 *
 * Full-stack build (default): delegates to the server functions in
 * `@/lib/server/ai`, which add the password-gate check and the outbound
 * SSRF guard before proxying to the provider.
 *
 * Static build (VITE_RTF_STATIC=1, GitHub Pages): calls the provider
 * directly from the browser with the user's own key. There is no server,
 * so the key only ever travels to the endpoint the user configured.
 */
import { IS_STATIC } from "@/lib/env";
import { PROVIDERS, isProviderId, resolveBaseUrl } from "@/lib/providers";
import type { ScanAnalysis } from "@/lib/probes/types";
import { providerFetch, redact } from "./provider-fetch";
import {
  ANALYST_TIMEOUT_MS,
  MAX_PAYLOAD,
  MAX_PROMPT,
  PROBE_TIMEOUT_MS,
  analyzeInputSchema,
  buildAnalystPrompt,
  compactFindings,
  liveInputSchema,
  shapeAnalysis,
  unusableAnalystOutput,
  type LiveInput,
} from "./shared";

type CompleteResult = Awaited<ReturnType<typeof providerFetch>>;

export async function runLiveProbe(args: {
  data: unknown;
}): Promise<CompleteResult> {
  if (IS_STATIC) {
    const data = liveInputSchema.parse(args.data);
    return directComplete(data);
  }
  const { runLiveProbe: serverFn } = await import("@/lib/server/ai");
  return serverFn(args as Parameters<typeof serverFn>[0]);
}

export async function analyzeScan(args: {
  data: unknown;
}): Promise<
  { ok: true; analysis: ScanAnalysis } | { ok: false; error: string }
> {
  if (!IS_STATIC) {
    const { analyzeScan: serverFn } = await import("@/lib/server/ai");
    return serverFn(args as Parameters<typeof serverFn>[0]);
  }

  const data = analyzeInputSchema.parse(args.data);
  const res = await providerFetch({
    provider: data.provider,
    baseUrl: baseUrlFor(data),
    apiKey: data.apiKey.trim(),
    model: modelFor(data.provider, data.model),
    systemPrompt:
      "You write concise, technical AI-security assessments. Respond with raw JSON only.",
    payload: buildAnalystPrompt(
      data.systemPrompt,
      compactFindings(data.findings),
    ),
    maxTokens: 2400,
    timeoutMs: ANALYST_TIMEOUT_MS,
  });
  if (!res.ok) return res;

  const { extractJson } = await import("./extract-json.mjs");
  const parsed = extractJson(res.text);
  const usable =
    parsed &&
    typeof parsed === "object" &&
    (typeof parsed.executiveSummary === "string" ||
      Array.isArray(parsed.findings));
  if (!usable) {
    console.error(
      "[analyzeScan] unusable analyst output:",
      redact(res.text.slice(0, 800), data.apiKey),
    );
    return { ok: false, error: unusableAnalystOutput(res.text) };
  }
  return { ok: true, analysis: shapeAnalysis(parsed) };
}

async function directComplete(data: LiveInput): Promise<CompleteResult> {
  const apiKey = data.apiKey.trim();
  if (!isProviderId(data.provider)) {
    return { ok: false, error: "Unknown provider." };
  }
  if (!apiKey) return { ok: false, error: "API key is required." };

  const res = await providerFetch({
    provider: data.provider,
    baseUrl: baseUrlFor(data),
    apiKey,
    model: modelFor(data.provider, data.model),
    systemPrompt: data.systemPrompt.slice(0, MAX_PROMPT),
    payload: data.payload.slice(0, MAX_PAYLOAD),
    maxTokens: 280,
    timeoutMs: PROBE_TIMEOUT_MS,
  });

  // Browsers refuse cross-origin calls without CORS headers; the same
  // request works fine through the self-hosted proxy, so point at the fix.
  if (!res.ok && /failed to fetch/i.test(res.error)) {
    return {
      ok: false,
      error:
        `${res.error} The browser could not reach this endpoint directly ` +
        "(CORS). Self-hosted targets must allow this origin — for Ollama, " +
        "set OLLAMA_ORIGINS to this site's URL.",
    };
  }
  return res;
}

function baseUrlFor(data: { provider: string; baseUrl?: string }): string {
  if (!isProviderId(data.provider)) return "";
  const base = resolveBaseUrl(data.provider, data.baseUrl);
  if (!base) return "";
  return base;
}

function modelFor(provider: string, model: string): string {
  const trimmed = model.trim();
  if (trimmed || !isProviderId(provider)) return trimmed;
  return PROVIDERS[provider].defaultModel;
}
