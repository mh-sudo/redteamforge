/**
 * Isomorphic provider transport: one fetch-based completion call against an
 * OpenAI-compatible or Anthropic endpoint. Used by the server-side proxy
 * (full-stack builds) and directly by the browser (static builds), so the
 * wire behavior stays identical between hosting modes.
 */
import { PROVIDERS, isProviderId } from "@/lib/providers";

export type CompleteOpts = {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  payload: string;
  maxTokens: number;
  timeoutMs: number;
};

export type CompleteResult =
  | { ok: true; text: string; model: string }
  | { ok: false; error: string; model?: string };

export async function providerFetch(
  opts: CompleteOpts,
): Promise<CompleteResult> {
  if (!isProviderId(opts.provider)) {
    return { ok: false, error: "Unknown provider." };
  }
  if (!opts.baseUrl) {
    return { ok: false, error: "Base URL is required." };
  }

  const spec = PROVIDERS[opts.provider];
  if (spec.requestFormat === "anthropic") {
    return anthropicMessages({
      url: `${opts.baseUrl}/v1/messages`,
      ...opts,
    });
  }

  return chatCompletions({
    url: `${opts.baseUrl}/chat/completions`,
    ...opts,
  });
}

// ---------------------------------------------------------------------------
// Provider transports
// ---------------------------------------------------------------------------

async function chatCompletions(
  opts: Omit<CompleteOpts, "provider" | "baseUrl"> & { url: string },
): Promise<CompleteResult> {
  try {
    const res = await fetch(opts.url, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(opts.timeoutMs),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify({
        model: opts.model,
        temperature: 0.2,
        max_tokens: opts.maxTokens,
        messages: [
          { role: "system", content: opts.systemPrompt },
          { role: "user", content: opts.payload },
        ],
      }),
    });
    if (!res.ok) {
      return {
        ok: false,
        error: statusError(
          res.status,
          await res.text().catch(() => ""),
          opts.apiKey,
        ),
      };
    }
    const json = (await res.json()) as {
      model?: string;
      usage?: { completion_tokens?: number; reasoning_tokens?: number };
      choices?: {
        finish_reason?: string;
        message?: { content?: string | null; reasoning_content?: string };
        text?: string;
      }[];
    };

    // Reasoning models often burn the whole budget on thinking and return
    // empty `content`, parking the visible text in `reasoning_content`.
    // Legacy completions-style endpoints use `choices[0].text`.
    const choice = json.choices?.[0];
    const raw =
      choice?.message?.content ||
      choice?.message?.reasoning_content ||
      choice?.text ||
      "";
    const text = typeof raw === "string" ? raw : "";

    if (!text.trim()) {
      const finish = choice?.finish_reason ?? "unknown";
      console.error(
        "[chatCompletions] empty completion from",
        opts.url,
        "model:",
        json.model ?? opts.model,
        "finish_reason:",
        finish,
        "usage:",
        JSON.stringify(json.usage ?? {}),
        "raw:",
        redact(JSON.stringify(json).slice(0, 800), opts.apiKey),
      );
      return {
        ok: false,
        error:
          `Target returned an empty completion (finish_reason=${finish}).` +
          (finish === "length"
            ? " The model spent the entire token budget without answering — this is common with reasoning models. Try a non-reasoning model."
            : ""),
        model: json.model || opts.model,
      };
    }
    return { ok: true, text, model: json.model || opts.model };
  } catch (err) {
    return {
      ok: false,
      error: fetchError(err, opts.timeoutMs),
    };
  }
}

async function anthropicMessages(
  opts: Omit<CompleteOpts, "provider" | "baseUrl"> & { url: string },
): Promise<CompleteResult> {
  try {
    const res = await fetch(opts.url, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(opts.timeoutMs),
      headers: {
        "Content-Type": "application/json",
        "x-api-key": opts.apiKey,
        // Required when calling api.anthropic.com straight from a browser
        // page (static build); ignored elsewhere.
        "anthropic-dangerous-direct-browser-access": "true",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: opts.model,
        max_tokens: opts.maxTokens,
        temperature: 0.2,
        system: opts.systemPrompt,
        messages: [{ role: "user", content: opts.payload }],
      }),
    });
    if (!res.ok) {
      return {
        ok: false,
        error: statusError(
          res.status,
          await res.text().catch(() => ""),
          opts.apiKey,
        ),
      };
    }
    const json = (await res.json()) as {
      model?: string;
      stop_reason?: string;
      content?: { type?: string; text?: string }[];
    };
    const text =
      json.content?.find((b) => b.type === "text")?.text ??
      json.content?.[0]?.text ??
      "";
    if (!text.trim()) {
      console.error(
        "[anthropicMessages] empty completion from",
        opts.url,
        "model:",
        json.model ?? opts.model,
        "stop_reason:",
        json.stop_reason ?? "unknown",
        "raw:",
        redact(JSON.stringify(json).slice(0, 800), opts.apiKey),
      );
      return {
        ok: false,
        error: `Target returned an empty completion (stop_reason=${json.stop_reason ?? "unknown"}).`,
        model: json.model || opts.model,
      };
    }
    return { ok: true, text, model: json.model || opts.model };
  } catch (err) {
    return { ok: false, error: fetchError(err, opts.timeoutMs) };
  }
}

function fetchError(err: unknown, timeoutMs: number) {
  if (err instanceof Error && err.name === "TimeoutError") {
    return `Target timed out after ${Math.round(timeoutMs / 1000)}s.`;
  }
  if (err instanceof Error && /redirect/i.test(err.message)) {
    return "Target tried to redirect the request — redirects are not followed.";
  }
  return err instanceof Error ? err.message : "Network error";
}

const KEY_PATTERNS =
  /\b(sk-ant-[A-Za-z0-9_-]{8,}|sk-or-[A-Za-z0-9_-]{8,}|sk-[A-Za-z0-9_-]{8,}|gsk_[A-Za-z0-9]{8,}|AIza[A-Za-z0-9_-]{8,}|xai-[A-Za-z0-9_-]{8,})\b/g;

export function redact(text: string, ...secrets: string[]) {
  let out = text;
  for (const s of secrets) {
    const trimmed = s.trim();
    if (trimmed.length >= 8) out = out.split(trimmed).join("[redacted]");
  }
  return out.replace(KEY_PATTERNS, "[redacted]");
}

function statusError(status: number, body: string, apiKey: string) {
  const snippet = redact(body, apiKey).slice(0, 160);
  return `Target error ${status}${snippet ? `: ${snippet}` : ""}`;
}
