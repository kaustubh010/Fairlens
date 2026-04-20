'use client';

import { cn } from '@/lib/utils';
import type { SeverityLevel } from '@/lib/fairness/types';

interface SeverityBadgeProps {
  severity: SeverityLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const severityConfig: Record<SeverityLevel, { label: string; className: string }> = {
  critical: {
    label: 'Critical',
    className: 'bg-[#ff3b30]/10 text-[#ff3b30] border-transparent',
  },
  high: {
    label: 'High',
    className: 'bg-[#ff9f0a]/10 text-[#ff9f0a] border-transparent',
  },
  medium: {
    label: 'Medium',
    className: 'bg-[#ffd60a]/20 text-[#d4b000] dark:text-[#ffd60a] border-transparent',
  },
  low: {
    label: 'Low',
    className: 'bg-[#0071e3]/10 text-[#0071e3] border-transparent',
  },
  pass: {
    label: 'Pass',
    className: 'bg-[#34c759]/10 text-[#34c759] border-transparent',
  },
};

const sizeConfig = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function SeverityBadge({ severity, size = 'md', showLabel = true }: SeverityBadgeProps) {
  const config = severityConfig[severity];
  
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        config.className,
        sizeConfig[size]
      )}
    >
      {showLabel ? config.label : severity.charAt(0).toUpperCase()}
    </span>
  );
}
