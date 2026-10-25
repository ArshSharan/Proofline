import { Router } from "express";
import { validateVulnerable } from "./vulnerable.js";
import { validateHardened } from "./hardened.js";
import { runRedosAttack } from "./runner.js";
import { REDOS_META } from "./meta.js";
import { createRun } from "../../services/runs.js";
import type { Mode } from "@proofline/core";

export const redosRouter = Router();

redosRouter.get("/meta", (_req, res) => {
  res.json(REDOS_META);
});

redosRouter.post("/validate", (req, res) => {
  const { text, mode = "vulnerable" } = req.body ?? {};

  if (typeof text !== "string") {
    res.status(400).json({
      error: { code: "INVALID_INPUT", message: "Field 'text' must be a string." },
    });
    return;
  }

  const result =
    mode === "hardened" ? validateHardened(text) : validateVulnerable(text);

  res.json({
    mode,
    ...result,
  });
});

redosRouter.post("/run", (req, res) => {
  const { mode = "vulnerable", ladder, maxLadder } = req.body ?? {};
  const validMode: Mode = mode === "hardened" ? "hardened" : "vulnerable";

  const run = createRun("redos", validMode, { ladder, maxLadder });

  // Launch runner in background
  runRedosAttack(run.id, validMode, { ladder, maxLadder });

  res.status(202).json({
    runId: run.id,
    module: run.module,
    mode: run.mode,
    status: run.status,
  });
});
