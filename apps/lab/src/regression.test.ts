import { test, expect } from "vitest";
import { validateVulnerable, makeReDoSInput } from "./modules/redos/vulnerable.js";
import { validateHardened } from "./modules/redos/hardened.js";
import { redeemVulnerable } from "./modules/race/vulnerable.js";
import { redeemHardened } from "./modules/race/hardened.js";
import { resetRaceState, DEFAULT_COUPON_CODE, DEFAULT_USER_ID } from "./modules/race/runner.js";
import { runIsolatedAttack, DEFAULT_ATTACK_PAYLOAD } from "./modules/dep/runner.js";

const mode = process.env.LAB_MODE ?? "hardened";

test("redos: a crafted input takes less than 50 ms", () => {
  const input = makeReDoSInput(22);
  const result =
    mode === "vulnerable" ? validateVulnerable(input) : validateHardened(input);

  expect(result.durationMs).toBeLessThan(50);
});

test("race: a single-use coupon is redeemed exactly once", async () => {
  const code = `REG_COUPON_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const user = `REG_USER_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  resetRaceState(code, user);
  const concurrency = 12;

  let releaseBarrier!: () => void;
  const barrier = new Promise<void>((r) => {
    releaseBarrier = r;
  });

  const promises = Array.from({ length: concurrency }, async () => {
    await barrier;
    return mode === "vulnerable"
      ? redeemVulnerable(code, user)
      : redeemHardened(code, user);
  });

  releaseBarrier();
  const results = await Promise.all(promises);
  const accepted = results.filter((r) => r.accepted);

  expect(accepted).toHaveLength(1);
});

test("dep: the isAdmin flag is not elevated by a crafted payload", async () => {
  const result = await runIsolatedAttack(
    mode === "vulnerable" ? "vulnerable" : "hardened",
    DEFAULT_ATTACK_PAYLOAD
  );

  expect(result.isAdminFlipped).toBe(false);
});
