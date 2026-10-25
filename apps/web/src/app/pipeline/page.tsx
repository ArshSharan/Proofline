import React from "react";

export default function PipelinePage() {
  const steps = [
    {
      name: "TypeScript Compilation",
      command: "npm run typecheck --workspaces",
      status: "Passing",
      description: "Strict null and type checking across lab, web, and core workspaces.",
    },
    {
      name: "Unit & Spec Test Matrix",
      command: "npm run test --workspaces",
      status: "Passing",
      description: "25 tests covering CVSS formulas, reference vectors, and ReDoS execution.",
    },
    {
      name: "ESLint Flat Analysis",
      command: "npm run lint --workspaces",
      status: "Passing",
      description: "TypeScript parser rules and core web vitals validation with zero warnings.",
    },
    {
      name: "Security Regression Proof",
      command: "npm run test:proof",
      status: "Configured",
      description: "Dual-mode test verification ensuring vulnerable flaws fail and hardened fixes pass.",
    },
    {
      name: "Semgrep Static Analysis",
      command: "semgrep scan --config p/owasp-top-ten",
      status: "Configured",
      description: "AST-based rule matching for CWE-1333, CWE-362, and CWE-1321 flaw patterns.",
    },
    {
      name: "OWASP ZAP Dynamic Scan",
      command: "zap-baseline.py -t http://localhost:4000",
      status: "Configured",
      description: "Automated baseline vulnerability scanner executed against hardened container.",
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      <section className="space-y-2 border-b border-[#E4E7E2] pb-6">
        <h1 className="font-display text-3xl sm:text-4xl text-[#1C2124] font-normal">
          Verification Pipeline
        </h1>
        <p className="text-base text-[#68706C]">
          Automated continuous quality, static analysis, and dynamic security validation suite.
        </p>
      </section>

      <div className="border border-[#E4E7E2] bg-[#FFFFFF] rounded-[8px] overflow-hidden divide-y divide-[#E4E7E2]">
        {steps.map((step) => (
          <div key={step.name} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm text-[#1C2124]">
                  {step.name}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#E5EEEA] text-[#1E4B3C]">
                  {step.status}
                </span>
              </div>
              <div className="text-xs text-[#68706C]">
                {step.description}
              </div>
            </div>

            <div className="font-mono text-xs text-[#68706C] bg-[#F5F6F3] px-3 py-1.5 rounded border border-[#E4E7E2] shrink-0">
              {step.command}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
