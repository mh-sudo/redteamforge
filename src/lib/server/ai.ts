import { createServerFn } from "@tanstack/react-start";
import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { providerFetch, redact } from "@/lib/ai/provider-fetch";
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
} from "@/lib/ai/shared";
import type { ScanAnalysis } from "@/lib/probes/types";
import { PROVIDERS, isProviderId, resolveBaseUrl } from "@/lib/providers";
import { assertGate } from "@/lib/server/auth.server";
import { extractJson } from "../ai/extract-json.mjs";

export const runLiveProbe = createServerFn({ method: "POST" })
  .validator((input: unknown) => liveInputSchema.parse(input))
  .handler(
    async ({ data }): Promise<Awaited<ReturnType<typeof providerFetch>>> => {
      assertGate();
      return complete({
        provider: data.provider,
        model: data.model,
        apiKey: data.apiKey,
        baseUrl: data.baseUrl,
        systemPrompt: data.systemPrompt.slice(0, MAX_PROMPT),
        payload: data.payload.slice(0, MAX_PAYLOAD),
        maxTokens: 280,
        timeoutMs: PROBE_TIMEOUT_MS,
      });
    },
  );

export const analyzeScan = createServerFn({ method: "POST" })
  .validator((input: unknown) => analyzeInputSchema.parse(input))
  .handler(
    async ({
      data,
    }): Promise<
      { ok: true; analysis: ScanAnalysis } | { ok: false; error: string }
    > => {
      assertGate();

      const prompt = buildAnalystPrompt(
        data.systemPrompt,
        compactFindings(data.findings),
      );

      const res = await complete({
        provider: data.provider,
        model: data.model,
        apiKey: data.apiKey,
        baseUrl: data.baseUrl,
        systemPrompt:
          "You write concise, technical AI-security assessments. Respond with raw JSON only.",
        payload: prompt,
        maxTokens: 2400,
        timeoutMs: ANALYST_TIMEOUT_MS,
      });
      if (!res.ok) return res;

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
    },
  );

async function complete(opts: {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl?: string;
  systemPrompt: string;
  payload: string;
  maxTokens: number;
  timeoutMs: number;
}) {
  if (!isProviderId(opts.provider)) {
    return { ok: false as const, error: "Unknown provider." };
  }
  const apiKey = opts.apiKey.trim();
  if (!apiKey) return { ok: false as const, error: "API key is required." };

  const spec = PROVIDERS[opts.provider];
  const base = resolveBaseUrl(opts.provider, opts.baseUrl);
  if (!base) return { ok: false as const, error: "Base URL is required." };
  const endpointError = await assertSafeEndpoint(base);
  if (endpointError) return { ok: false as const, error: endpointError };

  const model = opts.model.trim() || spec.defaultModel;
  if (!model) return { ok: false as const, error: "Model is required." };

  return providerFetch({
    provider: opts.provider,
    baseUrl: base,
    apiKey,
    model,
    systemPrompt: opts.systemPrompt,
    payload: opts.payload,
    maxTokens: opts.maxTokens,
    timeoutMs: opts.timeoutMs,
  });
}

// ---------------------------------------------------------------------------
// Outbound-endpoint guard (SSRF)
//
// The URL comes from the browser, so before the server POSTs to it we
// require https (loopback http is allowed for local runtimes like Ollama),
// refuse URLs with embedded credentials, and resolve the host to reject
// private / loopback / link-local addresses unless the operator opted in.
// Redirects are disabled so an allowed endpoint cannot bounce the request
// to somewhere the check never saw.
// ---------------------------------------------------------------------------

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function privateEndpointsAllowed() {
  // Passwordless instances are expected to stay on loopback or a tunnel;
  // gating one is the documented way to expose one. Either signal opts in.
  return (
    process.env.RTF_ALLOW_PRIVATE_ENDPOINTS === "1" ||
    Boolean(process.env.AUTH_PASSWORD?.trim())
  );
}

function ipv4Private(ip: string) {
  const o = ip.split(".").map(Number);
  if (o.length !== 4 || o.some((n) => Number.isNaN(n))) return true;
  const [a, b, c] = o;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local incl. cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  return false;
}

function ipv6Private(ip: string) {
  const low = ip.toLowerCase();
  if (low === "::" || low === "::1") return true;
  if (low.startsWith("fc") || low.startsWith("fd")) return true; // ULA fc00::/7
  if (/^fe[89ab]/.test(low)) return true; // link-local fe80::/10
  const mapped = low.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return ipv4Private(mapped[1]);
  return false;
}

function isPrivateAddress(addr: string) {
  const version = isIP(addr);
  if (version === 4) return ipv4Private(addr);
  if (version === 6) return ipv6Private(addr);
  return true;
}

const dnsCache = new Map<string, { addrs: string[]; at: number }>();
const DNS_TTL_MS = 5 * 60 * 1000;

async function resolveHost(host: string) {
  const cached = dnsCache.get(host);
  if (cached && Date.now() - cached.at < DNS_TTL_MS) return cached.addrs;
  const addrs = await lookup(host, { all: true }).catch(() => []);
  if (addrs.length > 0)
    dnsCache.set(host, { addrs: addrs.map((a) => a.address), at: Date.now() });
  return addrs.map((a) => a.address);
}

async function assertSafeEndpoint(rawUrl: string): Promise<string | null> {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return "Endpoint is not a valid URL.";
  }
  if (u.username || u.password) {
    return "Endpoint URL must not embed credentials.";
  }
  const host = u.hostname.replace(/^\[|\]$/g, "");
  const isLoopbackHttp =
    u.protocol === "http:" && LOOPBACK_HOSTS.has(u.hostname);
  if (u.protocol !== "https:" && !isLoopbackHttp) {
    return "Endpoint must be https, or http on localhost.";
  }
  if (isLoopbackHttp) return null;

  const addrs = isIP(host) ? [host] : await resolveHost(host);
  if (addrs.length === 0) return `Cannot resolve endpoint host "${host}".`;
  if (addrs.some((a) => isPrivateAddress(a)) && !privateEndpointsAllowed()) {
    return (
      "Private/internal endpoints are blocked by default. " +
      "Set RTF_ALLOW_PRIVATE_ENDPOINTS=1 (or configure AUTH_PASSWORD) to allow LAN/self-hosted targets."
    );
  }
  return null;
}
