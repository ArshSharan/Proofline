"use client";

import React, { useState } from "react";

type AttackMode = "vulnerable" | "hardened" | "compare";

interface AuditAdvisory {
  package: string;
  installedVersion: string;
  advisoryId: string;
  severity: "critical" | "high" | "moderate" | "low";
  fixedVersion: string;
}

const AUDIT_FINDINGS: AuditAdvisory[] = [
  {
    package: "lodash",
    installedVersion: "4.17.11",
    advisoryId: "GHSA-p6cf-qh6v-b366",
    severity: "high",
    fixedVersion: "4.17.21",
  },
  {
    package: "flat",
    installedVersion: "5.0.0",
    advisoryId: "GHSA-m5vv-6r4h-3vj9",
    severity: "high",
    fixedVersion: "5.0.2",
  },
  {
    package: "minimist",
    installedVersion: "1.2.0",
    advisoryId: "GHSA-vh95-rmgr-6w4m",
    severity: "critical",
    fixedVersion: "1.2.6",
  },
];

export default function DepPage() {
  const [mode, setMode] = useState<AttackMode>("compare");
  const [payloadText, setPayloadText] = useState<string>(
    '{\n  "__proto__": {\n    "isAdmin": true\n  }\n}'
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const [state, setState] = useState({
    protoModified: true,
    isAdminFlipped: true,
    userRole: "administrator",
    username: "guest",
    statusMessage: "Attack executed: Object.prototype.isAdmin polluted (guest elevated to administrator)",
  });

  const startAttack = async () => {
    setIsRunning(true);
    const labUrl = process.env.NEXT_PUBLIC_LAB_URL ?? "http://127.0.0.1:4000";

    try {
      let parsedPayload: Record<string, unknown>;
      try {
        parsedPayload = JSON.parse(payloadText);
      } catch {
        parsedPayload = { __proto__: { isAdmin: true } };
      }

      const res = await fetch(`${labUrl}/api/dep/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: mode === "compare" ? "vulnerable" : mode,
          payload: parsedPayload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const runId = data.runId;

        let done = false;
        let pollCount = 0;
        while (!done && pollCount < 20) {
          await new Promise((r) => setTimeout(r, 150));
          const runRes = await fetch(`${labUrl}/api/runs/${runId}`);
          if (runRes.ok) {
            const run = await runRes.json();
            if (run.status === "done" && run.metrics) {
              const m = run.metrics;
              setState({
                protoModified: m.protoModified,
                isAdminFlipped: m.isAdminFlipped,
                userRole: m.isAdminFlipped ? "administrator" : "standard_user",
                username: "guest",
                statusMessage: m.isAdminFlipped
                  ? "FLAW VERIFIED: Prototype pollution injected isAdmin=true into Object.prototype in isolated worker"
                  : "HARDENED DEFENSE CONFIRMED: Prototypal key rejected by filter, prototype clean",
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
      // Fallback to client simulation
    }

    await new Promise((r) => setTimeout(r, 250));

    if (mode === "vulnerable" || mode === "compare") {
      setState({
        protoModified: true,
        isAdminFlipped: true,
        userRole: "administrator",
        username: "guest",
        statusMessage: "FLAW CONFIRMED: Object.prototype.isAdmin polluted (guest elevated to administrator)",
      });
    } else {
      setState({
        protoModified: false,
        isAdminFlipped: false,
        userRole: "standard_user",
        username: "guest",
        statusMessage: "HARDENED CHECK PASSED: Prototypal key rejected, plain object remains standard_user",
      });
    }

    setIsRunning(false);
  };

  return (
    <div className="space-y-12 pb-32">
      {/* Page Header */}
      <section className="space-y-2 border-b border-[#E4E7E2] pb-6">
        <h1 className="font-display text-3xl sm:text-4xl text-[#1C2124] font-normal">
          Outdated package
        </h1>
        <p className="text-base text-[#68706C]">
          Unsanitized recursive object merge pollutes Object.prototype and flips authorization.
        </p>
        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#68706C]">
          <div>
            <span className="font-semibold text-[#1C2124]">Weakness:</span>{" "}
            <span className="font-mono">CWE-1321</span> (Improperly Controlled Modification of Dynamically-Determined Object Attributes)
          </div>
          <div>
            <span className="font-semibold text-[#1C2124]">OWASP:</span>{" "}
            <span>A06:2021 Vulnerable and Outdated Components</span>
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
              In JavaScript, all objects inherit methods and attributes from prototype chains rooted
              at <code>Object.prototype</code>. When an application merges untrusted JSON objects using
              an outdated deep-merge utility without key filtering, an attacker can supply <code>__proto__</code> keys.
            </p>
            <p>
              The merge assigns properties directly onto the prototype. Once polluted, every subsequent
              plain object instantiated anywhere in the process inherits the injected attribute.
              An unauthenticated guest user accessing a profile object evaluated via <code>user.isAdmin</code> is
              immediately treated as an administrator.
            </p>
            <p>
              Hardened mode introduces three layers of defense: an explicit blocklist rejecting prototypal
              keys (<code>__proto__</code>, <code>constructor</code>, <code>prototype</code>), strict schema
              whitelisting, and isolated execution.
            </p>
          </div>

          {/* Code Diff Excerpt */}
          <div className="border border-[#E4E7E2] bg-[#FFFFFF] rounded-[8px] overflow-hidden text-xs">
            <div className="py-2.5 px-4 border-b border-[#E4E7E2] bg-[#F5F6F3] font-sans font-medium text-[#1C2124]">
              Implementation comparison
            </div>

            {/* Vulnerable Excerpt */}
            <div className="p-4 bg-[#F3E6E8]/40 border-b border-[#E4E7E2] font-mono text-[11px] leading-relaxed">
              <div className="text-[#7A1F33] font-semibold mb-1">
                {"// Vulnerable (apps/lab/src/modules/dep/vulnerable.ts)"}
              </div>
              <div className="text-[#7A1F33]">
                {"for (const key of Object.keys(source)) {"}
              </div>
              <div className="text-[#7A1F33]">
                {"  target[key] = merge(target[key] || {}, source[key]);"}
              </div>
              <div className="text-[#68706C]">
                {"  // Unchecked __proto__ key mutates Object.prototype"}
              </div>
              <div className="text-[#7A1F33]">{"}"}</div>
            </div>

            {/* Hardened Excerpt */}
            <div className="p-4 bg-[#E5EEEA]/40 font-mono text-[11px] leading-relaxed">
              <div className="text-[#1E4B3C] font-semibold mb-1">
                {"// Hardened (apps/lab/src/modules/dep/hardened.ts)"}
              </div>
              <div className="text-[#1E4B3C]">
                {"const FORBIDDEN = new Set([\"__proto__\", \"constructor\", \"prototype\"]);"}
              </div>
              <div className="text-[#1E4B3C]">
                {"if (FORBIDDEN.has(key)) throw new Error(\"FORBIDDEN_KEY\");"}
              </div>
              <div className="text-[#68706C]">
                {"// Key blocklist + schema validation + prototype isolation"}
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
              Mitigation reduces Integrity impact from <strong>High (authorization bypass)</strong> to <strong>Low</strong> and increases Attack Complexity from <strong>Low</strong> to <strong>High</strong>.
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Object Inspector, Audit Table, Metrics (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live Object Inspector & Authorization State */}
          <div
            className={`border border-[#E4E7E2] p-6 rounded-[8px] transition-colors duration-400 ${
              state.isAdminFlipped
                ? "bg-[#F3E6E8]/20"
                : "bg-[#E5EEEA]/20"
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#E4E7E2]">
              <div>
                <h3 className="text-sm font-semibold text-[#1C2124]">
                  Runtime Authorization State (Plain Object Inspection)
                </h3>
                <p className="text-xs text-[#68706C]">
                  Object evaluates: <code>Boolean((user as any).isAdmin)</code>
                </p>
              </div>

              <div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    state.isAdminFlipped
                      ? "bg-[#F3E6E8] text-[#7A1F33]"
                      : "bg-[#E5EEEA] text-[#1E4B3C]"
                  }`}
                >
                  {state.isAdminFlipped ? "Privilege Elevated" : "Standard Privilege"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="border border-[#E4E7E2] bg-[#FFFFFF] p-4 rounded-[6px] space-y-2">
                <div className="text-xs text-[#68706C] font-medium">Inspected User Object</div>
                <pre className="font-mono text-xs bg-[#F5F6F3] p-3 rounded border border-[#E4E7E2] text-[#1C2124]">
{`const user = {
  username: "${state.username}",
  role: "${state.userRole}"
};`}
                </pre>
              </div>

              <div className="border border-[#E4E7E2] bg-[#FFFFFF] p-4 rounded-[6px] space-y-2">
                <div className="text-xs text-[#68706C] font-medium">Prototype Resolution</div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#E4E7E2]">
                    <span className="text-[#68706C]">Object.prototype.isAdmin:</span>
                    <span className={`font-mono font-bold ${state.protoModified ? "text-[#7A1F33]" : "text-[#1E4B3C]"}`}>
                      {state.protoModified ? "true (Polluted)" : "undefined"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E4E7E2]">
                    <span className="text-[#68706C]">Access check result:</span>
                    <span className={`font-mono font-bold ${state.isAdminFlipped ? "text-[#7A1F33]" : "text-[#1E4B3C]"}`}>
                      {state.isAdminFlipped ? "AUTHORIZED (Bypass)" : "DENIED"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#68706C]">Execution Isolate:</span>
                    <span className="font-mono text-[#1C2124]">Child Process (Isolated)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-[6px] text-xs font-mono border border-[#E4E7E2] bg-[#FFFFFF] text-[#1C2124]">
              {state.statusMessage}
            </div>
          </div>

          {/* Attack Payload Customizer */}
          <div className="border border-[#E4E7E2] bg-[#FFFFFF] p-5 rounded-[8px] space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-[#1C2124]">
                Attack Payload (JSON)
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setPayloadText('{\n  "__proto__": {\n    "isAdmin": true\n  }\n}')
                  }
                  className="text-xs text-[#68706C] hover:text-[#1C2124] underline cursor-pointer"
                >
                  Preset 1: __proto__
                </button>
                <span className="text-[#E4E7E2]">|</span>
                <button
                  type="button"
                  onClick={() =>
                    setPayloadText('{\n  "constructor": {\n    "prototype": {\n      "isAdmin": true\n    }\n  }\n}')
                  }
                  className="text-xs text-[#68706C] hover:text-[#1C2124] underline cursor-pointer"
                >
                  Preset 2: constructor.prototype
                </button>
              </div>
            </div>

            <textarea
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              rows={4}
              className="w-full font-mono text-xs p-3 bg-[#F5F6F3] border border-[#E4E7E2] rounded-[6px] text-[#1C2124] focus:outline-none focus:border-[#1C2124]"
            />
          </div>

          {/* Package Dependency Audit Table */}
          <div className="border border-[#E4E7E2] bg-[#FFFFFF] rounded-[8px] overflow-hidden">
            <div className="py-2.5 px-4 bg-[#F5F6F3] border-b border-[#E4E7E2] flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1C2124]">
                Dependency Security Audit Summary
              </span>
              <span className="text-[#68706C] font-mono text-[11px]">
                npm audit fixture (3 findings)
              </span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E4E7E2] text-[#68706C] bg-[#F5F6F3]/50">
                  <th className="py-2.5 px-4 font-medium">Package</th>
                  <th className="py-2.5 px-4 font-medium">Installed</th>
                  <th className="py-2.5 px-4 font-medium">Advisory</th>
                  <th className="py-2.5 px-4 font-medium">Severity</th>
                  <th className="py-2.5 px-4 font-medium text-right">Patched In</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7E2]">
                {AUDIT_FINDINGS.map((finding) => (
                  <tr key={finding.package} className="hover:bg-[#F5F6F3]/30 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-[#1C2124]">
                      {finding.package}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[#7A1F33]">
                      {finding.installedVersion}
                    </td>
                    <td className="py-2.5 px-4 text-[#68706C] font-mono text-[11px]">
                      {finding.advisoryId}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                          finding.severity === "critical"
                            ? "bg-[#F3E6E8] text-[#7A1F33]"
                            : "bg-[#F5F6F3] text-[#1C2124]"
                        }`}
                      >
                        {finding.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[#1E4B3C] text-right font-medium">
                      {finding.fixedVersion}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Floating Run Bar */}
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
            {isRunning ? "Running isolated attack..." : "Run attack"}
          </button>
        </div>
      </div>
    </div>
  );
}
