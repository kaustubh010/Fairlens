'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SeverityBadge } from './severity-badge';
import type { MetricResult } from '@/lib/fairness/types';
import { CheckCircle2, XCircle, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MetricCardProps {
  metric: MetricResult;
  onClick?: () => void;
}

export function MetricCard({ metric, onClick }: MetricCardProps) {
  const isRatio = metric.comparisonType === 'ratio';
  const displayValue = isRatio
    ? `${(metric.value * 100).toFixed(1)}%`
    : `${(metric.value * 100).toFixed(1)}%`;
  
  const thresholdDisplay = isRatio
    ? `>= ${(metric.threshold * 100).toFixed(0)}%`
    : `<= ${(metric.threshold * 100).toFixed(0)}%`;

  return (
    <div
      className={`cursor-pointer transition-all duration-300 bg-white dark:bg-[#1d1d1f] rounded-[18px] p-5 shadow-[0_5px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 ${
        metric.passed ? 'border border-transparent' : 'border border-[#ff3b30]/30'
      }`}
      onClick={onClick}
    >
      <div className="pb-4 border-b border-black/5 dark:border-white/5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[17px] font-medium text-[#1d1d1f] dark:text-white leading-tight">
            {metric.displayName}
          </h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-5 w-5 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs bg-white dark:bg-[#1d1d1f] rounded-[14px] shadow-[0_10px_40px_rgba(0,0,0,0.12)] p-4 border border-black/5 dark:border-white/5">
                <p className="text-[14px] text-[#1d1d1f] dark:text-white">{metric.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {metric.passed ? (
              <CheckCircle2 className="h-6 w-6 text-[#34c759]" />
            ) : (
              <XCircle className="h-6 w-6 text-[#ff3b30]" />
            )}
            <span className="text-[28px] font-semibold tracking-tight">{displayValue}</span>
          </div>
          <SeverityBadge severity={metric.severity} size="sm" />
        </div>
        <p className="text-[14px] text-[#86868b] font-medium">
          Threshold: {thresholdDisplay}
        </p>
        <p className="mt-1 text-[13px] text-[#86868b]">
          {metric.affectedGroups.length} groups analyzed
        </p>
      </div>
    </div>
  );
}
