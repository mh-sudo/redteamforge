import { create } from "zustand";
import { persist } from "zustand/middleware";
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

export const useScanStore = create<ScanState>()(
  persist(
    (set, get) => ({
      scans: [SAMPLE_SCAN],
      upsertScan: (scan) =>
        set((s) => ({
          scans: [scan, ...s.scans.filter((x) => x.id !== scan.id)],
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
    { name: "redteamforge-scans", version: 1 },
  ),
);
