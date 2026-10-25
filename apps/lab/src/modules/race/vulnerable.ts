import { getDb } from "../../db/index.js";

export const RACE_GAP_MS = Number.parseInt(
  process.env.RACE_GAP_MS ?? "15",
  10
);

export interface RedemptionResult {
  accepted: boolean;
  status: number;
  balanceCents?: number;
  error?: string;
}

export async function redeemVulnerable(
  code: string,
  userId: string,
  key?: string
): Promise<RedemptionResult> {
  const db = getDb();

  // 1. Check coupon status
  const coupon = db
    .prepare("SELECT code, max_uses, uses, value_cents FROM coupons WHERE code = ?")
    .get(code) as
    | { code: string; max_uses: number; uses: number; value_cents: number }
    | undefined;

  if (!coupon) {
    return { accepted: false, status: 404, error: "COUPON_NOT_FOUND" };
  }

  if (coupon.uses >= coupon.max_uses) {
    return { accepted: false, status: 409, error: "COUPON_EXHAUSTED" };
  }

  // 2. Artificial latency gap simulating distributed database or remote payment call
  await new Promise((resolve) => setTimeout(resolve, RACE_GAP_MS));

  // 3. Act: non-atomic state updates committed after the delay
  db.prepare("UPDATE coupons SET uses = uses + 1 WHERE code = ?").run(code);

  db.prepare(
    "INSERT INTO wallets (user_id, balance_cents) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET balance_cents = balance_cents + ?"
  ).run(userId, coupon.value_cents, coupon.value_cents);

  db.prepare(
    "INSERT INTO redemptions_naive (code, user_id, key, at) VALUES (?, ?, ?, ?)"
  ).run(code, userId, key ?? null, Date.now());

  const wallet = db
    .prepare("SELECT balance_cents FROM wallets WHERE user_id = ?")
    .get(userId) as { balance_cents: number } | undefined;

  return {
    accepted: true,
    status: 200,
    balanceCents: wallet?.balance_cents ?? coupon.value_cents,
  };
}
