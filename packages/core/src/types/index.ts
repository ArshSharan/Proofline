// Shared types for Proofline. Imported by both apps/lab and apps/web.

// ---------------------------------------------------------------------------
// Modules and modes
// ---------------------------------------------------------------------------

export type Module = "redos" | "race" | "dep";
export type Mode = "vulnerable" | "hardened";

// ---------------------------------------------------------------------------
// Run lifecycle
// ---------------------------------------------------------------------------

export type RunStatus = "running" | "done" | "failed" | "capped";

export interface Run {
  id: string;
  module: Module;
  mode: Mode;
  params: Record<string, unknown>;
  metrics: RedosMetrics | RaceMetrics | DepMetrics | null;
  status: RunStatus;
  startedAt: number;
  finishedAt: number | null;
}

// ---------------------------------------------------------------------------
// Module A: ReDoS metrics
// ---------------------------------------------------------------------------

export interface RedosSample {
  n: number;         // repeat count used in the ladder step
  input: string;     // the crafted input sent to the endpoint
  responseMs: number; // round-trip time in milliseconds
}

export interface RedosMetrics {
  samples: RedosSample[];
  eventLoopDelayP50Ms: number;
  eventLoopDelayP99Ms: number;
  eventLoopDelayMaxMs: number;
  probeLatenciesMs: number[];
  timedOutProbes: number;
}

// ---------------------------------------------------------------------------
// Module B: Race condition metrics
// ---------------------------------------------------------------------------

export interface RaceOutcome {
  requestIndex: number;
  status: number;    // HTTP status returned
  accepted: boolean;
}

export interface RaceMetrics {
  concurrency: number;
  outcomes: RaceOutcome[];
  acceptedCount: number;
  rejectedCount: number;
  expectedCount: number;       // always 1
  finalWalletBalanceCents: number;
  expectedBalanceCents: number;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Module C: Dependency / prototype pollution metrics
// ---------------------------------------------------------------------------

export interface AuditAdvisory {
  package: string;
  installedVersion: string;
  advisoryId: string;
  severity: "info" | "low" | "moderate" | "high" | "critical";
  fixedVersion: string | null;
}

export interface DepMetrics {
  payload: Record<string, unknown>;
  protoModified: boolean;
  isAdminFlipped: boolean;
  auditFindings: AuditAdvisory[];
  source: "live" | "fixture"; // whether audit came from a real npm audit or the stored fixture
}

// ---------------------------------------------------------------------------
// CVSS v3.1
// ---------------------------------------------------------------------------

export type CvssRating = "None" | "Low" | "Medium" | "High" | "Critical";

export interface CvssVector {
  AV: "N" | "A" | "L" | "P";   // Attack Vector
  AC: "L" | "H";               // Attack Complexity
  PR: "N" | "L" | "H";        // Privileges Required
  UI: "N" | "R";               // User Interaction
  S: "U" | "C";                // Scope
  C: "N" | "L" | "H";         // Confidentiality Impact
  I: "N" | "L" | "H";         // Integrity Impact
  A: "N" | "L" | "H";         // Availability Impact
}

export interface CvssResult {
  score: number;
  rating: CvssRating;
  vector: string; // e.g. CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H
}

// ---------------------------------------------------------------------------
// Findings catalogue
// ---------------------------------------------------------------------------

export interface Finding {
  id: string;
  module: Module;
  title: string;
  cwe: string;           // e.g. "CWE-1333"
  owasp: string;         // e.g. "A05:2021"
  description: string;
  vectorVulnerable: string;  // CVSS vector string
  vectorHardened: string;
  scoreVulnerable: CvssResult;
  scoreHardened: CvssResult;
}

// ---------------------------------------------------------------------------
// SSE events streamed from lab to dashboard
// ---------------------------------------------------------------------------

export type SseEventType =
  | "run:start"
  | "run:sample"
  | "run:complete"
  | "run:error";

export interface SseEvent<T = unknown> {
  type: SseEventType;
  runId: string;
  payload: T;
}

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export interface HealthResponse {
  status: "ok";
  eventLoopDelayMs: number;
  uptimeSeconds: number;
}
