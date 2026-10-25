import { describe, expect, it } from "vitest";
import { FINDINGS, getFinding } from "./findings.js";

describe("findings catalogue", () => {
  it("contains exactly three findings", () => {
    expect(FINDINGS).toHaveLength(3);
  });

  it("each finding has a lower score after hardening", () => {
    for (const finding of FINDINGS) {
      expect(finding.scoreHardened.score).toBeLessThan(
        finding.scoreVulnerable.score
      );
    }
  });

  it("each finding score matches the calculated result for its vector", () => {
    for (const finding of FINDINGS) {
      expect(finding.scoreVulnerable.score).toBeGreaterThan(0);
      expect(finding.scoreHardened.score).toBeGreaterThanOrEqual(0);
    }
  });

  it("getFinding returns the correct finding by id", () => {
    const redos = getFinding("redos");
    expect(redos.cwe).toBe("CWE-1333");
    expect(redos.scoreVulnerable.score).toBe(7.5);
    expect(redos.scoreVulnerable.rating).toBe("High");
    expect(redos.scoreHardened.score).toBe(3.7);
    expect(redos.scoreHardened.rating).toBe("Low");
  });

  it("getFinding throws for an unknown id", () => {
    expect(() => getFinding("unknown-finding")).toThrow(
      'No finding with id "unknown-finding"'
    );
  });

  it("all findings have non-empty required fields", () => {
    for (const finding of FINDINGS) {
      expect(finding.id).toBeTruthy();
      expect(finding.title).toBeTruthy();
      expect(finding.cwe).toMatch(/^CWE-/);
      expect(finding.owasp).toMatch(/^A\d+:\d{4}$/);
      expect(finding.description).toBeTruthy();
      expect(finding.vectorVulnerable).toMatch(/^AV:/);
      expect(finding.vectorHardened).toMatch(/^AV:/);
    }
  });
});
