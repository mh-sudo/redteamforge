import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Pure gate-cookie primitives, kept free of framework imports so they can
 * be unit-tested under `node --test` directly.
 *
 * Tokens are `issuedAt36.hmac(issuedAt36)` — the embedded issue time gives
 * every unlock a fresh token and bounds a stolen cookie to the same 7-day
 * window the cookie itself carries, instead of the password's lifetime.
 */

export const GATE_TOKEN_TTL_MS = 60 * 60 * 24 * 7 * 1000;

const TOKEN_CONTEXT = "rtf-gate-v2";

/** Monotonic clock so two unlocks in the same millisecond still rotate. */
let lastIssued = 0;
function nextIssueTime() {
  lastIssued = Math.max(Date.now(), lastIssued + 1);
  return lastIssued;
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function issueGateToken(secret: string) {
  const iat = nextIssueTime().toString(36);
  const mac = createHmac("sha256", secret)
    .update(`${TOKEN_CONTEXT}:${iat}`)
    .digest("hex");
  return `${iat}.${mac}`;
}

export function verifyGateToken(secret: string, token: string) {
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const iat = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  if (!/^[0-9a-z]+$/.test(iat) || !/^[0-9a-f]{64}$/.test(mac)) return false;
  const expected = createHmac("sha256", secret)
    .update(`${TOKEN_CONTEXT}:${iat}`)
    .digest("hex");
  if (!safeEqual(mac, expected)) return false;
  const issued = parseInt(iat, 36);
  const age = Date.now() - issued;
  return (
    Number.isFinite(issued) && age >= 0 && age <= GATE_TOKEN_TTL_MS
  );
}
