import { performance } from "node:perf_hooks";

export const REDOS_MAX_LADDER = Number.parseInt(
  process.env.REDOS_MAX_LADDER ?? "28",
  10
);

// Vulnerable regular expression with nested quantifiers
const VULNERABLE_REGEX = /^(\w+\s?)+$/;

export interface ValidationResult {
  valid: boolean;
  durationMs: number;
  inputLength: number;
}

export function validateVulnerable(input: string): ValidationResult {
  const start = performance.now();
  const valid = VULNERABLE_REGEX.test(input);
  const durationMs = performance.now() - start;

  return {
    valid,
    durationMs: Number(durationMs.toFixed(2)),
    inputLength: input.length,
  };
}

export function makeReDoSInput(n: number): string {
  const boundedN = Math.min(Math.max(1, n), REDOS_MAX_LADDER);
  return "a ".repeat(boundedN) + "!";
}
