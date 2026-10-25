import { getDb } from "../../db/index.js";
import type { RedemptionResult } from "./vulnerable.js";

export function redeemHardened(
  code: string,
  userId: string,
  key?: string
): RedemptionResult {
  const db = getDb();

  // 1. Idempotency guard: if key has already been processed, return cached success
  if (key) {
    const existing = db
      .prepare("SELECT id FROM redemptions WHERE key = ?")
      .get(key) as { id: number } | undefined;

    if (existing) {
      const wallet = db
        .prepare("SELECT balance_cents FROM wallets WHERE user_id = ?")
        .get(userId) as { balance_cents: number } | undefined;

      return {
        accepted: true,
        status: 200,
        balanceCents: wallet?.balance_cents ?? 0,
      };
    }
  }

  // 2. Fetch coupon value
  const coupon = db
    .prepare("SELECT value_cents, max_uses, uses FROM coupons WHERE code = ?")
    .get(code) as { value_cents: number; max_uses: number; uses: number } | undefined;

  if (!coupon) {
    return { accepted: false, status: 404, error: "COUPON_NOT_FOUND" };
  }

  // 3. Atomic execution inside a database transaction
  const executeAtomicRedemption = db.transaction(() => {
    // Atomic update conditioned on current uses being strictly below max_uses
    const result = db
      .prepare(
        "UPDATE coupons SET uses = uses + 1 WHERE code = ? AND uses < max_uses"
      )
      .run(code);

    if (result.changes === 0) {
      return { accepted: false, status: 409, error: "COUPON_EXHAUSTED" };
    }

    // Write redemption with unique constraint on (code, user_id)
    db.prepare(
      "INSERT INTO redemptions (code, user_id, key, at) VALUES (?, ?, ?, ?)"
    ).run(code, userId, key ?? null, Date.now());

    // Credit wallet balance
    db.prepare(
      "INSERT INTO wallets (user_id, balance_cents) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET balance_cents = balance_cents + ?"
    ).run(userId, coupon.value_cents, coupon.value_cents);

    const wallet = db
      .prepare("SELECT balance_cents FROM wallets WHERE user_id = ?")
      .get(userId) as { balance_cents: number } | undefined;

    return {
      accepted: true,
      status: 200,
      balanceCents: wallet?.balance_cents ?? coupon.value_cents,
    };
  });

  try {
    return executeAtomicRedemption();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("UNIQUE constraint failed")) {
      return { accepted: false, status: 409, error: "COUPON_ALREADY_REDEEMED" };
    }
    return { accepted: false, status: 500, error: message };
  }
}
