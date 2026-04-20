'use client';

import { cn } from '@/lib/utils';

interface ScoreCircleProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ScoreCircle({ score, size = 'md', className }: ScoreCircleProps) {
  const radius = size === 'sm' ? 30 : size === 'md' ? 45 : 60;
  const strokeWidth = size === 'sm' ? 4 : size === 'md' ? 6 : 8;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const remaining = circumference - progress;

  const getColor = () => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-28 h-28',
    lg: 'w-36 h-36',
  };

  const textClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        {/* Background circle */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={`${progress} ${remaining}`}
          strokeLinecap="round"
          className={cn('transition-all duration-1000', getColor())}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-bold', textClasses[size], getColor())}>{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}
