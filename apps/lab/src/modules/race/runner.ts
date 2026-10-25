import { performance } from "node:perf_hooks";
import { getDb } from "../../db/index.js";
import { redeemVulnerable } from "./vulnerable.js";
import { redeemHardened } from "./hardened.js";
import { dispatchSse, completeRun, failRun } from "../../services/runs.js";
import type { Mode, RaceMetrics, RaceOutcome } from "@proofline/core";

export const RACE_MAX_CONCURRENCY = Number.parseInt(
  process.env.RACE_MAX_CONCURRENCY ?? "50",
  10
);

export const DEFAULT_COUPON_CODE = "WELCOME10";
export const DEFAULT_USER_ID = "user_demo";
export const COUPON_VALUE_CENTS = 1000; // $10.00

export function resetRaceState(
  code = DEFAULT_COUPON_CODE,
  userId = DEFAULT_USER_ID,
  valueCents = COUPON_VALUE_CENTS
): void {
  const db = getDb();
  db.prepare("DELETE FROM redemptions WHERE code = ?").run(code);
  db.prepare("DELETE FROM redemptions_naive WHERE code = ?").run(code);
  db.prepare(
    "INSERT INTO coupons (code, max_uses, uses, value_cents) VALUES (?, 1, 0, ?) ON CONFLICT(code) DO UPDATE SET max_uses = 1, uses = 0, value_cents = ?"
  ).run(code, valueCents, valueCents);
  db.prepare(
    "INSERT INTO wallets (user_id, balance_cents) VALUES (?, 0) ON CONFLICT(user_id) DO UPDATE SET balance_cents = 0"
  ).run(userId);
}

export interface RaceRunnerOptions {
  concurrency?: number;
  code?: string;
  userId?: string;
}

export async function runRaceAttack(
  runId: string,
  mode: Mode,
  options: RaceRunnerOptions = {}
): Promise<void> {
  try {
    const rawConcurrency = options.concurrency ?? 12;
    const concurrency = Math.min(
      Math.max(2, rawConcurrency),
      RACE_MAX_CONCURRENCY
    );
    const code = options.code ?? DEFAULT_COUPON_CODE;
    const userId = options.userId ?? DEFAULT_USER_ID;

    // Reset state before running attack
    resetRaceState(code, userId);

    const startTime = performance.now();
    const outcomes: RaceOutcome[] = [];

    // Barrier synchronization: holds all tasks until every worker is ready to fire
    let releaseBarrier!: () => void;
    const barrier = new Promise<void>((resolve) => {
      releaseBarrier = resolve;
    });

    const tasks = Array.from({ length: concurrency }, async (_, idx) => {
      const requestIndex = idx + 1;
      await barrier; // Synchronize departure

      const result =
        mode === "vulnerable"
          ? await redeemVulnerable(code, userId)
          : redeemHardened(code, userId);

      const outcome: RaceOutcome = {
        requestIndex,
        status: result.status,
        accepted: result.accepted,
      };

      outcomes.push(outcome);

      dispatchSse(runId, "run:sample", {
        runId,
        mode,
        outcome,
        totalCompleted: outcomes.length,
      });

      return outcome;
    });

    // Release all concurrent requests simultaneously
    releaseBarrier();
    await Promise.all(tasks);

    const durationMs = Math.round(performance.now() - startTime);

    const db = getDb();
    const wallet = db
      .prepare("SELECT balance_cents FROM wallets WHERE user_id = ?")
      .get(userId) as { balance_cents: number } | undefined;

    const acceptedCount = outcomes.filter((o) => o.accepted).length;
    const rejectedCount = outcomes.filter((o) => !o.accepted).length;

    const metrics: RaceMetrics = {
      concurrency,
      outcomes: outcomes.sort((a, b) => a.requestIndex - b.requestIndex),
      acceptedCount,
      rejectedCount,
      expectedCount: 1,
      finalWalletBalanceCents: wallet?.balance_cents ?? 0,
      expectedBalanceCents: COUPON_VALUE_CENTS,
      durationMs,
    };

    completeRun(runId, metrics, "done");
  } catch (err) {
    failRun(runId, err instanceof Error ? err.message : String(err));
  }
}
