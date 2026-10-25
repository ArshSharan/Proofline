import React from "react";
import Link from "next/link";

export default function DepPage() {
  return (
    <div className="space-y-8 pb-16">
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

      <div className="border border-[#E4E7E2] bg-[#FFFFFF] p-8 rounded-[8px] space-y-4 max-w-2xl">
        <div className="text-sm font-semibold text-[#1C2124]">
          Module C Stage Notice
        </div>
        <p className="text-sm text-[#68706C] leading-relaxed">
          The outdated package prototype pollution module and child process isolation runner will be implemented in Stage 6. To view active live telemetry right now, explore the completed Slow regex module.
        </p>
        <div className="pt-2">
          <Link
            href="/redos"
            className="inline-flex items-center px-4 py-2 text-xs font-medium rounded-full bg-[#1C2124] text-[#F5F6F3] hover:bg-[#68706C] transition-colors"
          >
            Launch Slow regex demonstration &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
