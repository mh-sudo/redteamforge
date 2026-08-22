import { createServerFn } from "@tanstack/react-start";
import {
  clearGate,
  gateStatus,
  tryUnlock,
  type GateStatus,
} from "@/lib/server/auth.server";

export type { GateStatus };

export const getGateStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<GateStatus> => gateStatus(),
);

export const unlockGate = createServerFn({ method: "POST" })
  .validator((input: { password: string }) => input)
  .handler(
    async ({ data }): Promise<{ ok: true } | { ok: false; error: string }> =>
      tryUnlock(data.password),
  );

export const lockGate = createServerFn({ method: "POST" }).handler(async () => {
  clearGate();
  return { ok: true as const };
});
