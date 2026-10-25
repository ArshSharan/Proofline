import { spawn } from "node:child_process";
import { dispatchSse, completeRun, failRun } from "../../services/runs.js";
import { getAuditSummary } from "./audit.js";
import type { Mode, DepMetrics } from "@proofline/core";

export const DEFAULT_ATTACK_PAYLOAD_STRING = '{"__proto__": {"isAdmin": true}}';
export const DEFAULT_ATTACK_PAYLOAD: Record<string, unknown> = JSON.parse(
  DEFAULT_ATTACK_PAYLOAD_STRING
);

export interface IsolatedAttackResult {
  protoModified: boolean;
  isAdminFlipped: boolean;
  error?: string;
}

export function runIsolatedAttack(
  mode: Mode,
  payload: Record<string, unknown> | string = DEFAULT_ATTACK_PAYLOAD_STRING
): Promise<IsolatedAttackResult> {
  return new Promise((resolve, reject) => {
    let payloadJson: string;
    if (typeof payload === "string") {
      payloadJson = payload;
    } else {
      // Serialize with explicit __proto__ retention if present
      const hasProto = Object.prototype.hasOwnProperty.call(payload, "__proto__");
      if (hasProto) {
        payloadJson = `{"__proto__": ${JSON.stringify(
          (payload as Record<string, unknown>)["__proto__"]
        )}}`;
      } else {
        payloadJson = JSON.stringify(payload);
      }
    }

    // Child process script executing in its own V8 isolate
    const workerScript = `
const chunks = [];
process.stdin.on('data', c => chunks.push(c));
process.stdin.on('end', () => {
  try {
    const { mode, payloadJson } = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const payload = JSON.parse(payloadJson);
    let protoModified = false;
    let isAdminFlipped = false;
    let error = null;

    if (mode === "vulnerable") {
      function merge(target, source) {
        for (const key of Object.keys(source)) {
          if (source[key] !== null && typeof source[key] === "object" && !Array.isArray(source[key])) {
            if (!target[key] || typeof target[key] !== "object") target[key] = {};
            merge(target[key], source[key]);
          } else {
            target[key] = source[key];
          }
        }
        return target;
      }

      const settings = { theme: "light" };
      merge(settings, payload);

      protoModified = Object.prototype.hasOwnProperty("isAdmin") || ({}).isAdmin === true;
      const user = { username: "guest", role: "standard_user" };
      isAdminFlipped = Boolean(user.isAdmin);
    } else {
      const FORBIDDEN = new Set(["__proto__", "constructor", "prototype"]);
      for (const key of Object.keys(payload)) {
        if (FORBIDDEN.has(key)) {
          error = "Prototypal key " + key + " rejected by security filter.";
          break;
        }
      }

      protoModified = Object.prototype.hasOwnProperty("isAdmin") || ({}).isAdmin === true;
      const user = { username: "guest", role: "standard_user" };
      isAdminFlipped = Boolean(user.isAdmin);
    }

    process.stdout.write(JSON.stringify({ protoModified, isAdminFlipped, error }));
  } catch (err) {
    process.stderr.write(err.message);
    process.exit(1);
  }
});
`;

    const child = spawn(process.execPath, ["-e", workerScript], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Isolated worker exited with code ${code}: ${stderr}`));
        return;
      }
      try {
        const result = JSON.parse(stdout) as IsolatedAttackResult;
        resolve(result);
      } catch {
        reject(new Error(`Failed to parse worker output: ${stdout}`));
      }
    });

    child.stdin.write(JSON.stringify({ mode, payloadJson }));
    child.stdin.end();
  });
}

export async function runDepAttack(
  runId: string,
  mode: Mode,
  options: { payload?: Record<string, unknown> | string } = {}
): Promise<void> {
  try {
    const rawPayload = options.payload ?? DEFAULT_ATTACK_PAYLOAD_STRING;
    const result = await runIsolatedAttack(mode, rawPayload);
    const auditSummary = getAuditSummary();

    const metrics: DepMetrics = {
      payload:
        typeof rawPayload === "string"
          ? JSON.parse(rawPayload)
          : rawPayload,
      protoModified: result.protoModified,
      isAdminFlipped: result.isAdminFlipped,
      auditFindings: auditSummary.findings,
      source: auditSummary.source,
    };

    dispatchSse(runId, "run:sample", {
      runId,
      mode,
      metrics,
    });

    completeRun(runId, metrics, "done");
  } catch (err) {
    failRun(runId, err instanceof Error ? err.message : String(err));
  }
}
