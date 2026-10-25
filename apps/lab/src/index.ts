import express from "express";
import { loopbackGuard } from "./middleware/loopback.js";
import { startEventLoopMonitor, getEventLoopLag } from "./services/monitor.js";
import {
  createRun,
  getRun,
  listRuns,
  getOrCreateRunEmitter,
} from "./services/runs.js";
import { redosRouter } from "./modules/redos/routes.js";
import { runRedosAttack } from "./modules/redos/runner.js";
import { FINDINGS } from "@proofline/core";
import type { Module, Mode, SseEvent } from "@proofline/core";

const app = express();
const port = Number.parseInt(process.env.LAB_PORT ?? "4000", 10);
const startTime = Date.now();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

// CORS header configuration for dashboard access
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Idempotency-Key"
  );
  if (_req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(loopbackGuard);
app.use(express.json());

// Start event loop monitoring
startEventLoopMonitor();

// ---------------------------------------------------------------------------
// Health and Metadata Routes
// ---------------------------------------------------------------------------

app.get("/", (_req, res) => {
  res.json({
    service: "Proofline Lab Server",
    status: "online",
    dashboard: "http://localhost:3000",
    health: "/api/health",
    findings: "/api/findings",
  });
});

app.get("/api/health", (_req, res) => {
  const eventLoopDelayMs = getEventLoopLag();
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  res.json({
    status: "ok",
    eventLoopDelayMs,
    uptimeSeconds,
  });
});

app.get("/api/findings", (_req, res) => {
  res.json(FINDINGS);
});

// ---------------------------------------------------------------------------
// Run Management Routes
// ---------------------------------------------------------------------------

app.get("/api/runs", (_req, res) => {
  const runs = listRuns();
  res.json(runs);
});

app.get("/api/runs/:id", (req, res) => {
  const run = getRun(req.params.id);
  if (!run) {
    res.status(404).json({
      error: { code: "RUN_NOT_FOUND", message: `No run with id ${req.params.id}` },
    });
    return;
  }
  res.json(run);
});

app.get("/api/runs/:id/stream", (req, res) => {
  const runId = req.params.id;
  const run = getRun(runId);

  if (!run) {
    res.status(404).json({
      error: { code: "RUN_NOT_FOUND", message: `No run with id ${runId}` },
    });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const emitter = getOrCreateRunEmitter(runId);

  const listener = (event: SseEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  emitter.on("sse", listener);

  // Send initial connected event
  res.write(
    `data: ${JSON.stringify({ type: "connected", runId, status: run.status })}\n\n`
  );

  req.on("close", () => {
    emitter.off("sse", listener);
  });
});

app.post("/api/runs", (req, res) => {
  const { module, mode, params = {} } = req.body ?? {};

  if (!module || !mode) {
    res.status(400).json({
      error: {
        code: "INVALID_ARGUMENTS",
        message: "Fields 'module' and 'mode' are required.",
      },
    });
    return;
  }

  const validModule = module as Module;
  const validMode = mode as Mode;
  const run = createRun(validModule, validMode, params);

  if (validModule === "redos") {
    runRedosAttack(run.id, validMode, params);
  }

  res.status(202).json({
    runId: run.id,
    module: run.module,
    mode: run.mode,
    status: run.status,
  });
});

// ---------------------------------------------------------------------------
// Module Routes
// ---------------------------------------------------------------------------

app.use("/api/redos", redosRouter);

// ---------------------------------------------------------------------------
// Server Listen
// ---------------------------------------------------------------------------

if (process.env.NODE_ENV !== "test") {
  app.listen(port, "127.0.0.1", () => {
    console.log(`Proofline lab server listening on http://127.0.0.1:${port}`);
  });
}

export default app;
