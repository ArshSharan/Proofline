import { describe, expect, it, beforeEach } from "vitest";
import { resetRaceState, COUPON_VALUE_CENTS } from "./runner.js";
import { redeemHardened } from "./hardened.js";
import { redeemVulnerable } from "./vulnerable.js";
import { getDb } from "../../db/index.js";

describe("Double redemption module", () => {
  let code: string;
  let user: string;

  beforeEach(() => {
    code = `TEST_COUPON_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    user = `TEST_USER_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    resetRaceState(code, user);
  });

  describe("hardened mode", () => {
    it("allows single-use coupon to be redeemed once sequentially", () => {
      const first = redeemHardened(code, user);
      expect(first.accepted).toBe(true);
      expect(first.status).toBe(200);

      const second = redeemHardened(code, user);
      expect(second.accepted).toBe(false);
      expect(second.status).toBe(409);
    });

    it("respects Idempotency-Key for safe retries without double-crediting", () => {
      const key = `key_${Date.now()}_${Math.random()}`;
      const first = redeemHardened(code, user, key);
      expect(first.accepted).toBe(true);

      const retry = redeemHardened(code, user, key);
      expect(retry.accepted).toBe(true);

      const db = getDb();
      const wallet = db
        .prepare("SELECT balance_cents FROM wallets WHERE user_id = ?")
        .get(user) as { balance_cents: number };

      expect(wallet.balance_cents).toBe(COUPON_VALUE_CENTS);
    });

    it("accepts exactly one redemption under 12 concurrent requests", async () => {
      const concurrency = 12;
      let releaseBarrier!: () => void;
      const barrier = new Promise<void>((r) => {
        releaseBarrier = r;
      });

      const promises = Array.from({ length: concurrency }, async () => {
        await barrier;
        return redeemHardened(code, user);
      });

      releaseBarrier();
      const results = await Promise.all(promises);

      const accepted = results.filter((r) => r.accepted);
      const rejected = results.filter((r) => !r.accepted);

      expect(accepted).toHaveLength(1);
      expect(rejected).toHaveLength(concurrency - 1);

      const db = getDb();
      const wallet = db
        .prepare("SELECT balance_cents FROM wallets WHERE user_id = ?")
        .get(user) as { balance_cents: number };

      expect(wallet.balance_cents).toBe(COUPON_VALUE_CENTS);
    });
  });

  describe("vulnerable mode", () => {
    it("accepts multiple redemptions under concurrent execution", async () => {
      const concurrency = 12;
      let releaseBarrier!: () => void;
      const barrier = new Promise<void>((r) => {
        releaseBarrier = r;
      });

      const promises = Array.from({ length: concurrency }, async () => {
        await barrier;
        return redeemVulnerable(code, user);
      });

      releaseBarrier();
      const results = await Promise.all(promises);

      const accepted = results.filter((r) => r.accepted);
      expect(accepted.length).toBeGreaterThan(1);

      const db = getDb();
      const wallet = db
        .prepare("SELECT balance_cents FROM wallets WHERE user_id = ?")
        .get(user) as { balance_cents: number };

      expect(wallet.balance_cents).toBeGreaterThan(COUPON_VALUE_CENTS);
    });
  });
});
