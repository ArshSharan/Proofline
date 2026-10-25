import { Router } from "express";
import { vulnerableDeepMerge, checkUserProfile } from "./vulnerable.js";
import { hardenedDeepMerge } from "./hardened.js";
import { runDepAttack } from "./runner.js";
import { DEP_META } from "./meta.js";
import { getAuditSummary } from "./audit.js";
import { createRun } from "../../services/runs.js";
import type { Mode } from "@proofline/core";

export const depRouter = Router();

depRouter.get("/meta", (_req, res) => {
  res.json(DEP_META);
});

depRouter.get("/audit", (_req, res) => {
  const summary = getAuditSummary();
  res.json(summary);
});

depRouter.get("/profile", (_req, res) => {
  const profile = checkUserProfile("guest");
  res.json(profile);
});

depRouter.post("/settings", (req, res) => {
  const { mode = "vulnerable", settings = {} } = req.body ?? {};

  if (mode === "hardened") {
    const target = { theme: "light", language: "en" };
    const result = hardenedDeepMerge(target, settings);
    if (!result.success) {
      res.status(400).json({
        error: { code: "FORBIDDEN_KEY", message: result.error },
      });
      return;
    }
    res.json({ mode, settings: result.settings });
  } else {
    const target: Record<string, unknown> = { theme: "light", language: "en" };
    vulnerableDeepMerge(target, settings);
    res.json({ mode, settings: target });
  }
});

depRouter.post("/run", (req, res) => {
  const { mode = "vulnerable", payload } = req.body ?? {};
  const validMode: Mode = mode === "hardened" ? "hardened" : "vulnerable";

  const run = createRun("dep", validMode, { payload });

  // Spawn isolated child process runner
  runDepAttack(run.id, validMode, { payload });

  res.status(202).json({
    runId: run.id,
    module: run.module,
    mode: run.mode,
    status: run.status,
  });
});
