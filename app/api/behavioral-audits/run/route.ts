import { NextRequest, NextResponse } from 'next/server';
import type { BehavioralAuditConfig, BiasCategory } from '@/lib/behavioral/types';
import { storeBehavioralAudit } from '@/lib/behavioral/store';
import { runBehavioralAuditOffline, runBehavioralAuditOnline } from '@/lib/behavioral/runner';

type RunRequest =
  | {
      config: BehavioralAuditConfig;
      mode: 'online';
    }
  | {
      config: BehavioralAuditConfig;
      mode: 'offline';
      inputs: Array<{ probePairId: string; aText: string; bText: string }>;
    };

function normalizeCategories(categories: unknown): BiasCategory[] {
  const allowed: BiasCategory[] = [
    'politics',
    'religion',
    'gender',
    'race_ethnicity',
    'culture',
    'socioeconomics',
  ];
  const set = new Set(allowed);
  if (!Array.isArray(categories)) return [];
  return categories.filter((c): c is BiasCategory => typeof c === 'string' && set.has(c as BiasCategory));
}

export async function POST(req: NextRequest) {
  try {
    const body: RunRequest = await req.json();
    const config = body.config;

    if (!config) return NextResponse.json({ error: 'Missing config' }, { status: 400 });
    const categories = normalizeCategories((config as any).categories);
    if (categories.length === 0) return NextResponse.json({ error: 'Select at least one category' }, { status: 400 });

    const normalizedConfig: BehavioralAuditConfig = {
      ...config,
      categories,
      temperature: typeof config.temperature === 'number' ? config.temperature : 0,
      runsPerProbe: typeof config.runsPerProbe === 'number' ? config.runsPerProbe : 1,
      mode: body.mode,
    };

    if (body.mode === 'online') {
      if (normalizedConfig.provider !== 'gemini') {
        return NextResponse.json({ error: 'Only Gemini online runs are supported.' }, { status: 400 });
      }
      if (!normalizedConfig.apiKey || !normalizedConfig.model) {
        return NextResponse.json({ error: 'Gemini API key and model are required.' }, { status: 400 });
      }
    }

    const audit =
      body.mode === 'offline'
        ? await runBehavioralAuditOffline(normalizedConfig, body.inputs ?? [])
        : await runBehavioralAuditOnline(normalizedConfig);

    storeBehavioralAudit(audit);
    return NextResponse.json({ success: true, audit });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to run behavioral audit';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

