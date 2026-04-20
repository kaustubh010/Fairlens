'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import type { MetricResult } from '@/lib/fairness/types';

interface FairnessChartProps {
  metric: MetricResult;
}

export function FairnessChart({ metric }: FairnessChartProps) {
  const data = metric.affectedGroups.map((g) => ({
    name: g.group,
    value: g.value * 100,
    sampleSize: g.sampleSize,
    isReference: g.isReference,
  }));

  const thresholdValue = metric.threshold * 100;
  const isRatio = metric.comparisonType === 'ratio';

  return (
    <div className="bg-white dark:bg-[#1d1d1f] rounded-[18px] p-6 sm:p-8 shadow-[0_5px_30px_rgba(0,0,0,0.04)] h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight">{metric.displayName} by Group</h3>
      </div>
      <div className="flex-1 min-h-[250px]">
        <div className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 80, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="currentColor" className="opacity-10" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                stroke="currentColor"
                className="text-[12px] opacity-50"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 13, fill: 'currentColor', opacity: 0.8 }}
                width={75}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'currentColor', opacity: 0.05 }}
                contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.12)' }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Value']}
                labelFormatter={(label) => {
                  const item = data.find((d) => d.name === label);
                  return `${label}${item?.isReference ? ' (Reference)' : ''} - n=${item?.sampleSize}`;
                }}
              />
              {isRatio && (
                <ReferenceLine
                  x={thresholdValue}
                  stroke="#ff3b30"
                  strokeDasharray="5 5"
                  label={{ value: '80% Rule', position: 'top', fontSize: 11, fill: '#ff3b30' }}
                />
              )}
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.isReference
                        ? '#0071e3'
                        : isRatio
                        ? entry.value >= thresholdValue
                          ? '#34c759'
                          : '#ff3b30'
                        : '#5e5ce6'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5 flex flex-wrap gap-4 text-[13px] text-[#86868b] font-medium">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[#0071e3]" />
          <span>Reference Group</span>
        </div>
        {isRatio && (
          <>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-[#34c759]" />
              <span>Passes Threshold</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-[#ff3b30]" />
              <span>Below Threshold</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
