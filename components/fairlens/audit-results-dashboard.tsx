'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SeverityBadge } from './severity-badge';
import { MetricCard } from './metric-card';
import { FairnessChart } from './fairness-chart';
import { ProxyHeatmap } from './proxy-heatmap';
import { RepresentationChart } from './representation-chart';
import { RecommendationsList } from './recommendations-list';
import { AIExplanationPanel } from './ai-explanation-panel';
import type { BiasAuditResult, MetricResult } from '@/lib/fairness/types';
import {
  BarChart3,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  Download,
  ArrowLeft,
} from 'lucide-react';

interface AuditResultsDashboardProps {
  audit: BiasAuditResult;
  onBack: () => void;
  onGenerateExplanation: (apiKey: string) => Promise<void>;
  isGeneratingExplanation: boolean;
}

export function AuditResultsDashboard({
  audit,
  onBack,
  onGenerateExplanation,
  isGeneratingExplanation,
}: AuditResultsDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricResult | null>(null);

  const passedCount = audit.metrics.filter((m) => m.passed).length;
  const failedCount = audit.metrics.length - passedCount;

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(audit, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fairlens-audit-${audit.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-[#1d1d1f] p-8 rounded-[18px] shadow-[0_5px_30px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-[#0066cc] dark:text-[#2997ff] hover:bg-transparent hover:underline px-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="w-px h-8 bg-black/10 dark:bg-white/10 mx-2"></div>
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight">Audit Results</h1>
            <p className="text-[17px] text-[#86868b]">{audit.datasetName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-full px-6 bg-transparent border-[#0071e3] text-[#0071e3] hover:bg-[#0071e3]/5" onClick={handleExportJSON}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-[#1d1d1f] rounded-[18px] shadow-[0_5px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-shadow p-6 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-2">
            <div className="rounded-full bg-[#0071e3]/10 p-3">
              <BarChart3 className="h-6 w-6 text-[#0071e3]" />
            </div>
            <p className="text-[17px] text-[#86868b] font-medium">Overall Score</p>
          </div>
          <p className="text-[34px] font-semibold tracking-tight mt-2">{audit.overallScore}/100</p>
        </div>

        <div className="bg-white dark:bg-[#1d1d1f] rounded-[18px] shadow-[0_5px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-shadow p-6 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-2">
            <div className="rounded-full bg-[#0071e3]/10 p-3">
              <Shield className="h-6 w-6 text-[#0071e3]" />
            </div>
            <p className="text-[17px] text-[#86868b] font-medium">Severity Level</p>
          </div>
          <div className="mt-2">
            <SeverityBadge severity={audit.overallSeverity} size="lg" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1d1d1f] rounded-[18px] shadow-[0_5px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-shadow p-6 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-2">
            <div className="rounded-full bg-[#34c759]/10 p-3">
              <CheckCircle className="h-6 w-6 text-[#34c759]" />
            </div>
            <p className="text-[17px] text-[#86868b] font-medium">Metrics Passed</p>
          </div>
          <p className="text-[34px] font-semibold tracking-tight text-[#34c759] mt-2">{passedCount}</p>
        </div>

        <div className="bg-white dark:bg-[#1d1d1f] rounded-[18px] shadow-[0_5px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-shadow p-6 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-2">
            <div className="rounded-full bg-[#ff3b30]/10 p-3">
              <AlertTriangle className="h-6 w-6 text-[#ff3b30]" />
            </div>
            <p className="text-[17px] text-[#86868b] font-medium">Metrics Failed</p>
          </div>
          <p className="text-[34px] font-semibold tracking-tight text-[#ff3b30] mt-2">{failedCount}</p>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="ai">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {audit.metrics.map((metric) => (
              <MetricCard
                key={metric.name}
                metric={metric}
                onClick={() => setSelectedMetric(metric)}
              />
            ))}
          </div>

          {/* Selected Metric Detail */}
          {selectedMetric && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedMetric.displayName} Detail</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMetric(null)}
                >
                  Close
                </Button>
              </div>
              <FairnessChart metric={selectedMetric} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {/* Proxy Variables */}
          <ProxyHeatmap correlations={audit.proxyCorrelations} />

          {/* Representation Analysis */}
          <div className="grid gap-4 lg:grid-cols-2">
            {audit.representationAnalysis.map((analysis) => (
              <RepresentationChart key={analysis.protectedAttribute} analysis={analysis} />
            ))}
          </div>

          {/* All Metrics Charts */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detailed Metric Breakdown</h3>
            <div className="grid gap-4 lg:grid-cols-2">
              {audit.metrics.slice(0, 4).map((metric) => (
                <FairnessChart key={metric.name} metric={metric} />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recommendations">
          <RecommendationsList recommendations={audit.recommendations} />
        </TabsContent>

        <TabsContent value="ai">
          <AIExplanationPanel
            explanation={audit.aiExplanation}
            onGenerateExplanation={onGenerateExplanation}
            isLoading={isGeneratingExplanation}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
