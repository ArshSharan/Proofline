/**
 * Intentionally flawed recursive deep merge representing an unpatched
 * library vulnerable to prototype pollution (CWE-1321).
 */

export function vulnerableDeepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    if (
      sourceVal !== null &&
      typeof sourceVal === "object" &&
      !Array.isArray(sourceVal)
    ) {
      if (!target[key] || typeof target[key] !== "object") {
        target[key] = {};
      }
      vulnerableDeepMerge(
        target[key] as Record<string, unknown>,
        sourceVal as Record<string, unknown>
      );
    } else {
      target[key] = sourceVal;
    }
  }
  return target;
}

export interface ProfileCheck {
  username: string;
  role: string;
  isAdmin: boolean;
}

export function checkUserProfile(username = "guest"): ProfileCheck {
  // Plain object without an explicit isAdmin property
  const profile: Record<string, unknown> = {
    username,
    role: "standard_user",
  };

  // Naive authorization check that reads .isAdmin off the plain object
  const isAdmin = Boolean((profile as { isAdmin?: boolean }).isAdmin);

  return {
    username,
    role: isAdmin ? "administrator" : "standard_user",
    isAdmin,
  };
}
