import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";
import type { ProviderId } from "./catalog";
import { PROVIDERS } from "./catalog";

export type Connection = {
  apiKey: string;
  model: string;
  baseUrl?: string;
  /** UI-only name, used to tell custom endpoints apart. */
  label?: string;
};

type VaultState = {
  connections: Partial<Record<ProviderId, Connection>>;
  upsert: (id: ProviderId, conn: Connection) => void;
  disconnect: (id: ProviderId) => void;
};

/** Guarded localStorage so a full/blocked store never breaks the UI. */
const safeStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(name, value);
    } catch (err) {
      console.warn("[vault] could not persist connections", err);
    }
  },
  removeItem: (name) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(name);
    } catch {
      /* nothing to clean up */
    }
  },
};

export const useVault = create<VaultState>()(
  persist(
    (set) => ({
      connections: {},
      upsert: (id, conn) =>
        set((s) => ({
          connections: { ...s.connections, [id]: conn },
        })),
      disconnect: (id) =>
        set((s) => {
          const next = { ...s.connections };
          delete next[id];
          return { connections: next };
        }),
    }),
    {
      name: "redteamforge-keys",
      version: 2,
      storage: createJSONStorage(() => safeStorage),
      migrate: (state) => state as VaultState,
    },
  ),
);

export function connectedIds(
  connections: Partial<Record<ProviderId, Connection>>,
): ProviderId[] {
  return (Object.keys(connections) as ProviderId[]).filter((id) => {
    const c = connections[id];
    if (!c?.apiKey.trim()) return false;
    if (id === "custom" && !c.baseUrl?.trim()) return false;
    return true;
  });
}

export function connectionReady(
  connections: Partial<Record<ProviderId, Connection>>,
  id: ProviderId,
) {
  return connectedIds(connections).includes(id);
}

export function defaultConnection(id: ProviderId): Connection {
  const p = PROVIDERS[id];
  return {
    apiKey: id === "ollama" ? "ollama" : "",
    model: p.defaultModel,
    baseUrl: id === "ollama" || id === "custom" ? p.defaultBaseUrl : undefined,
  };
}
