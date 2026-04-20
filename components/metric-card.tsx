'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SeverityBadge } from '@/components/severity-badge';
import { CheckCircle2, XCircle, Info } from 'lucide-react';
import type { FairnessMetric } from '@/lib/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MetricCardProps {
  metric: FairnessMetric;
}

export function MetricCard({ metric }: MetricCardProps) {
  const formatValue = (value: number) => {
    if (metric.name.includes('Ratio') || metric.name.includes('Index')) {
      return `${(value * 100).toFixed(1)}%`;
    }
    return value.toFixed(3);
  };

  return (
    <Card className="relative overflow-hidden">
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          metric.passed ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {metric.passed ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 shrink-0" />
            )}
            <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
          </div>
          {!metric.passed && <SeverityBadge severity={metric.severity} />}
        </div>
        <CardDescription className="text-xs line-clamp-2">
          {metric.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-2xl font-bold">{formatValue(metric.value)}</p>
            <p className="text-xs text-muted-foreground">
              Threshold: {metric.name.includes('Ratio') || metric.name.includes('Index') ? '>=' : '<='}{' '}
              {formatValue(metric.threshold)}
            </p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-xs">{metric.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Group breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Group Breakdown</p>
          {metric.groups.map((group) => (
            <div key={group.name} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground truncate max-w-[60%]">{group.name}</span>
              <span className="font-mono">
                {formatValue(group.value)}
                <span className="text-muted-foreground ml-1">(n={group.count})</span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
