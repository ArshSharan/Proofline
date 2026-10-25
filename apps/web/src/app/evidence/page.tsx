"use client";

import React from "react";

export default function EvidencePage() {
  return (
    <div className="space-y-8 pb-16">
      <section className="space-y-2 border-b border-[#E4E7E2] pb-6">
        <h1 className="font-display text-3xl sm:text-4xl text-[#1C2124] font-normal">
          Evidence and Export
        </h1>
        <p className="text-base text-[#68706C]">
          Export structured JSON telemetry, CSV summaries, and print-ready report assets.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-[#E4E7E2] bg-[#FFFFFF] p-6 rounded-[8px] space-y-3">
          <h2 className="text-sm font-semibold text-[#1C2124]">Telemetry Export (JSON)</h2>
          <p className="text-xs text-[#68706C] leading-relaxed">
            Download raw metric samples, event loop delays, and paired run responses across all executed attack runs.
          </p>
          <button
            type="button"
            className="mt-2 px-4 py-2 text-xs font-medium rounded-full bg-[#1C2124] text-[#F5F6F3] hover:bg-[#68706C] transition-colors cursor-pointer"
            onClick={() => {
              const labUrl = process.env.NEXT_PUBLIC_LAB_URL ?? "http://127.0.0.1:4000";
              window.open(`${labUrl}/api/runs`, "_blank");
            }}
          >
            Export JSON Telemetry
          </button>
        </div>

        <div className="border border-[#E4E7E2] bg-[#FFFFFF] p-6 rounded-[8px] space-y-3">
          <h2 className="text-sm font-semibold text-[#1C2124]">Report Evidence (CSV)</h2>
          <p className="text-xs text-[#68706C] leading-relaxed">
            Export tabulated response time ladders and CVSS score deltas formatted for direct inclusion into project reports.
          </p>
          <button
            type="button"
            className="mt-2 px-4 py-2 text-xs font-medium rounded-full border border-[#1C2124] text-[#1C2124] hover:bg-[#F5F6F3] transition-colors cursor-pointer"
            onClick={() => {
              alert("CSV summary will be generated from active SQLite run store.");
            }}
          >
            Generate CSV Summary
          </button>
        </div>

        <div className="border border-[#E4E7E2] bg-[#FFFFFF] p-6 rounded-[8px] space-y-3">
          <h2 className="text-sm font-semibold text-[#1C2124]">Printable Report View</h2>
          <p className="text-xs text-[#68706C] leading-relaxed">
            Format charts and findings at A4 print dimensions suitable for PDF export and documentation appendices.
          </p>
          <button
            type="button"
            className="mt-2 px-4 py-2 text-xs font-medium rounded-full border border-[#1C2124] text-[#1C2124] hover:bg-[#F5F6F3] transition-colors cursor-pointer"
            onClick={() => window.print()}
          >
            Open Print Layout
          </button>
        </div>
      </div>
    </div>
  );
}
