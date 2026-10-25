import React from "react";
import { FINDINGS } from "@proofline/core";

export default function FindingsPage() {
  return (
    <div className="space-y-8 pb-16">
      <section className="space-y-2 border-b border-[#E4E7E2] pb-6">
        <h1 className="font-display text-3xl sm:text-4xl text-[#1C2124] font-normal">
          Findings Ledger
        </h1>
        <p className="text-base text-[#68706C]">
          Systematic weakness inventory with official CVSS v3.1 base score vectors before and after remediation.
        </p>
      </section>

      <div className="border border-[#E4E7E2] bg-[#FFFFFF] rounded-[8px] overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#E4E7E2] text-xs text-[#68706C] bg-[#F5F6F3]">
              <th className="py-3 px-6 font-medium">Finding</th>
              <th className="py-3 px-6 font-medium">Weakness</th>
              <th className="py-3 px-6 font-medium">OWASP</th>
              <th className="py-3 px-6 font-medium">Vulnerable Vector</th>
              <th className="py-3 px-6 font-medium">Hardened Vector</th>
              <th className="py-3 px-6 font-medium text-right">Score Delta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E7E2]">
            {FINDINGS.map((finding) => (
              <tr key={finding.id} className="hover:bg-[#F5F6F3]/50 transition-colors">
                <td className="py-4 px-6 font-semibold text-[#1C2124]">
                  {finding.title}
                </td>
                <td className="py-4 px-6 text-[#68706C] font-mono text-xs">
                  {finding.cwe}
                </td>
                <td className="py-4 px-6 text-[#68706C] text-xs">
                  {finding.owasp}
                </td>
                <td className="py-4 px-6 font-mono text-[11px] text-[#7A1F33]">
                  {finding.vectorVulnerable}
                </td>
                <td className="py-4 px-6 font-mono text-[11px] text-[#1E4B3C]">
                  {finding.vectorHardened}
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#F3E6E8] text-[#7A1F33] font-medium tabular-nums text-xs">
                      {finding.scoreVulnerable.score} {finding.scoreVulnerable.rating}
                    </span>
                    <span className="text-[#68706C] text-xs">&rarr;</span>
                    <span className="px-2 py-0.5 rounded bg-[#E5EEEA] text-[#1E4B3C] font-medium tabular-nums text-xs">
                      {finding.scoreHardened.score} {finding.scoreHardened.rating}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
