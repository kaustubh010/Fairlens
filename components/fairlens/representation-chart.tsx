'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { RepresentationAnalysis } from '@/lib/fairness/types';

interface RepresentationChartProps {
  analysis: RepresentationAnalysis;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const statusColors = {
  underrepresented: 'text-orange-600 bg-orange-100',
  overrepresented: 'text-blue-600 bg-blue-100',
  balanced: 'text-emerald-600 bg-emerald-100',
};

const statusLabels = {
  underrepresented: 'Under',
  overrepresented: 'Over',
  balanced: 'Balanced',
};

export function RepresentationChart({ analysis }: RepresentationChartProps) {
  const data = analysis.groups.map((g, i) => ({
    name: g.group,
    value: g.count,
    percentage: g.percentage * 100,
    representationIndex: g.representationIndex,
    status: g.status,
    color: COLORS[i % COLORS.length],
  }));

  const hasIssues = analysis.groups.some((g) => g.status !== 'balanced');

  return (
    <div className="bg-white dark:bg-[#1d1d1f] rounded-[18px] p-6 sm:p-8 shadow-[0_5px_30px_rgba(0,0,0,0.04)] h-full flex flex-col">
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight">
              Representation: {analysis.protectedAttribute}
            </h3>
            <p className="text-[14px] text-[#86868b] mt-1">
              Distribution of groups in the dataset
            </p>
          </div>
          {hasIssues && (
            <span className="rounded-full bg-[#ff9f0a]/10 px-3 py-1 text-[13px] font-medium text-[#ff9f0a]">
              Imbalance detected
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-8">
          <div className="h-48 w-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  cursor={{ fill: 'currentColor', opacity: 0.05 }}
                  contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.12)' }}
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString()} (${data.find(d => d.name === name)?.percentage.toFixed(1)}%)`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex-1 space-y-3">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-[14px]">
                <div className="flex items-center gap-3">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-[#1d1d1f] dark:text-white">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#86868b] font-mono">
                    {item.percentage.toFixed(1)}%
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[12px] font-medium ${statusColors[item.status]}`}
                  >
                    {statusLabels[item.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-8 border-t border-black/5 dark:border-white/5 pt-4">
          <p className="text-[13px] text-[#86868b] leading-relaxed">
            Representation Index: 0.80-1.20 is considered balanced. Values below 0.80 indicate
            underrepresentation, above 1.20 indicates overrepresentation.
          </p>
        </div>
      </div>
    </div>
  );
}
