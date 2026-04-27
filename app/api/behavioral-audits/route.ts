import { NextResponse } from 'next/server';
import { getAllBehavioralAudits } from '@/lib/behavioral/store';

export async function GET() {
  const audits = getAllBehavioralAudits();
  return NextResponse.json({
    audits: audits.map((a) => ({
      id: a.id,
      createdAt: a.createdAt,
      overallBss: a.overallBss,
      categories: a.categories,
      probePairsRun: a.probePairsRun,
      bundle: a.config.bundle,
    })),
  });
}

