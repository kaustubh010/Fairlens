// Core types for FairLens Bias Audit Platform

export interface DatasetColumn {
  name: string;
  type: 'numeric' | 'categorical' | 'boolean' | 'string';
  nullCount: number;
  uniqueValues: number;
  sampleValues: (string | number | boolean)[];
  distribution?: Record<string, number>;
  stats?: {
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    stdDev?: number;
  };
}

export interface Dataset {
  id: string;
  name: string;
  rows: Record<string, unknown>[];
  columns: DatasetColumn[];
  rowCount: number;
  uploadedAt: Date;
}

export interface ProtectedAttribute {
  column: string;
  groups: string[];
  referenceGroup?: string;
}

export interface AuditConfig {
  datasetId: string;
  protectedAttributes: ProtectedAttribute[];
  outcomeColumn: string;
  predictedColumn?: string;
  probabilityColumn?: string;
  positiveOutcomeValue: string | number | boolean;
  thresholds: FairnessThresholds;
}

export interface FairnessThresholds {
  disparateImpactRatio: number; // >= 0.80
  equalOpportunityDiff: number; // <= 0.05
  predictiveParityDiff: number; // <= 0.05
  calibrationGap: number; // <= 0.05
  representationIndexMin: number; // >= 0.80
  representationIndexMax: number; // <= 1.20
}

export const DEFAULT_THRESHOLDS: FairnessThresholds = {
  disparateImpactRatio: 0.80,
  equalOpportunityDiff: 0.05,
  predictiveParityDiff: 0.05,
  calibrationGap: 0.05,
  representationIndexMin: 0.80,
  representationIndexMax: 1.20,
};

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'pass';

export interface MetricResult {
  name: string;
  displayName: string;
  description: string;
  value: number;
  threshold: number;
  passed: boolean;
  severity: SeverityLevel;
  affectedGroups: GroupMetric[];
  comparisonType: 'ratio' | 'difference';
}

export interface GroupMetric {
  group: string;
  value: number;
  sampleSize: number;
  isReference: boolean;
}

export interface ProxyCorrelation {
  feature: string;
  protectedAttribute: string;
  correlationCoefficient: number;
  pValue: number;
  isSignificant: boolean;
}

export interface BiasAuditResult {
  id: string;
  datasetId: string;
  datasetName: string;
  auditedAt: Date;
  config: AuditConfig;
  metrics: MetricResult[];
  overallSeverity: SeverityLevel;
  overallScore: number; // 0-100
  proxyCorrelations: ProxyCorrelation[];
  representationAnalysis: RepresentationAnalysis[];
  recommendations: Recommendation[];
  aiExplanation?: AIExplanation;
}

export interface RepresentationAnalysis {
  protectedAttribute: string;
  groups: {
    group: string;
    count: number;
    percentage: number;
    representationIndex: number;
    status: 'underrepresented' | 'overrepresented' | 'balanced';
  }[];
}

export interface Recommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'data' | 'model' | 'threshold' | 'process';
  title: string;
  description: string;
  affectedMetrics: string[];
  expectedImpact: string;
}

export interface AIExplanation {
  executiveSummary: string;
  technicalSummary: string;
  keyFindings: string[];
  riskAssessment: {
    eeocCompliance: 'compliant' | 'at_risk' | 'non_compliant';
    euAiActCompliance: 'compliant' | 'at_risk' | 'non_compliant';
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
  };
  actionItems: string[];
  generatedAt: Date;
}

export interface AuditReport {
  audit: BiasAuditResult;
  generatedAt: Date;
  format: 'pdf' | 'json';
}
