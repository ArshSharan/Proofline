import { describe, expect, it } from "vitest";
import { hardenedDeepMerge } from "./hardened.js";
import { runIsolatedAttack, DEFAULT_ATTACK_PAYLOAD } from "./runner.js";

describe("Outdated package / prototype pollution module", () => {
  describe("hardened merge", () => {
    it("rejects __proto__ payload", () => {
      const target = { theme: "light" };
      const payload = JSON.parse('{"__proto__": {"isAdmin": true}}');
      const result = hardenedDeepMerge(target, payload);

      expect(result.success).toBe(false);
      expect(result.error).toContain("rejected by security filter");
    });

    it("rejects constructor.prototype payload", () => {
      const target = { theme: "light" };
      const payload = JSON.parse('{"constructor": {"prototype": {"isAdmin": true}}}');
      const result = hardenedDeepMerge(target, payload);

      expect(result.success).toBe(false);
      expect(result.error).toContain("rejected by security filter");
    });

    it("merges allowed schema properties cleanly", () => {
      const target = { theme: "light", language: "en" };
      const payload = { theme: "dark", fontSize: 16 };
      const result = hardenedDeepMerge(target, payload);

      expect(result.success).toBe(true);
      expect(result.settings?.theme).toBe("dark");
      expect(result.settings?.fontSize).toBe(16);
    });
  });

  describe("isolated child process execution", () => {
    it("vulnerable mode flips isAdmin in child process without leaking to parent", async () => {
      const result = await runIsolatedAttack("vulnerable", DEFAULT_ATTACK_PAYLOAD);

      expect(result.protoModified).toBe(true);
      expect(result.isAdminFlipped).toBe(true);

      // Verify isolation: main test process prototype must remain unpolluted
      const testPlainObj: Record<string, unknown> = {};
      expect(testPlainObj["isAdmin"]).toBeUndefined();
    });

    it("hardened mode blocks pollution in child process", async () => {
      const result = await runIsolatedAttack("hardened", DEFAULT_ATTACK_PAYLOAD);

      expect(result.protoModified).toBe(false);
      expect(result.isAdminFlipped).toBe(false);
      expect(result.error).toContain("rejected");

      const testPlainObj: Record<string, unknown> = {};
      expect(testPlainObj["isAdmin"]).toBeUndefined();
    });
  });
});
