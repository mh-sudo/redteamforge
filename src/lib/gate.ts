/**
 * Dual-mode gate facade mirroring the server-function call convention.
 *
 * Static builds have no server to protect, so the gate compiles out:
 * status is always open and lock/unlock become no-ops. Full-stack builds
 * delegate to the real cookie-backed implementation.
 *
 * Note: the flag deliberately comes from env.ts rather than being inlined.
 * Inlining changes the SSR bundle's chunk graph and trips a rolldown
 * chunk-cycle crash during SPA prerender; the leftover dynamic imports are
 * unreachable at runtime because IS_STATIC is compile-time true there.
 */
import { IS_STATIC } from "@/lib/env";

export type GateStatus = {
  enabled: boolean;
  unlocked: boolean;
};

export async function getGateStatus(): Promise<GateStatus> {
  if (IS_STATIC) return { enabled: false, unlocked: false };
  const { getGateStatus: serverFn } = await import("@/lib/server/auth");
  return serverFn();
}

export async function unlockGate(args: {
  data: { password: string };
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (IS_STATIC) return { ok: true };
  const { unlockGate: serverFn } = await import("@/lib/server/auth");
  return serverFn(args);
}

export async function lockGate(): Promise<{ ok: true }> {
  if (IS_STATIC) return { ok: true };
  const { lockGate: serverFn } = await import("@/lib/server/auth");
  return serverFn();
}
