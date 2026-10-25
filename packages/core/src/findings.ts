/**
 * Findings catalogue.
 *
 * Each finding records its module, weakness, OWASP category, and the CVSS
 * vectors before and after the fix. Scores are computed by the calculator so
 * they stay in sync if a vector is revised.
 */

import { parseCvssVector } from "./cvss.js";
import type { Finding } from "./types/index.js";

const RAW_FINDINGS: Omit<Finding, "scoreVulnerable" | "scoreHardened">[] = [
  {
    id: "redos",
    module: "redos",
    title: "Regular expression denial of service",
    cwe: "CWE-1333",
    owasp: "A05:2021",
    description:
      "A pattern with nested quantifiers processes a crafted input in " +
      "exponential time on the main thread, blocking the event loop and " +
      "making the server unresponsive to all other requests.",
    vectorVulnerable: "AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H",
    vectorHardened: "AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:L",
  },
  {
    id: "race",
    module: "race",
    title: "Race condition on coupon redemption",
    cwe: "CWE-362",
    owasp: "A04:2021",
    description:
      "Concurrent requests all pass a check-then-act sequence before the " +
      "database is updated, allowing a single-use coupon to be redeemed " +
      "more than once and crediting a wallet multiple times.",
    vectorVulnerable: "AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:N",
    // Residual risk after the atomic update fix: integrity impact drops to Low
    // because a retry with a duplicate idempotency key could still be observed.
    vectorHardened: "AV:N/AC:H/PR:L/UI:N/S:U/C:N/I:L/A:N",
  },
  {
    id: "dep",
    module: "dep",
    title: "Prototype pollution via vulnerable dependency",
    cwe: "CWE-1321",
    owasp: "A06:2021",
    description:
      "A deep-merge function in an outdated library allows a crafted " +
      "JSON body to set properties on Object.prototype, causing an " +
      "isAdmin check on a plain object to evaluate as true for any user.",
    // Network-accessible, no auth required, payload bypasses an access check.
    vectorVulnerable: "AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:H/A:N",
    // Patched library + key blocklist + schema validation. Attack complexity
    // rises because all three controls must be bypassed simultaneously.
    vectorHardened: "AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:L/A:N",
  },
];

export const FINDINGS: Finding[] = RAW_FINDINGS.map((f) => ({
  ...f,
  scoreVulnerable: parseCvssVector(f.vectorVulnerable),
  scoreHardened: parseCvssVector(f.vectorHardened),
}));

/**
 * Look up a finding by its id.
 * Throws if the id is not in the catalogue, so callers never receive undefined.
 */
export function getFinding(id: string): Finding {
  const found = FINDINGS.find((f) => f.id === id);
  if (!found) {
    throw new Error(`No finding with id "${id}" in the catalogue.`);
  }
  return found;
}
