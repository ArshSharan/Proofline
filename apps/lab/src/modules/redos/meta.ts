export const REDOS_META = {
  id: "redos",
  module: "redos",
  title: "Slow regex",
  subtitle: "One crafted input can stall a whole server.",
  cwe: "CWE-1333",
  cweTitle: "Inefficient Regular Expression Complexity",
  owasp: "A05:2021",
  owaspTitle: "Security Misconfiguration",
  vectorVulnerable: "AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H",
  vectorHardened: "AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:L",
  description:
    "A regular expression with nested quantifiers evaluated on the Node.js main thread causes catastrophic backtracking on unmatched inputs, freezing the event loop and starving concurrent requests.",
  remediation:
    "Apply strict input length bounds, replace nested quantifiers with linear-time patterns, and evaluate complex expressions in isolated worker threads with execution timeouts.",
  codeVulnerable: `// Vulnerable: nested quantifier evaluated on main thread
const PATTERN = /^(\\w+\\s?)+$/;
export function validate(input: string): boolean {
  return PATTERN.test(input); // catastrophic backtracking on "a a a ... !"
}`,
  codeHardened: `// Hardened: strict length ceiling + linear pattern + worker isolation
const PATTERN = /^\\w+(?:\\s\\w+)*$/;
export function validate(input: string): boolean {
  if (input.length > 100) throw new Error("Input exceeds length limit");
  return PATTERN.test(input); // strictly linear matching time
}`,
};
