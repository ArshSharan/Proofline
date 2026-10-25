import { EventEmitter } from "node:events";
import { getDb } from "../db/index.js";
import type {
  Module,
  Mode,
  Run,
  RunStatus,
  RedosMetrics,
  RaceMetrics,
  DepMetrics,
  SseEvent,
  SseEventType,
} from "@proofline/core";

type RunMetrics = RedosMetrics | RaceMetrics | DepMetrics;

interface RunEmitter extends EventEmitter {
  emit(event: "sse", data: SseEvent): boolean;
  on(event: "sse", listener: (data: SseEvent) => void): this;
}

const activeEmitters = new Map<string, RunEmitter>();

export function getOrCreateRunEmitter(runId: string): RunEmitter {
  let emitter = activeEmitters.get(runId);
  if (!emitter) {
    emitter = new EventEmitter() as RunEmitter;
    activeEmitters.set(runId, emitter);
  }
  return emitter;
}

export function cleanupRunEmitter(runId: string): void {
  activeEmitters.delete(runId);
}

export function createRun(
  module: Module,
  mode: Mode,
  params: Record<string, unknown>
): Run {
  const db = getDb();
  const id = `run_${module}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const startedAt = Date.now();
  const status: RunStatus = "running";

  const stmt = db.prepare(`
    INSERT INTO runs (id, module, mode, params, metrics, status, started_at, finished_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, module, mode, JSON.stringify(params), null, status, startedAt, null);

  const run: Run = {
    id,
    module,
    mode,
    params,
    metrics: null,
    status,
    startedAt,
    finishedAt: null,
  };

  dispatchSse(id, "run:start", { run });
  return run;
}

export function dispatchSse(
  runId: string,
  type: SseEventType,
  payload: unknown
): void {
  const emitter = activeEmitters.get(runId);
  if (emitter) {
    emitter.emit("sse", { type, runId, payload });
  }
}

export function completeRun(
  runId: string,
  metrics: RunMetrics,
  status: RunStatus = "done"
): void {
  const db = getDb();
  const finishedAt = Date.now();

  const stmt = db.prepare(`
    UPDATE runs
    SET metrics = ?, status = ?, finished_at = ?
    WHERE id = ?
  `);

  stmt.run(JSON.stringify(metrics), status, finishedAt, runId);
  dispatchSse(runId, "run:complete", { runId, status, metrics, finishedAt });

  setTimeout(() => {
    cleanupRunEmitter(runId);
  }, 10000);
}

export function failRun(runId: string, error: string): void {
  const db = getDb();
  const finishedAt = Date.now();

  const stmt = db.prepare(`
    UPDATE runs
    SET status = 'failed', finished_at = ?
    WHERE id = ?
  `);

  stmt.run(finishedAt, runId);
  dispatchSse(runId, "run:error", { runId, error });

  setTimeout(() => {
    cleanupRunEmitter(runId);
  }, 10000);
}

export function getRun(runId: string): Run | null {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT id, module, mode, params, metrics, status, started_at, finished_at
    FROM runs
    WHERE id = ?
  `);

  const row = stmt.get(runId) as {
    id: string;
    module: Module;
    mode: Mode;
    params: string;
    metrics: string | null;
    status: RunStatus;
    started_at: number;
    finished_at: number | null;
  } | undefined;

  if (!row) return null;

  return {
    id: row.id,
    module: row.module,
    mode: row.mode,
    params: JSON.parse(row.params),
    metrics: row.metrics ? JSON.parse(row.metrics) : null,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}

export function listRuns(limit = 50): Run[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT id, module, mode, params, metrics, status, started_at, finished_at
    FROM runs
    ORDER BY started_at DESC
    LIMIT ?
  `);

  const rows = stmt.all(limit) as Array<{
    id: string;
    module: Module;
    mode: Mode;
    params: string;
    metrics: string | null;
    status: RunStatus;
    started_at: number;
    finished_at: number | null;
  }>;

  return rows.map((row) => ({
    id: row.id,
    module: row.module,
    mode: row.mode,
    params: JSON.parse(row.params),
    metrics: row.metrics ? JSON.parse(row.metrics) : null,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  }));
}
