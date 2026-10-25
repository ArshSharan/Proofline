import { validateVulnerable, makeReDoSInput, REDOS_MAX_LADDER } from "./vulnerable.js";
import { validateHardened } from "./hardened.js";
import { dispatchSse, completeRun, failRun } from "../../services/runs.js";
import { getEventLoopLag } from "../../services/monitor.js";
import type { Mode, RedosMetrics, RedosSample } from "@proofline/core";

export interface RedosRunnerOptions {
  ladder?: number[];
  maxLadder?: number;
}

export async function runRedosAttack(
  runId: string,
  mode: Mode,
  options: RedosRunnerOptions = {}
): Promise<void> {
  try {
    const maxLadder = Math.min(options.maxLadder ?? REDOS_MAX_LADDER, REDOS_MAX_LADDER);
    const defaultLadder = [14, 16, 18, 20, 22, 24, 26, 28].filter(
      (n) => n <= maxLadder
    );
    const ladder = options.ladder ?? defaultLadder;

    const samples: RedosSample[] = [];
    const eventLoopDelays: number[] = [];

    for (const n of ladder) {
      // Yield to event loop between steps to allow SSE flushes and probes
      await new Promise((resolve) => setTimeout(resolve, 50));

      const input = makeReDoSInput(n);
      const lagBefore = getEventLoopLag();

      const result =
        mode === "vulnerable"
          ? validateVulnerable(input)
          : validateHardened(input);

      const lagAfter = getEventLoopLag();
      const currentLag = Math.max(lagBefore, lagAfter);
      eventLoopDelays.push(currentLag);

      const sample: RedosSample = {
        n,
        input,
        responseMs: result.durationMs,
      };

      samples.push(sample);

      dispatchSse(runId, "run:sample", {
        runId,
        mode,
        sample,
        eventLoopDelayMs: currentLag,
      });

      // Break early if vulnerable mode hit catastrophic threshold (> 8000ms) to protect server
      if (mode === "vulnerable" && result.durationMs > 8000) {
        break;
      }
    }

    eventLoopDelays.sort((a, b) => a - b);
    const p50 = percentile(eventLoopDelays, 0.5);
    const p99 = percentile(eventLoopDelays, 0.99);
    const max =
      eventLoopDelays.length > 0
        ? (eventLoopDelays[eventLoopDelays.length - 1] ?? 0)
        : 0;

    const metrics: RedosMetrics = {
      samples,
      eventLoopDelayP50Ms: p50,
      eventLoopDelayP99Ms: p99,
      eventLoopDelayMaxMs: max,
      probeLatenciesMs: eventLoopDelays,
      timedOutProbes: eventLoopDelays.filter((d) => d > 500).length,
    };

    completeRun(runId, metrics, "done");
  } catch (err) {
    failRun(runId, err instanceof Error ? err.message : String(err));
  }
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.ceil(p * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))] ?? 0;
}
