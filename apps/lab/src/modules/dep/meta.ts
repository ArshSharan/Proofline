export const DEP_META = {
  id: "dep",
  module: "dep",
  title: "Outdated package",
  subtitle: "Unsanitized recursive object merge pollutes Object.prototype and flips authorization.",
  cwe: "CWE-1321",
  cweTitle: "Improperly Controlled Modification of Dynamically-Determined Object Attributes",
  owasp: "A06:2021",
  owaspTitle: "Vulnerable and Outdated Components",
  vectorVulnerable: "AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:H/A:N",
  vectorHardened: "AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:L/A:N",
  description:
    "An outdated dependency containing an unpatched recursive deep merge allows crafted JSON keys (__proto__ or constructor.prototype) to mutate the global Object prototype. Plain objects throughout the runtime inherit the injected properties, bypassing authorization checks.",
  remediation:
    "Update to patched dependency versions, strip prototypal keys (__proto__, constructor, prototype) before merging, validate incoming payloads against strict schemas, and use Object.create(null) for dictionary objects.",
  codeVulnerable: `// Vulnerable: Unsanitized recursive deep merge (outdated library)
function merge(target: any, source: any): any {
  for (const key of Object.keys(source)) {
    if (typeof source[key] === "object" && source[key] !== null) {
      target[key] = merge(target[key] || {}, source[key]); // Sets target["__proto__"]!
    } else {
      target[key] = source[key];
    }
  }
  return target;
}`,
  codeHardened: `// Hardened: Key blocklist + schema validation + prototype isolation
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);
function safeMerge(target: any, source: any): any {
  for (const key of Object.keys(source)) {
    if (FORBIDDEN_KEYS.has(key)) throw new Error(\`Forbidden prototypal key: \${key}\`);
    if (typeof source[key] === "object" && source[key] !== null) {
      target[key] = safeMerge(target[key] || Object.create(null), source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}`,
};
