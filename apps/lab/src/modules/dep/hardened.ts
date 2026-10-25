const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const ALLOWED_SETTING_KEYS = new Set([
  "theme",
  "fontSize",
  "notifications",
  "language",
  "timezone",
  "displayMode",
]);

export interface HardenedMergeResult {
  success: boolean;
  settings?: Record<string, unknown>;
  error?: string;
}

export function hardenedDeepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): HardenedMergeResult {
  // Guard 1: Prototypal key blocklist
  for (const key of Object.keys(source)) {
    if (FORBIDDEN_KEYS.has(key)) {
      return {
        success: false,
        error: `Prototypal key "${key}" rejected by security filter.`,
      };
    }

    // Guard 2: Schema validation on allowed setting properties
    if (!ALLOWED_SETTING_KEYS.has(key)) {
      return {
        success: false,
        error: `Property "${key}" is not permitted by settings schema.`,
      };
    }
  }

  // Guard 3: Safe copy without prototype traversal
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const val = source[key];
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      result[key] = {
        ...((result[key] as Record<string, unknown>) ?? {}),
        ...(val as Record<string, unknown>),
      };
    } else {
      result[key] = val;
    }
  }

  return {
    success: true,
    settings: result,
  };
}
