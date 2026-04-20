'use client';

import type { ProxyCorrelation } from '@/lib/fairness/types';
import type { ProxyCorrelation } from '@/lib/fairness/types';
import { AlertTriangle } from 'lucide-react';

interface ProxyHeatmapProps {
  correlations: ProxyCorrelation[];
}

function getCorrelationColor(value: number): string {
  if (value >= 0.7) return 'bg-red-500';
  if (value >= 0.5) return 'bg-orange-500';
  if (value >= 0.3) return 'bg-yellow-500';
  if (value >= 0.1) return 'bg-blue-300';
  return 'bg-gray-200';
}

function getCorrelationTextColor(value: number): string {
  if (value >= 0.3) return 'text-white';
  return 'text-gray-700';
}

export function ProxyHeatmap({ correlations }: ProxyHeatmapProps) {
  const significantCorrelations = correlations.filter((c) => c.isSignificant);
  
  if (correlations.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1d1d1f] rounded-[18px] p-6 sm:p-8 shadow-[0_5px_30px_rgba(0,0,0,0.04)]">
        <div className="mb-2">
          <h3 className="text-[20px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight">Proxy Variable Detection</h3>
          <p className="text-[15px] text-[#86868b] mt-1">No features analyzed for proxy correlations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1d1d1f] rounded-[18px] p-6 sm:p-8 shadow-[0_5px_30px_rgba(0,0,0,0.04)]">
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[20px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight">Proxy Variable Detection</h3>
            <p className="text-[15px] text-[#86868b] mt-1">
              Features correlated with protected attributes may encode demographic information
            </p>
          </div>
          {significantCorrelations.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-[#ff9f0a]/10 px-3 py-1.5 text-[13px] font-medium text-[#ff9f0a]">
              <AlertTriangle className="h-4 w-4" />
              {significantCorrelations.length} potential proxies
            </div>
          )}
        </div>
      </div>
      <div>
        <div className="space-y-4">
          {correlations.slice(0, 10).map((corr) => (
            <div key={`${corr.feature}-${corr.protectedAttribute}`} className="flex items-center gap-4">
              <div className="w-32 truncate text-[15px] font-medium text-[#1d1d1f] dark:text-white" title={corr.feature}>
                {corr.feature}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="h-4 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/5">
                    <div
                      className={`h-full ${getCorrelationColor(corr.correlationCoefficient)} transition-all duration-500 ease-out`}
                      style={{ width: `${corr.correlationCoefficient * 100}%` }}
                    />
                  </div>
                  <span
                    className={`w-12 text-right text-[14px] font-mono ${
                      corr.isSignificant ? 'font-bold text-[#ff3b30]' : 'text-[#86868b]'
                    }`}
                  >
                    {(corr.correlationCoefficient * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="w-24 text-[13px] text-[#86868b] truncate">
                vs {corr.protectedAttribute}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-6">
          <div className="flex gap-4 text-[13px] font-medium text-[#86868b]">
            <span className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-gray-200 dark:bg-gray-700" /> Low
            </span>
            <span className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-yellow-500" /> Moderate
            </span>
            <span className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-red-500" /> High
            </span>
          </div>
          <p className="text-[13px] text-[#86868b]">
            Correlation &gt; 30% flagged as potential proxy
          </p>
        </div>
      </div>
    </div>
  );
}
