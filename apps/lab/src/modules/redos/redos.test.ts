import { describe, expect, it } from "vitest";
import { validateVulnerable, makeReDoSInput } from "./vulnerable.js";
import { validateHardened, HARDENED_MAX_LENGTH } from "./hardened.js";

describe("ReDoS module", () => {
  describe("vulnerable validator", () => {
    it("matches valid words correctly", () => {
      const result = validateVulnerable("hello world");
      expect(result.valid).toBe(true);
      expect(result.durationMs).toBeLessThan(50);
    });

    it("evaluates crafted input with catastrophic backtracking", () => {
      // Use a moderate ladder step (e.g. 18) to avoid slow test suites
      const input = makeReDoSInput(18);
      const result = validateVulnerable(input);
      expect(result.valid).toBe(false);
      expect(result.durationMs).toBeGreaterThan(0);
    });
  });

  describe("hardened validator", () => {
    it("rejects input exceeding maximum length", () => {
      const longInput = "a".repeat(HARDENED_MAX_LENGTH + 1);
      const result = validateHardened(longInput);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceeds maximum allowed length");
      expect(result.durationMs).toBeLessThan(10);
    });

    it("validates valid word sequences quickly in linear time", () => {
      const result = validateHardened("alpha beta gamma delta");
      expect(result.valid).toBe(true);
      expect(result.durationMs).toBeLessThan(10);
    });

    it("safely handles crafted attack input without backtracking", () => {
      // Craft an input of length 50 (below limit) that fails match
      const input = makeReDoSInput(16);
      const result = validateHardened(input);
      expect(result.valid).toBe(false);
      expect(result.durationMs).toBeLessThan(20);
    });
  });
});
