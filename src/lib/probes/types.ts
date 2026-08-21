export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type ProbePack =
  | "injection"
  | "jailbreak"
  | "exfil"
  | "agency"
  | "output"
  | "rag"
  | "misinfo"
  | "consumption";

export type Detector =
  | { kind: "leak"; tokens: string[] }
  | { kind: "keywords"; needles: string[]; requireNoRefusal?: boolean }
  | { kind: "regex"; pattern: string; flags?: string; requireNoRefusal?: boolean }
  | { kind: "compliance"; markers: string[] };

export type Probe = {
  id: string;
  name: string;
  pack: ProbePack;
  owasp: string;
  atlas: string;
  severity: Severity;
  quick?: boolean;
  description: string;
  payload: string;
  detector: Detector;
  sandbox: "hit" | "blocked" | "partial";
};

export type Verdict = "hit" | "blocked" | "partial" | "error" | "inconclusive";

export type ProbeResult = {
  probeId: string;
  verdict: Verdict;
  severity: Severity;
  response: string;
  evidence: string;
  latencyMs: number;
  model: string;
  error?: string;
};

export type TargetKind = "sandbox" | "xai" | "custom";

export type TargetConfig = {
  kind: TargetKind;
  label: string;
  model: string;
  baseUrl?: string;
};

export type AnalysisFinding = {
  probeId: string;
  whyItMatters: string;
  exploitability: string;
  remediation: string[];
};

export type ScanAnalysis = {
  executiveSummary: string;
  overallRisk: Severity;
  priorityOrder: string[];
  findings: AnalysisFinding[];
  systemPromptAdvice: string[];
  residualRisk: string;
};

export type ScanRecord = {
  id: string;
  createdAt: string;
  name: string;
  target: TargetConfig;
  systemPrompt: string;
  probeIds: string[];
  results: ProbeResult[];
  status: "running" | "complete" | "aborted";
  analysis?: ScanAnalysis;
  durationMs: number;
};

export const PACK_META: Record<
  ProbePack,
  { label: string; blurb: string; owasp: string }
> = {
  injection: {
    label: "Prompt injection",
    blurb: "Override, delimiter, and hierarchy attacks against the system prompt.",
    owasp: "LLM01",
  },
  jailbreak: {
    label: "Jailbreaks",
    blurb: "Roleplay, encoding, and hypothetical frames that strip safety policy.",
    owasp: "LLM01",
  },
  exfil: {
    label: "Data exfiltration",
    blurb: "System-prompt leakage, secret extraction, and encoding smuggling.",
    owasp: "LLM02 / LLM07",
  },
  agency: {
    label: "Excessive agency",
    blurb: "Unauthorized tool use, refunds, and destructive actions.",
    owasp: "LLM06",
  },
  output: {
    label: "Output handling",
    blurb: "XSS, markup, and code that a naive renderer would execute.",
    owasp: "LLM05",
  },
  rag: {
    label: "RAG / embeddings",
    blurb: "Poisoned retrieved context and citation manipulation.",
    owasp: "LLM08",
  },
  misinfo: {
    label: "Misinformation",
    blurb: "Confident fabrication and false-authority claims.",
    owasp: "LLM09",
  },
  consumption: {
    label: "Unbounded use",
    blurb: "Repeat-forever and token-amplification instructions.",
    owasp: "LLM10",
  },
};

export const OWASP_2025: { id: string; name: string }[] = [
  { id: "LLM01", name: "Prompt Injection" },
  { id: "LLM02", name: "Sensitive Information Disclosure" },
  { id: "LLM03", name: "Supply Chain" },
  { id: "LLM04", name: "Data & Model Poisoning" },
  { id: "LLM05", name: "Improper Output Handling" },
  { id: "LLM06", name: "Excessive Agency" },
  { id: "LLM07", name: "System Prompt Leakage" },
  { id: "LLM08", name: "Vector & Embedding Weaknesses" },
  { id: "LLM09", name: "Misinformation" },
  { id: "LLM10", name: "Unbounded Consumption" },
];
