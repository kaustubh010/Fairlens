import { cn } from '@/lib/utils';
import type { SeverityLevel } from '@/lib/types';

interface SeverityBadgeProps {
  severity: SeverityLevel;
  className?: string;
}

const severityConfig = {
  critical: {
    label: 'Critical',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  high: {
    label: 'High',
    className: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  },
  medium: {
    label: 'Medium',
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
  low: {
    label: 'Low',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  pass: {
    label: 'Pass',
    className: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
};

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const config = severityConfig[severity];
  
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
