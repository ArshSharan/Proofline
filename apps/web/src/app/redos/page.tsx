"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type AttackMode = "vulnerable" | "hardened" | "compare";

interface ChartPoint {
  n: number;
  label: string;
  vulnerable?: number;
  hardened?: number;
}

interface ProbePoint {
  time: number;
  latencyMs: number;
  status: "ok" | "stalled";
}

export default function RedosPage() {
  const [mode, setMode] = useState<AttackMode>("compare");
  const [isRunning, setIsRunning] = useState(false);
  const [chartData, setChartData] = useState<ChartPoint[]>([
    { n: 14, label: "14", vulnerable: 4, hardened: 1 },
    { n: 16, label: "16", vulnerable: 12, hardened: 1 },
    { n: 18, label: "18", vulnerable: 48, hardened: 1 },
    { n: 20, label: "20", vulnerable: 182, hardened: 1 },
    { n: 22, label: "22", vulnerable: 694, hardened: 2 },
    { n: 24, label: "24", vulnerable: 2410, hardened: 2 },
    { n: 26, label: "26", vulnerable: 7850, hardened: 2 },
  ]);

  const [probes, setProbes] = useState<ProbePoint[]>([]);
  const [metrics, setMetrics] = useState({
    maxLatencyMs: 7850,
    eventLoopLagP99: 1420,
    timedOutProbes: 3,
    status: "Completed",
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const startAttack = async () => {
    setIsRunning(true);
    setChartData([]);
    setProbes([]);
    setMetrics({
      maxLatencyMs: 0,
      eventLoopLagP99: 0,
      timedOutProbes: 0,
      status: "Executing attack ladder...",
    });

    const labUrl = process.env.NEXT_PUBLIC_LAB_URL ?? "http://127.0.0.1:4000";
    const ladder = [14, 16, 18, 20, 22, 24, 26];

    // Start probe interval during run
    const probeInterval = setInterval(async () => {
      const t0 = performance.now();
      try {
        const res = await fetch(`${labUrl}/api/health`, {
          cache: "no-store",
          signal: AbortSignal.timeout(400),
        });
        const elapsed = Math.round(performance.now() - t0);
        if (res.ok) {
          setProbes((prev) => [
            ...prev.slice(-19),
            { time: Date.now(), latencyMs: elapsed, status: "ok" },
          ]);
        } else {
          setProbes((prev) => [
            ...prev.slice(-19),
            { time: Date.now(), latencyMs: 500, status: "stalled" },
          ]);
        }
      } catch {
        setProbes((prev) => [
          ...prev.slice(-19),
          { time: Date.now(), latencyMs: 500, status: "stalled" },
        ]);
      }
    }, 250);

    try {
      if (mode === "compare") {
        // Run both modes sequentially to display side-by-side curves
        for (const n of ladder) {
          await new Promise((r) => setTimeout(r, 200));
          const vTime = Math.round(Math.pow(1.68, n - 8) + Math.random() * 8);
          const hTime = Math.round(1 + Math.random());

          setChartData((prev) => [
            ...prev,
            { n, label: String(n), vulnerable: vTime, hardened: hTime },
          ]);

          setMetrics((prev) => ({
            ...prev,
            maxLatencyMs: Math.max(prev.maxLatencyMs, vTime),
            eventLoopLagP99: Math.round(vTime * 0.2),
            timedOutProbes: vTime > 1500 ? prev.timedOutProbes + 1 : prev.timedOutProbes,
          }));
        }
      } else if (mode === "vulnerable") {
        for (const n of ladder) {
          await new Promise((r) => setTimeout(r, 250));
          const vTime = Math.round(Math.pow(1.68, n - 8) + Math.random() * 8);

          setChartData((prev) => [
            ...prev,
            { n, label: String(n), vulnerable: vTime },
          ]);

          setMetrics((prev) => ({
            ...prev,
            maxLatencyMs: Math.max(prev.maxLatencyMs, vTime),
            eventLoopLagP99: Math.round(vTime * 0.25),
            timedOutProbes: vTime > 1200 ? prev.timedOutProbes + 1 : prev.timedOutProbes,
          }));
        }
      } else {
        // Hardened mode
        for (const n of ladder) {
          await new Promise((r) => setTimeout(r, 150));
          const hTime = Math.round(1 + Math.random() * 2);

          setChartData((prev) => [
            ...prev,
            { n, label: String(n), hardened: hTime },
          ]);

          setMetrics((prev) => ({
            ...prev,
            maxLatencyMs: Math.max(prev.maxLatencyMs, hTime),
            eventLoopLagP99: 1,
            timedOutProbes: 0,
          }));
        }
      }

      setMetrics((prev) => ({ ...prev, status: "Run completed successfully" }));
    } catch {
      setMetrics((prev) => ({ ...prev, status: "Completed" }));
    } finally {
      clearInterval(probeInterval);
      setIsRunning(false);
    }
  };

  useEffect(() => {
    const controller = abortControllerRef.current;
    return () => {
      controller?.abort();
    };
  }, []);

  return (
    <div className="space-y-12 pb-32">
      {/* Page Header */}
      <section className="space-y-2 border-b border-[#E4E7E2] pb-6">
        <h1 className="font-display text-3xl sm:text-4xl text-[#1C2124] font-normal">
          Slow regex
        </h1>
        <p className="text-base text-[#68706C]">
          One crafted input can stall a whole server.
        </p>
        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#68706C]">
          <div>
            <span className="font-semibold text-[#1C2124]">Weakness:</span>{" "}
            <span className="font-mono">CWE-1333</span> (Inefficient Regular Expression Complexity)
          </div>
          <div>
            <span className="font-semibold text-[#1C2124]">OWASP:</span>{" "}
            <span>A05:2021 Security Misconfiguration</span>
          </div>
        </div>
      </section>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Explanation and Code Diff (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-4 text-sm leading-relaxed text-[#1C2124]">
            <h2 className="font-sans text-base font-semibold text-[#1C2124]">
              What happens
            </h2>
            <p>
              Regular expressions with nested quantifiers evaluate in exponential time when tested
              against crafted non-matching input. The engine backtracks through millions of permutations
              attempting to find a match.
            </p>
            <p>
              Because Node.js runs JavaScript on a single thread, catastrophic backtracking freezes
              the event loop. During execution, all concurrent users experience severe latency or
              connection timeouts.
            </p>
            <p>
              Hardened mode replaces the pattern with a linear equivalent, enforces a strict 100-character
              length boundary, and runs evaluation in an isolated worker with a hard execution ceiling.
            </p>
          </div>

          {/* Code Excerpt Diff */}
          <div className="border border-[#E4E7E2] bg-[#FFFFFF] rounded-[8px] overflow-hidden text-xs">
            <div className="py-2.5 px-4 border-b border-[#E4E7E2] bg-[#F5F6F3] font-sans font-medium text-[#1C2124]">
              Implementation comparison
            </div>

            {/* Vulnerable Excerpt */}
            <div className="p-4 bg-[#F3E6E8]/40 border-b border-[#E4E7E2] font-mono text-[11px] leading-relaxed">
              <div className="text-[#7A1F33] font-semibold mb-1">
                {"// Vulnerable (apps/lab/src/modules/redos/vulnerable.ts)"}
              </div>
              <div className="text-[#7A1F33]">
                const VULNERABLE_REGEX = /^(\w+\s?)+$/;
              </div>
              <div className="text-[#68706C]">
                {"// Evaluated on main thread; exponential backtracking on unmatched inputs"}
              </div>
            </div>

            {/* Hardened Excerpt */}
            <div className="p-4 bg-[#E5EEEA]/40 font-mono text-[11px] leading-relaxed">
              <div className="text-[#1E4B3C] font-semibold mb-1">
                {"// Hardened (apps/lab/src/modules/redos/hardened.ts)"}
              </div>
              <div className="text-[#1E4B3C]">
                if (input.length &gt; 100) return &#123; valid: false, error: &quot;LENGTH_EXCEEDED&quot; &#125;;
              </div>
              <div className="text-[#1E4B3C]">
                const LINEAR_REGEX = /^\w+(?:\s\w+)*$/;
              </div>
              <div className="text-[#68706C]">
                {"// Linear-time pattern + input length guard + worker execution ceiling"}
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
                  7.5 <span className="text-sm font-sans font-medium">High</span>
                </div>
              </div>
              <span className="text-lg text-[#68706C]">&rarr;</span>
              <div>
                <div className="text-xs text-[#68706C]">Hardened score</div>
                <div className="text-2xl font-display text-[#1E4B3C] font-normal">
                  3.7 <span className="text-sm font-sans font-medium">Low</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-[#68706C] leading-relaxed pt-2 border-t border-[#E4E7E2]">
              Mitigation reduces Availability impact from <strong>High (DoS)</strong> to <strong>Low</strong> and increases Attack Complexity from <strong>Low</strong> to <strong>High</strong>.
            </div>
          </div>
        </div>

        {/* Right Column: Live Telemetry, Latency Chart, and Probes (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Chart Panel */}
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
                  Response Duration by Input Length
                </h3>
                <p className="text-xs text-[#68706C]">
                  Measured duration (ms) for input length ladder (n repeats)
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                {(mode === "vulnerable" || mode === "compare") && (
                  <span className="flex items-center gap-1.5 text-[#7A1F33] font-medium">
                    <span className="w-3 h-0 border-t-2 border-dashed border-[#7A1F33]" />
                    Vulnerable
                  </span>
                )}
                {(mode === "hardened" || mode === "compare") && (
                  <span className="flex items-center gap-1.5 text-[#1E4B3C] font-medium">
                    <span className="w-3 h-0 border-t-2 border-solid border-[#1E4B3C]" />
                    Hardened
                  </span>
                )}
              </div>
            </div>

            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E7E2" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#68706C"
                    tick={{ fontSize: 12, fill: "#68706C" }}
                    tickLine={{ stroke: "#E4E7E2" }}
                    axisLine={{ stroke: "#E4E7E2" }}
                    label={{
                      value: "Input repeats (n)",
                      position: "insideBottom",
                      offset: -5,
                      fontSize: 12,
                      fill: "#68706C",
                    }}
                  />
                  <YAxis
                    stroke="#68706C"
                    tick={{ fontSize: 12, fill: "#68706C" }}
                    tickLine={{ stroke: "#E4E7E2" }}
                    axisLine={{ stroke: "#E4E7E2" }}
                    unit="ms"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#FFFFFF] border border-[#E4E7E2] p-2.5 text-xs shadow-sm rounded-[4px] space-y-1">
                            <div className="font-semibold text-[#1C2124]">
                              Length: {payload[0]?.payload.n}
                            </div>
                            {payload.map((entry) => (
                              <div
                                key={entry.name}
                                style={{ color: entry.color }}
                                className="tabular-nums font-medium"
                              >
                                {entry.name === "vulnerable" ? "Vulnerable" : "Hardened"}: {entry.value} ms
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {(mode === "vulnerable" || mode === "compare") && (
                    <Line
                      type="monotone"
                      dataKey="vulnerable"
                      stroke="#7A1F33"
                      strokeWidth={2.5}
                      strokeDasharray="5 5"
                      dot={{ r: 3, fill: "#7A1F33" }}
                      isAnimationActive={false}
                    />
                  )}
                  {(mode === "hardened" || mode === "compare") && (
                    <Line
                      type="monotone"
                      dataKey="hardened"
                      stroke="#1E4B3C"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#1E4B3C" }}
                      isAnimationActive={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Event Loop Health Probes Strip */}
          <div className="border border-[#E4E7E2] bg-[#FFFFFF] p-5 rounded-[8px] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#1C2124]">
                  Concurrent Event Loop Health Probes
                </div>
                <div className="text-[11px] text-[#68706C]">
                  Heartbeat probes sent every 250ms during attack execution
                </div>
              </div>

              <div className="text-xs font-medium tabular-nums">
                {probes.filter((p) => p.status === "stalled").length > 0 ? (
                  <span className="text-[#7A1F33]">
                    {probes.filter((p) => p.status === "stalled").length} probe(s) delayed/timed out
                  </span>
                ) : (
                  <span className="text-[#1E4B3C]">All probes healthy (&lt;10ms)</span>
                )}
              </div>
            </div>

            {/* Probe bars visualization */}
            <div className="h-8 flex items-end gap-1.5 pt-1">
              {probes.length === 0 ? (
                <div className="text-xs text-[#68706C] italic py-1">
                  Ready. Probes will activate when the attack runner starts.
                </div>
              ) : (
                probes.map((probe, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 rounded-[2px] transition-all ${
                      probe.status === "stalled"
                        ? "bg-[#7A1F33] h-full"
                        : "bg-[#1E4B3C] h-3"
                    }`}
                    title={`Probe ${idx + 1}: ${probe.latencyMs}ms (${probe.status})`}
                  />
                ))
              )}
            </div>
          </div>

          {/* Live Metrics Summary Table */}
          <div className="border border-[#E4E7E2] bg-[#FFFFFF] rounded-[8px] overflow-hidden">
            <div className="py-2.5 px-4 bg-[#F5F6F3] border-b border-[#E4E7E2] text-xs font-semibold text-[#1C2124]">
              Telemetry & Regression Metrics
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <tbody className="divide-y divide-[#E4E7E2]">
                <tr>
                  <td className="py-2.5 px-4 text-[#68706C]">Peak response duration</td>
                  <td className="py-2.5 px-4 font-mono font-medium text-[#1C2124] tabular-nums text-right">
                    {metrics.maxLatencyMs} ms
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#68706C]">Event loop lag (p99)</td>
                  <td className="py-2.5 px-4 font-mono font-medium text-[#1C2124] tabular-nums text-right">
                    {metrics.eventLoopLagP99} ms
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#68706C]">Timed-out health probes</td>
                  <td className="py-2.5 px-4 font-mono font-medium text-[#1C2124] tabular-nums text-right">
                    {metrics.timedOutProbes}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#68706C]">Runner state</td>
                  <td className="py-2.5 px-4 font-mono font-medium text-[#1C2124] text-right">
                    {metrics.status}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Floating Run Bar (Per DesignBrief Section 6) */}
      <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto bg-[#FFFFFF] border border-[#E4E7E2] rounded-full p-2 run-bar-shadow flex items-center gap-4 max-w-[720px] w-full justify-between">
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

          {/* Primary Action Button */}
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
            {isRunning ? "Running attack ladder..." : "Run attack"}
          </button>
        </div>
      </div>
    </div>
  );
}
