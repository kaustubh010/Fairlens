// Statistical Fairness Metrics Engine
import {
  Dataset,
  AuditConfig,
  MetricResult,
  GroupMetric,
  SeverityLevel,
  ProxyCorrelation,
  RepresentationAnalysis,
  Recommendation,
  BiasAuditResult,
  DEFAULT_THRESHOLDS,
} from './types';

// Helper to get severity based on how far from threshold
function getSeverity(value: number, threshold: number, comparisonType: 'ratio' | 'difference'): SeverityLevel {
  if (comparisonType === 'ratio') {
    // For ratios like Disparate Impact (should be >= threshold)
    if (value >= threshold) return 'pass';
    if (value >= threshold * 0.9) return 'low';
    if (value >= threshold * 0.75) return 'medium';
    if (value >= threshold * 0.5) return 'high';
    return 'critical';
  } else {
    // For differences (should be <= threshold)
    if (value <= threshold) return 'pass';
    if (value <= threshold * 1.5) return 'low';
    if (value <= threshold * 2) return 'medium';
    if (value <= threshold * 3) return 'high';
    return 'critical';
  }
}

// Calculate confusion matrix for a group
interface ConfusionMatrix {
  tp: number; // True Positives
  fp: number; // False Positives
  tn: number; // True Negatives
  fn: number; // False Negatives
  total: number;
}

function calculateConfusionMatrix(
  rows: Record<string, unknown>[],
  outcomeColumn: string,
  predictedColumn: string,
  positiveValue: string | number | boolean
): ConfusionMatrix {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  
  for (const row of rows) {
    const actual = row[outcomeColumn];
    const predicted = row[predictedColumn];
    const actualPositive = String(actual) === String(positiveValue);
    const predictedPositive = String(predicted) === String(positiveValue);
    
    if (actualPositive && predictedPositive) tp++;
    else if (!actualPositive && predictedPositive) fp++;
    else if (!actualPositive && !predictedPositive) tn++;
    else if (actualPositive && !predictedPositive) fn++;
  }
  
  return { tp, fp, tn, fn, total: rows.length };
}

// 1. Disparate Impact Ratio (80% Rule)
// Ratio of positive outcome rates between protected and reference groups
export function calculateDisparateImpact(
  rows: Record<string, unknown>[],
  protectedColumn: string,
  outcomeColumn: string,
  positiveValue: string | number | boolean,
  referenceGroup: string,
  threshold: number = DEFAULT_THRESHOLDS.disparateImpactRatio
): MetricResult {
  const groups = new Map<string, { positive: number; total: number }>();
  
  for (const row of rows) {
    const group = String(row[protectedColumn]);
    const outcome = row[outcomeColumn];
    const isPositive = String(outcome) === String(positiveValue);
    
    if (!groups.has(group)) {
      groups.set(group, { positive: 0, total: 0 });
    }
    const g = groups.get(group)!;
    g.total++;
    if (isPositive) g.positive++;
  }
  
  const refData = groups.get(referenceGroup);
  if (!refData || refData.total === 0) {
    throw new Error(`Reference group "${referenceGroup}" not found or empty`);
  }
  
  const referenceRate = refData.positive / refData.total;
  
  const affectedGroups: GroupMetric[] = [];
  let worstRatio = 1;
  
  for (const [group, data] of groups) {
    const rate = data.total > 0 ? data.positive / data.total : 0;
    const ratio = referenceRate > 0 ? rate / referenceRate : 1;
    
    affectedGroups.push({
      group,
      value: ratio,
      sampleSize: data.total,
      isReference: group === referenceGroup,
    });
    
    if (group !== referenceGroup && ratio < worstRatio) {
      worstRatio = ratio;
    }
  }
  
  const passed = worstRatio >= threshold;
  
  return {
    name: 'disparate_impact',
    displayName: 'Disparate Impact Ratio',
    description: 'Ratio of positive outcome rates between protected and reference groups. A ratio below 0.80 indicates potential adverse impact under EEOC guidelines.',
    value: worstRatio,
    threshold,
    passed,
    severity: getSeverity(worstRatio, threshold, 'ratio'),
    affectedGroups,
    comparisonType: 'ratio',
  };
}

