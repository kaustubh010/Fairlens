import { NextRequest, NextResponse } from 'next/server';
import type { BehavioralAuditConfig, BiasCategory } from '@/lib/behavioral/types';
import { storeBehavioralAudit } from '@/lib/behavioral/store';
import { runBehavioralAudit, type OfflineProbePairInput } from '@/lib/behavioral/runner';

function normalizeCategories(categories: unknown): BiasCategory[] {
  const allowed = new Set<string>(['politics', 'religion', 'gender', 'race_ethnicity', 'culture', 'socioeconomics']);
  if (!Array.isArray(categories)) return [];
  return categories.filter((c): c is BiasCategory => typeof c === 'string' && allowed.has(c));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { config: rawConfig, inputs } = body as {
      config: BehavioralAuditConfig;
      inputs: OfflineProbePairInput[];
    };

    if (!rawConfig) return NextResponse.json({ error: 'Missing config' }, { status: 400 });
    const categories = normalizeCategories((rawConfig as any).categories);

    const config: BehavioralAuditConfig = {
      categories,
      bundle: ['quick', 'full', 'custom'].includes(rawConfig.bundle) ? rawConfig.bundle : 'quick',
      geminiApiKey: typeof rawConfig.geminiApiKey === 'string' ? rawConfig.geminiApiKey : undefined,
    };

    if (!Array.isArray(inputs) || inputs.length === 0) {
      return NextResponse.json({ error: 'No probe inputs provided. Paste at least one response pair.' }, { status: 400 });
    }

    // At least some inputs must have non-empty text
    const hasContent = inputs.some(i => i.aText?.trim() || i.bText?.trim());
    if (!hasContent) {
      return NextResponse.json({ error: 'All inputs are empty. Paste model outputs before running.' }, { status: 400 });
    }

    const audit = await runBehavioralAudit(config, inputs);
    storeBehavioralAudit(audit);
    return NextResponse.json({ success: true, audit });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to run behavioral audit';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
