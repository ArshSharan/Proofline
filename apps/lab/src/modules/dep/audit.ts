import type { AuditAdvisory } from "@proofline/core";

export const STORED_AUDIT_FIXTURE: AuditAdvisory[] = [
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

export interface AuditSummaryResult {
  findings: AuditAdvisory[];
  source: "live" | "fixture";
  totalCount: number;
}

export function getAuditSummary(): AuditSummaryResult {
  return {
    findings: STORED_AUDIT_FIXTURE,
    source: "fixture",
    totalCount: STORED_AUDIT_FIXTURE.length,
  };
}
