/**
 * proof.mjs
 *
 * Runs the lab test suite in vulnerable mode and succeeds only when
 * exactly the expected tests fail. Any unexpected pass or unexpected
 * failure is a problem, so exit code 1 is returned.
 *
 * Usage: node scripts/proof.mjs
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const EXPECTED_FAILURES = [
  "redos: a crafted input takes less than 50 ms",
  "race: a single-use coupon is redeemed exactly once",
  "dep: the isAdmin flag is not elevated by a crafted payload",
];

console.log("Running proof matrix in vulnerable mode...");

let output = "";

try {
  output = execSync(
    "npm run test --workspace=apps/lab -- --reporter=json",
    {
      encoding: "utf8",
      env: { ...process.env, LAB_MODE: "vulnerable" },
      stdio: ["pipe", "pipe", "pipe"],
    }
  );
  // If the suite passes in vulnerable mode, the proof fails.
  console.error(
    "ERROR: Test suite passed in vulnerable mode. Expected failures were not observed."
  );
  process.exit(1);
} catch (err) {
  // Non-zero exit is expected. Inspect which tests failed.
  output = err.stdout ? err.stdout.toString() : "";
}

let results;
const reportPath = path.resolve("apps/lab/.vitest/json/output.json");

try {
  if (fs.existsSync(reportPath)) {
    results = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  } else {
    const jsonStart = output.indexOf("{");
    if (jsonStart !== -1) {
      results = JSON.parse(output.slice(jsonStart));
    } else {
      throw new Error("No JSON found in output or report file.");
    }
  }
} catch {
  console.error(
    "ERROR: Could not parse test output as JSON. Run `npm run test --workspace=apps/lab` directly to inspect."
  );
  process.exit(1);
}

const failed =
  results.testResults
    ?.flatMap((f) => f.assertionResults ?? [])
    .filter((r) => r.status === "failed")
    .map((r) => r.fullName) ?? [];

const unexpected = failed.filter((name) => !EXPECTED_FAILURES.includes(name));
const missing = EXPECTED_FAILURES.filter((name) => !failed.includes(name));

if (unexpected.length > 0) {
  console.error("ERROR: Unexpected test failures:");
  unexpected.forEach((name) => console.error("  -", name));
}

if (missing.length > 0) {
  console.error("ERROR: Expected failures did not fail:");
  missing.forEach((name) => console.error("  -", name));
}

if (unexpected.length === 0 && missing.length === 0) {
  console.log("Proof matrix passed: all expected tests failed in vulnerable mode.");
  process.exit(0);
} else {
  process.exit(1);
}
