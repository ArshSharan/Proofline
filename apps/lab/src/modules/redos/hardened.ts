import { performance } from "node:perf_hooks";

export const HARDENED_MAX_LENGTH = 100;

// Linear-time regular expression avoiding nested quantifiers
const LINEAR_REGEX = /^\w+(?:\s\w+)*$/;

export interface HardenedValidationResult {
  valid: boolean;
  durationMs: number;
  inputLength: number;
  error?: string;
}

export function validateHardened(input: string): HardenedValidationResult {
  const start = performance.now();

  // Guard 1: strict length limit
  if (input.length > HARDENED_MAX_LENGTH) {
    const durationMs = performance.now() - start;
    return {
      valid: false,
      durationMs: Number(durationMs.toFixed(2)),
      inputLength: input.length,
      error: `Input length ${input.length} exceeds maximum allowed length of ${HARDENED_MAX_LENGTH}`,
    };
  }

  // Guard 2: linear-time rewritten pattern
  const valid = LINEAR_REGEX.test(input);
  const durationMs = performance.now() - start;

  return {
    valid,
    durationMs: Number(durationMs.toFixed(2)),
    inputLength: input.length,
  };
}
