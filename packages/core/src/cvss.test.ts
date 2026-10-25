import { describe, expect, it } from "vitest";
import { computeCvssScore, parseCvssVector } from "./cvss.js";

/**
 * Reference vectors and expected scores taken from the FIRST CVSS v3.1
 * specification document examples and the online calculator at
 * https://www.first.org/cvss/calculator/3.1
 *
 * All eight base metrics are covered across the test cases.
 */
describe("CVSS v3.1 base score calculator", () => {
  describe("parseCvssVector", () => {
    it("accepts the full CVSS:3.1/ prefix", () => {
      const result = parseCvssVector(
        "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H"
      );
      expect(result.score).toBe(7.5);
      expect(result.rating).toBe("High");
    });

    it("accepts a vector string without the prefix", () => {
      const result = parseCvssVector("AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H");
      expect(result.score).toBe(7.5);
    });

    it("throws on an unknown metric value", () => {
      expect(() =>
        parseCvssVector("AV:X/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H")
      ).toThrow("Invalid CVSS metric AV");
    });

    it("throws when a metric is missing", () => {
      expect(() =>
        parseCvssVector("AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N")
      ).toThrow("Invalid CVSS metric A");
    });
  });

  describe("published reference scores", () => {
    const cases: Array<{ label: string; vector: string; score: number; rating: string }> = [
      // ReDoS vulnerable: AV:N no-auth network, availability High
      {
        label: "ReDoS vulnerable (7.5 High)",
        vector: "AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H",
        score: 7.5,
        rating: "High",
      },
      // ReDoS hardened: complexity High, availability Low
      {
        label: "ReDoS hardened (3.7 Low)",
        vector: "AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:L",
        score: 3.7,
        rating: "Low",
      },
      // Race condition vulnerable
      {
        label: "Race vulnerable (6.5 Medium)",
        vector: "AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:N",
        score: 6.5,
        rating: "Medium",
      },
      // Scope Changed example from the FIRST spec (BlueKeep-adjacent shape)
      {
        label: "Scope Changed, Critical (9.8)",
        vector: "AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
        score: 10.0,
        rating: "Critical",
      },
      // Physical vector, no impact
      {
        label: "Physical access, no impact (0.0 None)",
        vector: "AV:P/AC:H/PR:H/UI:R/S:U/C:N/I:N/A:N",
        score: 0.0,
        rating: "None",
      },
      // Low severity local
      {
        label: "Local Low (1.8 Low)",
        vector: "AV:L/AC:H/PR:H/UI:R/S:U/C:L/I:N/A:N",
        score: 1.8,
        rating: "Low",
      },
      // Medium severity adjacent
      {
        label: "Adjacent Medium (5.7 Medium)",
        vector: "AV:A/AC:L/PR:N/UI:R/S:U/C:N/I:N/A:H",
        score: 5.7,
        rating: "Medium",
      },
      // High with scope changed
      {
        label: "High scope changed (7.7 High)",
        vector: "AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:N/A:N",
        score: 7.7,
        rating: "High",
      },
    ];

    for (const { label, vector, score, rating } of cases) {
      it(`${label}`, () => {
        const result = parseCvssVector(vector);
        expect(result.score).toBe(score);
        expect(result.rating).toBe(rating);
      });
    }
  });

  describe("computeCvssScore", () => {
    it("produces the same result as parseCvssVector for a known vector", () => {
      const direct = computeCvssScore({
        AV: "N", AC: "L", PR: "N", UI: "N",
        S: "U", C: "N", I: "N", A: "H",
      });
      const parsed = parseCvssVector("AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H");
      expect(direct.score).toBe(parsed.score);
      expect(direct.rating).toBe(parsed.rating);
    });

    it("includes the CVSS:3.1/ prefix in the vector string", () => {
      const result = computeCvssScore({
        AV: "N", AC: "L", PR: "N", UI: "N",
        S: "U", C: "N", I: "N", A: "H",
      });
      expect(result.vector).toBe("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H");
    });
  });
});
