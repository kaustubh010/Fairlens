'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Recommendation } from '@/lib/fairness/types';
import { Database, Cpu, SlidersHorizontal, RefreshCw, ChevronRight } from 'lucide-react';

interface RecommendationsListProps {
  recommendations: Recommendation[];
}

const priorityStyles = {
  critical: 'border-l-red-500 bg-red-50',
  high: 'border-l-orange-500 bg-orange-50',
  medium: 'border-l-yellow-500 bg-yellow-50',
  low: 'border-l-blue-500 bg-blue-50',
};

const priorityLabels = {
  critical: { text: 'Critical', className: 'bg-red-100 text-red-800' },
  high: { text: 'High', className: 'bg-orange-100 text-orange-800' },
  medium: { text: 'Medium', className: 'bg-yellow-100 text-yellow-800' },
  low: { text: 'Low', className: 'bg-blue-100 text-blue-800' },
};

const categoryIcons = {
  data: Database,
  model: Cpu,
  threshold: SlidersHorizontal,
  process: RefreshCw,
};

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  if (recommendations.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1d1d1f] rounded-[18px] p-6 sm:p-8 shadow-[0_5px_30px_rgba(0,0,0,0.04)]">
        <div className="mb-6">
          <h3 className="text-[20px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white">Recommendations</h3>
          <p className="text-[15px] text-[#86868b]">No issues found - no recommendations needed</p>
        </div>
        <div className="flex flex-col items-center justify-center py-12 bg-[#34c759]/5 rounded-2xl border border-[#34c759]/10">
          <div className="bg-[#34c759]/10 p-3 rounded-full mb-3">
            <RefreshCw className="h-8 w-8 text-[#34c759]" />
          </div>
          <span className="text-[19px] font-semibold tracking-tight text-[#34c759]">All fairness checks passed!</span>
        </div>
      </div>
    );
  }

  const sortedRecs = [...recommendations].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <div className="bg-white dark:bg-[#1d1d1f] rounded-[18px] shadow-[0_5px_30px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-black/5 dark:border-white/5">
        <h3 className="text-[20px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white mb-1">Remediation Recommendations</h3>
        <p className="text-[15px] text-[#86868b]">
          {recommendations.length} action item{recommendations.length > 1 ? 's' : ''} to address fairness concerns
        </p>
      </div>
      <div className="p-6 sm:p-8 space-y-4 bg-[#f5f5f7]/50 dark:bg-black/20">
        {sortedRecs.map((rec) => {
          const Icon = categoryIcons[rec.category];
          const priority = priorityLabels[rec.priority];
          
          return (
            <div
              key={rec.id}
              className={`rounded-[16px] bg-white dark:bg-[#1d1d1f] p-5 shadow-sm border border-black/5 dark:border-white/5 relative overflow-hidden`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${priorityStyles[rec.priority].split(' ')[0]}`} />
              <div className="flex items-start gap-4 pl-2">
                <div className="rounded-full bg-[#f5f5f7] dark:bg-black/30 p-3">
                  <Icon className="h-5 w-5 text-[#424245] dark:text-[#a1a1a6]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-[17px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white">{rec.title}</h4>
                    <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold tracking-wide ${priority.className}`}>
                      {priority.text}
                    </span>
                  </div>
                  <p className="mt-2 text-[15px] text-[#424245] dark:text-[#a1a1a6] leading-relaxed">{rec.description}</p>
                  
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-[13px] text-[#86868b] font-medium">Affects:</span>
                    {rec.affectedMetrics.map((m) => (
                      <span key={m} className="rounded-md bg-[#f5f5f7] dark:bg-white/10 px-2 py-1 text-[13px] font-mono text-[#1d1d1f] dark:text-white">
                        {m}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5">
                    <p className="flex items-center gap-2 text-[14px] font-medium text-[#34c759]">
                      <ChevronRight className="h-4 w-4" />
                      {rec.expectedImpact}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
