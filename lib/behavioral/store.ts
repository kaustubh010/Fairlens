import type { BehavioralAuditResult } from './types';

// In-memory store (dev/MVP). Swap to Prisma later without changing API surface.
const behavioralAudits = new Map<string, BehavioralAuditResult>();

export function storeBehavioralAudit(audit: BehavioralAuditResult): void {
  behavioralAudits.set(audit.id, audit);
}

export function getBehavioralAudit(id: string): BehavioralAuditResult | undefined {
  return behavioralAudits.get(id);
}

export function getAllBehavioralAudits(): BehavioralAuditResult[] {
  return Array.from(behavioralAudits.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

