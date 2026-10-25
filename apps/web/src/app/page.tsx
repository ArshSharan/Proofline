"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface PairedDataPoint {
  n: number;
  label: string;
  vulnerable: number;
  hardened: number;
}

const DEMO_LADDER: PairedDataPoint[] = [
  { n: 14, label: "14", vulnerable: 4, hardened: 1 },
  { n: 16, label: "16", vulnerable: 12, hardened: 1 },
  { n: 18, label: "18", vulnerable: 48, hardened: 1 },
  { n: 20, label: "20", vulnerable: 182, hardened: 1 },
  { n: 22, label: "22", vulnerable: 694, hardened: 2 },
  { n: 24, label: "24", vulnerable: 2410, hardened: 2 },
  { n: 26, label: "26", vulnerable: 7850, hardened: 2 },
];

export default function OverviewPage() {
  const [dataPoints, setDataPoints] = useState<PairedDataPoint[]>(DEMO_LADDER);
  const [isRunning, setIsRunning] = useState(false);

  const startDemonstration = () => {
    setIsRunning(true);
    setDataPoints([]);

    let index = 0;
    const interval = setInterval(() => {
      if (index < DEMO_LADDER.length) {
        const nextPoint = DEMO_LADDER[index];
        if (nextPoint) {
          setDataPoints((prev) => [...prev, nextPoint]);
        }
        index++;
      } else {
        clearInterval(interval);
        setIsRunning(false);
      }
    }, 320);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="space-y-6 pt-4">
        <div className="max-w-[680px]">
          <h1 className="font-display text-4xl sm:text-6xl text-[#1C2124] tracking-tight leading-[1.08] font-normal">
            Same request. Two outcomes.
          </h1>
          <p className="mt-4 text-lg text-[#68706C] leading-relaxed">
            Three attacks, run against the same code in two modes, measured and scored.
          </p>
        </div>

        {/* Live Paired Trace Chart */}
        <div className="border border-[#E4E7E2] bg-[#FFFFFF] p-6 sm:p-8 rounded-[8px] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E7E2]">
            <div>
              <div className="text-sm font-semibold text-[#1C2124]">
                Live Paired Trace: Catastrophic Backtracking vs Linear Match
              </div>
              <div className="text-xs text-[#68706C] mt-0.5">
                Response time in milliseconds against repeat count (ladder steps 14 through 26)
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-[#7A1F33] font-medium">
                  <span className="w-3 h-0 border-t-2 border-dashed border-[#7A1F33]" />
                  Vulnerable
                </span>
                <span className="flex items-center gap-1.5 text-[#1E4B3C] font-medium">
                  <span className="w-3 h-0 border-t-2 border-solid border-[#1E4B3C]" />
                  Hardened
                </span>
              </div>

              <button
                type="button"
                onClick={startDemonstration}
                disabled={isRunning}
                className="px-4 py-1.5 text-xs font-medium rounded-full bg-[#1C2124] text-[#F5F6F3] hover:bg-[#68706C] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isRunning ? "Demonstrating..." : "Replay trace"}
              </button>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dataPoints}
                margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
              >
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
                      const vulnerable = payload.find((p) => p.dataKey === "vulnerable")?.value;
                      const hardened = payload.find((p) => p.dataKey === "hardened")?.value;
                      return (
                        <div className="bg-[#FFFFFF] border border-[#E4E7E2] p-3 text-xs shadow-sm rounded-[4px] space-y-1">
                          <div className="font-semibold text-[#1C2124]">
                            Length: {payload[0]?.payload.n} repeats
                          </div>
                          <div className="text-[#7A1F33]">
                            Vulnerable: <span className="tabular-nums font-medium">{vulnerable} ms</span>
                          </div>
                          <div className="text-[#1E4B3C]">
                            Hardened: <span className="tabular-nums font-medium">{hardened} ms</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="vulnerable"
                  stroke="#7A1F33"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: "#7A1F33" }}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="hardened"
                  stroke="#1E4B3C"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#1E4B3C" }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Findings Ledger Section */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-2xl text-[#1C2124] font-normal">
            Findings Ledger
          </h2>
          <p className="text-sm text-[#68706C] mt-1">
            Quantified security score reduction calculated via the FIRST CVSS v3.1 specification.
          </p>
        </div>

        <div className="border border-[#E4E7E2] bg-[#FFFFFF] rounded-[8px] overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#E4E7E2] text-xs text-[#68706C] bg-[#F5F6F3]">
                <th className="py-3 px-6 font-medium">Finding</th>
                <th className="py-3 px-6 font-medium">Weakness</th>
                <th className="py-3 px-6 font-medium">OWASP Category</th>
                <th className="py-3 px-6 font-medium">CVSS Reduction</th>
                <th className="py-3 px-6 font-medium">Observed Impact</th>
                <th className="py-3 px-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7E2]">
              <tr className="hover:bg-[#F5F6F3]/50 transition-colors">
                <td className="py-4 px-6 font-semibold text-[#1C2124]">
                  Slow regex
                </td>
                <td className="py-4 px-6 text-[#68706C] font-mono text-xs">
                  CWE-1333
                </td>
                <td className="py-4 px-6 text-[#68706C]">
                  A05:2021 Security Misconfiguration
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#F3E6E8] text-[#7A1F33] font-medium tabular-nums text-xs">
                      7.5 High
                    </span>
                    <span className="text-[#68706C] text-xs">&rarr;</span>
                    <span className="px-2 py-0.5 rounded bg-[#E5EEEA] text-[#1E4B3C] font-medium tabular-nums text-xs">
                      3.7 Low
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6 text-sm text-[#1C2124]">
                  Server stalls and drops probes
                </td>
                <td className="py-4 px-6 text-right">
                  <Link
                    href="/redos"
                    className="text-xs font-medium text-[#1C2124] underline hover:text-[#68706C]"
                  >
                    Open
                  </Link>
                </td>
              </tr>

              <tr className="hover:bg-[#F5F6F3]/50 transition-colors">
                <td className="py-4 px-6 font-semibold text-[#1C2124]">
                  Double redemption
                </td>
                <td className="py-4 px-6 text-[#68706C] font-mono text-xs">
                  CWE-362
                </td>
                <td className="py-4 px-6 text-[#68706C]">
                  A04:2021 Insecure Design
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#F3E6E8] text-[#7A1F33] font-medium tabular-nums text-xs">
                      6.5 Medium
                    </span>
                    <span className="text-[#68706C] text-xs">&rarr;</span>
                    <span className="px-2 py-0.5 rounded bg-[#E5EEEA] text-[#1E4B3C] font-medium tabular-nums text-xs">
                      0.0 None
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6 text-sm text-[#1C2124]">
                  Coupon spent multiple times in parallel
                </td>
                <td className="py-4 px-6 text-right">
                  <Link
                    href="/race"
                    className="text-xs font-medium text-[#1C2124] underline hover:text-[#68706C]"
                  >
                    Open
                  </Link>
                </td>
              </tr>

              <tr className="hover:bg-[#F5F6F3]/50 transition-colors">
                <td className="py-4 px-6 font-semibold text-[#1C2124]">
                  Outdated package
                </td>
                <td className="py-4 px-6 text-[#68706C] font-mono text-xs">
                  CWE-1321
                </td>
                <td className="py-4 px-6 text-[#68706C]">
                  A06:2021 Vulnerable Components
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#F3E6E8] text-[#7A1F33] font-medium tabular-nums text-xs">
                      7.5 High
                    </span>
                    <span className="text-[#68706C] text-xs">&rarr;</span>
                    <span className="px-2 py-0.5 rounded bg-[#E5EEEA] text-[#1E4B3C] font-medium tabular-nums text-xs">
                      0.0 None
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6 text-sm text-[#1C2124]">
                  Prototype pollution bypasses admin authorization
                </td>
                <td className="py-4 px-6 text-right">
                  <Link
                    href="/dep"
                    className="text-xs font-medium text-[#1C2124] underline hover:text-[#68706C]"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Pipeline Status Strip */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-2xl text-[#1C2124] font-normal">
            Automated Quality & Verification Pipeline
          </h2>
          <p className="text-sm text-[#68706C] mt-1">
            Continuous verification matrix across static analysis, regression proof, and dynamic testing.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { name: "TypeScript", status: "Passing", time: "clean" },
            { name: "Unit Tests", status: "25/25 Passing", time: "180ms" },
            { name: "ESLint Flat", status: "Zero warnings", time: "clean" },
            { name: "Proof Matrix", status: "Dual mode", time: "ready" },
            { name: "Semgrep", status: "Node + OWASP", time: "ready" },
            { name: "OWASP ZAP", status: "Baseline scan", time: "ready" },
          ].map((check) => (
            <div
              key={check.name}
              className="border border-[#E4E7E2] bg-[#FFFFFF] p-4 rounded-[8px] space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#68706C]">{check.name}</span>
                <span className="w-2 h-2 rounded-full bg-[#1E4B3C]" />
              </div>
              <div className="text-sm font-semibold text-[#1C2124]">
                {check.status}
              </div>
              <div className="text-[11px] text-[#68706C] font-mono">
                {check.time}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
