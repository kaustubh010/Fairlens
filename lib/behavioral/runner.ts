import type { BehavioralAuditConfig, BehavioralAuditResult, CategoryScore, ProbePairScore } from './types';
import { getCategoryById, getProbePairsForCategories, getQuickAuditProbePairs, getFullAuditProbePairs } from './probes';
import { scoreProbePair } from './scoring';
import { generateAiExplanation } from './providers/explainer';

export interface OfflineProbePairInput {
  probePairId: string;
  aText: string;
  bText: string;
}

function avg(nums: number[]): number {
  return nums.length === 0 ? 0 : nums.reduce((a, b) => a + b, 0) / nums.length;
}

function buildCategories(probeScores: ProbePairScore[]): CategoryScore[] {
  const catMap = new Map<string, ProbePairScore[]>();
  for (const s of probeScores) {
    if (!catMap.has(s.categoryId)) catMap.set(s.categoryId, []);
    catMap.get(s.categoryId)!.push(s);
  }
  return Array.from(catMap.entries()).map(([categoryId, scores]) => {
    const cat = getCategoryById(categoryId as any);
    return {
      categoryId: categoryId as any,
      title: cat?.title ?? categoryId,
      bss: Math.round(avg(scores.map(s => s.bss))),
      probeCount: scores.length,
    };
  });
}

/**
 * Run a behavioral audit from pasted text inputs.
 * Scoring is entirely deterministic NLP — no external API calls here.
 * Optionally generates an AI explanation via Gemini after scoring.
 */
export async function runBehavioralAudit(
  config: BehavioralAuditConfig,
  inputs: OfflineProbePairInput[]
): Promise<BehavioralAuditResult> {
  const probePairs =
    config.bundle === 'quick' ? getQuickAuditProbePairs()
    : config.bundle === 'full' ? getFullAuditProbePairs()
    : getProbePairsForCategories(config.categories);

  const byId = new Map(inputs.map(i => [i.probePairId, i]));

  const probeScores: ProbePairScore[] = probePairs.map(pair => {
    const inp = byId.get(pair.id);
    return scoreProbePair(pair, inp?.aText ?? '', inp?.bText ?? '');
  });

  const categories = buildCategories(probeScores);
  const overallBss = Math.round(avg(probeScores.map(s => s.bss)));

  const audit: Omit<BehavioralAuditResult, 'aiExplanation'> = {
    id: `ba_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    config,
    probePairsRun: probePairs.length,
    overallBss,
    categories,
    probeScores,
  };

  // AI explanation is generated AFTER scoring, using Gemini only for narration
  let aiExplanation: BehavioralAuditResult['aiExplanation'];
  if (config.geminiApiKey?.trim()) {
    try {
      aiExplanation = await generateAiExplanation(audit, {
        apiKey: config.geminiApiKey.trim(),
        model: 'gemini-1.5-flash',
        temperature: 0.3,
      });
    } catch {
      // Explanation is optional — scoring is already complete without it
      aiExplanation = undefined;
    }
  }

  return { ...audit, aiExplanation };
}
