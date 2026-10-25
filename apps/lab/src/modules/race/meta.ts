export const RACE_META = {
  id: "race",
  module: "race",
  title: "Double redemption",
  subtitle: "Parallel requests pass a non-atomic balance check before the write commits.",
  cwe: "CWE-362",
  cweTitle: "Concurrent Execution using Shared Resource with Improper Synchronization",
  owasp: "A04:2021",
  owaspTitle: "Insecure Design",
  vectorVulnerable: "AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:N",
  vectorHardened: "AV:N/AC:H/PR:H/UI:N/S:U/C:N/I:N/A:N",
  description:
    "A check-then-act flaw in coupon redemption permits concurrent HTTP requests to all pass validation before any row updates commit, resulting in multiple credits from a single-use coupon.",
  remediation:
    "Enforce atomic conditional database updates (UPDATE ... WHERE uses < max_uses), apply unique database constraints on (code, user_id), and require idempotency keys for distributed transactions.",
  codeVulnerable: `// Vulnerable: Check-then-act with asynchronous latency gap
const coupon = db.prepare("SELECT * FROM coupons WHERE code = ?").get(code);
if (coupon.uses < coupon.max_uses) {
  await simulateRemoteLedgerCall(15); // Network or microservice delay
  db.prepare("UPDATE coupons SET uses = uses + 1 WHERE code = ?").run(code);
  db.prepare("UPDATE wallets SET balance_cents = balance_cents + ? WHERE user_id = ?").run(coupon.value_cents, userId);
  return { status: 200, credited: true };
}`,
  codeHardened: `// Hardened: Atomic single-statement check and unique constraint
const tx = db.transaction(() => {
  const result = db.prepare(
    "UPDATE coupons SET uses = uses + 1 WHERE code = ? AND uses < max_uses"
  ).run(code);
  if (result.changes === 0) throw new Error("COUPON_ALREADY_USED");
  db.prepare("INSERT INTO redemptions (code, user_id, at) VALUES (?, ?, ?)").run(code, userId, Date.now());
  db.prepare("UPDATE wallets SET balance_cents = balance_cents + ? WHERE user_id = ?").run(couponValue, userId);
});`,
};
