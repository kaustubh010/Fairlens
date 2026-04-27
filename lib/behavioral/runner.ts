import type {
  BehavioralAuditConfig,
  BehavioralAuditResult,
  ProbePair,
  ProbePairScore,
} from './types';
import { getCategoryById, getProbePairsForCategories } from './probes';
import { scoreProbePair } from './scoring';
import { geminiComplete } from './providers/gemini';

export interface OfflineProbePairInputs {
  probePairId: string;
  aText: string;
  bText: string;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function uniqueBy<T>(items: T[], keyFn: (t: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const i of items) {
    const k = keyFn(i);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(i);
  }
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < retries) await sleep(500 * Math.pow(2, i));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Request failed after retries');
}

export async function runBehavioralAuditOnline(config: BehavioralAuditConfig): Promise<BehavioralAuditResult> {
  const probePairs = getProbePairsForCategories(config.categories);
  const scores: ProbePairScore[] = [];

  if (config.provider !== 'gemini') throw new Error('Gemini is the only online provider in this version.');
  if (!config.apiKey) throw new Error('API key is required for online audits.');
  if (!config.model) throw new Error('Model is required for online audits.');

  const runs = Math.max(1, Math.min(10, config.runsPerProbe || 1));
  const temperature = typeof config.temperature === 'number' ? config.temperature : 0;

  for (const pair of probePairs) {
    const aRuns: string[] = [];
    const bRuns: string[] = [];

    for (let i = 0; i < runs; i++) {
      const a = await withRetry(() =>
        geminiComplete({ apiKey: config.apiKey!, model: config.model!, temperature }, pair.a.prompt)
      );
      const b = await withRetry(() =>
        geminiComplete({ apiKey: config.apiKey!, model: config.model!, temperature }, pair.b.prompt)
      );
      aRuns.push(a.text);
      bRuns.push(b.text);
      // Lightweight rate-limit guard to avoid bursting provider APIs.
      await sleep(120);
    }

    // For MVP we score against the first run, and treat multi-run as “stability” input later.
    const s = scoreProbePair(pair, aRuns[0] ?? '', bRuns[0] ?? '');
    scores.push(s);
  }

  return summarizeAudit(config, probePairs, scores);
}

export async function runBehavioralAuditOffline(
  config: BehavioralAuditConfig,
  inputs: OfflineProbePairInputs[]
): Promise<BehavioralAuditResult> {
  const probePairs = getProbePairsForCategories(config.categories);
  const byId = new Map(inputs.map((i) => [i.probePairId, i]));

  const scores = probePairs.map((pair) => {
    const found = byId.get(pair.id);
    return scoreProbePair(pair, found?.aText ?? '', found?.bText ?? '');
  });

  return summarizeAudit(config, probePairs, scores);
}

function summarizeAudit(
  config: BehavioralAuditConfig,
  probePairs: ProbePair[],
  probeScores: ProbePairScore[]
): BehavioralAuditResult {
  const categories = uniqueBy(
    probePairs.map((p) => p.categoryId),
    (c) => c
  );

  const categoryScores = categories.map((categoryId) => {
    const cat = getCategoryById(categoryId);
    const these = probeScores.filter((s) => s.categoryId === categoryId);
    const bss = Math.round(avg(these.map((s) => s.bss)));
    return {
      categoryId,
      title: cat?.title ?? categoryId,
      bss,
      probeCount: these.length,
    };
  });

  const overallBss = Math.round(avg(probeScores.map((s) => s.bss)));

  const { apiKey: _apiKey, ...safeConfig } = config;
  return {
    id: `ba_${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    config: safeConfig,
    probePairsRun: probePairs.length,
    overallBss,
    categories: categoryScores,
    probeScores,
  };
}

