import { Router } from "express";
import { redeemVulnerable } from "./vulnerable.js";
import { redeemHardened } from "./hardened.js";
import {
  runRaceAttack,
  resetRaceState,
  DEFAULT_COUPON_CODE,
  DEFAULT_USER_ID,
} from "./runner.js";
import { RACE_META } from "./meta.js";
import { createRun } from "../../services/runs.js";
import { getDb } from "../../db/index.js";
import type { Mode } from "@proofline/core";

export const raceRouter = Router();

raceRouter.get("/meta", (_req, res) => {
  res.json(RACE_META);
});

raceRouter.get("/state", (_req, res) => {
  const db = getDb();
  const coupon = db
    .prepare("SELECT * FROM coupons WHERE code = ?")
    .get(DEFAULT_COUPON_CODE);
  const wallet = db
    .prepare("SELECT * FROM wallets WHERE user_id = ?")
    .get(DEFAULT_USER_ID);

  res.json({
    coupon: coupon ?? null,
    wallet: wallet ?? null,
  });
});

raceRouter.post("/reset", (_req, res) => {
  resetRaceState();
  res.json({ status: "ok", message: "Coupon and wallet reset to initial state." });
});

raceRouter.post("/redeem", async (req, res) => {
  const {
    code = DEFAULT_COUPON_CODE,
    userId = DEFAULT_USER_ID,
    mode = "vulnerable",
  } = req.body ?? {};

  const idempotencyKey = req.header("Idempotency-Key") ?? undefined;

  const result =
    mode === "hardened"
      ? redeemHardened(code, userId, idempotencyKey)
      : await redeemVulnerable(code, userId, idempotencyKey);

  res.status(result.status).json(result);
});

raceRouter.post("/run", (req, res) => {
  const { mode = "vulnerable", concurrency = 12 } = req.body ?? {};
  const validMode: Mode = mode === "hardened" ? "hardened" : "vulnerable";

  const run = createRun("race", validMode, { concurrency });

  // Spawn runner in background
  runRaceAttack(run.id, validMode, { concurrency });

  res.status(202).json({
    runId: run.id,
    module: run.module,
    mode: run.mode,
    status: run.status,
  });
});
