import { createHmac, timingSafeEqual } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import {
  deleteCookie,
  getCookie,
  getRequestHeader,
  setCookie,
} from "@tanstack/react-start/server";

const COOKIE = "rtf_gate";
const MAX_AGE = 60 * 60 * 24 * 7;

export type GateStatus = {
  enabled: boolean;
  unlocked: boolean;
};

function password() {
  return process.env.AUTH_PASSWORD?.trim() || "";
}

function tokenFor(secret: string) {
  return createHmac("sha256", secret).update("rtf-gate-v1").digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function cookieSecure() {
  if (process.env.AUTH_COOKIE_SECURE === "1") return true;
  const proto = getRequestHeader("x-forwarded-proto") ?? "";
  return proto.split(",")[0]?.trim() === "https";
}

function readUnlocked() {
  const secret = password();
  if (!secret) return true;
  const got = getCookie(COOKIE);
  if (!got) return false;
  return safeEqual(got, tokenFor(secret));
}

export function assertGate() {
  const secret = password();
  if (!secret) return;
  if (!readUnlocked()) {
    throw new Error("Locked");
  }
}

export const getGateStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<GateStatus> => {
    const enabled = Boolean(password());
    return { enabled, unlocked: readUnlocked() };
  },
);

export const unlockGate = createServerFn({ method: "POST" })
  .validator((input: { password: string }) => input)
  .handler(
    async ({ data }): Promise<{ ok: true } | { ok: false; error: string }> => {
      const secret = password();
      if (!secret) return { ok: true };
      if (!safeEqual(data.password, secret)) {
        return { ok: false, error: "Wrong password" };
      }
      setCookie(COOKIE, tokenFor(secret), {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: MAX_AGE,
        secure: cookieSecure(),
      });
      return { ok: true };
    },
  );

export const lockGate = createServerFn({ method: "POST" }).handler(async () => {
  deleteCookie(COOKIE, { path: "/" });
  return { ok: true as const };
});
