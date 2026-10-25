/**
 * CVSS v3.1 base score calculator.
 *
 * Implements the formula from the FIRST CVSS v3.1 specification:
 * https://www.first.org/cvss/v3.1/specification-document
 *
 * Only the base score is computed. Temporal and environmental scores
 * are out of scope for this project.
 */

import type { CvssRating, CvssResult, CvssVector } from "./types/index.js";

// ---------------------------------------------------------------------------
// Metric numeric weights from the specification (Table 14)
// ---------------------------------------------------------------------------

const AV_WEIGHTS = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 } as const;
const AC_WEIGHTS = { L: 0.77, H: 0.44 } as const;
const PR_WEIGHTS_UNCHANGED = { N: 0.85, L: 0.62, H: 0.27 } as const;
const PR_WEIGHTS_CHANGED = { N: 0.85, L: 0.68, H: 0.5 } as const;
const UI_WEIGHTS = { N: 0.85, R: 0.62 } as const;
const CIA_WEIGHTS = { N: 0.0, L: 0.22, H: 0.56 } as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compute the CVSS v3.1 base score and severity rating from a parsed vector.
 */
export function computeCvssScore(v: CvssVector): CvssResult {
  const scopeChanged = v.S === "C";
  const ISCBase =
    1 -
    (1 - CIA_WEIGHTS[v.C]) *
      (1 - CIA_WEIGHTS[v.I]) *
      (1 - CIA_WEIGHTS[v.A]);

  const ISC = scopeChanged
    ? 7.52 * (ISCBase - 0.029) - 3.25 * Math.pow(ISCBase - 0.02, 15)
    : 6.42 * ISCBase;

  if (ISC <= 0) {
    return { score: 0.0, rating: "None", vector: buildVectorString(v) };
  }

  const PR_WEIGHTS = scopeChanged ? PR_WEIGHTS_CHANGED : PR_WEIGHTS_UNCHANGED;

  const exploitability =
    8.22 *
    AV_WEIGHTS[v.AV] *
    AC_WEIGHTS[v.AC] *
    PR_WEIGHTS[v.PR] *
    UI_WEIGHTS[v.UI];

  const baseScore = scopeChanged
    ? roundUp(Math.min(1.08 * (ISC + exploitability), 10))
    : roundUp(Math.min(ISC + exploitability, 10));

  return {
    score: baseScore,
    rating: scoreToRating(baseScore),
    vector: buildVectorString(v),
  };
}

/**
 * Parse a CVSS v3.1 vector string and compute the score.
 *
 * Accepts both the full form ("CVSS:3.1/AV:N/AC:L/...") and the short
 * form without the prefix ("AV:N/AC:L/...").
 */
export function parseCvssVector(vectorString: string): CvssResult {
  const stripped = vectorString.startsWith("CVSS:3.1/")
    ? vectorString.slice("CVSS:3.1/".length)
    : vectorString;

  const parts = Object.fromEntries(
    stripped.split("/").map((part) => {
      const colonIdx = part.indexOf(":");
      return [part.slice(0, colonIdx), part.slice(colonIdx + 1)];
    })
  );

  const v: CvssVector = {
    AV: assertIn(parts["AV"], ["N", "A", "L", "P"], "AV") as CvssVector["AV"],
    AC: assertIn(parts["AC"], ["L", "H"], "AC") as CvssVector["AC"],
    PR: assertIn(parts["PR"], ["N", "L", "H"], "PR") as CvssVector["PR"],
    UI: assertIn(parts["UI"], ["N", "R"], "UI") as CvssVector["UI"],
    S: assertIn(parts["S"], ["U", "C"], "S") as CvssVector["S"],
    C: assertIn(parts["C"], ["N", "L", "H"], "C") as CvssVector["C"],
    I: assertIn(parts["I"], ["N", "L", "H"], "I") as CvssVector["I"],
    A: assertIn(parts["A"], ["N", "L", "H"], "A") as CvssVector["A"],
  };

  return computeCvssScore(v);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Round up to one decimal place, as defined in the CVSS specification.
 * The spec uses ceiling rounding on the second decimal.
 */
function roundUp(value: number): number {
  const rounded = Math.round(value * 100000);
  if (rounded % 10000 === 0) {
    return rounded / 100000;
  }
  return (Math.floor(rounded / 10000) + 1) / 10;
}

function scoreToRating(score: number): CvssRating {
  if (score === 0.0) return "None";
  if (score < 4.0) return "Low";
  if (score < 7.0) return "Medium";
  if (score < 9.0) return "High";
  return "Critical";
}

function buildVectorString(v: CvssVector): string {
  return `CVSS:3.1/AV:${v.AV}/AC:${v.AC}/PR:${v.PR}/UI:${v.UI}/S:${v.S}/C:${v.C}/I:${v.I}/A:${v.A}`;
}

function assertIn<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  metric: string
): T {
  if (value === undefined || !(allowed as readonly string[]).includes(value)) {
    throw new Error(
      `Invalid CVSS metric ${metric}: "${value ?? "undefined"}". Allowed: ${allowed.join(", ")}`
    );
  }
  return value as T;
}
