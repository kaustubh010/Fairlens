// Gemini API Integration for AI-Powered Explanations
import { BiasAuditResult, AIExplanation, MetricResult } from './types';

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

function formatMetricsForPrompt(metrics: MetricResult[]): string {
  return metrics.map(m => {
    const status = m.passed ? 'PASSED' : 'FAILED';
    const groupDetails = m.affectedGroups
      .map(g => `${g.group}: ${(g.value * 100).toFixed(1)}% (n=${g.sampleSize})${g.isReference ? ' [reference]' : ''}`)
      .join(', ');
    
    return `- ${m.displayName}: ${(m.value * 100).toFixed(1)}% (threshold: ${(m.threshold * 100).toFixed(1)}%) - ${status}
    Severity: ${m.severity.toUpperCase()}
    Groups: ${groupDetails}
    Description: ${m.description}`;
  }).join('\n\n');
}

export async function generateAIExplanation(
  auditResult: Omit<BiasAuditResult, 'aiExplanation'>,
  apiKey: string
): Promise<AIExplanation> {
  const failedMetrics = auditResult.metrics.filter(m => !m.passed);
  const passedMetrics = auditResult.metrics.filter(m => m.passed);
  
  const significantProxies = auditResult.proxyCorrelations.filter(p => p.isSignificant);
  const underrepGroups = auditResult.representationAnalysis.flatMap(r => 
    r.groups.filter(g => g.status === 'underrepresented')
  );
  
  const prompt = `You are FairLens AI, an expert system for explaining algorithmic fairness audit results. Analyze the following bias audit results and provide a comprehensive explanation.

## AUDIT SUMMARY
- Dataset: ${auditResult.datasetName}
- Total Records: ${auditResult.config.protectedAttributes.reduce((sum, attr) => {
    const metric = auditResult.metrics.find(m => m.affectedGroups.some(g => g.group === attr.groups[0]));
    return metric ? metric.affectedGroups.reduce((s, g) => s + g.sampleSize, 0) / metric.affectedGroups.length : sum;
  }, 0).toFixed(0)} (estimated)
- Protected Attributes Analyzed: ${auditResult.config.protectedAttributes.map(a => a.column).join(', ')}
- Overall Score: ${auditResult.overallScore}/100
- Overall Severity: ${auditResult.overallSeverity.toUpperCase()}

## FAILED FAIRNESS METRICS (${failedMetrics.length})
${failedMetrics.length > 0 ? formatMetricsForPrompt(failedMetrics) : 'None - all metrics passed!'}

## PASSED FAIRNESS METRICS (${passedMetrics.length})
${formatMetricsForPrompt(passedMetrics)}

## PROXY VARIABLE CONCERNS
${significantProxies.length > 0 
  ? significantProxies.map(p => `- ${p.feature}: correlation ${(p.correlationCoefficient * 100).toFixed(1)}% with ${p.protectedAttribute}`).join('\n')
  : 'No significant proxy variables detected.'}

## REPRESENTATION ISSUES
${underrepGroups.length > 0
  ? underrepGroups.map(g => `- ${g.group}: ${(g.percentage * 100).toFixed(1)}% of dataset (representation index: ${g.representationIndex.toFixed(2)})`).join('\n')
  : 'No significant representation imbalances detected.'}

## RECOMMENDATIONS GENERATED
${auditResult.recommendations.map(r => `- [${r.priority.toUpperCase()}] ${r.title}`).join('\n')}

---

Please provide your analysis in the following JSON format (respond ONLY with valid JSON, no markdown):
{
  "executiveSummary": "A 2-3 sentence non-technical summary for executives explaining the overall findings and risk level. Use plain language, no technical terms.",
  "technicalSummary": "A 3-4 sentence technical summary for data scientists explaining the specific fairness issues found and their statistical significance.",
  "keyFindings": ["Finding 1", "Finding 2", "Finding 3", "Finding 4", "Finding 5"],
  "riskAssessment": {
    "eeocCompliance": "compliant|at_risk|non_compliant",
    "euAiActCompliance": "compliant|at_risk|non_compliant", 
    "overallRisk": "low|medium|high|critical"
  },
  "actionItems": ["Action 1", "Action 2", "Action 3"]
}

Be specific about which groups are affected and by how much. Reference the 80% rule for EEOC compliance. For EU AI Act, consider if this would be classified as high-risk AI.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean and parse JSON response
    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const parsed = JSON.parse(cleanedText);
    
    return {
      executiveSummary: parsed.executiveSummary || 'Unable to generate executive summary.',
      technicalSummary: parsed.technicalSummary || 'Unable to generate technical summary.',
      keyFindings: parsed.keyFindings || [],
      riskAssessment: {
        eeocCompliance: parsed.riskAssessment?.eeocCompliance || 'at_risk',
        euAiActCompliance: parsed.riskAssessment?.euAiActCompliance || 'at_risk',
        overallRisk: parsed.riskAssessment?.overallRisk || 'medium',
      },
      actionItems: parsed.actionItems || [],
      generatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error generating AI explanation:', error);
    
    // Fallback explanation based on audit results
    return generateFallbackExplanation(auditResult);
  }
}

function generateFallbackExplanation(
  auditResult: Omit<BiasAuditResult, 'aiExplanation'>
): AIExplanation {
  const failedMetrics = auditResult.metrics.filter(m => !m.passed);
  const hasDisparateImpact = failedMetrics.some(m => m.name === 'disparate_impact');
  const hasCriticalIssues = auditResult.overallSeverity === 'critical';
  
  return {
    executiveSummary: failedMetrics.length === 0
      ? `The model audit found no significant fairness violations. All ${auditResult.metrics.length} fairness metrics passed their thresholds, indicating the model treats different demographic groups equitably.`
      : `The audit identified ${failedMetrics.length} fairness concern(s) affecting certain demographic groups. ${hasCriticalIssues ? 'Immediate attention is required as critical violations were detected.' : 'Review and remediation is recommended before deployment.'}`,
    
    technicalSummary: failedMetrics.length === 0
      ? `All computed fairness metrics (Disparate Impact, Equal Opportunity, Predictive Parity, etc.) are within acceptable thresholds. The model demonstrates statistical parity across protected groups.`
      : `The model exhibits ${hasDisparateImpact ? 'disparate impact (violating the 80% rule)' : 'fairness metric violations'} across analyzed demographic groups. ${failedMetrics.map(m => `${m.displayName}: ${(m.value * 100).toFixed(1)}%`).join(', ')}. Statistical significance indicates these differences are unlikely due to chance.`,
    
    keyFindings: [
      `Overall fairness score: ${auditResult.overallScore}/100`,
      `${auditResult.metrics.filter(m => m.passed).length}/${auditResult.metrics.length} metrics passed`,
      failedMetrics.length > 0 ? `Most severe issue: ${failedMetrics.sort((a, b) => 
        ['critical', 'high', 'medium', 'low', 'pass'].indexOf(a.severity) - 
        ['critical', 'high', 'medium', 'low', 'pass'].indexOf(b.severity)
      )[0]?.displayName}` : 'No critical fairness violations detected',
      `${auditResult.proxyCorrelations.filter(p => p.isSignificant).length} potential proxy variables identified`,
      `${auditResult.representationAnalysis.flatMap(r => r.groups.filter(g => g.status === 'underrepresented')).length} underrepresented groups detected`,
    ],
    
    riskAssessment: {
      eeocCompliance: hasDisparateImpact ? 'non_compliant' : (failedMetrics.length > 0 ? 'at_risk' : 'compliant'),
      euAiActCompliance: hasCriticalIssues ? 'non_compliant' : (failedMetrics.length > 0 ? 'at_risk' : 'compliant'),
      overallRisk: auditResult.overallSeverity === 'critical' ? 'critical' : 
                   auditResult.overallSeverity === 'high' ? 'high' :
                   failedMetrics.length > 0 ? 'medium' : 'low',
    },
    
    actionItems: auditResult.recommendations.slice(0, 5).map(r => r.title),
    
    generatedAt: new Date(),
  };
}