// 2. Equal Opportunity Difference
// Difference in True Positive Rates (TPR) between groups
export function calculateEqualOpportunity(
  rows: Record<string, unknown>[],
  protectedColumn: string,
  outcomeColumn: string,
  predictedColumn: string,
  positiveValue: string | number | boolean,
  referenceGroup: string,
  threshold: number = DEFAULT_THRESHOLDS.equalOpportunityDiff
): MetricResult {
  const groupRows = new Map<string, Record<string, unknown>[]>();
  
  for (const row of rows) {
    const group = String(row[protectedColumn]);
    if (!groupRows.has(group)) {
      groupRows.set(group, []);
    }
    groupRows.get(group)!.push(row);
  }
  
  const groupTPRs = new Map<string, { tpr: number; total: number }>();
  
  for (const [group, gRows] of groupRows) {
    const cm = calculateConfusionMatrix(gRows, outcomeColumn, predictedColumn, positiveValue);
    const tpr = (cm.tp + cm.fn) > 0 ? cm.tp / (cm.tp + cm.fn) : 0;
    groupTPRs.set(group, { tpr, total: gRows.length });
  }
  
  const refTPR = groupTPRs.get(referenceGroup)?.tpr ?? 0;
  
  const affectedGroups: GroupMetric[] = [];
  let maxDiff = 0;
  
  for (const [group, data] of groupTPRs) {
    const diff = Math.abs(data.tpr - refTPR);
    
    affectedGroups.push({
      group,
      value: data.tpr,
      sampleSize: data.total,
      isReference: group === referenceGroup,
    });
    
    if (group !== referenceGroup && diff > maxDiff) {
      maxDiff = diff;
    }
  }
  
  const passed = maxDiff <= threshold;
  
  return {
    name: 'equal_opportunity',
    displayName: 'Equal Opportunity Difference',
    description: 'Difference in True Positive Rates between groups. Measures whether the model has equal recall for positive cases across groups.',
    value: maxDiff,
    threshold,
    passed,
    severity: getSeverity(maxDiff, threshold, 'difference'),
    affectedGroups,
    comparisonType: 'difference',
  };
}

// 3. Predictive Parity
// Difference in Precision (Positive Predictive Value) between groups
export function calculatePredictiveParity(
  rows: Record<string, unknown>[],
  protectedColumn: string,
  outcomeColumn: string,
  predictedColumn: string,
  positiveValue: string | number | boolean,
  referenceGroup: string,
  threshold: number = DEFAULT_THRESHOLDS.predictiveParityDiff
): MetricResult {
  const groupRows = new Map<string, Record<string, unknown>[]>();
  
  for (const row of rows) {
    const group = String(row[protectedColumn]);
    if (!groupRows.has(group)) {
      groupRows.set(group, []);
    }
    groupRows.get(group)!.push(row);
  }
  
  const groupPPVs = new Map<string, { ppv: number; total: number }>();
  
  for (const [group, gRows] of groupRows) {
    const cm = calculateConfusionMatrix(gRows, outcomeColumn, predictedColumn, positiveValue);
    const ppv = (cm.tp + cm.fp) > 0 ? cm.tp / (cm.tp + cm.fp) : 0;
    groupPPVs.set(group, { ppv, total: gRows.length });
  }
  
  const refPPV = groupPPVs.get(referenceGroup)?.ppv ?? 0;
  
  const affectedGroups: GroupMetric[] = [];
  let maxDiff = 0;
  
  for (const [group, data] of groupPPVs) {
    const diff = Math.abs(data.ppv - refPPV);
    
    affectedGroups.push({
      group,
      value: data.ppv,
      sampleSize: data.total,
      isReference: group === referenceGroup,
    });
    
    if (group !== referenceGroup && diff > maxDiff) {
      maxDiff = diff;
    }
  }
  
  const passed = maxDiff <= threshold;
  
  return {
    name: 'predictive_parity',
    displayName: 'Predictive Parity',
    description: 'Difference in Precision (PPV) between groups. Measures whether positive predictions are equally reliable across groups.',
    value: maxDiff,
    threshold,
    passed,
    severity: getSeverity(maxDiff, threshold, 'difference'),
    affectedGroups,
    comparisonType: 'difference',
  };
}

