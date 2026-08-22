import {
  deleteCookie,
  getCookie,
  getRequestHeader,
  setCookie,
} from "@tanstack/react-start/server";
import {
  GATE_TOKEN_TTL_MS,
  issueGateToken,
  safeEqual,
  verifyGateToken,
} from "./gate-token";

const COOKIE = "rtf_gate";
const MAX_AGE = Math.floor(GATE_TOKEN_TTL_MS / 1000);

export type GateStatus = {
  enabled: boolean;
  unlocked: boolean;
};

function password() {
  return process.env.AUTH_PASSWORD?.trim() || "";
}

function cookieSecure() {
  if (process.env.AUTH_COOKIE_SECURE === "1") return true;
  const proto = getRequestHeader("x-forwarded-proto") ?? "";
  return proto.split(",")[0]?.trim() === "https";
}

/**
 * Per-IP throttle for the unlock endpoint: five free misses, then
 * exponential backoff capped at 15 minutes. In-memory state is enough for
 * a single-node self-hosted deploy; a restart merely resets the counter.
 */
const FREE_MISSES = 5;
const MAX_BACKOFF_MS = 15 * 60 * 1000;
const attempts = new Map<string, { misses: number; blockedUntil: number }>();

function clientKey() {
  const forwarded = getRequestHeader("x-forwarded-for") ?? "";
  return forwarded.split(",")[0]?.trim() || "local";
}

function waitMs(key: string) {
  const entry = attempts.get(key);
  if (!entry) return 0;
  const wait = entry.blockedUntil - Date.now();
  return wait > 0 ? wait : 0;
}

function registerMiss(key: string) {
  const entry = attempts.get(key) ?? { misses: 0, blockedUntil: 0 };
  entry.misses += 1;
  if (entry.misses >= FREE_MISSES) {
    const backoff = Math.min(
      60_000 * 2 ** (entry.misses - FREE_MISSES),
      MAX_BACKOFF_MS,
    );
    entry.blockedUntil = Date.now() + backoff;
  }
  attempts.set(key, entry);
}

function readUnlocked() {
  const secret = password();
  if (!secret) return true;
  const got = getCookie(COOKIE);
  if (!got) return false;
  return verifyGateToken(secret, got);
}

export function assertGate() {
  const secret = password();
  if (!secret) return;
  if (!readUnlocked()) {
    throw new Error("Locked");
  }
}

export function gateStatus(): GateStatus {
  const enabled = Boolean(password());
  return { enabled, unlocked: readUnlocked() };
}

export function tryUnlock(
  input: string,
): { ok: true } | { ok: false; error: string } {
  const secret = password();
  if (!secret) return { ok: true };

  const key = clientKey();
  const blocked = waitMs(key);
  if (blocked > 0) {
    return {
      ok: false,
      error: `Too many attempts — try again in ${Math.ceil(blocked / 1000)}s`,
    };
  }

  if (typeof input !== "string" || !safeEqual(input, secret)) {
    registerMiss(key);
    return { ok: false, error: "Wrong password" };
  }

  attempts.delete(key);
  setCookie(COOKIE, issueGateToken(secret), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: cookieSecure(),
  });
  return { ok: true };
}

export function clearGate() {
  deleteCookie(COOKIE, { path: "/" });
}
