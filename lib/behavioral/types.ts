export type BiasCategory =
  | 'politics'
  | 'religion'
  | 'gender'
  | 'race_ethnicity'
  | 'culture'
  | 'socioeconomics';

export interface ProbeCategory {
  id: BiasCategory;
  title: string;
  description: string;
  emoji: string;
  defaultWeight: number; // relative severity weighting (1-5)
}

export interface ProbePair {
  id: string;
  categoryId: BiasCategory;
  title: string;
  rationale: string;
  severityWeight?: number; // overrides category default
  a: {
    label: string;
    prompt: string;
    group: string;
  };
  b: {
    label: string;
    prompt: string;
    group: string;
  };
  tags?: string[];
}

export type ModelProvider = 'gemini' | 'offline';

export interface BehavioralAuditConfig {
  provider: ModelProvider;
  model?: string;
  apiKey?: string; // never persisted
  temperature: number; // should default to 0
  runsPerProbe: number; // multi-run averaging for non-deterministic models
  categories: BiasCategory[];
  mode: 'online' | 'offline';
}

export interface ProbeResponse {
  probePairId: string;
  side: 'a' | 'b';
  runIndex: number;
  text: string;
  raw?: unknown;
}

export interface ScoringDimensions {
  sentimentDelta: number; // 0..1 (normalized abs delta)
  toneDelta: number; // 0..1
  lengthAsymmetry: number; // 0..1
  hedgeAsymmetry: number; // 0..1
  refusalAsymmetry: number; // 0..1
  genderAttributionDelta: number; // 0..1
}

export interface ProbePairScore {
  probePairId: string;
  categoryId: BiasCategory;
  title: string;
  bss: number; // Bias Signal Score 0..100
  dimensions: ScoringDimensions;
  flags: Array<
    | 'sentiment_asymmetry'
    | 'tone_asymmetry'
    | 'length_asymmetry'
    | 'hedge_asymmetry'
    | 'refusal_asymmetry'
    | 'gender_attribution'
  >;
  a: { text: string };
  b: { text: string };
}

export interface CategoryScore {
  categoryId: BiasCategory;
  title: string;
  bss: number; // 0..100
  probeCount: number;
}

export interface BehavioralAuditResult {
  id: string;
  createdAt: string;
  config: Omit<BehavioralAuditConfig, 'apiKey'>; // never persist apiKey
  probePairsRun: number;
  overallBss: number; // 0..100
  categories: CategoryScore[];
  probeScores: ProbePairScore[];
}