// 4. Calibration Gap
// Difference between predicted probabilities and actual outcomes by group
export function calculateCalibrationGap(
  rows: Record<string, unknown>[],
  protectedColumn: string,
  outcomeColumn: string,
  probabilityColumn: string,
  positiveValue: string | number | boolean,
  referenceGroup: string,
  threshold: number = DEFAULT_THRESHOLDS.calibrationGap
): MetricResult {
  const groupData = new Map<string, { sumProb: number; sumActual: number; total: number }>();
  
  for (const row of rows) {
    const group = String(row[protectedColumn]);
    const prob = Number(row[probabilityColumn]) || 0;
    const actual = String(row[outcomeColumn]) === String(positiveValue) ? 1 : 0;
    
    if (!groupData.has(group)) {
      groupData.set(group, { sumProb: 0, sumActual: 0, total: 0 });
    }
    const g = groupData.get(group)!;
    g.sumProb += prob;
    g.sumActual += actual;
    g.total++;
  }
  
  const groupCalibration = new Map<string, { gap: number; total: number }>();
  
  for (const [group, data] of groupData) {
    const avgProb = data.total > 0 ? data.sumProb / data.total : 0;
    const avgActual = data.total > 0 ? data.sumActual / data.total : 0;
    const gap = Math.abs(avgProb - avgActual);
    groupCalibration.set(group, { gap, total: data.total });
  }
  
  const refGap = groupCalibration.get(referenceGroup)?.gap ?? 0;
  
  const affectedGroups: GroupMetric[] = [];
  let maxGapDiff = 0;
  
  for (const [group, data] of groupCalibration) {
    const gapDiff = Math.abs(data.gap - refGap);
    
    affectedGroups.push({
      group,
      value: data.gap,
      sampleSize: data.total,
      isReference: group === referenceGroup,
    });
    
    if (group !== referenceGroup && gapDiff > maxGapDiff) {
      maxGapDiff = gapDiff;
    }
  }
  
  const passed = maxGapDiff <= threshold;
  
  return {
    name: 'calibration_gap',
    displayName: 'Calibration Gap',
    description: 'Difference between predicted probabilities and actual outcomes across groups. Measures whether the model is equally well-calibrated for all groups.',
    value: maxGapDiff,
    threshold,
    passed,
    severity: getSeverity(maxGapDiff, threshold, 'difference'),
    affectedGroups,
    comparisonType: 'difference',
  };
}

// 5. False Positive Rate Parity
// Difference in False Positive Rates between groups
export function calculateFPRParity(
  rows: Record<string, unknown>[],
  protectedColumn: string,
  outcomeColumn: string,
  predictedColumn: string,
  positiveValue: string | number | boolean,
  referenceGroup: string,
  threshold: number = DEFAULT_THRESHOLDS.equalOpportunityDiff
): MetricResult {
  const groupRows = new Map<string, Record<string, unknown>[]>();
  
  for (const row of rows) {
    const group = String(row[protectedColumn]);
    if (!groupRows.has(group)) {
      groupRows.set(group, []);
    }
    groupRows.get(group)!.push(row);
  }
  
  const groupFPRs = new Map<string, { fpr: number; total: number }>();
  
  for (const [group, gRows] of groupRows) {
    const cm = calculateConfusionMatrix(gRows, outcomeColumn, predictedColumn, positiveValue);
    const fpr = (cm.fp + cm.tn) > 0 ? cm.fp / (cm.fp + cm.tn) : 0;
    groupFPRs.set(group, { fpr, total: gRows.length });
  }
  
  const refFPR = groupFPRs.get(referenceGroup)?.fpr ?? 0;
  
  const affectedGroups: GroupMetric[] = [];
  let maxDiff = 0;
  
  for (const [group, data] of groupFPRs) {
    const diff = Math.abs(data.fpr - refFPR);
    
    affectedGroups.push({
      group,
      value: data.fpr,
      sampleSize: data.total,
      isReference: group === referenceGroup,
    });
    
    if (group !== referenceGroup && diff > maxDiff) {
      maxDiff = diff;
    }
  }
  
  const passed = maxDiff <= threshold;
  
  return {
    name: 'fpr_parity',
    displayName: 'False Positive Rate Parity',
    description: 'Difference in False Positive Rates between groups. Measures whether negative cases are equally likely to be incorrectly classified across groups.',
    value: maxDiff,
    threshold,
    passed,
    severity: getSeverity(maxDiff, threshold, 'difference'),
    affectedGroups,
    comparisonType: 'difference',
  };
}

