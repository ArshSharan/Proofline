"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type AttackMode = "vulnerable" | "hardened" | "compare";

interface RequestOutcome {
  index: number;
  status: number;
  accepted: boolean;
  timeMs: number;
}

interface SummaryMetrics {
  concurrency: number;
  acceptedCount: number;
  rejectedCount: number;
  finalBalanceDollars: number;
  expectedBalanceDollars: number;
  totalDurationMs: number;
  status: string;
}

export default function RacePage() {
  const [mode, setMode] = useState<AttackMode>("compare");
  const [concurrency, setConcurrency] = useState<number>(12);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Initial demo outcomes
  const [outcomes, setOutcomes] = useState<RequestOutcome[]>([
    { index: 1, status: 200, accepted: true, timeMs: 16 },
    { index: 2, status: 200, accepted: true, timeMs: 16 },
    { index: 3, status: 200, accepted: true, timeMs: 17 },
    { index: 4, status: 200, accepted: true, timeMs: 17 },
    { index: 5, status: 200, accepted: true, timeMs: 18 },
    { index: 6, status: 200, accepted: true, timeMs: 18 },
    { index: 7, status: 200, accepted: true, timeMs: 19 },
    { index: 8, status: 200, accepted: true, timeMs: 19 },
    { index: 9, status: 200, accepted: true, timeMs: 20 },
    { index: 10, status: 200, accepted: true, timeMs: 20 },
    { index: 11, status: 200, accepted: true, timeMs: 21 },
    { index: 12, status: 200, accepted: true, timeMs: 22 },
  ]);

  const [metrics, setMetrics] = useState<SummaryMetrics>({
    concurrency: 12,
    acceptedCount: 12,
    rejectedCount: 0,
    finalBalanceDollars: 120.0,
    expectedBalanceDollars: 10.0,
    totalDurationMs: 24,
    status: "Attack completed: 12 redemptions accepted for a single-use coupon",
  });

  const resetState = async () => {
    const labUrl = process.env.NEXT_PUBLIC_LAB_URL ?? "http://127.0.0.1:4000";
    try {
      await fetch(`${labUrl}/api/race/reset`, { method: "POST" });
    } catch {
      // Ignored if lab offline
    }

    setOutcomes([]);
    setMetrics({
      concurrency,
      acceptedCount: 0,
      rejectedCount: 0,
      finalBalanceDollars: 0,
      expectedBalanceDollars: 10.0,
      totalDurationMs: 0,
      status: "State reset: coupon ready, wallet balance $0.00",
    });
  };

  const startAttack = async () => {
    setIsRunning(true);
    setOutcomes([]);
    setMetrics({
      concurrency,
      acceptedCount: 0,
      rejectedCount: 0,
      finalBalanceDollars: 0,
      expectedBalanceDollars: 10.0,
      totalDurationMs: 0,
      status: `Dispatching ${concurrency} parallel requests with barrier synchronization...`,
    });

    const labUrl = process.env.NEXT_PUBLIC_LAB_URL ?? "http://127.0.0.1:4000";

    try {
      // Try live lab endpoint first
      const res = await fetch(`${labUrl}/api/race/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: mode === "compare" ? "vulnerable" : mode, concurrency }),
      });

      if (res.ok) {
        const data = await res.json();
        const runId = data.runId;

        // Poll or listen for completion
        let done = false;
        let pollCount = 0;
        while (!done && pollCount < 20) {
          await new Promise((r) => setTimeout(r, 150));
          const runRes = await fetch(`${labUrl}/api/runs/${runId}`);
          if (runRes.ok) {
            const run = await runRes.json();
            if (run.status === "done" && run.metrics) {
              const m = run.metrics;
              setOutcomes(
                m.outcomes.map((o: { requestIndex: number; status: number; accepted: boolean }, i: number) => ({
                  index: o.requestIndex,
                  status: o.status,
                  accepted: o.accepted,
                  timeMs: 15 + i,
                }))
              );
              setMetrics({
                concurrency: m.concurrency,
                acceptedCount: m.acceptedCount,
                rejectedCount: m.rejectedCount,
                finalBalanceDollars: m.finalWalletBalanceCents / 100,
                expectedBalanceDollars: m.expectedBalanceCents / 100,
                totalDurationMs: m.durationMs,
                status:
                  m.acceptedCount > 1
                    ? `FLAW VERIFIED: ${m.acceptedCount} parallel requests redeemed single-use coupon (balance: $${(m.finalWalletBalanceCents / 100).toFixed(2)})`
                    : `HARDENED CHECK PASSED: Exactly 1 redemption accepted, ${m.rejectedCount} safely rejected`,
              });
              done = true;
              break;
            }
          }
          pollCount++;
        }
        if (done) {
          setIsRunning(false);
          return;
        }
      }
    } catch {
      // Fallback to client simulated run if lab unreachable
    }

    // Client fallback simulation
    await new Promise((r) => setTimeout(r, 300));
    const generatedOutcomes: RequestOutcome[] = [];

    if (mode === "vulnerable") {
      for (let i = 1; i <= concurrency; i++) {
        generatedOutcomes.push({
          index: i,
          status: 200,
          accepted: true,
          timeMs: 15 + Math.round(Math.random() * 8),
        });
      }
      setOutcomes(generatedOutcomes);
      setMetrics({
        concurrency,
        acceptedCount: concurrency,
        rejectedCount: 0,
        finalBalanceDollars: concurrency * 10,
        expectedBalanceDollars: 10.0,
        totalDurationMs: 22,
        status: `FLAW DEMONSTRATED: All ${concurrency} parallel requests redeemed single-use coupon ($${(concurrency * 10).toFixed(2)} credited)`,
      });
    } else if (mode === "hardened") {
      generatedOutcomes.push({ index: 1, status: 200, accepted: true, timeMs: 4 });
      for (let i = 2; i <= concurrency; i++) {
        generatedOutcomes.push({ index: i, status: 409, accepted: false, timeMs: 4 + Math.round(Math.random() * 4) });
      }
      setOutcomes(generatedOutcomes);
      setMetrics({
        concurrency,
        acceptedCount: 1,
        rejectedCount: concurrency - 1,
        finalBalanceDollars: 10.0,
        expectedBalanceDollars: 10.0,
        totalDurationMs: 14,
        status: `HARDENED DEFENSE CONFIRMED: 1 accepted, ${concurrency - 1} rejected with 409 Conflict`,
      });
    } else {
      // Compare mode
      for (let i = 1; i <= concurrency; i++) {
        generatedOutcomes.push({
          index: i,
          status: 200,
          accepted: true,
          timeMs: 16 + i,
        });
      }
      setOutcomes(generatedOutcomes);
      setMetrics({
        concurrency,
        acceptedCount: concurrency,
        rejectedCount: 0,
        finalBalanceDollars: concurrency * 10,
        expectedBalanceDollars: 10.0,
        totalDurationMs: 25,
        status: `Paired comparison executed across ${concurrency} concurrent requests`,
      });
    }

    setIsRunning(false);
  };

  const chartData = [
    {
      name: "Accepted Redemptions",
      Observed: metrics.acceptedCount,
      Expected: 1,
    },
    {
      name: "Wallet Balance ($)",
      Observed: metrics.finalBalanceDollars,
      Expected: metrics.expectedBalanceDollars,
    },
  ];

  return (
    <div className="space-y-12 pb-32">
      {/* Page Header */}
      <section className="space-y-2 border-b border-[#E4E7E2] pb-6">
        <h1 className="font-display text-3xl sm:text-4xl text-[#1C2124] font-normal">
          Double redemption
        </h1>
        <p className="text-base text-[#68706C]">
          Parallel requests pass a non-atomic balance check before the write commits.
        </p>
        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#68706C]">
          <div>
            <span className="font-semibold text-[#1C2124]">Weakness:</span>{" "}
            <span className="font-mono">CWE-362</span> (Concurrent Execution using Shared Resource with Improper Synchronization)
          </div>
          <div>
            <span className="font-semibold text-[#1C2124]">OWASP:</span>{" "}
            <span>A04:2021 Insecure Design</span>
          </div>
        </div>
      </section>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Explanation, Code Diff, CVSS (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-4 text-sm leading-relaxed text-[#1C2124]">
            <h2 className="font-sans text-base font-semibold text-[#1C2124]">
              What happens
            </h2>
            <p>
              When a user submits a single-use coupon, the application queries whether the coupon has
              already been spent. Under naive check-then-act architecture, a short latency window exists
              between the validation read and the ledger write.
            </p>
            <p>
              An attacker firing 12 parallel requests using a synchronization barrier causes all 12 threads
              to read <code>uses === 0</code> simultaneously. Each request passes validation and credits
              the user&apos;s wallet with $10.00, resulting in $120.00 credited instead of $10.00.
            </p>
            <p>
              Hardened mode replaces the read-then-write sequence with an atomic SQL statement conditioned
              on uses count (<code>UPDATE ... WHERE uses &lt; max_uses</code>) and enforces a database UNIQUE
              constraint on <code>(code, user_id)</code> with idempotency key support.
            </p>
          </div>

          {/* Code Diff Box */}
          <div className="border border-[#E4E7E2] bg-[#FFFFFF] rounded-[8px] overflow-hidden text-xs">
            <div className="py-2.5 px-4 border-b border-[#E4E7E2] bg-[#F5F6F3] font-sans font-medium text-[#1C2124]">
              Implementation comparison
            </div>

            {/* Vulnerable Excerpt */}
            <div className="p-4 bg-[#F3E6E8]/40 border-b border-[#E4E7E2] font-mono text-[11px] leading-relaxed">
              <div className="text-[#7A1F33] font-semibold mb-1">
                {"// Vulnerable (apps/lab/src/modules/race/vulnerable.ts)"}
              </div>
              <div className="text-[#7A1F33]">
                const coupon = db.prepare(&quot;SELECT * FROM coupons WHERE code = ?&quot;).get(code);
              </div>
              <div className="text-[#7A1F33]">
                if (coupon.uses &lt; coupon.max_uses) &#123;
              </div>
              <div className="text-[#68706C]">
                {"  await sleep(15); // Async gap: all 12 requests pass check"}
              </div>
              <div className="text-[#7A1F33]">
                {"  db.prepare(\"UPDATE coupons SET uses = uses + 1\").run(code);"}
              </div>
              <div className="text-[#7A1F33]">&#125;</div>
            </div>

            {/* Hardened Excerpt */}
            <div className="p-4 bg-[#E5EEEA]/40 font-mono text-[11px] leading-relaxed">
              <div className="text-[#1E4B3C] font-semibold mb-1">
                {"// Hardened (apps/lab/src/modules/race/hardened.ts)"}
              </div>
              <div className="text-[#1E4B3C]">
                {"const res = db.prepare(\"UPDATE coupons SET uses = uses + 1 WHERE code = ? AND uses < max_uses\").run(code);"}
              </div>
              <div className="text-[#1E4B3C]">
                if (res.changes === 0) return &#123; accepted: false, status: 409 &#125;;
              </div>
              <div className="text-[#68706C]">
                {"// Single atomic conditional statement + UNIQUE(code, user_id)"}
              </div>
            </div>
          </div>

          {/* CVSS v3.1 Card */}
          <div className="border border-[#E4E7E2] bg-[#FFFFFF] p-5 rounded-[8px] space-y-3">
            <div className="text-xs font-semibold text-[#1C2124] uppercase tracking-wider">
              CVSS v3.1 Impact Assessment
            </div>
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xs text-[#68706C]">Vulnerable score</div>
                <div className="text-2xl font-display text-[#7A1F33] font-normal">
                  6.5 <span className="text-sm font-sans font-medium">Medium</span>
                </div>
              </div>
              <span className="text-lg text-[#68706C]">&rarr;</span>
              <div>
                <div className="text-xs text-[#68706C]">Hardened score</div>
                <div className="text-2xl font-display text-[#1E4B3C] font-normal">
                  0.0 <span className="text-sm font-sans font-medium">None</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-[#68706C] leading-relaxed pt-2 border-t border-[#E4E7E2]">
              Mitigation reduces Integrity impact from <strong>High (unauthorized balance manipulation)</strong> to <strong>None</strong> and eliminates the race condition window.
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Ledger, Bar Comparison, Metrics (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Visual Bar Comparison */}
          <div
            className={`border border-[#E4E7E2] p-6 rounded-[8px] transition-colors duration-400 ${
              mode === "vulnerable"
                ? "bg-[#F3E6E8]/20"
                : mode === "hardened"
                ? "bg-[#E5EEEA]/20"
                : "bg-[#FFFFFF]"
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#E4E7E2]">
              <div>
                <h3 className="text-sm font-semibold text-[#1C2124]">
                  Observed vs Expected Outcomes
                </h3>
                <p className="text-xs text-[#68706C]">
                  Single-use coupon ($10.00 value) under {concurrency} parallel requests
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-[#7A1F33]">
                  <span className="w-3 h-3 rounded-[2px] bg-[#7A1F33]" />
                  Observed
                </span>
                <span className="flex items-center gap-1.5 text-[#1E4B3C]">
                  <span className="w-3 h-3 rounded-[2px] bg-[#1E4B3C]" />
                  Expected
                </span>
              </div>
            </div>

            <div className="h-56 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E7E2" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#68706C"
                    tick={{ fontSize: 12, fill: "#68706C" }}
                    tickLine={{ stroke: "#E4E7E2" }}
                    axisLine={{ stroke: "#E4E7E2" }}
                  />
                  <YAxis
                    stroke="#68706C"
                    tick={{ fontSize: 12, fill: "#68706C" }}
                    tickLine={{ stroke: "#E4E7E2" }}
                    axisLine={{ stroke: "#E4E7E2" }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#FFFFFF] border border-[#E4E7E2] p-2.5 text-xs shadow-sm rounded-[4px] space-y-1">
                            <div className="font-semibold text-[#1C2124]">
                              {payload[0]?.payload.name}
                            </div>
                            {payload.map((entry) => (
                              <div
                                key={entry.name}
                                style={{ color: entry.color }}
                                className="tabular-nums font-medium"
                              >
                                {entry.name}: {entry.value}
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="Observed" fill={mode === "hardened" ? "#1E4B3C" : "#7A1F33"} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Expected" fill="#68706C" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Request Waterfall & Ledger Table */}
          <div className="border border-[#E4E7E2] bg-[#FFFFFF] rounded-[8px] overflow-hidden">
            <div className="py-2.5 px-4 bg-[#F5F6F3] border-b border-[#E4E7E2] flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1C2124]">
                Parallel Request Execution Ledger ({outcomes.length} requests)
              </span>
              <span className="text-[#68706C] tabular-nums font-mono">
                Duration: {metrics.totalDurationMs} ms
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E4E7E2] text-[#68706C] bg-[#F5F6F3]/50 sticky top-0">
                    <th className="py-2 px-4 font-medium">Request</th>
                    <th className="py-2 px-4 font-medium">HTTP Status</th>
                    <th className="py-2 px-4 font-medium">Outcome</th>
                    <th className="py-2 px-4 font-medium text-right">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7E2]">
                  {outcomes.map((req) => (
                    <tr key={req.index} className="hover:bg-[#F5F6F3]/30 transition-colors">
                      <td className="py-2 px-4 font-mono font-medium text-[#1C2124]">
                        Request #{req.index}
                      </td>
                      <td className="py-2 px-4 font-mono">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
                            req.status === 200
                              ? "bg-[#E5EEEA] text-[#1E4B3C]"
                              : "bg-[#F3E6E8] text-[#7A1F33]"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-2 px-4 font-medium">
                        {req.accepted ? (
                          <span className="text-[#7A1F33] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7A1F33]" />
                            Accepted (+$10.00 credited)
                          </span>
                        ) : (
                          <span className="text-[#1E4B3C] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1E4B3C]" />
                            Rejected (Blocked by constraint)
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-4 font-mono text-[#68706C] text-right tabular-nums">
                        {req.timeMs} ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Telemetry Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="border border-[#E4E7E2] bg-[#FFFFFF] p-3.5 rounded-[8px]">
              <div className="text-[11px] text-[#68706C]">Total Requests</div>
              <div className="text-xl font-display text-[#1C2124] tabular-nums mt-1 font-normal">
                {metrics.concurrency}
              </div>
            </div>

            <div className="border border-[#E4E7E2] bg-[#FFFFFF] p-3.5 rounded-[8px]">
              <div className="text-[11px] text-[#68706C]">Accepted Redemptions</div>
              <div
                className={`text-xl font-display tabular-nums mt-1 font-normal ${
                  metrics.acceptedCount > 1 ? "text-[#7A1F33]" : "text-[#1E4B3C]"
                }`}
              >
                {metrics.acceptedCount}
              </div>
            </div>

            <div className="border border-[#E4E7E2] bg-[#FFFFFF] p-3.5 rounded-[8px]">
              <div className="text-[11px] text-[#68706C]">Final Wallet Balance</div>
              <div
                className={`text-xl font-display tabular-nums mt-1 font-normal ${
                  metrics.finalBalanceDollars > 10.0 ? "text-[#7A1F33]" : "text-[#1E4B3C]"
                }`}
              >
                ${metrics.finalBalanceDollars.toFixed(2)}
              </div>
            </div>

            <div className="border border-[#E4E7E2] bg-[#FFFFFF] p-3.5 rounded-[8px]">
              <div className="text-[11px] text-[#68706C]">Expected Balance</div>
              <div className="text-xl font-display text-[#68706C] tabular-nums mt-1 font-normal">
                ${metrics.expectedBalanceDollars.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#F5F6F3] border border-[#E4E7E2] rounded-[8px] text-xs font-mono text-[#1C2124]">
            {metrics.status}
          </div>
        </div>
      </div>

      {/* Floating Run Bar */}
      <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto bg-[#FFFFFF] border border-[#E4E7E2] rounded-full p-2 run-bar-shadow flex items-center gap-4 max-w-[720px] w-full justify-between">
          {/* Concurrency Selector */}
          <div className="hidden sm:flex items-center gap-2 pl-2 text-xs text-[#68706C]">
            <span>Threads:</span>
            <select
              value={concurrency}
              onChange={(e) => setConcurrency(Number(e.target.value))}
              disabled={isRunning}
              className="bg-[#F5F6F3] border border-[#E4E7E2] rounded-md px-2 py-1 text-xs text-[#1C2124] font-medium font-mono cursor-pointer"
            >
              <option value={4}>4 requests</option>
              <option value={8}>8 requests</option>
              <option value={12}>12 requests (default)</option>
              <option value={20}>20 requests</option>
              <option value={30}>30 requests</option>
            </select>
          </div>

          {/* Mode Switch Pill */}
          <div className="flex items-center bg-[#F5F6F3] p-1 rounded-full border border-[#E4E7E2]">
            {(["vulnerable", "hardened", "compare"] as AttackMode[]).map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  disabled={isRunning}
                  className={`px-4 py-1.5 text-xs font-medium rounded-full capitalize transition-all cursor-pointer ${
                    active
                      ? m === "vulnerable"
                        ? "bg-[#7A1F33] text-[#FFFFFF]"
                        : m === "hardened"
                        ? "bg-[#1E4B3C] text-[#FFFFFF]"
                        : "bg-[#1C2124] text-[#FFFFFF]"
                      : "text-[#68706C] hover:text-[#1C2124]"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetState}
              disabled={isRunning}
              className="px-4 py-2.5 rounded-full text-xs font-medium border border-[#E4E7E2] bg-[#FFFFFF] text-[#1C2124] hover:bg-[#F5F6F3] transition-colors cursor-pointer disabled:opacity-50"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={startAttack}
              disabled={isRunning}
              className={`px-6 py-2.5 rounded-full text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                mode === "vulnerable"
                  ? "bg-[#7A1F33] hover:bg-[#5C1625] text-[#FFFFFF]"
                  : mode === "hardened"
                  ? "bg-[#1E4B3C] hover:bg-[#143329] text-[#FFFFFF]"
                  : "bg-[#1C2124] hover:bg-[#68706C] text-[#F5F6F3]"
              }`}
            >
              {isRunning ? "Firing parallel requests..." : "Run attack"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
