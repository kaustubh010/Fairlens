'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { CategoryScore } from '@/lib/behavioral/types';

export function BiasFingerprintRadar({ categories }: { categories: CategoryScore[] }) {
  const data = categories.map((c) => ({
    category: c.title,
    bss: c.bss,
  }));

  return (
    <div className="bg-white dark:bg-[#1d1d1f] rounded-[18px] p-6 border border-black/10 dark:border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[17px] font-semibold">Bias fingerprint</h3>
          <p className="text-[13px] text-[#86868b]">Higher score = stronger asymmetric signal (0–100).</p>
        </div>
      </div>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="rgba(0,0,0,0.12)" />
            <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: '#86868b' }} />
            <Tooltip formatter={(v: any) => [`${v}/100`, 'BSS']} />
            <Radar
              dataKey="bss"
              stroke="#0071e3"
              fill="#0071e3"
              fillOpacity={0.18}
              dot={{ r: 2, fill: '#0071e3' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