// 6. Statistical Parity Difference
// Difference in positive prediction rates (regardless of ground truth)
export function calculateStatisticalParity(
  rows: Record<string, unknown>[],
  protectedColumn: string,
  predictedColumn: string,
  positiveValue: string | number | boolean,
  referenceGroup: string,
  threshold: number = DEFAULT_THRESHOLDS.equalOpportunityDiff
): MetricResult {
  const groups = new Map<string, { positive: number; total: number }>();
  
  for (const row of rows) {
    const group = String(row[protectedColumn]);
    const predicted = String(row[predictedColumn]) === String(positiveValue);
    
    if (!groups.has(group)) {
      groups.set(group, { positive: 0, total: 0 });
    }
    const g = groups.get(group)!;
    g.total++;
    if (predicted) g.positive++;
  }
  
  const refData = groups.get(referenceGroup);
  const refRate = refData && refData.total > 0 ? refData.positive / refData.total : 0;
  
  const affectedGroups: GroupMetric[] = [];
  let maxDiff = 0;
  
  for (const [group, data] of groups) {
    const rate = data.total > 0 ? data.positive / data.total : 0;
    const diff = Math.abs(rate - refRate);
    
    affectedGroups.push({
      group,
      value: rate,
      sampleSize: data.total,
      isReference: group === referenceGroup,
    });
    
    if (group !== referenceGroup && diff > maxDiff) {
      maxDiff = diff;
    }
  }
  
  const passed = maxDiff <= threshold;
  
  return {
    name: 'statistical_parity',
    displayName: 'Statistical Parity Difference',
    description: 'Difference in positive prediction rates between groups. Measures whether the model predicts positive outcomes at similar rates across groups.',
    value: maxDiff,
    threshold,
    passed,
    severity: getSeverity(maxDiff, threshold, 'difference'),
    affectedGroups,
    comparisonType: 'difference',
  };
}

// 7. Representation Index
// Compares group proportions in dataset to expected proportions
export function calculateRepresentationIndex(
  rows: Record<string, unknown>[],
  protectedColumn: string,
  thresholdMin: number = DEFAULT_THRESHOLDS.representationIndexMin,
  thresholdMax: number = DEFAULT_THRESHOLDS.representationIndexMax
): RepresentationAnalysis {
  const groups = new Map<string, number>();
  
  for (const row of rows) {
    const group = String(row[protectedColumn]);
    groups.set(group, (groups.get(group) || 0) + 1);
  }
  
  const totalRows = rows.length;
  const numGroups = groups.size;
  const expectedProportion = 1 / numGroups; // Equal representation baseline
  
  const groupAnalysis = Array.from(groups.entries()).map(([group, count]) => {
    const percentage = count / totalRows;
    const representationIndex = percentage / expectedProportion;
    
    let status: 'underrepresented' | 'overrepresented' | 'balanced';
    if (representationIndex < thresholdMin) {
      status = 'underrepresented';
    } else if (representationIndex > thresholdMax) {
      status = 'overrepresented';
    } else {
      status = 'balanced';
    }
    
    return {
      group,
      count,
      percentage,
      representationIndex,
      status,
    };
  });
  
  return {
    protectedAttribute: protectedColumn,
    groups: groupAnalysis,
  };
}

// Proxy Variable Detection using Cramér's V correlation
export function detectProxyCorrelations(
  rows: Record<string, unknown>[],
  protectedColumn: string,
  featureColumns: string[],
  significanceThreshold: number = 0.3
): ProxyCorrelation[] {
  const correlations: ProxyCorrelation[] = [];
  
  for (const feature of featureColumns) {
    if (feature === protectedColumn) continue;
    
    // Calculate Cramér's V for categorical correlation
    const contingencyTable = new Map<string, Map<string, number>>();
    const protectedCounts = new Map<string, number>();
    const featureCounts = new Map<string, number>();
    
    for (const row of rows) {
      const pVal = String(row[protectedColumn]);
      const fVal = String(row[feature]);
      
      if (!contingencyTable.has(pVal)) {
        contingencyTable.set(pVal, new Map());
      }
      const inner = contingencyTable.get(pVal)!;
      inner.set(fVal, (inner.get(fVal) || 0) + 1);
      
      protectedCounts.set(pVal, (protectedCounts.get(pVal) || 0) + 1);
      featureCounts.set(fVal, (featureCounts.get(fVal) || 0) + 1);
    }
    
    // Calculate chi-squared
    const n = rows.length;
    let chiSquared = 0;
    
    for (const [pVal, inner] of contingencyTable) {
      for (const [fVal, observed] of inner) {
        const pCount = protectedCounts.get(pVal) || 0;
        const fCount = featureCounts.get(fVal) || 0;
        const expected = (pCount * fCount) / n;
        if (expected > 0) {
          chiSquared += Math.pow(observed - expected, 2) / expected;
        }
      }
    }
    
    // Calculate Cramér's V
    const k1 = protectedCounts.size;
    const k2 = featureCounts.size;
    const minDim = Math.min(k1, k2) - 1;
    const cramersV = minDim > 0 ? Math.sqrt(chiSquared / (n * minDim)) : 0;
    
    // Approximate p-value (simplified)
    const df = (k1 - 1) * (k2 - 1);
    const pValue = df > 0 ? Math.exp(-chiSquared / (2 * df)) : 1;
    
    correlations.push({
      feature,
      protectedAttribute: protectedColumn,
      correlationCoefficient: cramersV,
      pValue,
      isSignificant: cramersV >= significanceThreshold,
    });
  }
  
  return correlations.sort((a, b) => b.correlationCoefficient - a.correlationCoefficient);
}

