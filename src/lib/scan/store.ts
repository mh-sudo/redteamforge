import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";
import type { ScanAnalysis, ScanRecord } from "@/lib/probes/types";
import { SAMPLE_SCAN } from "./sample";

type ScanState = {
  scans: ScanRecord[];
  upsertScan: (scan: ScanRecord) => void;
  patchScan: (id: string, patch: Partial<ScanRecord>) => void;
  setAnalysis: (id: string, analysis: ScanAnalysis) => void;
  deleteScan: (id: string) => void;
  getScan: (id: string) => ScanRecord | undefined;
};

/** History is localStorage-backed; past this many records we drop the oldest. */
const MAX_SCANS = 50;

/**
 * localStorage can throw (quota exceeded, disabled storage) — a failed
 * persist must never break the scan loop, so every access is guarded and
 * quota failures degrade to a console warning instead of an exception.
 */
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
      console.warn(
        "[scan store] could not persist scans (storage full?)",
        err,
      );
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

export const useScanStore = create<ScanState>()(
  persist(
    (set, get) => ({
      scans: [SAMPLE_SCAN],
      upsertScan: (scan) =>
        set((s) => ({
          scans: [scan, ...s.scans.filter((x) => x.id !== scan.id)].slice(
            0,
            MAX_SCANS,
          ),
        })),
      patchScan: (id, patch) =>
        set((s) => ({
          scans: s.scans.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      setAnalysis: (id, analysis) =>
        set((s) => ({
          scans: s.scans.map((x) => (x.id === id ? { ...x, analysis } : x)),
        })),
      deleteScan: (id) =>
        set((s) => ({ scans: s.scans.filter((x) => x.id !== id) })),
      getScan: (id) => get().scans.find((x) => x.id === id),
    }),
    { name: "redteamforge-scans", version: 1, storage: createJSONStorage(() => safeStorage) },
  ),
);