// Generate recommendations based on audit results
export function generateRecommendations(
  metrics: MetricResult[],
  proxyCorrelations: ProxyCorrelation[],
  representationAnalysis: RepresentationAnalysis[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  let id = 1;
  
  // Check failing metrics
  for (const metric of metrics) {
    if (!metric.passed) {
      if (metric.name === 'disparate_impact') {
        recommendations.push({
          id: `rec-${id++}`,
          priority: metric.severity === 'critical' ? 'critical' : 'high',
          category: 'model',
          title: 'Address Disparate Impact Violation',
          description: `The model shows disparate impact (${(metric.value * 100).toFixed(1)}% of reference group rate) which violates the EEOC 80% rule. Consider threshold calibration, reweighting training data, or using fairness-constrained optimization.`,
          affectedMetrics: [metric.name],
          expectedImpact: 'Could improve disparate impact ratio by 10-20%',
        });
      }
      
      if (metric.name === 'equal_opportunity') {
        recommendations.push({
          id: `rec-${id++}`,
          priority: metric.severity === 'critical' ? 'critical' : 'high',
          category: 'model',
          title: 'Improve Equal Opportunity',
          description: `The model has unequal True Positive Rates (${(metric.value * 100).toFixed(1)}% difference). This means qualified individuals from some groups are less likely to receive positive predictions. Consider equalized odds post-processing or retraining with fairness constraints.`,
          affectedMetrics: [metric.name],
          expectedImpact: 'Could reduce TPR gap by 50-70%',
        });
      }
      
      if (metric.name === 'predictive_parity') {
        recommendations.push({
          id: `rec-${id++}`,
          priority: metric.severity === 'critical' ? 'high' : 'medium',
          category: 'model',
          title: 'Improve Predictive Parity',
          description: `Precision varies by ${(metric.value * 100).toFixed(1)}% across groups. Positive predictions are less reliable for some groups. Review feature engineering and consider group-specific calibration.`,
          affectedMetrics: [metric.name],
          expectedImpact: 'Could improve prediction reliability across groups',
        });
      }
      
      if (metric.name === 'calibration_gap') {
        recommendations.push({
          id: `rec-${id++}`,
          priority: metric.severity === 'critical' ? 'high' : 'medium',
          category: 'model',
          title: 'Address Calibration Issues',
          description: `Model probabilities are miscalibrated across groups (${(metric.value * 100).toFixed(1)}% gap). Apply Platt scaling or isotonic regression calibration separately per group.`,
          affectedMetrics: [metric.name],
          expectedImpact: 'Improved probability reliability for all groups',
        });
      }
    }
  }
  
  // Check proxy correlations
  const significantProxies = proxyCorrelations.filter(p => p.isSignificant);
  if (significantProxies.length > 0) {
    recommendations.push({
      id: `rec-${id++}`,
      priority: 'medium',
      category: 'data',
      title: 'Review Proxy Variables',
      description: `${significantProxies.length} feature(s) show significant correlation with protected attributes: ${significantProxies.slice(0, 3).map(p => p.feature).join(', ')}. These may encode demographic information indirectly. Consider feature removal or debiasing techniques.`,
      affectedMetrics: ['disparate_impact', 'statistical_parity'],
      expectedImpact: 'Reduced indirect discrimination through proxy features',
    });
  }
  
  // Check representation
  for (const rep of representationAnalysis) {
    const underrep = rep.groups.filter(g => g.status === 'underrepresented');
    if (underrep.length > 0) {
      recommendations.push({
        id: `rec-${id++}`,
        priority: 'medium',
        category: 'data',
        title: `Address Underrepresentation in ${rep.protectedAttribute}`,
        description: `Groups ${underrep.map(g => g.group).join(', ')} are underrepresented in the dataset. Consider collecting more data from these groups or applying oversampling techniques like SMOTE.`,
        affectedMetrics: ['representation_index'],
        expectedImpact: 'Improved model performance for underrepresented groups',
      });
    }
  }
  
  return recommendations;
}

// Main audit function
export function runFairnessAudit(
  dataset: Dataset,
  config: AuditConfig
): Omit<BiasAuditResult, 'aiExplanation'> {
  const metrics: MetricResult[] = [];
  const representationAnalysis: RepresentationAnalysis[] = [];
  const allProxyCorrelations: ProxyCorrelation[] = [];
  
  const rows = dataset.rows;
  const featureColumns = dataset.columns.map(c => c.name).filter(
    c => c !== config.outcomeColumn && 
         c !== config.predictedColumn && 
         c !== config.probabilityColumn
  );
  
  for (const attr of config.protectedAttributes) {
    const referenceGroup = attr.referenceGroup || attr.groups[0];
    
    // 1. Disparate Impact (always calculate, works with just outcome)
    metrics.push(calculateDisparateImpact(
      rows,
      attr.column,
      config.outcomeColumn,
      config.positiveOutcomeValue,
      referenceGroup,
      config.thresholds.disparateImpactRatio
    ));
    
    // Metrics requiring predictions
    if (config.predictedColumn) {
      // 2. Equal Opportunity
      metrics.push(calculateEqualOpportunity(
        rows,
        attr.column,
        config.outcomeColumn,
        config.predictedColumn,
        config.positiveOutcomeValue,
        referenceGroup,
        config.thresholds.equalOpportunityDiff
      ));
      
      // 3. Predictive Parity
      metrics.push(calculatePredictiveParity(
        rows,
        attr.column,
        config.outcomeColumn,
        config.predictedColumn,
        config.positiveOutcomeValue,
        referenceGroup,
        config.thresholds.predictiveParityDiff
      ));
      
      // 5. FPR Parity
      metrics.push(calculateFPRParity(
        rows,
        attr.column,
        config.outcomeColumn,
        config.predictedColumn,
        config.positiveOutcomeValue,
        referenceGroup,
        config.thresholds.equalOpportunityDiff
      ));
      
      // 6. Statistical Parity
      metrics.push(calculateStatisticalParity(
        rows,
        attr.column,
        config.predictedColumn,
        config.positiveOutcomeValue,
        referenceGroup,
        config.thresholds.equalOpportunityDiff
      ));
    }
    
    // 4. Calibration Gap (requires probability column)
    if (config.probabilityColumn) {
      metrics.push(calculateCalibrationGap(
        rows,
        attr.column,
        config.outcomeColumn,
        config.probabilityColumn,
        config.positiveOutcomeValue,
        referenceGroup,
        config.thresholds.calibrationGap
      ));
    }
    
    // 7. Representation Analysis
    representationAnalysis.push(calculateRepresentationIndex(
      rows,
      attr.column,
      config.thresholds.representationIndexMin,
      config.thresholds.representationIndexMax
    ));
    
    // Proxy Detection
    const proxies = detectProxyCorrelations(rows, attr.column, featureColumns);
    allProxyCorrelations.push(...proxies);
  }
  
  // Calculate overall severity
  const severityOrder: SeverityLevel[] = ['pass', 'low', 'medium', 'high', 'critical'];
  const worstSeverity = metrics.reduce((worst, m) => {
    return severityOrder.indexOf(m.severity) > severityOrder.indexOf(worst) ? m.severity : worst;
  }, 'pass' as SeverityLevel);
  
  // Calculate overall score (0-100)
  const passedCount = metrics.filter(m => m.passed).length;
  const overallScore = Math.round((passedCount / metrics.length) * 100);
  
  // Generate recommendations
  const recommendations = generateRecommendations(metrics, allProxyCorrelations, representationAnalysis);
  
  return {
    id: `audit-${Date.now()}`,
    datasetId: dataset.id,
    datasetName: dataset.name,
    auditedAt: new Date(),
    config,
    metrics,
    overallSeverity: worstSeverity,
    overallScore,
    proxyCorrelations: allProxyCorrelations.slice(0, 10), // Top 10 correlations
    representationAnalysis,
    recommendations,
  };
}
